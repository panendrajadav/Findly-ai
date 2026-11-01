"""Runbook loader that ingests operational runbooks into the STAIR system."""

from pathlib import Path
from typing import List
from findly.ingestion.doc_parser import DocumentSection, MarkdownStructuralParser, ParsedDocument


def load_all_runbooks(runbook_dir: str = "runbooks") -> List[ParsedDocument]:
    """Scan and ingest all markdown runbooks preserving their structural sections."""
    path = Path(runbook_dir)
    if not path.exists():
        return []

    documents: List[ParsedDocument] = []
    for f in path.glob("*.md"):
        content = f.read_text(encoding="utf-8", errors="replace")
        title = f.stem.replace("_", " ").title()
        doc_id = f"runbook_{f.stem}"

        sections = MarkdownStructuralParser.parse(content, document_title=title, document_id=doc_id)
        doc = ParsedDocument(
            document_id=doc_id,
            title=title,
            file_type="MARKDOWN",
            file_path=str(f),
            file_size_bytes=f.stat().st_size,
            sections=sections,
            metadata={"runbook_filename": f.name, "category": "DevOps Runbook"},
        )
        documents.append(doc)

    return documents

