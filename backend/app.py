"""FastAPI Application entry point for Findly AI."""

import os
import sys
from contextlib import asynccontextmanager
from pathlib import Path

# Add src and root to Python path
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))
sys.path.insert(0, str(Path(__file__).parent.parent))

import time
import uuid

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from backend.routes.actions import router as actions_router
from backend.routes.chat import router as chat_router
from backend.routes.documents import router as documents_router
from backend.routes.incidents import router as incidents_router
from backend.routes.metrics import router as metrics_router
from backend.routes.stair import router as stair_router
from backend.state import state
from findly.monitoring import log_access, request_metrics


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize DB, Trie, VectorStore, and OpenStack data
    state.initialize()
    yield
    # Shutdown logic if needed


app = FastAPI(
    title="Findly AI — Structure-Aware RAG API",
    description="Operational OpenStack Log Anomaly Detection & STAIR RAG (arXiv:2609.03874)",
    version="0.2.0",
    lifespan=lifespan,
)

# Enable CORS for React frontend (Vite default port 5173 / localhost)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def monitoring_middleware(request: Request, call_next):
    """Structured access logging + request metrics for API routes."""
    if not request.url.path.startswith("/api"):
        return await call_next(request)
    request_id = request.headers.get("x-request-id") or uuid.uuid4().hex[:12]
    start = time.perf_counter()
    status = 500
    try:
        response = await call_next(request)
        status = response.status_code
        response.headers["X-Request-ID"] = request_id
        response.headers["X-Response-Time-ms"] = f"{(time.perf_counter() - start) * 1000:.2f}"
        return response
    finally:
        latency_ms = (time.perf_counter() - start) * 1000
        route = request.scope.get("route")
        route_path = getattr(route, "path", request.url.path)
        request_metrics.record(request.method, route_path, status, latency_ms)
        log_access(
            request_id, request.method, request.url.path, status, latency_ms,
            request.client.host if request.client else "-",
        )


# Include Routers
app.include_router(documents_router)
app.include_router(stair_router)
app.include_router(incidents_router)
app.include_router(chat_router)
app.include_router(actions_router)
app.include_router(metrics_router)


@app.get("/api/health")
def health_check():
    return {
        "status": "HEALTHY",
        "service": "Findly AI Backend",
        "stair_initialized": state._is_initialized,
        "indexed_sections": state.vector_store.count(),
        "trie_leaves": len(state.trie.get_all_leaves()),
        "openstack_logs_loaded": len(state.log_records),
    }


# Mount React build directory if exists
frontend_dist = Path(__file__).parent.parent / "frontend" / "dist"
if frontend_dist.exists():
    app.mount("/", StaticFiles(directory=str(frontend_dist), html=True), name="frontend")
