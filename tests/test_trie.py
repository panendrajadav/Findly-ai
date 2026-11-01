"""Automated unit tests for custom HierarchyTrie."""

import pytest
from findly.trie import HierarchyTrie


def test_trie_insert_and_find():
    trie = HierarchyTrie()
    path = "OpenStack > Nova Compute > Instance Lifecycle > Spawn & Build Latency Metrics"
    trie.insert(path, section_id="sec_101", is_leaf=True, metadata={"title": "Spawn Latency"})

    assert trie.is_valid_prefix("OpenStack")
    assert trie.is_valid_prefix("OpenStack > Nova Compute")
    assert trie.is_valid_prefix("OpenStack > Nova Compute > Instance Lifecycle")
    assert trie.is_valid_prefix(path)
    assert not trie.is_valid_prefix("OpenStack > Nonexistent Service")

    # Verify leaf status
    assert trie.is_valid_leaf(path)
    assert not trie.is_valid_leaf("OpenStack > Nova Compute")  # Internal node, not a leaf


def test_trie_get_valid_continuations():
    trie = HierarchyTrie()
    trie.insert("OpenStack > Nova Compute > Lifecycle > Spawn Timing", "s1", is_leaf=True)
    trie.insert("OpenStack > Nova Compute > Lifecycle > Power Events", "s2", is_leaf=True)
    trie.insert("OpenStack > Nova Compute > Resources > Claims", "s3", is_leaf=True)

    # From 'OpenStack > Nova Compute'
    continuations = trie.get_valid_continuations("OpenStack > Nova Compute")
    assert "Lifecycle" in continuations
    assert "Resources" in continuations

    # From 'OpenStack > Nova Compute > Lifecycle'
    leaf_continuations = trie.get_valid_continuations("OpenStack > Nova Compute > Lifecycle")
    assert "Spawn Timing" in leaf_continuations
    assert "Power Events" in leaf_continuations


def test_trie_constrain_candidates():
    trie = HierarchyTrie()
    p1 = "OpenStack > Nova Compute > Lifecycle > Spawn Timing"
    p2 = "OpenStack > Nova API > Keystone > Token Auth"
    trie.insert(p1, "s1", is_leaf=True)
    trie.insert(p2, "s2", is_leaf=True)

    candidates = [
        p1,  # Exact leaf match
        "OpenStack > Nova Compute > Lifecycle",  # Internal node
        "Nonexistent > Path",  # Invalid path
        "Token Auth",  # Substring match to p2
    ]

    constrained = trie.constrain_candidates(candidates)
    assert len(constrained) == 2
    paths = [item[0] for item in constrained]
    assert p1 in paths
    assert p2 in paths

