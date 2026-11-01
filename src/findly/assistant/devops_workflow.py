"""DevOps Human-in-the-Loop approval and safety workflow engine."""

import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from findly.database import ActionApprovalRecord, SessionLocal


def utc_now():
    return datetime.now(timezone.utc)


class DevOpsWorkflowManager:
    """
    Manages operational remediation actions.
    Enforces the safety invariant: Never execute destructive or high-risk actions automatically.
    """

    @staticmethod
    def propose_action(
        command: str,
        target_resource: str,
        runbook_title: str,
        risk_level: str,
        rationale: str,
        incident_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Create a pending action request requiring operator review."""
        action_id = f"act_{uuid.uuid4().hex[:8]}"
        session = SessionLocal()
        try:
            record = ActionApprovalRecord(
                id=action_id,
                incident_id=incident_id,
                runbook_title=runbook_title,
                command=command,
                target_resource=target_resource,
                risk_level=risk_level,
                rationale=rationale,
                status="PENDING_APPROVAL",
                requested_by="Findly AI Assistant (Qwen)",
                requested_at=utc_now(),
            )
            session.add(record)
            session.commit()
            return {
                "action_id": action_id,
                "command": command,
                "target_resource": target_resource,
                "risk_level": risk_level,
                "rationale": rationale,
                "status": "PENDING_APPROVAL",
                "requested_at": record.requested_at.isoformat(),
            }
        finally:
            session.close()

    @staticmethod
    def review_action(
        action_id: str,
        decision: str,  # "APPROVE" or "REJECT"
        reviewer_name: str = "DevOps Engineer",
    ) -> Dict[str, Any]:
        """Approve or reject a pending action."""
        session = SessionLocal()
        try:
            record = session.query(ActionApprovalRecord).filter_by(id=action_id).first()
            if not record:
                raise ValueError(f"Action request {action_id} not found.")

            if decision.upper() == "APPROVE":
                record.status = "APPROVED"
                record.reviewed_by = reviewer_name
                record.reviewed_at = utc_now()
                record.execution_output = f"Simulated execution succeeded on {record.target_resource}. Status: OK."
            else:
                record.status = "REJECTED"
                record.reviewed_by = reviewer_name
                record.reviewed_at = utc_now()
                record.execution_output = "Action was explicitly rejected by operator. No commands executed."

            session.commit()
            return {
                "action_id": record.id,
                "status": record.status,
                "reviewed_by": record.reviewed_by,
                "reviewed_at": record.reviewed_at.isoformat() if record.reviewed_at else None,
                "execution_output": record.execution_output,
            }
        finally:
            session.close()

    @staticmethod
    def list_actions(status_filter: Optional[str] = None) -> List[Dict[str, Any]]:
        """List all action requests and audit trails."""
        session = SessionLocal()
        try:
            query = session.query(ActionApprovalRecord)
            if status_filter:
                query = query.filter_by(status=status_filter)
            records = query.order_by(ActionApprovalRecord.requested_at.desc()).all()
            return [
                {
                    "action_id": r.id,
                    "incident_id": r.incident_id,
                    "runbook_title": r.runbook_title,
                    "command": r.command,
                    "target_resource": r.target_resource,
                    "risk_level": r.risk_level,
                    "rationale": r.rationale,
                    "status": r.status,
                    "requested_by": r.requested_by,
                    "reviewed_by": r.reviewed_by,
                    "requested_at": r.requested_at.isoformat() if r.requested_at else None,
                    "reviewed_at": r.reviewed_at.isoformat() if r.reviewed_at else None,
                    "execution_output": r.execution_output,
                }
                for r in records
            ]
        finally:
            session.close()
