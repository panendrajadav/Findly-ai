"""Automated unit tests for DevOps workflow and safety engine."""

import pytest
from findly.assistant.devops_workflow import DevOpsWorkflowManager
from findly.database import init_db


def test_propose_and_approve_action():
    init_db()

    action = DevOpsWorkflowManager.propose_action(
        command="nova live-migration vm-1234 compute-02",
        target_resource="vm-1234",
        runbook_title="Nova Compute Spawn Latency Runbook",
        risk_level="HIGH",
        rationale="Migrate workload away from overloaded compute host.",
    )

    action_id = action["action_id"]
    assert action["status"] == "PENDING_APPROVAL"
    assert action["risk_level"] == "HIGH"

    # Operator Approval
    approved = DevOpsWorkflowManager.review_action(
        action_id=action_id,
        decision="APPROVE",
        reviewer_name="Senior SRE",
    )
    assert approved["status"] == "APPROVED"
    assert approved["reviewed_by"] == "Senior SRE"


def test_reject_destructive_action():
    init_db()

    action = DevOpsWorkflowManager.propose_action(
        command="rm -rf /var/lib/nova/instances/*",
        target_resource="compute-01",
        runbook_title="Emergency Disk Cleanup",
        risk_level="CRITICAL",
        rationale="Clear disk space.",
    )

    action_id = action["action_id"]

    # Operator Rejection
    rejected = DevOpsWorkflowManager.review_action(
        action_id=action_id,
        decision="REJECT",
        reviewer_name="Safety Lead",
    )
    assert rejected["status"] == "REJECTED"
    assert "rejected" in rejected["execution_output"].lower()

