"""Automated API integration tests for FastAPI backend."""

import pytest
from fastapi.testclient import TestClient
from backend.app import app
from backend.state import state


@pytest.fixture(scope="module")
def client():
    # Trigger lifespan startup
    state.initialize()
    with TestClient(app) as c:
        yield c


def test_health_check(client):
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "HEALTHY"
    assert data["stair_initialized"] is True
    assert data["indexed_sections"] > 0
    assert data["trie_leaves"] > 0


def test_list_documents(client):
    res = client.get("/api/documents")
    assert res.status_code == 200
    docs = res.json()
    assert len(docs) >= 4  # The 4 default runbooks
    titles = [d["title"] for d in docs]
    assert any("Spawn Latency" in t for t in titles)


def test_stair_trie_export(client):
    res = client.get("/api/stair/trie")
    assert res.status_code == 200
    trie_data = res.json()
    assert "total_leaves" in trie_data
    assert trie_data["total_leaves"] > 0
    assert "root" in trie_data


def test_stair_retrieve_api(client):
    query = "Why did VM 544fd51c-4edc-4780-baae-ba1d80a0acfc take over 40 seconds to spawn?"
    res = client.post("/api/stair/retrieve", json={"query": query})
    assert res.status_code == 200
    data = res.json()
    assert "hierarchy_path" in data
    assert "procedure_content" in data
    assert "remediation_commands" in data
    assert len(data["procedure_content"]) > 0

    # Test retrieval specifically targeting actionable remediation commands
    rem_res = client.post("/api/stair/retrieve", json={"query": "Remediation action command to restart nova compute service"})
    assert rem_res.status_code == 200
    rem_data = rem_res.json()
    assert len(rem_data["remediation_commands"]) > 0


def test_list_incidents_api(client):
    res = client.get("/api/incidents")
    assert res.status_code == 200
    data = res.json()
    assert "evaluation_metrics" in data
    assert "incidents" in data
    # Detection recall must be 1.0 (100%) on known anomalies
    assert data["evaluation_metrics"]["recall"] == 1.0
    assert len(data["known_anomalies"]) == 4


def test_chat_api(client):
    query = "Instance 544fd51c experienced 41.81s latency. What is the recommended remediation?"
    res = client.post("/api/chat", json={"query": query})
    assert res.status_code == 200
    data = res.json()
    assert "hierarchy_path" in data
    assert "summary" in data
    assert "detailed_explanation" in data
    assert "proposed_commands" in data
    assert data["requires_approval"] is True


def test_devops_action_proposal_and_review(client):
    # Propose an action
    propose_res = client.post("/api/actions/propose", json={
        "command": "systemctl restart nova-compute",
        "target_resource": "compute-host-01",
        "runbook_title": "Nova Compute Spawn Latency Runbook",
        "risk_level": "HIGH",
        "rationale": "Hypervisor compute worker thread unresponsive.",
    })
    assert propose_res.status_code == 200
    action = propose_res.json()
    action_id = action["action_id"]
    assert action["status"] == "PENDING_APPROVAL"

    # Review action: Approve
    review_res = client.post(f"/api/actions/{action_id}/review", json={
        "decision": "APPROVE",
        "reviewer_name": "Test DevOps Lead",
    })
    assert review_res.status_code == 200
    reviewed = review_res.json()
    assert reviewed["status"] == "APPROVED"
    assert reviewed["reviewed_by"] == "Test DevOps Lead"
