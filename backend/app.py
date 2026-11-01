"""FastAPI Application entry point for Findly AI."""

import os
import sys
from contextlib import asynccontextmanager
from pathlib import Path

# Add src and root to Python path
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))
sys.path.insert(0, str(Path(__file__).parent.parent))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from backend.routes.actions import router as actions_router
from backend.routes.chat import router as chat_router
from backend.routes.documents import router as documents_router
from backend.routes.incidents import router as incidents_router
from backend.routes.stair import router as stair_router
from backend.state import state


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

# Include Routers
app.include_router(documents_router)
app.include_router(stair_router)
app.include_router(incidents_router)
app.include_router(chat_router)
app.include_router(actions_router)


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
