"""Grounded Chat API routes utilizing Qwen assistant and STAIR retrieval."""

import json
import time
import uuid
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from findly.assistant.conversation import (
    ConversationMemory, classify_message, explain_simply, no_previous_answer, small_talk,
)
from findly.assistant.qwen_engine import QwenGroundedAssistant
from findly.database import ChatMessageRecord, SessionLocal
from findly.monitoring import build_chat_eval, eval_log
from backend.state import state

router = APIRouter(prefix="/api/chat", tags=["Chat"])
assistant = QwenGroundedAssistant()
memory = ConversationMemory()


class ChatRequest(BaseModel):
    query: str
    session_id: str = "default"


def _save_message(session_id: str, query: str, answer: str, path: str, leaf_id: str, citations: list) -> None:
    db = SessionLocal()
    try:
        db.add(ChatMessageRecord(
            id=f"msg_{uuid.uuid4().hex[:8]}",
            session_id=session_id,
            role="assistant",
            query=query,
            answer=answer,
            retrieved_path=path,
            leaf_id=leaf_id,
            citations_json=json.dumps(citations),
        ))
        db.commit()
    finally:
        db.close()


def _conversational_reply(req: ChatRequest, kind: str) -> Dict[str, Any]:
    """Small talk, or a plain-language re-explanation of this session's previous answer."""
    if kind == "clarify":
        turn = memory.last(req.session_id)
        if turn:
            level = memory.bump_level(req.session_id) - 1
            text = explain_simply(turn["retrieval"], turn["response"], level=level)
            prev = turn["response"]
            # The original answer keeps its command buttons; the plain version only describes them.
            path, commands, approval = prev.hierarchy_path, [], False
            summary = "Plain-language explanation of the previous answer."
        else:
            text, path, commands, approval = no_previous_answer(), "", [], False
            summary = "No previous answer to explain."
    else:
        text, path, commands, approval = small_talk(kind), "", [], False
        summary = text.splitlines()[0]

    _save_message(req.session_id, req.query, text, path, "", [])
    return {
        "query": req.query,
        "intent": "clarification" if kind == "clarify" else "conversation",
        "hierarchy_path": path,
        "summary": summary,
        "detailed_explanation": text,
        "retrieved_procedure": "",
        "proposed_commands": commands,
        "requires_approval": approval,
        "approval_prompt": "",
        "evidence_citations": [],
        "model_name": assistant.model_name,
    }


@router.post("")
def chat_with_assistant(req: ChatRequest):
    """
    Grounded conversation:
    0. Small talk and "I don't understand" follow-ups are answered conversationally.
    1. STAIR retrieves the exact leaf section and supporting log evidence.
    2. The assistant synthesizes the diagnostic assessment and proposed actions.
    3. Identifies if human-in-the-loop operator approval is required.
    """
    if not state.retriever:
        raise HTTPException(status_code=500, detail="STAIR engine not initialized.")

    kind = classify_message(req.query)
    if kind:
        return _conversational_reply(req, kind)

    start = time.perf_counter()

    # 1. STAIR Retrieval
    retrieval = state.retriever.retrieve(req.query)

    # 2. Synthesis
    response = assistant.synthesize(retrieval)
    memory.remember(req.session_id, retrieval, response)

    # Evaluation logging (retrieval quality + grounding signals)
    eval_log.log(build_chat_eval(
        retrieval, response, state.trie, (time.perf_counter() - start) * 1000, req.session_id
    ))

    # 3. Save message to DB
    _save_message(req.session_id, req.query, response.detailed_explanation, response.hierarchy_path,
                  retrieval.section_id, response.evidence_citations)

    return {
        "query": response.query,
        "intent": getattr(retrieval, "intent", "runbook"),
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

