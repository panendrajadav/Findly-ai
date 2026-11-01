"""STAIR Structure-Aware Retrieval and Trie inspection API routes."""

from typing import Any, Dict, List
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from backend.state import state

router = APIRouter(prefix="/api/stair", tags=["STAIR"])


class RetrieveRequest(BaseModel):
    query: str
    top_k: int = 3
    max_evidence_logs: int = 8


@router.post("/retrieve")
def retrieve_stair_procedure(req: RetrieveRequest):
    """
    Execute STAIR retrieval:
    Constrains prediction via the custom HierarchyTrie and retrieves complete sections and log evidence.
    """
    if not state.retriever:
        raise HTTPException(status_code=500, detail="STAIR retriever is not initialized.")

    result = state.retriever.retrieve(
        query=req.query,
        top_k=req.top_k,
        max_evidence_logs=req.max_evidence_logs,
    )

    evidence = [
        {
            "file": r.source_file,
            "line": r.line_number,
            "timestamp": r.timestamp.strftime("%Y-%m-%d %H:%M:%S.%f")[:-3],
            "severity": r.level,
            "service": r.service,
            "module": r.module,
            "instance_id": r.instance_id or "-",
            "message": r.message,
        }
        for r in result.evidence_records
    ]

    return {
        "query": result.query,
        "hierarchy_path": result.hierarchy_path,
        "leaf_title": result.leaf_title,
        "section_id": result.section_id,
        "score": round(result.score, 3),
        "procedure_content": result.procedure_content,
        "remediation_commands": result.remediation_commands,
        "risk_level": result.risk_level,
        "candidate_paths": result.candidate_paths,
        "extracted_entities": result.extracted_entities,
        "evidence_logs": evidence,
    }


@router.get("/trie")
def export_trie_structure():
    """Export the complete custom HierarchyTrie for visualization."""
    return state.trie.export_tree()


@router.get("/leaves")
def get_registered_leaves():
    """List all registered valid leaf sections in the Trie."""
    leaves = state.trie.get_all_leaves()
    return [
        {
            "path": leaf.path_so_far,
            "segment": leaf.segment,
            "section_id": leaf.section_id,
            "metadata": leaf.metadata,
        }
        for leaf in leaves
    ]

