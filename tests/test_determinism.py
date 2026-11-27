"""Retrieval must not depend on Python's per-process hash randomization.

Regression guard: section keywords were once built from an unordered set, so the
search index (and therefore answers) changed between server restarts. This test
builds the index in separate processes with different PYTHONHASHSEED values and
requires identical results.
"""

import json
import os
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

QUERIES = [
    "Is the disk full on the compute host?",
    "How do I fix keystone token expiration errors?",
    "Instance 544fd51c experienced 41.81s latency. What is the recommended remediation?",
    "image cache invalid disk info error",
    "What does a claim failure on the hypervisor mean?",
]

# Builds only the runbook index (no log parsing), which is the part that was nondeterministic.
SCRIPT = """
import json, sys
sys.path[:0] = ["src", "."]
from findly.ingestion.runbook_loader import load_all_runbooks
from findly.stair.retriever import StairRetrieverEngine
from findly.stair.vector_store import SectionVectorStore
from findly.trie import HierarchyTrie
trie, store = HierarchyTrie(), SectionVectorStore()
for doc in load_all_runbooks("runbooks"):
    for sec in doc.sections:
        store.add_section(sec)
        trie.insert(path=sec.hierarchy_path, section_id=sec.section_id, is_leaf=sec.is_leaf,
                    metadata={"title": sec.title, "document_id": sec.document_id})
retriever = StairRetrieverEngine(trie=trie, vector_store=store, log_records=[])
out = []
for q in json.loads(sys.argv[1]):
    r = retriever.retrieve(q)
    out.append([r.hierarchy_path, round(r.score, 6), r.low_confidence])
print("RESULT" + json.dumps(out))
"""


def retrieve_with_seed(seed: str):
    env = {**os.environ, "PYTHONHASHSEED": seed}
    proc = subprocess.run(
        [sys.executable, "-c", SCRIPT, json.dumps(QUERIES)],
        cwd=ROOT, env=env, capture_output=True, text=True, timeout=300,
    )
    assert proc.returncode == 0, proc.stderr[-2000:]
    line = next(l for l in proc.stdout.splitlines() if l.startswith("RESULT"))
    return json.loads(line[len("RESULT"):])


def test_retrieval_identical_across_hash_seeds():
    baseline = retrieve_with_seed("1")
    for seed in ("2", "3"):
        assert retrieve_with_seed(seed) == baseline, f"results differ between PYTHONHASHSEED=1 and {seed}"
