"""Data models for Findly AI OpenStack telemetry analysis and STAIR RAG."""

from dataclasses import dataclass, field
from datetime import datetime
from typing import List, Optional, Tuple, Dict, Any


@dataclass
class LogRecord:
    """Represents a structured OpenStack log entry."""
    source_file: str
    line_number: int
    timestamp: datetime
    pid: int
    level: str
    module: str
    service: str
    request_id: Optional[str]
    user_id: Optional[str]
    tenant_id: Optional[str]
    instance_id: Optional[str]
    message: str
    raw: str = ""

    def to_dict(self) -> Dict[str, Any]:
        return {
            "source_file": self.source_file,
            "line_number": self.line_number,
            "timestamp": self.timestamp.isoformat(),
            "pid": self.pid,
            "level": self.level,
            "module": self.module,
            "service": self.service,
            "request_id": self.request_id,
            "user_id": self.user_id,
            "tenant_id": self.tenant_id,
            "instance_id": self.instance_id,
            "message": self.message,
        }


@dataclass
class VMLifecycle:
    """Aggregated lifecycle telemetry for an OpenStack virtual machine instance."""
    instance_id: str
    file_source: str
    first_seen: datetime
    last_seen: datetime
    spawn_duration: Optional[float] = None
    build_duration: Optional[float] = None
    destroy_duration: Optional[float] = None
    network_dealloc_duration: Optional[float] = None
    memory_mb: Optional[int] = None
    disk_gb: Optional[int] = None
    vcpu: Optional[int] = None
    total_events: int = 0
    records: List[LogRecord] = field(default_factory=list)
    lifecycle_states: List[Tuple[datetime, str]] = field(default_factory=list)
    is_known_anomaly: bool = False
    predicted_anomaly: bool = False
    anomaly_score: float = 0.0
    anomaly_reason: str = ""

    @property
    def total_lifespan_seconds(self) -> float:
        return (self.last_seen - self.first_seen).total_seconds()


@dataclass
class ToCNode:
    """Represents a node in STAIR's hierarchical Table of Contents."""
    node_id: str
    title: str
    path: str
    level: int
    is_leaf: bool
    description: str
    keywords: List[str] = field(default_factory=list)
    parent_id: Optional[str] = None
    children_ids: List[str] = field(default_factory=list)


@dataclass
class RetrievalResult:
    """Result from STAIR structure-aware retrieval."""
    query: str
    leaf_node: ToCNode
    hierarchy_path: str
    score: float
    evidence_records: List[LogRecord] = field(default_factory=list)
    extracted_entities: Dict[str, Any] = field(default_factory=dict)
    candidate_scores: Dict[str, float] = field(default_factory=dict)


@dataclass
class GroundedAnswer:
    """An operational diagnostic answer grounded strictly in retrieved log evidence."""
    query: str
    retrieval: RetrievalResult
    answer_text: str
    cited_records: List[LogRecord] = field(default_factory=list)
    root_cause: str = ""
    status: str = "NORMAL"  # NORMAL, ANOMALY_CONFIRMED, INVESTIGATION_NEEDED

