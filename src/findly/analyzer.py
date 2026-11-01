"""OpenStack VM lifecycle reconstruction and baseline statistical anomaly detection."""

import re
from datetime import datetime
from pathlib import Path
from typing import Dict, Iterable, List, Optional, Set, Tuple, Union
import numpy as np
import pandas as pd

from findly.models import LogRecord, VMLifecycle

# Key operational metric patterns
SPAWN_DURATION_RE = re.compile(
    r"Took\s+(?P<duration>[\d\.]+)\s+seconds\s+to\s+spawn\s+the\s+instance",
    re.IGNORECASE,
)
BUILD_DURATION_RE = re.compile(
    r"Took\s+(?P<duration>[\d\.]+)\s+seconds\s+to\s+build\s+instance",
    re.IGNORECASE,
)
DESTROY_DURATION_RE = re.compile(
    r"Took\s+(?P<duration>[\d\.]+)\s+seconds\s+to\s+destroy\s+the\s+instance",
    re.IGNORECASE,
)
NETWORK_DEALLOC_RE = re.compile(
    r"Took\s+(?P<duration>[\d\.]+)\s+seconds\s+to\s+deallocate\s+network",
    re.IGNORECASE,
)
CLAIM_RE = re.compile(
    r"Attempting\s+claim:\s+memory\s+(?P<mem>\d+)\s+MB,\s+disk\s+(?P<disk>\d+)\s+GB,\s+vcpus\s+(?P<vcpu>\d+)\s+CPU",
    re.IGNORECASE,
)

LIFECYCLE_STATES = [
    "Creating image",
    "VM Started (Lifecycle Event)",
    "VM Paused (Lifecycle Event)",
    "VM Resumed (Lifecycle Event)",
    "VM Stopped (Lifecycle Event)",
    "Terminating instance",
    "Instance destroyed successfully",
]


def load_ground_truth_labels(
    label_path: Union[str, Path] = "dataset/anomaly_labels.txt",
) -> Set[str]:
    """Load known anomalous VM instance UUIDs from label file."""
    path = Path(label_path)
    if not path.exists():
        return set()

    uuid_re = re.compile(
        r"[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}",
        re.IGNORECASE,
    )
    labeled_vms = set()
    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            match = uuid_re.search(line)
            if match:
                labeled_vms.add(match.group(0).lower())
    return labeled_vms


