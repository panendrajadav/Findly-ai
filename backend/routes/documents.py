"""Document ingestion API routes."""

from typing import Any, Dict, List
from fastapi import APIRouter, File, HTTPException, UploadFile
from findly.database import DocumentRecord, SectionRecord, SessionLocal
from findly.ingestion.doc_parser import UnifiedDocumentIngestion
from backend.state import state

router = APIRouter(prefix="/api/documents", tags=["Documents"])


@router.get("", response_model=List[Dict[str, Any]])
def list_documents():
    """List all ingested documents and their structural metadata."""
    db = SessionLocal()
    try:
        docs = db.query(DocumentRecord).order_by(DocumentRecord.created_at.desc()).all()
        return [
            {
                "id": d.id,
                "title": d.title,
                "file_type": d.file_type,
                "file_path": d.file_path,
                "file_size_bytes": d.file_size_bytes,
                "total_sections": d.total_sections,
                "created_at": d.created_at.isoformat() if d.created_at else None,
            }
            for d in docs
        ]
    finally:
        db.close()


@router.get("/{document_id}/sections", response_model=List[Dict[str, Any]])
def get_document_sections(document_id: str):
    """Retrieve all complete structural sections for an ingested document."""
    db = SessionLocal()
    try:
        sections = db.query(SectionRecord).filter_by(document_id=document_id).order_by(SectionRecord.hierarchy_path).all()
        if not sections:
            raise HTTPException(status_code=404, detail="Document not found or has no sections.")
        return [
            {
                "id": s.id,
                "title": s.title,
                "hierarchy_path": s.hierarchy_path,
                "level": s.level,
                "is_leaf": s.is_leaf,
                "content": s.content,
            }
            for s in sections
        ]
    finally:
        db.close()


@router.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    """Upload and ingest a document (PDF, DOCX, TXT, Markdown) into the STAIR system."""
    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    parsed_doc = UnifiedDocumentIngestion.ingest_file(file.filename, content)
    state._sync_documents_to_db_and_trie([parsed_doc])

    return {
        "status": "SUCCESS",
        "document_id": parsed_doc.document_id,
        "title": parsed_doc.title,
        "file_type": parsed_doc.file_type,
        "total_sections_ingested": len(parsed_doc.sections),
    }


@router.delete("/{document_id}")
def delete_document(document_id: str):
    """Delete an ingested document, its structural sections, and Trie references."""
    success = state.delete_document(document_id)
    if not success:
        raise HTTPException(status_code=404, detail=f"Document {document_id} not found.")
    return {
        "status": "SUCCESS",
        "message": f"Document {document_id} and its structural sections deleted.",
        "remaining_sections": state.vector_store.count(),
        "remaining_trie_leaves": len(state.trie.get_all_leaves()),
    }


@router.post("/{document_id}/reingest")
def reingest_document(document_id: str):
    """Re-parse and re-index an existing document."""
    parsed_doc = state.reingest_document(document_id)
    if not parsed_doc:
        raise HTTPException(status_code=404, detail=f"Could not re-ingest document {document_id} (source file missing).")
    return {
        "status": "SUCCESS",
        "document_id": parsed_doc.document_id,
        "title": parsed_doc.title,
        "sections_reingested": len(parsed_doc.sections),
    }

