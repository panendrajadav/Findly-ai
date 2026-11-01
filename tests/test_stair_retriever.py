"""Unit tests for the refactored STAIR retriever engine and vector store."""

import pytest
from findly.ingestion.doc_parser import DocumentSection
from findly.stair.retriever import StairRetrieverEngine
from findly.stair.vector_store import SectionVectorStore
from findly.trie import HierarchyTrie


def test_section_vector_store_indexing_and_similarity():
    vs = SectionVectorStore()
    s1 = DocumentSection(
        section_id="sec_spawn",
        document_id="doc_1",
        document_title="Nova Compute Runbook",
        title="Spawn Latency Remediation",
        hierarchy_path="Nova > Compute > Spawn",
        level=2,
        is_leaf=True,
        content="Investigate hypervisor spawn latency and restart nova-compute service."
    )
    s2 = DocumentSection(
        section_id="sec_token",
        document_id="doc_2",
        document_title="Keystone Auth Runbook",
        title="Keystone Token Expiration",
        hierarchy_path="Keystone > Auth > Token",
        level=2,
        is_leaf=True,
        content="Flush expired PKI tokens in keystone and verify memcached connectivity."
    )
    vs.add_sections([s1, s2])
    assert vs.count() == 2

    results = vs.search("slow spawn time restart compute", top_k=1)
    assert len(results) == 1
    assert results[0][0].section_id == "sec_spawn"


def test_stair_retriever_engine_trie_constrained_routing():
    trie = HierarchyTrie()
    vs = SectionVectorStore()

    leaf_path = "OpenStack Cloud Telemetry > Nova Compute > Lifecycle > Instance Spawning Delays"
    trie.insert(leaf_path, is_leaf=True, section_id="leaf_spawning", metadata={"title": "Spawn Delays"})

    sec = DocumentSection(
        section_id="leaf_spawning",
        document_id="doc_runbook",
        document_title="Nova Compute Runbook",
        title="Instance Spawning Delays",
        hierarchy_path=leaf_path,
        level=3,
        is_leaf=True,
        content="Run ```bash\nsystemctl restart openstack-nova-compute\n``` on the compute host to clear stuck tasks."
    )
    vs.add_sections([sec])

    engine = StairRetrieverEngine(trie=trie, vector_store=vs, log_records=[])
    result = engine.retrieve("Why is instance spawning delayed on the hypervisor?")

    assert result.hierarchy_path == leaf_path
    assert result.leaf_title == "Instance Spawning Delays"
    assert "systemctl restart openstack-nova-compute" in result.remediation_commands
    assert result.risk_level in ["MEDIUM", "HIGH"]
