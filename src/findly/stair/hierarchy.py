"""Hierarchical Table of Contents (ToC) representations for STAIR."""

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional
from findly.ingestion.doc_parser import DocumentSection


@dataclass
class HierarchicalSectionNode:
    """Represents a structural section node in the STAIR ToC hierarchy."""
    node_id: str
    title: str
    path: str
    level: int
    is_leaf: bool
    description: str
    content: str = ""
    keywords: List[str] = field(default_factory=list)
    document_id: Optional[str] = None
    parent_id: Optional[str] = None
    children_ids: List[str] = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)

    @property
    def full_context(self) -> str:
        """STAIR context representation: Ancestor path context combined with title and description."""
        return f"Hierarchy: {self.path}\nTitle: {self.title}\nDescription: {self.description}\nKeywords: {', '.join(self.keywords)}"


def section_to_hierarchy_node(sec: DocumentSection) -> HierarchicalSectionNode:
    """Convert an ingested document section into a STAIR hierarchy node."""
    return HierarchicalSectionNode(
        node_id=sec.section_id,
        title=sec.title,
        path=sec.hierarchy_path,
        level=sec.level,
        is_leaf=sec.is_leaf,
        description=sec.summary or sec.content[:180].replace("\n", " "),
        content=sec.content,
        keywords=sec.keywords,
        document_id=sec.document_id,
        metadata=sec.metadata,
    )

