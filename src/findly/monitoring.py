"""Basic monitoring and evaluation logging for Findly AI.

- Structured JSON access logs for every /api request (latency, status, request id).
- In-memory request metrics (counts, error rate, latency percentiles) per route.
- Per-query evaluation records for the chat pipeline (retrieval path, Trie validity,
  score, grounding signals, latency) appended to a JSON-lines file and kept in a
  ring buffer for the /api/metrics/evals endpoint.
"""

import json
import logging
import os
import sys
import threading
import time
from collections import defaultdict, deque
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Deque, Dict, List, Optional


def _configure_logger(name: str) -> logging.Logger:
    logger = logging.getLogger(name)
    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(logging.Formatter("%(message)s"))
        logger.addHandler(handler)
        logger.setLevel(os.environ.get("FINDLY_LOG_LEVEL", "INFO").upper())
        logger.propagate = False
    return logger


access_logger = _configure_logger("findly.access")
eval_logger = _configure_logger("findly.eval")


def _utc_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _percentile(sorted_values: List[float], pct: float) -> float:
    if not sorted_values:
        return 0.0
    k = (len(sorted_values) - 1) * pct
    lo = int(k)
    hi = min(lo + 1, len(sorted_values) - 1)
    return round(sorted_values[lo] + (sorted_values[hi] - sorted_values[lo]) * (k - lo), 2)


class RequestMetrics:
    """Thread-safe in-memory request counters and latency windows."""

    def __init__(self, window: int = 1000):
        self._lock = threading.Lock()
        self._window = window
        self.started_at = time.time()
        self.total = 0
        self.errors = 0
        self.by_status: Dict[int, int] = defaultdict(int)
        self.by_route: Dict[str, Dict[str, Any]] = {}
        self.latencies: Deque[float] = deque(maxlen=window)

    def record(self, method: str, route: str, status: int, latency_ms: float) -> None:
        key = f"{method} {route}"
        with self._lock:
            self.total += 1
            self.by_status[status] += 1
            if status >= 500:
                self.errors += 1
            self.latencies.append(latency_ms)
            r = self.by_route.setdefault(
                key, {"count": 0, "errors": 0, "latencies": deque(maxlen=self._window)}
            )
            r["count"] += 1
            if status >= 500:
                r["errors"] += 1
            r["latencies"].append(latency_ms)

    def snapshot(self) -> Dict[str, Any]:
        with self._lock:
            lat = sorted(self.latencies)
            routes = {}
            for key, r in self.by_route.items():
                rl = sorted(r["latencies"])
                routes[key] = {
                    "count": r["count"],
                    "errors": r["errors"],
                    "p50_ms": _percentile(rl, 0.50),
                    "p95_ms": _percentile(rl, 0.95),
                }
            return {
                "uptime_seconds": round(time.time() - self.started_at, 1),
                "requests_total": self.total,
                "errors_5xx_total": self.errors,
                "error_rate": round(self.errors / self.total, 4) if self.total else 0.0,
                "latency_ms": {
                    "p50": _percentile(lat, 0.50),
                    "p95": _percentile(lat, 0.95),
                    "p99": _percentile(lat, 0.99),
                    "max": round(lat[-1], 2) if lat else 0.0,
                },
                "status_codes": dict(self.by_status),
                "routes": routes,
            }

    def reset(self) -> None:
        with self._lock:
            self.__init__(self._window)


class EvalLogger:
    """Records one evaluation entry per chat query (JSONL file + ring buffer)."""

    def __init__(self, path: Optional[str] = None, buffer_size: int = 500):
        self._lock = threading.Lock()
        self.path = Path(path or os.environ.get("FINDLY_EVAL_LOG", "logs/evals.jsonl"))
        self.records: Deque[Dict[str, Any]] = deque(maxlen=buffer_size)

    def log(self, record: Dict[str, Any]) -> Dict[str, Any]:
        record = {"timestamp": _utc_iso(), "event": "chat_eval", **record}
        with self._lock:
            self.records.append(record)
            try:
                self.path.parent.mkdir(parents=True, exist_ok=True)
                with self.path.open("a", encoding="utf-8") as f:
                    f.write(json.dumps(record, default=str) + "\n")
            except OSError:
                pass  # File logging is best-effort (e.g. read-only filesystem)
        eval_logger.info(json.dumps(record, default=str))
        return record

    def recent(self, limit: int = 50) -> List[Dict[str, Any]]:
        with self._lock:
            return list(self.records)[-limit:][::-1]

    def summary(self) -> Dict[str, Any]:
        with self._lock:
            recs = list(self.records)
        n = len(recs)
        if not n:
            return {"queries_evaluated": 0}

        def rate(key: str) -> float:
            return round(sum(1 for r in recs if r.get(key)) / n, 4)

        lat = sorted(r.get("latency_ms", 0.0) for r in recs)
        scores = [r.get("retrieval_score", 0.0) for r in recs]
        path_counts: Dict[str, int] = defaultdict(int)
        for r in recs:
            path_counts[r.get("hierarchy_path", "")] += 1
        return {
            "queries_evaluated": n,
            "trie_valid_leaf_rate": rate("trie_valid_leaf"),
            "procedure_found_rate": rate("procedure_found"),
            "grounded_with_evidence_rate": rate("has_evidence"),
            "approval_required_rate": rate("requires_approval"),
            "avg_retrieval_score": round(sum(scores) / n, 4),
            "avg_citations": round(sum(r.get("citation_count", 0) for r in recs) / n, 2),
            "latency_ms": {"p50": _percentile(lat, 0.5), "p95": _percentile(lat, 0.95)},
            "top_paths": dict(sorted(path_counts.items(), key=lambda kv: -kv[1])[:10]),
        }


def build_chat_eval(retrieval, response, trie, latency_ms: float, session_id: str) -> Dict[str, Any]:
    """Derive evaluation signals from a STAIR retrieval + assistant response."""
    try:
        valid_leaf = bool(trie.is_valid_leaf(retrieval.hierarchy_path))
    except Exception:
        valid_leaf = False
    citations = response.evidence_citations or []
    return {
        "session_id": session_id,
        "query": retrieval.query[:500],
        "hierarchy_path": retrieval.hierarchy_path,
        "section_id": retrieval.section_id,
        "retrieval_score": round(float(retrieval.score or 0.0), 4),
        "candidate_count": len(retrieval.candidate_paths or []),
        "trie_valid_leaf": valid_leaf,
        "procedure_found": bool(retrieval.procedure_found),
        "citation_count": len(citations),
        "has_evidence": len(citations) > 0,
        "target_vms": retrieval.extracted_entities.get("vms", []),
        "is_cross_vm_comparison": bool(retrieval.is_cross_vm_comparison),
        "proposed_command_count": len(response.proposed_commands or []),
        "requires_approval": bool(response.requires_approval),
        "risk_level": retrieval.risk_level,
        "model_name": response.model_name,
        "latency_ms": round(latency_ms, 2),
    }


def log_access(request_id: str, method: str, path: str, status: int, latency_ms: float, client: str) -> None:
    access_logger.info(json.dumps({
        "timestamp": _utc_iso(),
        "event": "http_request",
        "request_id": request_id,
        "method": method,
        "path": path,
        "status": status,
        "latency_ms": round(latency_ms, 2),
        "client": client,
    }))


request_metrics = RequestMetrics()
eval_log = EvalLogger()
