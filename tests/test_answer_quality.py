"""Regression tests for answer quality on the real runbooks + OpenStack dataset."""

import pytest

from backend.state import state
from findly.assistant.qwen_engine import QwenGroundedAssistant
from findly.stair.retriever import parse_command_risks


@pytest.fixture(scope="module")
def ask():
    state.initialize()
    assistant = QwenGroundedAssistant()

    def _ask(query):
        retrieval = state.retriever.retrieve(query)
        return retrieval, assistant.synthesize(retrieval)

    return _ask


def test_lists_anomalous_vms(ask):
    retrieval, response = ask("Which VMs are anomalous and why?")
    assert retrieval.intent == "anomaly_listing"
    text = response.detailed_explanation
    for vm in ("544fd51c-4edc-4780-baae-ba1d80a0acfc", "ae651dff-c7ad-43d6-ac96-bbcd820ccca8",
               "a445709b-6ad0-40ec-8860-bec60b6ca0c2", "1643649d-2f42-4303-bfcd-7798baec19f9"):
        assert vm in text
    assert response.proposed_commands == []
    assert len(response.evidence_citations) >= 4


def test_fix_question_lands_on_actionable_section(ask):
    retrieval, response = ask("How do I fix keystone token expiration errors?")
    assert "Keystone" in retrieval.hierarchy_path
    assert "Overview" not in retrieval.hierarchy_path
    assert response.proposed_commands, "expected runbook commands for a fix question"


def test_weak_match_withholds_risky_commands(ask):
    retrieval, response = ask("Is the disk full on the compute host?")
    assert retrieval.low_confidence is True
    assert all(c["risk_level"] == "LOW" for c in response.proposed_commands)
    assert response.evidence_citations == []
    assert "Low-confidence match" in response.detailed_explanation


def test_bulk_destructive_request_is_not_answered_with_commands(ask):
    retrieval, response = ask("Delete all instances on compute-1")
    assert retrieval.intent == "destructive_refused"
    assert response.proposed_commands == []
    assert response.requires_approval is False


def test_runbook_risk_level_is_authoritative(ask):
    _, response = ask("How do I clean orphaned instance files?")
    risks = {c["command"]: c["risk_level"] for c in response.proposed_commands}
    cmd = 'find /var/lib/nova/instances/ -maxdepth 1 -name "*_del" -type d -exec rm -rf {} +'
    assert risks.get(cmd) == "MEDIUM"
    assert response.requires_approval is True


def test_legit_remove_question_still_answered(ask):
    retrieval, _ = ask("Remove all orphaned instance files with _del suffix")
    assert retrieval.procedure_found is True
    assert "Orphaned" in retrieval.hierarchy_path


def test_parse_command_risks():
    content = "Do it:\n```bash\nsystemctl restart x\n```\nRisk Level: **HIGH** (careful)."
    assert parse_command_risks(content) == {"systemctl restart x": "HIGH"}
