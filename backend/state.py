"""Shared application state and initialized singletons for FastAPI."""

import sys
from pathlib import Path
from typing import List, Optional

# Ensure src is on sys.path
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from findly.analyzer import LogAnalyzer
from findly.database import DocumentRecord, SectionRecord, SessionLocal, init_db
from findly.ingestion.doc_parser import ParsedDocument
from findly.ingestion.runbook_loader import load_all_runbooks
from findly.models import LogRecord
from findly.parser import parse_log_file
from findly.stair.retriever import StairRetrieverEngine
from findly.stair.vector_store import SectionVectorStore
from findly.trie import HierarchyTrie


class AppState:
    """Singleton holding shared in-memory engines and indexes."""

    def __init__(self):
        self.trie = HierarchyTrie()
        self.vector_store = SectionVectorStore()
        self.analyzer = LogAnalyzer(label_file="dataset/anomaly_labels.txt")
        self.log_records: List[LogRecord] = []
        self.retriever: Optional[StairRetrieverEngine] = None
        self._is_initialized = False

    def initialize(self):
        if self._is_initialized:
            return

        # 1. Initialize DB tables
        init_db()

        # 2. Parse OpenStack datasets
        abnormal_path = Path("dataset/openstack_abnormal.log")
        normal1_path = Path("dataset/openstack_normal1.log")

        recs = []
        if abnormal_path.exists():
            recs.extend(parse_log_file(abnormal_path))
        if normal1_path.exists():
            recs.extend(parse_log_file(normal1_path, max_lines=15000))

        self.log_records = recs

        # 3. Ingest operational runbooks
        runbooks = load_all_runbooks("runbooks")
        self._sync_documents_to_db_and_trie(runbooks)

        # 4. Construct STAIR retriever engine
        self.retriever = StairRetrieverEngine(
            trie=self.trie,
            vector_store=self.vector_store,
            log_records=self.log_records,
        )

        self._is_initialized = True

    def _sync_documents_to_db_and_trie(self, documents: List[ParsedDocument]):
        db = SessionLocal()
        try:
            for doc in documents:
                # Add to DB
                existing = db.query(DocumentRecord).filter_by(id=doc.document_id).first()
                if not existing:
                    doc_rec = DocumentRecord(
                        id=doc.document_id,
                        title=doc.title,
                        file_type=doc.file_type,
                        file_path=doc.file_path,
                        file_size_bytes=doc.file_size_bytes,
                        total_sections=len(doc.sections),
                    )
                    db.add(doc_rec)

                # Register sections
                for sec in doc.sections:
                    # Register in Vector Store
                    self.vector_store.add_section(sec)

                    # Register in Trie if leaf
                    self.trie.insert(
                        path=sec.hierarchy_path,
                        section_id=sec.section_id,
                        is_leaf=sec.is_leaf,
                        metadata={"title": sec.title, "document_id": sec.document_id},
                    )

                    # Store in DB
                    sec_existing = db.query(SectionRecord).filter_by(id=sec.section_id).first()
                    if not sec_existing:
                        sec_rec = SectionRecord(
                            id=sec.section_id,
                            document_id=sec.document_id,
                            title=sec.title,
                            hierarchy_path=sec.hierarchy_path,
                            level=sec.level,
                            is_leaf=sec.is_leaf,
                            content=sec.content,
                        )
                        db.add(sec_rec)

            db.commit()
        finally:
            db.close()

    def delete_document(self, document_id: str) -> bool:
        """Delete a document and its sections from DB, vector store, and Trie."""
        db = SessionLocal()
        try:
            doc = db.query(DocumentRecord).filter_by(id=document_id).first()
            if not doc:
                return False
            # Remove sections and document record
            db.query(SectionRecord).filter_by(document_id=document_id).delete()
            db.query(DocumentRecord).filter_by(id=document_id).delete()
            db.commit()

            # Remove from vector store
            self.vector_store.remove_sections_by_document(document_id)

            # Rebuild Trie with remaining sections
            self.trie.clear()
            for sec in self.vector_store.sections.values():
                self.trie.insert(
                    path=sec.hierarchy_path,
                    section_id=sec.section_id,
                    is_leaf=sec.is_leaf,
                    metadata={"title": sec.title, "document_id": sec.document_id},
                )

            # Reinitialize retriever
            self.retriever = StairRetrieverEngine(
                trie=self.trie,
                vector_store=self.vector_store,
                log_records=self.log_records,
            )
            return True
        finally:
            db.close()

    def reingest_document(self, document_id: str) -> Optional[ParsedDocument]:
        """Re-ingest an existing document from its file path."""
        db = SessionLocal()
        try:
            doc = db.query(DocumentRecord).filter_by(id=document_id).first()
            if not doc or not doc.file_path or not Path(doc.file_path).exists():
                return None
            content = Path(doc.file_path).read_bytes()
            parsed_doc = UnifiedDocumentIngestion.ingest_file(Path(doc.file_path).name, content)
            self._sync_documents_to_db_and_trie([parsed_doc])
            return parsed_doc
        finally:
            db.close()


state = AppState()

