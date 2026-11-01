"""Automated unit tests for document structural parsing."""

import pytest
from findly.ingestion.doc_parser import MarkdownStructuralParser, UnifiedDocumentIngestion


def test_markdown_preserves_structure_without_fixed_chunks():
    md_content = """# Nova Compute Runbook

## Diagnostic Inspection
First, check host uptime and memory.
Run: `free -m`

## Remediation Procedures
### Action 1: Restart Compute
Execute `systemctl restart nova-compute`.

### Action 2: Clear Disk
Clean up old temporary directories.
"""
    sections = MarkdownStructuralParser.parse(md_content, document_title="Nova Compute Runbook")

    assert len(sections) == 3
    paths = [s.hierarchy_path for s in sections]
    assert "Nova Compute Runbook > Diagnostic Inspection" in paths
    assert "Nova Compute Runbook > Remediation Procedures > Action 1: Restart Compute" in paths
    assert "Nova Compute Runbook > Remediation Procedures > Action 2: Clear Disk" in paths

    # Verify content was preserved intact without 512-character chunk truncation
    action1_sec = next(s for s in sections if "Action 1" in s.title)
    assert "systemctl restart nova-compute" in action1_sec.content
    assert action1_sec.is_leaf is True


def test_unified_document_ingestion_text():
    sample_txt = b"# System Architecture\n\n## Compute Subsystem\nNova handles virtualization."
    doc = UnifiedDocumentIngestion.ingest_file("architecture.txt", sample_txt)

    assert doc.file_type == "TXT"
    assert len(doc.sections) >= 1
    assert doc.sections[0].document_title == "Architecture"