class LogAnalyzer:
    """Analyzes OpenStack telemetry, reconstructs VM lifecycles, and flags anomalies."""

    def __init__(
        self,
        known_anomalous_vms: Optional[Set[str]] = None,
        label_file: Union[str, Path] = "dataset/anomaly_labels.txt",
    ):
        if known_anomalous_vms is not None:
            self.known_anomalies = known_anomalous_vms
        else:
            self.known_anomalies = load_ground_truth_labels(label_file)

        # Baseline statistical parameters (computed on normal telemetry)
        self.baseline_stats: Dict[str, float] = {
            "spawn_mean": 19.79,
            "spawn_std": 0.65,
            "spawn_median": 19.74,
            "spawn_iqr": 0.84,
            "spawn_q75": 20.16,
            "build_mean": 20.59,
            "build_std": 0.65,
        }
        self.is_baseline_calibrated = False

    def reconstruct_lifecycles(
        self,
        records: Iterable[LogRecord],
    ) -> Dict[str, VMLifecycle]:
        """Group parsed log records by VM instance ID and assemble lifecycle profiles."""
        vm_records: Dict[str, List[LogRecord]] = {}

        for rec in records:
            if rec.instance_id:
                vm_records.setdefault(rec.instance_id, []).append(rec)

        lifecycles: Dict[str, VMLifecycle] = {}

        for vm_id, recs in vm_records.items():
            # Sort records chronologically
            recs_sorted = sorted(recs, key=lambda r: r.timestamp)
            first_seen = recs_sorted[0].timestamp
            last_seen = recs_sorted[-1].timestamp
            file_source = recs_sorted[0].source_file

            lifecycle = VMLifecycle(
                instance_id=vm_id,
                file_source=file_source,
                first_seen=first_seen,
                last_seen=last_seen,
                total_events=len(recs_sorted),
                records=recs_sorted,
                is_known_anomaly=(vm_id in self.known_anomalies),
            )

            # Extract durations and states from log messages
            for r in recs_sorted:
                msg = r.message

                # Spawn duration
                m_spawn = SPAWN_DURATION_RE.search(msg)
                if m_spawn:
                    lifecycle.spawn_duration = float(m_spawn.group("duration"))

                # Build duration
                m_build = BUILD_DURATION_RE.search(msg)
                if m_build:
                    lifecycle.build_duration = float(m_build.group("duration"))

                # Destroy duration
                m_destroy = DESTROY_DURATION_RE.search(msg)
                if m_destroy:
                    lifecycle.destroy_duration = float(m_destroy.group("duration"))

                # Network deallocation duration
                m_net = NETWORK_DEALLOC_RE.search(msg)
                if m_net:
                    lifecycle.network_dealloc_duration = float(m_net.group("duration"))

                # Resource claim
                m_claim = CLAIM_RE.search(msg)
                if m_claim:
                    lifecycle.memory_mb = int(m_claim.group("mem"))
                    lifecycle.disk_gb = int(m_claim.group("disk"))
                    lifecycle.vcpu = int(m_claim.group("vcpu"))

                # Check for lifecycle milestones
                for state in LIFECYCLE_STATES:
                    if state in msg:
                        lifecycle.lifecycle_states.append((r.timestamp, state))
                        break

            lifecycles[vm_id] = lifecycle

        return lifecycles

    def calibrate_baseline(self, normal_lifecycles: Dict[str, VMLifecycle]) -> None:
        """Calibrate normal baseline distributions using normal log telemetry."""
        spawn_times = [
            vm.spawn_duration
            for vm in normal_lifecycles.values()
            if vm.spawn_duration is not None and vm.spawn_duration > 0
        ]
        build_times = [
            vm.build_duration
            for vm in normal_lifecycles.values()
            if vm.build_duration is not None and vm.build_duration > 0
        ]

        if spawn_times:
            arr = np.array(spawn_times)
            q25, q75 = np.percentile(arr, [25, 75])
            self.baseline_stats["spawn_mean"] = float(np.mean(arr))
            self.baseline_stats["spawn_std"] = float(np.std(arr)) if np.std(arr) > 0 else 1.0
            self.baseline_stats["spawn_median"] = float(np.median(arr))
            self.baseline_stats["spawn_iqr"] = float(q75 - q25)
            self.baseline_stats["spawn_q75"] = float(q75)

        if build_times:
            arr_b = np.array(build_times)
            self.baseline_stats["build_mean"] = float(np.mean(arr_b))
            self.baseline_stats["build_std"] = float(np.std(arr_b)) if np.std(arr_b) > 0 else 1.0

        self.is_baseline_calibrated = True

    def detect_anomalies(
        self,
        lifecycles: Dict[str, VMLifecycle],
        z_threshold: float = 4.0,
        absolute_cutoff_seconds: float = 25.0,
    ) -> Dict[str, VMLifecycle]:
        """
        Flag anomalies using statistical baseline thresholding on spawn latency.
        Computes Z-score relative to normal baseline mean and standard deviation.
        """
        mean = self.baseline_stats["spawn_mean"]
        std = self.baseline_stats["spawn_std"]
        iqr_thresh = self.baseline_stats["spawn_q75"] + 1.5 * self.baseline_stats["spawn_iqr"]

        for vm in lifecycles.values():
            if vm.spawn_duration is not None:
                z_score = (vm.spawn_duration - mean) / std
                vm.anomaly_score = float(max(0.0, z_score))

                # Flag anomaly if spawn exceeds statistical Z-threshold OR absolute cutoff
                if z_score >= z_threshold or vm.spawn_duration >= absolute_cutoff_seconds:
                    vm.predicted_anomaly = True
                    vm.anomaly_reason = (
                        f"Hypervisor spawn latency anomaly: took {vm.spawn_duration:.2f}s "
                        f"(Z-score: +{z_score:.1f}σ vs normal baseline {mean:.2f}s ± {std:.2f}s)"
                    )
                else:
                    vm.predicted_anomaly = False
                    vm.anomaly_reason = "Provisioning duration within normal operating thresholds"
            else:
                vm.anomaly_score = 0.0
                vm.predicted_anomaly = False
                vm.anomaly_reason = "No hypervisor spawn timing telemetry available"

        return lifecycles

    def evaluate_predictions(
        self,
        lifecycles: Dict[str, VMLifecycle],
    ) -> Dict[str, Union[int, float]]:
        """Evaluate detection performance against known ground-truth labels."""
        tp = 0
        fp = 0
        tn = 0
        fn = 0

        for vm in lifecycles.values():
            if vm.predicted_anomaly and vm.is_known_anomaly:
                tp += 1
            elif vm.predicted_anomaly and not vm.is_known_anomaly:
                fp += 1
            elif not vm.predicted_anomaly and not vm.is_known_anomaly:
                tn += 1
            elif not vm.predicted_anomaly and vm.is_known_anomaly:
                fn += 1

        precision = tp / (tp + fp) if (tp + fp) > 0 else 0.0
        recall = tp / (tp + fn) if (tp + fn) > 0 else 0.0
        f1 = 2 * (precision * recall) / (precision + recall) if (precision + recall) > 0 else 0.0
        fpr = fp / (fp + tn) if (fp + tn) > 0 else 0.0

        # Top-4 ranking precision
        ranked_vms = sorted(
            [v for v in lifecycles.values() if v.spawn_duration is not None],
            key=lambda x: (x.spawn_duration or 0),
            reverse=True,
        )
        top4_hits = sum(1 for v in ranked_vms[:4] if v.is_known_anomaly)
        top4_recall = top4_hits / len(self.known_anomalies) if self.known_anomalies else 0.0

        return {
            "tp": tp,
            "fp": fp,
            "tn": tn,
            "fn": fn,
            "total_evaluated": len(lifecycles),
            "precision": float(precision),
            "recall": float(recall),
            "f1_score": float(f1),
            "fpr": float(fpr),
            "top4_accuracy": float(top4_recall),
        }

    def to_dataframe(self, lifecycles: Dict[str, VMLifecycle]) -> pd.DataFrame:
        """Convert reconstructed lifecycles into a structured pandas DataFrame."""
        rows = []
        for vm in lifecycles.values():
            rows.append({
                "instance_id": vm.instance_id,
                "file_source": vm.file_source,
                "spawn_duration": vm.spawn_duration,
                "build_duration": vm.build_duration,
                "destroy_duration": vm.destroy_duration,
                "memory_mb": vm.memory_mb,
                "disk_gb": vm.disk_gb,
                "vcpu": vm.vcpu,
                "total_events": vm.total_events,
                "is_known_anomaly": vm.is_known_anomaly,
                "predicted_anomaly": vm.predicted_anomaly,
                "anomaly_score": vm.anomaly_score,
                "anomaly_reason": vm.anomaly_reason,
                "first_seen": vm.first_seen,
                "last_seen": vm.last_seen,
            })
        return pd.DataFrame(rows)

