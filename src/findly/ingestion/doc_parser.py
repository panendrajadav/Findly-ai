"""Structural document parser for PDF, DOCX, Markdown, and TXT files.

Preserves document hierarchical structures (Headings, Subheadings, Runbook Steps)
and generates complete semantic sections instead of arbitrary fixed-size text chunks.
"""

import io
import re
import uuid
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple, Union


@dataclass
class DocumentSection:
    """Represents a complete structural section within a document."""
    section_id: str
    document_id: str
    document_title: str
    title: str
    hierarchy_path: str
    level: int
    is_leaf: bool
    content: str
    summary: str = ""
    keywords: List[str] = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class ParsedDocument:
    """Represents a fully ingested document with structural Table of Contents."""
    document_id: str
    title: str
    file_type: str
    file_path: Optional[str]
    file_size_bytes: int
    sections: List[DocumentSection] = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)


class MarkdownStructuralParser:
    """Parses Markdown documents preserving heading hierarchies into full sections."""

    HEADING_RE = re.compile(r"^(#{1,6})\s+(.+)$", re.MULTILINE)
    FRONTMATTER_RE = re.compile(r"^---\s*\n(.*?)\n---\s*\n", re.DOTALL)

    @classmethod
    def parse(cls, text: str, document_title: str, document_id: Optional[str] = None) -> List[DocumentSection]:
        doc_id = document_id or str(uuid.uuid4())[:8]
        sections: List[DocumentSection] = []

        # Extract YAML frontmatter metadata if present
        metadata = {}
        fm_match = cls.FRONTMATTER_RE.match(text)
        body_text = text
        if fm_match:
            fm_text = fm_match.group(1)
            body_text = text[fm_match.end():]
            for line in fm_text.splitlines():
                if ":" in line:
                    k, v = line.split(":", 1)
                    metadata[k.strip()] = v.strip().strip('"').strip("'")

        lines = body_text.splitlines()
        current_path_stack: List[Tuple[int, str]] = []  # [(level, heading_title)]
        current_section_lines: List[str] = []
        current_title = document_title
        current_level = 1

        def flush_section():
            nonlocal current_section_lines, current_title, current_level
            content = "\n".join(current_section_lines).strip()
            if content:
                path_segments = [document_title]
                for lvl, h_text in current_path_stack:
                    if h_text.lower() != document_title.lower():
                        path_segments.append(h_text)
                if (
                    current_title.lower() != document_title.lower()
                    and (not current_path_stack or current_path_stack[-1][1] != current_title)
                ):
                    path_segments.append(current_title)

                hierarchy_path = " > ".join(path_segments)
                sec_id = f"{doc_id}_sec_{len(sections) + 1}"

                # Extract basic operational keywords
                keywords = list(set(re.findall(r"\b[A-Za-z0-9_\-]{4,}\b", (current_title + " " + content).lower())))[:12]

                sections.append(DocumentSection(
                    section_id=sec_id,
                    document_id=doc_id,
                    document_title=document_title,
                    title=current_title,
                    hierarchy_path=hierarchy_path,
                    level=current_level,
                    is_leaf=True,  # Will update leaf flags in second pass
                    content=content,
                    keywords=keywords,
                    metadata=dict(metadata),
                ))
            current_section_lines = []

        for line in lines:
            h_match = re.match(r"^(#{1,6})\s+(.+)$", line)
            if h_match:
                flush_section()
                h_level = len(h_match.group(1))
                h_title = h_match.group(2).strip()

                # Adjust heading hierarchy stack
                while current_path_stack and current_path_stack[-1][0] >= h_level:
                    current_path_stack.pop()

                current_level = h_level
                current_title = h_title
                current_path_stack.append((h_level, h_title))
            else:
                current_section_lines.append(line)

        flush_section()

        # If document had no headings, create a single complete section
        if not sections and body_text.strip():
            sections.append(DocumentSection(
                section_id=f"{doc_id}_sec_1",
                document_id=doc_id,
                document_title=document_title,
                title="Overview",
                hierarchy_path=f"{document_title} > Overview",
                level=1,
                is_leaf=True,
                content=body_text.strip(),
                metadata=dict(metadata),
            ))

        # Mark parent sections vs leaf sections
        paths = [s.hierarchy_path for s in sections]
        for s in sections:
            # If any other section starts with this section's path + ' > ', this section is a parent
            is_parent = any(p != s.hierarchy_path and p.startswith(s.hierarchy_path + " > ") for p in paths)
            s.is_leaf = not is_parent

        return sections


