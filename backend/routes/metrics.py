"""Monitoring & evaluation endpoints."""

from fastapi import APIRouter, Query

from findly.monitoring import eval_log, request_metrics
from backend.state import state

router = APIRouter(prefix="/api/metrics", tags=["Monitoring"])


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
