"""Automated tests for VM lifecycle reconstruction and baseline anomaly detection."""

import pytest
from datetime import datetime
from pathlib import Path

from findly.models import LogRecord
from findly.parser import parse_log_file
from findly.analyzer import LogAnalyzer, load_ground_truth_labels


def test_load_ground_truth_labels():
    labels = load_ground_truth_labels("dataset/anomaly_labels.txt")
    assert len(labels) == 4
    expected_vms = {
        "544fd51c-4edc-4780-baae-ba1d80a0acfc",
        "ae651dff-c7ad-43d6-ac96-bbcd820ccca8",
        "a445709b-6ad0-40ec-8860-bec60b6ca0c2",
        "1643649d-2f42-4303-bfcd-7798baec19f9",
    }
    assert labels == expected_vms


def test_lifecycle_reconstruction_synthetic():
    vm_id = "544fd51c-4edc-4780-baae-ba1d80a0acfc"
    records = [
        LogRecord(
            source_file="openstack_abnormal.log",
            line_number=1,
            timestamp=datetime(2017, 5, 14, 21, 7, 37, 102000),
            pid=2931,
            level="INFO",
            module="nova.compute.claims",
            service="nova-compute",
            request_id="req-1",
            user_id="u1",
            tenant_id="t1",
            instance_id=vm_id,
            message=f"[instance: {vm_id}] Attempting claim: memory 2048 MB, disk 20 GB, vcpus 1 CPU",
        ),
        LogRecord(
            source_file="openstack_abnormal.log",
            line_number=2,
            timestamp=datetime(2017, 5, 14, 21, 8, 19, 736000),
            pid=2931,
            level="INFO",
            module="nova.compute.manager",
            service="nova-compute",
            request_id="req-1",
            user_id="u1",
            tenant_id="t1",
            instance_id=vm_id,
            message=f"[instance: {vm_id}] Took 41.81 seconds to spawn the instance on the hypervisor.",
        ),
        LogRecord(
            source_file="openstack_abnormal.log",
            line_number=3,
            timestamp=datetime(2017, 5, 14, 21, 8, 19, 900000),
            pid=2931,
            level="INFO",
            module="nova.compute.manager",
            service="nova-compute",
            request_id="req-1",
            user_id="u1",
            tenant_id="t1",
            instance_id=vm_id,
            message=f"[instance: {vm_id}] Took 42.81 seconds to build instance.",
        ),
    ]

    analyzer = LogAnalyzer(known_anomalous_vms={vm_id})
    lifecycles = analyzer.reconstruct_lifecycles(records)

    assert vm_id in lifecycles
    vm = lifecycles[vm_id]
    assert vm.is_known_anomaly is True
    assert vm.spawn_duration == 41.81
    assert vm.build_duration == 42.81
    assert vm.memory_mb == 2048
    assert vm.disk_gb == 20
    assert vm.vcpu == 1


def test_baseline_anomaly_detection_flags_outlier():
    vm_norm = "00000000-0000-0000-0000-000000000001"
    vm_anom = "544fd51c-4edc-4780-baae-ba1d80a0acfc"

    records = [
        LogRecord(
            source_file="openstack_normal.log",
            line_number=1,
            timestamp=datetime(2017, 5, 16, 0, 0, 0),
            pid=2931,
            level="INFO",
            module="nova.compute.manager",
            service="nova-compute",
            request_id=None,
            user_id=None,
            tenant_id=None,
            instance_id=vm_norm,
            message=f"[instance: {vm_norm}] Took 19.50 seconds to spawn the instance on the hypervisor.",
        ),
        LogRecord(
            source_file="openstack_abnormal.log",
            line_number=2,
            timestamp=datetime(2017, 5, 14, 21, 8, 19),
            pid=2931,
            level="INFO",
            module="nova.compute.manager",
            service="nova-compute",
            request_id=None,
            user_id=None,
            tenant_id=None,
            instance_id=vm_anom,
            message=f"[instance: {vm_anom}] Took 41.81 seconds to spawn the instance on the hypervisor.",
        ),
    ]

    analyzer = LogAnalyzer(known_anomalous_vms={vm_anom})
    lifecycles = analyzer.reconstruct_lifecycles(records)
    analyzer.detect_anomalies(lifecycles, z_threshold=3.0, absolute_cutoff_seconds=25.0)

    assert lifecycles[vm_norm].predicted_anomaly is False
    assert lifecycles[vm_anom].predicted_anomaly is True
    assert lifecycles[vm_anom].anomaly_score > 30.0

    eval_metrics = analyzer.evaluate_predictions(lifecycles)
    assert eval_metrics["tp"] == 1
    assert eval_metrics["fn"] == 0
    assert eval_metrics["recall"] == 1.0


@pytest.mark.skipif(not Path("dataset/openstack_abnormal.log").exists(), reason="Dataset file missing")
def test_abnormal_dataset_detection_recall():
    """Verify that analyzing openstack_abnormal.log detects all 4 labeled anomalies."""
    records = parse_log_file("dataset/openstack_abnormal.log")
    analyzer = LogAnalyzer(label_file="dataset/anomaly_labels.txt")
    lifecycles = analyzer.reconstruct_lifecycles(records)
    analyzer.detect_anomalies(lifecycles, z_threshold=4.0, absolute_cutoff_seconds=28.0)
    metrics = analyzer.evaluate_predictions(lifecycles)

    # All 4 known anomalous VMs must be recalled with 100% sensitivity
    assert metrics["recall"] == 1.0
    assert metrics["tp"] == 4
    assert metrics["fn"] == 0
    assert metrics["top4_accuracy"] == 1.0

