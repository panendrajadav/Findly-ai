"""Grounded Chat API routes utilizing Qwen assistant and STAIR retrieval."""

import json
import uuid
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from findly.assistant.qwen_engine import QwenGroundedAssistant
from findly.database import ChatMessageRecord, SessionLocal
from backend.state import state

router = APIRouter(prefix="/api/chat", tags=["Chat"])
assistant = QwenGroundedAssistant()


class ChatRequest(BaseModel):
    query: str
    session_id: str = "default"


@router.post("")
def chat_with_assistant(req: ChatRequest):
    """
    Execute grounded conversation:
    1. STAIR retrieves the exact leaf section and supporting log evidence.
    2. Qwen assistant synthesizes the diagnostic assessment and proposed actions.
    3. Identifies if human-in-the-loop operator approval is required.
    """
    if not state.retriever:
        raise HTTPException(status_code=500, detail="STAIR engine not initialized.")

    # 1. STAIR Retrieval
    retrieval = state.retriever.retrieve(req.query)

    # 2. Qwen Synthesis
    response = assistant.synthesize(retrieval)

    # 3. Save message to DB
    db = SessionLocal()
    try:
        chat_rec = ChatMessageRecord(
            id=f"msg_{uuid.uuid4().hex[:8]}",
            session_id=req.session_id,
            role="assistant",
            query=req.query,
            answer=response.detailed_explanation,
            retrieved_path=response.hierarchy_path,
            leaf_id=retrieval.section_id,
            citations_json=json.dumps(response.evidence_citations),
        )
        db.add(chat_rec)
        db.commit()
    finally:
        db.close()

    return {
        "query": response.query,
        "hierarchy_path": response.hierarchy_path,
        "summary": response.summary,
        "detailed_explanation": response.detailed_explanation,
        "retrieved_procedure": response.retrieved_procedure,
        "proposed_commands": response.proposed_commands,
        "requires_approval": response.requires_approval,
        "approval_prompt": response.approval_prompt,
        "evidence_citations": response.evidence_citations,
        "model_name": response.model_name,
    }


@router.get("/history")
def get_chat_history(session_id: str = "default"):
    """Retrieve chat conversation history."""
    db = SessionLocal()
    try:
        messages = (
            db.query(ChatMessageRecord)
            .filter_by(session_id=session_id)
            .order_by(ChatMessageRecord.created_at.asc())
            .all()
        )
        return [
            {
                "id": m.id,
                "query": m.query,
                "answer": m.answer,
                "retrieved_path": m.retrieved_path,
                "citations": json.loads(m.citations_json or "[]"),
                "created_at": m.created_at.isoformat() if m.created_at else None,
            }
            for m in messages
        ]
    finally:
        db.close()

