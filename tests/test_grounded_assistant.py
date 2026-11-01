"""Tests for Qwen grounded assistant: VM isolation, unsupported root-cause rejection, and numerical precision."""

import pytest
from findly.assistant.qwen_engine import QwenGroundedAssistant
from findly.ingestion.doc_parser import DocumentSection
from findly.models import LogRecord
from findly.stair.retriever import StairRetrieverEngine
from findly.stair.vector_store import SectionVectorStore
from findly.trie import HierarchyTrie
from datetime import datetime


@pytest.fixture
def test_engine():
    trie = HierarchyTrie()
    vs = SectionVectorStore()

    # Register spawn latency runbook leaf
    leaf_path = "OpenStack Cloud Telemetry > Nova Compute > Lifecycle > Instance Spawning Delays"
    trie.insert(leaf_path, is_leaf=True, section_id="leaf_spawn", metadata={"title": "Instance Spawning Delays"})

    sec = DocumentSection(
        section_id="leaf_spawn",
        document_id="doc_spawn",
        document_title="Nova Compute Spawn Latency Runbook",
        title="Instance Spawning Delays",
        hierarchy_path=leaf_path,
        level=3,
        is_leaf=True,
        content=(
            "### Remediation\n"
            "Safe inspection:\n```bash\nuptime && free -m && iostat -xz 1 5\n```\n"
            "Restart compute worker thread:\n```bash\nsystemctl restart nova-compute\n```"
        ),
    )
    vs.add_sections([sec])

    vm1_id = "544fd51c-4edc-4780-baae-ba1d80a0acfc"
    vm2_id = "ae651dff-c7ad-43d6-ac96-bbcd820ccca8"

    # Synthetic Oslo log records for VM1 and VM2
    recs = [
        LogRecord(
            source_file="openstack_abnormal.log",
            line_number=101,
            timestamp=datetime(2020, 4, 12, 10, 0, 0),
            pid=1234,
            level="INFO",
            module="nova.compute.claims",
            service="nova-compute",
            request_id="req-1",
            user_id="u1",
            tenant_id="t1",
            instance_id=vm1_id,
            message=f"[instance: {vm1_id}] [claim] Total memory: 8192 mb, used: 2048 mb; Total vcpu: 8, used: 1",
        ),
        LogRecord(
            source_file="openstack_abnormal.log",
            line_number=102,
            timestamp=datetime(2020, 4, 12, 10, 0, 41),
            pid=1234,
            level="INFO",
            module="nova.compute.manager",
            service="nova-compute",
            request_id="req-1",
            user_id="u1",
            tenant_id="t1",
            instance_id=vm1_id,
            message=f"[instance: {vm1_id}] Took 41.81 seconds to spawn the instance on the hypervisor.",
        ),
        LogRecord(
            source_file="openstack_abnormal.log",
            line_number=201,
            timestamp=datetime(2020, 4, 12, 10, 10, 0),
            pid=1234,
            level="INFO",
            module="nova.compute.manager",
            service="nova-compute",
            request_id="req-2",
            user_id="u2",
            tenant_id="t2",
            instance_id=vm2_id,
            message=f"[instance: {vm2_id}] Took 50.72 seconds to spawn the instance on the hypervisor.",
        ),
    ]

    return StairRetrieverEngine(trie=trie, vector_store=vs, log_records=recs)


def test_strict_vm_isolation_and_evidence_citations(test_engine):
    """Verify that querying VM1 never returns or contaminates with VM2 records."""
    assistant = QwenGroundedAssistant()
    vm1_id = "544fd51c-4edc-4780-baae-ba1d80a0acfc"

    retrieval = test_engine.retrieve(f"Why did instance {vm1_id} experience spawn latency?")
    response = assistant.synthesize(retrieval)

    # 1. Check citations belong strictly to VM1
    assert len(response.evidence_citations) > 0
    for citation in response.evidence_citations:
        assert citation["instance_id"].lower() == vm1_id.lower()

    # 2. Check exact numerical measurements are present
    assert "41.81" in response.detailed_explanation
    assert "19.79" in response.detailed_explanation  # Baseline comparison