class DocxStructuralParser:
    """Parses Microsoft Word DOCX files preserving paragraph heading styles."""

    @classmethod
    def parse(cls, file_bytes_or_path: Union[str, Path, bytes], document_title: str, document_id: Optional[str] = None) -> List[DocumentSection]:
        import docx

        doc_id = document_id or str(uuid.uuid4())[:8]
        if isinstance(file_bytes_or_path, (str, Path)):
            doc = docx.Document(file_bytes_or_path)
        else:
            doc = docx.Document(io.BytesIO(file_bytes_or_path))

        sections: List[DocumentSection] = []
        current_path_stack: List[Tuple[int, str]] = []
        current_section_lines: List[str] = []
        current_title = document_title
        current_level = 1

        def flush_section():
            nonlocal current_section_lines, current_title, current_level
            content = "\n".join(current_section_lines).strip()
            if content:
                path_segments = [document_title]
                for lvl, h_text in current_path_stack:
                    if h_text.lower() != document_title.lower():
                        path_segments.append(h_text)
                if (
                    current_title.lower() != document_title.lower()
                    and (not current_path_stack or current_path_stack[-1][1] != current_title)
                ):
                    path_segments.append(current_title)

                hierarchy_path = " > ".join(path_segments)
                sec_id = f"{doc_id}_sec_{len(sections) + 1}"

                sections.append(DocumentSection(
                    section_id=sec_id,
                    document_id=doc_id,
                    document_title=document_title,
                    title=current_title,
                    hierarchy_path=hierarchy_path,
                    level=current_level,
                    is_leaf=True,
                    content=content,
                ))
            current_section_lines = []

        for para in doc.paragraphs:
            text = para.text.strip()
            if not text:
                continue

            style_name = para.style.name.lower()
            if "heading 1" in style_name:
                flush_section()
                current_level = 1
                current_title = text
                current_path_stack = [(1, text)]
            elif "heading 2" in style_name:
                flush_section()
                current_level = 2
                current_title = text
                while current_path_stack and current_path_stack[-1][0] >= 2:
                    current_path_stack.pop()
                current_path_stack.append((2, text))
            elif "heading 3" in style_name:
                flush_section()
                current_level = 3
                current_title = text
                while current_path_stack and current_path_stack[-1][0] >= 3:
                    current_path_stack.pop()
                current_path_stack.append((3, text))
            else:
                current_section_lines.append(text)

        flush_section()
        return sections


class PdfStructuralParser:
    """Parses PDF documents using PyPDFium2 / PyPDF2 into structural page/chapter sections."""

    @classmethod
    def parse(cls, file_bytes_or_path: Union[str, Path, bytes], document_title: str, document_id: Optional[str] = None) -> List[DocumentSection]:
        doc_id = document_id or str(uuid.uuid4())[:8]
        pages_text: List[str] = []

        # Try pypdfium2 first
        try:
            import pypdfium2 as pdfium
            if isinstance(file_bytes_or_path, (str, Path)):
                pdf = pdfium.PdfDocument(file_bytes_or_path)
            else:
                pdf = pdfium.PdfDocument(file_bytes_or_path)
            for page in pdf:
                textpage = page.get_textpage()
                pages_text.append(textpage.get_text_range())
        except Exception:
            # Fallback to PyPDF2
            import PyPDF2
            stream = io.BytesIO(file_bytes_or_path) if isinstance(file_bytes_or_path, bytes) else open(file_bytes_or_path, "rb")
            reader = PyPDF2.PdfReader(stream)
            for p in reader.pages:
                pages_text.append(p.extract_text() or "")
            if isinstance(file_bytes_or_path, (str, Path)):
                stream.close()

        # Build full text and parse through markdown structural extractor
        full_text = "\n\n".join(pages_text)
        return MarkdownStructuralParser.parse(full_text, document_title=document_title, document_id=doc_id)


class UnifiedDocumentIngestion:
    """Unified entry point for ingesting any supported document format."""

    @classmethod
    def ingest_file(cls, file_path_or_name: str, content_bytes: bytes) -> ParsedDocument:
        path = Path(file_path_or_name)
        suffix = path.suffix.lower()
        title = path.stem.replace("_", " ").replace("-", " ").title()
        doc_id = str(uuid.uuid4())[:8]

        if suffix in [".md", ".markdown"]:
            text = content_bytes.decode("utf-8", errors="replace")
            sections = MarkdownStructuralParser.parse(text, document_title=title, document_id=doc_id)
            file_type = "MARKDOWN"
        elif suffix in [".docx"]:
            sections = DocxStructuralParser.parse(content_bytes, document_title=title, document_id=doc_id)
            file_type = "DOCX"
        elif suffix in [".pdf"]:
            sections = PdfStructuralParser.parse(content_bytes, document_title=title, document_id=doc_id)
            file_type = "PDF"
        else:
            # Standard Text
            text = content_bytes.decode("utf-8", errors="replace")
            sections = MarkdownStructuralParser.parse(text, document_title=title, document_id=doc_id)
            file_type = "TXT"

        return ParsedDocument(
            document_id=doc_id,
            title=title,
            file_type=file_type,
            file_path=str(path),
            file_size_bytes=len(content_bytes),
            sections=sections,
            metadata={"total_sections": len(sections)},
        )
