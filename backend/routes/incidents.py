"""OpenStack incident investigation and telemetry API routes."""

from typing import Any, Dict, List
from fastapi import APIRouter, HTTPException
from backend.state import state

router = APIRouter(prefix="/api/incidents", tags=["Incidents"])


@router.get("")
def list_incidents():
    """List all detected OpenStack anomalies and evaluation metrics."""
    # Reconstruct lifecycles from currently indexed logs
    lifecycles = state.analyzer.reconstruct_lifecycles(state.log_records)
    state.analyzer.detect_anomalies(lifecycles, z_threshold=4.0, absolute_cutoff_seconds=28.0)
    eval_metrics = state.analyzer.evaluate_predictions(lifecycles)

    ranked_vms = sorted(
        lifecycles.values(),
        key=lambda x: (x.spawn_duration or 0),
        reverse=True,
    )

    incidents = []
    for vm in ranked_vms:
        if vm.spawn_duration is not None:
            incidents.append({
                "instance_id": vm.instance_id,
                "file_source": vm.file_source,
                "spawn_duration": vm.spawn_duration,
                "build_duration": vm.build_duration,
                "memory_mb": vm.memory_mb,
                "disk_gb": vm.disk_gb,
                "vcpu": vm.vcpu,
                "is_known_anomaly": vm.is_known_anomaly,
                "predicted_anomaly": vm.predicted_anomaly,
                "anomaly_score": round(vm.anomaly_score, 1),
                "anomaly_reason": vm.anomaly_reason,
                "total_events": vm.total_events,
            })

    return {
        "evaluation_metrics": eval_metrics,
        "total_vms": len(lifecycles),
        "total_anomalies_detected": eval_metrics["tp"] + eval_metrics["fp"],
        "known_anomalies": list(state.analyzer.known_anomalies),
        "incidents": incidents[:50],  # Top 50 ranked by latency
    }


@router.get("/{instance_id}")
def get_incident_detail(instance_id: str):
    """Retrieve detailed telemetry timeline and supporting logs for a VM instance."""
    inst_lower = instance_id.lower()
    matching_records = [r for r in state.log_records if r.instance_id and r.instance_id.lower() == inst_lower]

    if not matching_records:
        raise HTTPException(status_code=404, detail=f"No telemetry found for instance ID {instance_id}")

    lifecycles = state.analyzer.reconstruct_lifecycles(matching_records)
    vm = lifecycles.get(inst_lower) or lifecycles.get(instance_id) or (next(iter(lifecycles.values())) if lifecycles else None)

    if not vm:
        raise HTTPException(status_code=404, detail="Lifecycle reconstruction failed for instance.")

    return {
        "instance_id": vm.instance_id,
        "file_source": vm.file_source,
        "first_seen": vm.first_seen.isoformat(),
        "last_seen": vm.last_seen.isoformat(),
        "spawn_duration": vm.spawn_duration,
        "build_duration": vm.build_duration,
        "memory_mb": vm.memory_mb,
        "disk_gb": vm.disk_gb,
        "vcpu": vm.vcpu,
        "is_known_anomaly": vm.is_known_anomaly,
        "predicted_anomaly": vm.predicted_anomaly,
        "anomaly_score": round(vm.anomaly_score, 1),
        "anomaly_reason": vm.anomaly_reason,
        "milestones": [{"time": t.isoformat(), "event": ev} for t, ev in vm.lifecycle_states],
        "log_events": [
            {
                "line": r.line_number,
                "timestamp": r.timestamp.strftime("%Y-%m-%d %H:%M:%S.%f")[:-3],
                "service": r.service,
                "level": r.level,
                "module": r.module,
                "message": r.message,
            }
            for r in vm.records
        ],
    }

