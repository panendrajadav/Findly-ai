"""Database persistence layer using SQLAlchemy supporting PostgreSQL with SQLite fallback."""

import json
import os
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    create_engine,
)
from sqlalchemy.orm import declarative_base, relationship, sessionmaker, Session

Base = declarative_base()

def utc_now():
    return datetime.now(timezone.utc)

# Configure Database URL: Postgres default, SQLite fallback for seamless demo execution
POSTGRES_URL = os.environ.get(
    "DATABASE_URL",
    "postgresql://postgres:postgres@localhost:5432/findly_ai",
)
SQLITE_URL = "sqlite:///./findly_local.db"


def get_engine():
    """Try PostgreSQL first; gracefully fallback to SQLite if connection fails."""
    try:
        # Check if Postgres is reachable with a short timeout
        eng = create_engine(POSTGRES_URL, pool_pre_ping=True, connect_args={"connect_timeout": 2})
        with eng.connect() as conn:
            return eng
    except Exception:
        # Fallback to SQLite
        return create_engine(SQLITE_URL, connect_args={"check_same_thread": False})


engine = get_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class DocumentRecord(Base):
    """Stores ingested document metadata and its root Table of Contents."""
    __tablename__ = "documents"

    id = Column(String(64), primary_key=True)
    title = Column(String(255), nullable=False)
    file_type = Column(String(32), nullable=False)  # PDF, DOCX, MARKDOWN, TXT, LOG
    file_path = Column(String(512), nullable=True)
    file_size_bytes = Column(Integer, default=0)
    total_sections = Column(Integer, default=0)
    created_at = Column(DateTime, default=utc_now)
    metadata_json = Column(Text, default="{}")

    sections = relationship("SectionRecord", back_populates="document", cascade="all, delete-orphan")


class SectionRecord(Base):
    """
    Stores complete structural document sections with hierarchical paths.
    STAIR principle: Sections are preserved in their entirety; never split into arbitrary fixed-size chunks.
    """
    __tablename__ = "sections"

    id = Column(String(64), primary_key=True)
    document_id = Column(String(64), ForeignKey("documents.id"), nullable=False)
    title = Column(String(255), nullable=False)
    hierarchy_path = Column(String(512), nullable=False, index=True)
    level = Column(Integer, default=1)
    is_leaf = Column(Boolean, default=True)
    content = Column(Text, nullable=False)
    summary = Column(Text, default="")
    keywords_json = Column(Text, default="[]")
    metadata_json = Column(Text, default="{}")
    embedding_json = Column(Text, nullable=True)  # JSON-serialized embedding vector

    document = relationship("DocumentRecord", back_populates="sections")


class IncidentRecord(Base):
    """Stores detected OpenStack anomalies and correlated telemetry."""
    __tablename__ = "incidents"

    id = Column(String(64), primary_key=True)
    instance_id = Column(String(64), nullable=False, index=True)
    severity = Column(String(32), default="HIGH")
    anomaly_score = Column(Float, default=0.0)
    spawn_duration = Column(Float, nullable=True)
    build_duration = Column(Float, nullable=True)
    is_known_anomaly = Column(Boolean, default=False)
    root_cause = Column(Text, default="")
    status = Column(String(32), default="OPEN")  # OPEN, INVESTIGATING, RESOLVED
    created_at = Column(DateTime, default=utc_now)
    evidence_json = Column(Text, default="[]")


class ActionApprovalRecord(Base):
    """DevOps Human-in-the-Loop approval requests for remediation runbook actions."""
    __tablename__ = "action_approvals"

    id = Column(String(64), primary_key=True)
    incident_id = Column(String(64), nullable=True)
    runbook_title = Column(String(255), nullable=False)
    command = Column(Text, nullable=False)
    target_resource = Column(String(255), nullable=False)
    risk_level = Column(String(32), default="MEDIUM")  # LOW, MEDIUM, HIGH, CRITICAL
    rationale = Column(Text, nullable=False)
    status = Column(String(32), default="PENDING_APPROVAL")  # PENDING_APPROVAL, APPROVED, REJECTED, EXECUTED
    requested_by = Column(String(64), default="Findly AI Assistant")
    reviewed_by = Column(String(64), nullable=True)
    requested_at = Column(DateTime, default=utc_now)
    reviewed_at = Column(DateTime, nullable=True)
    execution_output = Column(Text, default="")


class ChatMessageRecord(Base):
    """Stores conversational diagnostic interaction history with STAIR evidence citations."""
    __tablename__ = "chat_messages"

    id = Column(String(64), primary_key=True)
    session_id = Column(String(64), default="default", index=True)
    role = Column(String(32), nullable=False)  # user, assistant, system
    query = Column(Text, nullable=False)
    answer = Column(Text, nullable=True)
    retrieved_path = Column(String(512), nullable=True)
    leaf_id = Column(String(64), nullable=True)
    citations_json = Column(Text, default="[]")
    created_at = Column(DateTime, default=utc_now)


def init_db():
    """Create all tables in the database."""
    Base.metadata.create_all(bind=engine)


def get_db() -> Session:
    """Dependency helper for FastAPI endpoints."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
