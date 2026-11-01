"""Section Vector Store for STAIR with Qdrant integration.

Stores complete document sections, embeddings, metadata, and hierarchy references.
Explicitly avoids arbitrary fixed-size chunking, preserving semantic integrity.
Backends:
  - QdrantSectionStore: Native Qdrant client vector index with section payload.
  - SectionVectorStore: High-performance vector store with Trie constraints and Qdrant integration.
"""

import json
import logging
import re
from typing import Any, Dict, List, Optional, Set, Tuple
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from findly.ingestion.doc_parser import DocumentSection

logger = logging.getLogger(__name__)

try:
    import qdrant_client
    from qdrant_client.models import Distance, PointStruct, VectorParams
    QDRANT_AVAILABLE = True
except ImportError:
    QDRANT_AVAILABLE = False


class QdrantSectionStore:
    """
    Qdrant-backed vector store for complete document sections.
    Indexes full document sections with full hierarchy path, metadata, and payload.
    """

    COLLECTION_NAME = "stair_sections"
    VECTOR_DIM = 512

    def __init__(self, location: str = ":memory:"):
        self.location = location
        self.client: Optional[Any] = None
        self._init_client()

    def _init_client(self) -> None:
        if not QDRANT_AVAILABLE:
            logger.warning("qdrant-client not installed; QdrantSectionStore unavailable.")
            return

        try:
            self.client = qdrant_client.QdrantClient(self.location)
            collections = [c.name for c in self.client.get_collections().collections]
            if self.COLLECTION_NAME not in collections:
                self.client.create_collection(
                    collection_name=self.COLLECTION_NAME,
                    vectors_config=VectorParams(size=self.VECTOR_DIM, distance=Distance.COSINE),
                )
            logger.info("Qdrant collection '%s' initialized at %s", self.COLLECTION_NAME, self.location)
        except Exception as e:
            logger.error("Failed to initialize Qdrant client: %s", e)
            self.client = None

    def is_available(self) -> bool:
        return self.client is not None

    def upsert_sections(self, sections: List[DocumentSection], embeddings: List[np.ndarray]) -> bool:
        if not self.is_available() or not sections:
            return False

        points = []
        for i, (sec, emb) in enumerate(zip(sections, embeddings)):
            vector = emb.tolist() if isinstance(emb, np.ndarray) else list(emb)
            # Pad or truncate to VECTOR_DIM if necessary
            if len(vector) < self.VECTOR_DIM:
                vector = vector + [0.0] * (self.VECTOR_DIM - len(vector))
            elif len(vector) > self.VECTOR_DIM:
                vector = vector[:self.VECTOR_DIM]

            points.append(
                PointStruct(
                    id=abs(hash(sec.section_id)) % (2**63 - 1),
                    vector=vector,
                    payload={
                        "section_id": sec.section_id,
                        "document_id": sec.document_id,
                        "title": sec.title,
                        "hierarchy_path": sec.hierarchy_path,
                        "level": getattr(sec, "level", 1),
                        "content": sec.content,
                        "keywords": sec.keywords,
                        "is_leaf": sec.is_leaf,
                        "risk_level": getattr(sec, "metadata", {}).get("risk_level", "low") if isinstance(getattr(sec, "metadata", None), dict) else "low",
                    },
                )
            )

        try:
            self.client.upsert(collection_name=self.COLLECTION_NAME, points=points)
            return True
        except Exception as e:
            logger.error("Failed to upsert sections to Qdrant: %s", e)
            return False


class SectionVectorStore:
    """
    Vector store for complete document sections.
    Integrates full hierarchy paths into the section embedding context,
    with native support for Qdrant storage.
    """

    def __init__(self, use_qdrant: bool = True):
        self.sections: Dict[str, DocumentSection] = {}
        self.vectorizer = TfidfVectorizer(
            ngram_range=(1, 2),
            stop_words="english",
            max_features=512,
        )
        self.tfidf_matrix: Optional[np.ndarray] = None
        self.section_id_list: List[str] = []
        self._is_indexed = False
        self.qdrant_store = QdrantSectionStore() if (use_qdrant and QDRANT_AVAILABLE) else None

    def add_section(self, section: DocumentSection) -> None:
        """Add a complete document section (never chunked)."""
        self.sections[section.section_id] = section
        self._is_indexed = False

    def add_sections(self, sections: List[DocumentSection]) -> None:
        """Add multiple complete document sections."""
        for sec in sections:
            self.sections[sec.section_id] = sec
        self._is_indexed = False

    def remove_sections_by_document(self, document_id: str) -> int:
        """Remove all sections associated with a document and invalidate the index."""
        to_del = [sid for sid, sec in self.sections.items() if sec.document_id == document_id]
        for sid in to_del:
            del self.sections[sid]
        self._is_indexed = False
        return len(to_del)

    def _build_index(self) -> None:
        """Compute embeddings across all registered complete sections and sync to Qdrant."""
        if not self.sections:
            return

        self.section_id_list = list(self.sections.keys())
        corpus = []
        sec_objs = []

        for sec_id in self.section_id_list:
            sec = self.sections[sec_id]
            sec_objs.append(sec)
            # STAIR Principle: Embed full hierarchy context + complete section body
            text_representation = (
                f"Path: {sec.hierarchy_path}\n"
                f"Title: {sec.title}\n"
                f"Keywords: {' '.join(sec.keywords)}\n"
                f"Content: {sec.content}"
            )
            corpus.append(text_representation)

        dense_tfidf = self.vectorizer.fit_transform(corpus)
        self.tfidf_matrix = dense_tfidf
        self._is_indexed = True

        # Synchronize with Qdrant collection if active
        if self.qdrant_store and self.qdrant_store.is_available():
            dense_array = dense_tfidf.toarray()
            self.qdrant_store.upsert_sections(sec_objs, dense_array)

    def search(
        self,
        query: str,
        top_k: int = 5,
        allowed_paths: Optional[Set[str]] = None,
        leaf_only: bool = True,
    ) -> List[Tuple[DocumentSection, float]]:
        """
        Perform vector similarity search over complete sections.
        Optionally constrains search space to allowed Trie hierarchy paths.
        """
        if not self.sections:
            return []

        if not self._is_indexed:
            self._build_index()

        q_vec = self.vectorizer.transform([query])
        similarities = cosine_similarity(q_vec, self.tfidf_matrix).flatten()

        ranked_indices = np.argsort(similarities)[::-1]
        results: List[Tuple[DocumentSection, float]] = []

        for idx in ranked_indices:
            sec_id = self.section_id_list[idx]
            sec = self.sections[sec_id]
            score = float(similarities[idx])

            # Apply leaf constraint
            if leaf_only and not sec.is_leaf:
                continue

            # Apply Trie path constraint if provided
            if allowed_paths is not None:
                if sec.hierarchy_path not in allowed_paths:
                    continue

            results.append((sec, score))
            if len(results) >= top_k:
                break

        return results

    def get_section(self, section_id: str) -> Optional[DocumentSection]:
        return self.sections.get(section_id)

    def count(self) -> int:
        return len(self.sections)


