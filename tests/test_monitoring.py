"""Tests for monitoring middleware, metrics endpoints and evaluation logging."""

import json

import pytest
from fastapi.testclient import TestClient

from backend.app import app
from backend.state import state
from findly.monitoring import EvalLogger, RequestMetrics, _percentile


@pytest.fixture(scope="module")
def client():
    state.initialize()
    with TestClient(app) as c:
        yield c


def test_percentile():
    assert _percentile([], 0.5) == 0.0
    assert _percentile([1.0, 2.0, 3.0, 4.0, 5.0], 0.5) == 3.0
    assert _percentile([10.0], 0.95) == 10.0


def test_request_metrics_counts_errors():
    m = RequestMetrics()
    m.record("GET", "/api/x", 200, 5.0)
    m.record("GET", "/api/x", 503, 15.0)
    snap = m.snapshot()
    assert snap["requests_total"] == 2
    assert snap["errors_5xx_total"] == 1
    assert snap["error_rate"] == 0.5
    assert snap["routes"]["GET /api/x"]["count"] == 2


def test_eval_logger_writes_jsonl(tmp_path):
    path = tmp_path / "evals.jsonl"
    log = EvalLogger(path=str(path))
    log.log({"hierarchy_path": "A > B", "trie_valid_leaf": True, "has_evidence": False,
             "retrieval_score": 0.8, "latency_ms": 12.0, "citation_count": 0})
    lines = path.read_text(encoding="utf-8").strip().splitlines()
    assert len(lines) == 1
    assert json.loads(lines[0])["event"] == "chat_eval"
    summary = log.summary()
    assert summary["queries_evaluated"] == 1
    assert summary["trie_valid_leaf_rate"] == 1.0


def test_response_headers_and_metrics_endpoint(client):
    res = client.get("/api/health")
    assert res.status_code == 200
    assert "X-Request-ID" in res.headers
    assert "X-Response-Time-ms" in res.headers

    metrics = client.get("/api/metrics").json()
    assert metrics["ready"] is True
    assert metrics["requests"]["requests_total"] >= 1
    assert "GET /api/health" in metrics["requests"]["routes"]


def test_chat_produces_eval_record(client):
    res = client.post("/api/chat", json={"query": "How do I fix nova compute spawn latency?"})
    assert res.status_code == 200
    evals = client.get("/api/metrics/evals?limit=5").json()
    assert evals["summary"]["queries_evaluated"] >= 1
    latest = evals["records"][0]
    assert latest["query"].startswith("How do I fix nova")
    for key in ("hierarchy_path", "trie_valid_leaf", "retrieval_score", "latency_ms", "citation_count"):
        assert key in latest