def test_unsupported_root_cause_rejection(test_engine):
    """Verify that unsupported root-cause claims (CPU starvation, disk contention) are explicitly rejected."""
    assistant = QwenGroundedAssistant()
    vm1_id = "544fd51c-4edc-4780-baae-ba1d80a0acfc"

    retrieval = test_engine.retrieve(f"What caused instance {vm1_id} to be slow?")
    response = assistant.synthesize(retrieval)

    # Must explicitly state that CPU starvation / disk contention are unsupported hypotheses
    text = response.detailed_explanation.lower()
    assert "unsupported" in text
    assert "cpu starvation" in text or "disk" in text or "kernel metrics" in text


def test_cross_vm_comparison_explicit_request(test_engine):
    """Verify cross-VM comparison generates a comparison table without mixing records."""
    assistant = QwenGroundedAssistant()
    vm1_id = "544fd51c-4edc-4780-baae-ba1d80a0acfc"
    vm2_id = "ae651dff-c7ad-43d6-ac96-bbcd820ccca8"

    query = f"Compare VM {vm1_id} vs {vm2_id} spawn duration"
    retrieval = test_engine.retrieve(query)
    response = assistant.synthesize(retrieval)

    assert retrieval.is_cross_vm_comparison is True
    assert "Cross-VM" in response.detailed_explanation or "Comparison" in response.detailed_explanation
    assert "41.81" in response.detailed_explanation
    assert "50.72" in response.detailed_explanation


def test_remediation_commands_and_approval_requirement(test_engine):
    """Verify only verified runbook commands are proposed and high-risk ones require approval."""
    assistant = QwenGroundedAssistant()
    retrieval = test_engine.retrieve("What commands remediate hypervisor spawn delays?")
    response = assistant.synthesize(retrieval)

    cmd_texts = [cmd["command"] for cmd in response.proposed_commands]
    assert "systemctl restart nova-compute" in cmd_texts
    assert "uptime && free -m && iostat -xz 1 5" in cmd_texts

    assert response.requires_approval is True
    assert "HUMAN-IN-THE-LOOP" in response.approval_prompt


def test_direct_remediation_answer_relevance_and_isolation(test_engine):
    """Verify direct remediation queries answer directly without unrelated stats, CPU starvation, or disk claims."""
    assistant = QwenGroundedAssistant()
    query = "What is the command to restart nova compute when stuck?"
    retrieval = test_engine.retrieve(query)
    response = assistant.synthesize(retrieval)

    # 1. Answer directly with exact command
    assert "systemctl restart nova-compute" in response.detailed_explanation
    # 2. Source document and section displayed
    assert "Source Document" in response.detailed_explanation
    assert "Source Section" in response.detailed_explanation
    # 3. High risk level and approval requirement displayed
    assert "Risk Level" in response.detailed_explanation
    assert "Operator Approval" in response.detailed_explanation
    assert response.requires_approval is True
    # 4. Verification commands clearly labelled
    assert "Verification" in response.detailed_explanation
    # 5. NO unrelated anomaly statistics, CPU starvation claims or disk contention explanations
    explanation_lower = response.detailed_explanation.lower()
    assert "cpu starvation" not in explanation_lower
    assert "disk contention" not in explanation_lower
    assert "baseline diff" not in explanation_lower
    assert "z-score" not in explanation_lower
    assert len(response.evidence_citations) == 0


def test_direct_remediation_unknown_procedure_say_so(test_engine):
    """Verify that if a procedure cannot be found, the assistant clearly states so without inventing commands."""
    assistant = QwenGroundedAssistant()
    query = "What is the command to reboot kubernetes worker node?"
    retrieval = test_engine.retrieve(query)
    response = assistant.synthesize(retrieval)

    assert "Procedure Not Found" in response.detailed_explanation
    assert "No relevant troubleshooting procedure" in response.detailed_explanation
    assert len(response.proposed_commands) == 0
    assert response.requires_approval is False


