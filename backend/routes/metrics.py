"""Monitoring & evaluation endpoints."""

import json
import os
import time
import urllib.request
from pathlib import Path
from typing import Any, Dict, Optional

from fastapi import APIRouter, Query

from findly.monitoring import eval_log, request_metrics
from backend.state import state

router = APIRouter(prefix="/api/metrics", tags=["Monitoring"])

# CI publishes golden-set eval results to the eval-history branch on every push to main.
EVAL_HISTORY_BASE = os.environ.get(
    "EVAL_HISTORY_BASE_URL",
    "https://raw.githubusercontent.com/panendrajadav/Findly-ai/eval-history",
)
# Local fallback (e.g. output of `python scripts/run_eval.py --history eval-history.json`)
EVAL_HISTORY_DIR = Path(os.environ.get("EVAL_HISTORY_DIR", "."))
CACHE_SECONDS = 300
_cache: Dict[str, Any] = {"at": 0.0, "data": None}


@router.get("")
def get_metrics():
    """Service metrics: request counts, error rate, latency percentiles, eval summary."""
    return {
        "service": "findly-ai",
        "ready": state._is_initialized,
        "requests": request_metrics.snapshot(),
        "evaluation": eval_log.summary(),
    }


@router.get("/evals")
def get_recent_evals(limit: int = Query(50, ge=1, le=500)):
    """Most recent per-query evaluation records (newest first)."""
    return {"summary": eval_log.summary(), "records": eval_log.recent(limit)}


def _fetch_json(url: str) -> Optional[Any]:
    req = urllib.request.Request(url, headers={"User-Agent": "findly-ai-eval-dashboard"})
    with urllib.request.urlopen(req, timeout=5) as res:
        return json.loads(res.read().decode("utf-8"))


def _read_local(name: str) -> Optional[Any]:
    path = EVAL_HISTORY_DIR / name
    return json.loads(path.read_text(encoding="utf-8")) if path.exists() else None


def load_eval_history() -> Dict[str, Any]:
    errors = []
    for source, loader in (
        ("github", lambda n: _fetch_json(f"{EVAL_HISTORY_BASE}/{n}")),
        ("local", _read_local),
    ):
        try:
            runs = loader("eval-history.json")
            if runs is None:
                continue
            try:
                latest = loader("latest-report.json")
            except Exception:
                latest = None
            return {"source": source, "runs": runs, "latest": latest, "errors": errors}
        except Exception as exc:  # network down, branch missing, bad JSON...
            errors.append(f"{source}: {exc}")
    return {"source": None, "runs": [], "latest": None, "errors": errors}


@router.get("/eval-history")
def get_eval_history(refresh: bool = False):
    """Golden-set accuracy and latency per commit, as recorded by CI."""
    now = time.time()
    if refresh or _cache["data"] is None or now - _cache["at"] > CACHE_SECONDS:
        _cache["data"] = load_eval_history()
        _cache["at"] = now
    return _cache["data"]
