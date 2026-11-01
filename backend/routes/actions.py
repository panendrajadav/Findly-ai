"""DevOps Action Approval and Safety API routes."""

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from findly.assistant.devops_workflow import DevOpsWorkflowManager

router = APIRouter(prefix="/api/actions", tags=["DevOps Actions"])


class ProposeActionRequest(BaseModel):
    command: str
    target_resource: str
    runbook_title: str
    risk_level: str = "MEDIUM"
    rationale: str
    incident_id: Optional[str] = None


class ReviewActionRequest(BaseModel):
    decision: str  # "APPROVE" or "REJECT"
    reviewer_name: str = "DevOps Lead Engineer"


@router.get("")
def list_action_requests(status: Optional[str] = None):
    """List DevOps action requests and their approval statuses."""
    return DevOpsWorkflowManager.list_actions(status_filter=status)


@router.post("/propose")
def propose_remediation_action(req: ProposeActionRequest):
    """Propose an operational remediation command requiring human review."""
    return DevOpsWorkflowManager.propose_action(
        command=req.command,
        target_resource=req.target_resource,
        runbook_title=req.runbook_title,
        risk_level=req.risk_level,
        rationale=req.rationale,
        incident_id=req.incident_id,
    )


@router.post("/{action_id}/review")
def review_action(action_id: str, req: ReviewActionRequest):
    """Human-in-the-loop operator review: Approve or Reject a proposed action."""
    try:
        return DevOpsWorkflowManager.review_action(
            action_id=action_id,
            decision=req.decision,
            reviewer_name=req.reviewer_name,
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

