"""Custom Trie implementation for STAIR structure-aware retrieval.

Constrains retrieval candidate generation strictly to valid registered hierarchy
paths and leaf sections, preventing hallucinated or malformed retrieval destinations.
"""

from typing import Any, Dict, List, Optional, Set, Tuple, Union


class TrieNode:
    """Represents a node in the hierarchical STAIR path Trie."""

    def __init__(self, segment: str, path_so_far: str, is_leaf: bool = False):
        self.segment: str = segment
        self.path_so_far: str = path_so_far
        self.is_leaf: bool = is_leaf
        self.section_id: Optional[str] = None
        self.metadata: Dict[str, Any] = {}
        self.children: Dict[str, "TrieNode"] = {}

    def add_child(self, segment: str, is_leaf: bool = False) -> "TrieNode":
        if segment not in self.children:
            child_path = f"{self.path_so_far} > {segment}" if self.path_so_far else segment
            self.children[segment] = TrieNode(segment=segment, path_so_far=child_path, is_leaf=is_leaf)
        elif is_leaf:
            self.children[segment].is_leaf = True
        return self.children[segment]

    def to_dict(self) -> Dict[str, Any]:
        """Convert Trie node to dictionary for frontend tree visualization."""
        return {
            "segment": self.segment,
            "path": self.path_so_far,
            "is_leaf": self.is_leaf,
            "section_id": self.section_id,
            "metadata": self.metadata,
            "children": [child.to_dict() for child in self.children.values()],
        }


class HierarchyTrie:
    """
    Trie structure constraining STAIR retrieval to registered hierarchy paths.
    Enforces Trie-constrained decoding & branch verification.
    """

    def __init__(self, separator: str = " > "):
        self.separator = separator
        self.root = TrieNode(segment="ROOT", path_so_far="")
        self._leaf_count = 0
        self._all_leaves: Dict[str, TrieNode] = {}  # Map of path -> TrieNode

    def clear(self) -> None:
        """Reset the Trie completely."""
        self.root = TrieNode(segment="ROOT", path_so_far="")
        self._leaf_count = 0
        self._all_leaves = {}

    def _split_path(self, path: Union[str, List[str]]) -> List[str]:
        if isinstance(path, list):
            return [p.strip() for p in path if p.strip()]
        return [seg.strip() for seg in path.split(self.separator) if seg.strip()]

    def insert(
        self,
        path: Union[str, List[str]],
        section_id: str,
        is_leaf: bool = True,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> TrieNode:
        """
        Register a valid hierarchical path in the Trie.
        Marks the terminal node as a valid leaf section if is_leaf is True.
        """
        segments = self._split_path(path)
        if not segments:
            raise ValueError("Path segments cannot be empty.")

        curr = self.root
        for idx, seg in enumerate(segments):
            is_terminal = (idx == len(segments) - 1)
            curr = curr.add_child(seg, is_leaf=(is_terminal and is_leaf))

        if is_leaf:
            curr.is_leaf = True
            curr.section_id = section_id
            curr.metadata = metadata or {}
            self._all_leaves[curr.path_so_far] = curr
            self._leaf_count += 1

        return curr

    def is_valid_prefix(self, prefix: Union[str, List[str]]) -> bool:
        """Verify whether a path prefix exists in the registered hierarchy."""
        segments = self._split_path(prefix)
        curr = self.root
        for seg in segments:
            if seg not in curr.children:
                return False
            curr = curr.children[seg]
        return True

    def get_valid_continuations(self, prefix: Union[str, List[str]]) -> List[str]:
        """
        Trie-Constrained Decoding:
        Given an active prefix path, returns all valid next branch segments.
        If the prefix reaches a leaf with no further children, returns empty list.
        """
        segments = self._split_path(prefix)
        curr = self.root
        for seg in segments:
            if seg not in curr.children:
                return []
            curr = curr.children[seg]
        return sorted(list(curr.children.keys()))

    def find(self, path: Union[str, List[str]]) -> Optional[TrieNode]:
        """Find the exact TrieNode corresponding to the full path."""
        segments = self._split_path(path)
        curr = self.root
        for seg in segments:
            if seg not in curr.children:
                return None
            curr = curr.children[seg]
        return curr

    def is_valid_leaf(self, path: Union[str, List[str]]) -> bool:
        """Check if a path corresponds to a registered valid leaf section."""
        node = self.find(path)
        return node is not None and node.is_leaf

    def get_all_leaves(self) -> List[TrieNode]:
        """Return all registered leaf nodes in the Trie."""
        return list(self._all_leaves.values())

    def constrain_candidates(self, candidate_paths: List[str]) -> List[Tuple[str, TrieNode]]:
        """
        Filter and project a list of candidate path predictions onto strictly
        valid registered leaf nodes in the Trie.
        """
        valid_matches = []
        for cand in candidate_paths:
            cand_clean = cand.strip()
            # 1. Exact leaf match
            if cand_clean in self._all_leaves:
                valid_matches.append((cand_clean, self._all_leaves[cand_clean]))
                continue

            # 2. Match terminal leaf segment or suffix (e.g. "Token Auth")
            for leaf_path, leaf_node in self._all_leaves.items():
                if leaf_node.segment.lower() == cand_clean.lower() or leaf_path.endswith(f" > {cand_clean}"):
                    valid_matches.append((leaf_path, leaf_node))
                    break

        return valid_matches

    def export_tree(self) -> Dict[str, Any]:
        """Export the full Trie for frontend visualization."""
        return {
            "total_leaves": self._leaf_count,
            "root": self.root.to_dict(),
        }
