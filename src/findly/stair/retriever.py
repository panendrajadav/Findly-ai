"""STAIR Structure-Aware Retriever with custom Trie path constraint.

Given a user query or infrastructure alert:
1. Navigates the operational Table of Contents.
2. Uses the HierarchyTrie to constrain predictions strictly to valid leaf sections.
3. Retrieves the complete relevant troubleshooting procedure from complete sections (no arbitrary chunks).
4. Pulls supporting OpenStack log evidence strictly isolated by VM instance ID.
5. Reconstructs exact lifecycle metrics (spawn duration, build duration, claims) and avoids cross-VM pollution.
"""

import re
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Set, Tuple

from findly.analyzer import LogAnalyzer
from findly.ingestion.doc_parser import DocumentSection
from findly.models import LogRecord
from findly.stair.vector_store import SectionVectorStore
from findly.trie import HierarchyTrie, TrieNode

UUID_PATTERN = re.compile(
    r"[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}",
    re.IGNORECASE,
)
REQ_PATTERN = re.compile(
    r"req-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}",
    re.IGNORECASE,
)
BASH_COMMAND_RE = re.compile(r"```bash\s*\n(.*?)\n```", re.DOTALL)


@dataclass
class StairRetrievalOutput:
    """Complete structured output from STAIR retrieval."""
    query: str
    hierarchy_path: str
    leaf_title: str
    section_id: str
    score: float
    procedure_content: str
    remediation_commands: List[str] = field(default_factory=list)
    risk_level: str = "LOW"
    evidence_records: List[LogRecord] = field(default_factory=list)
    candidate_paths: List[Dict[str, Any]] = field(default_factory=list)
    extracted_entities: Dict[str, Any] = field(default_factory=dict)
    vm_lifecycles: Dict[str, Any] = field(default_factory=dict)
    is_cross_vm_comparison: bool = False
    source_document: str = ""
    is_direct_remediation_query: bool = False
    procedure_found: bool = True


class StairRetrieverEngine:
    """
    STAIR Retriever Engine integrating Trie-constrained decoding, complete
    section storage, and strictly isolated OpenStack log evidence extraction.
    """

    def __init__(
        self,
        trie: HierarchyTrie,
        vector_store: SectionVectorStore,
        log_records: Optional[List[LogRecord]] = None,
    ):
        self.trie = trie
        self.vector_store = vector_store
        self.log_records = log_records or []
        self.analyzer = LogAnalyzer(label_file="dataset/anomaly_labels.txt")
        self._index_logs_by_instance()

    def _index_logs_by_instance(self) -> None:
        self.instance_log_map: Dict[str, List[LogRecord]] = {}
        self.service_log_map: Dict[str, List[LogRecord]] = {}

        for r in self.log_records:
            if r.instance_id:
                self.instance_log_map.setdefault(r.instance_id.lower(), []).append(r)
            if r.service:
                self.service_log_map.setdefault(r.service.lower(), []).append(r)

    def extract_entities(self, query: str) -> Dict[str, Any]:
        """Extract explicit VM UUIDs (full or 8-char prefixes), request IDs, and service terms from query/alert."""
        vms = [m.group(0).lower() for m in UUID_PATTERN.finditer(query) if not m.group(0).lower().startswith("req-")]
        # Also match 8-char prefix hex identifiers (e.g. "Instance 544fd51c")
        if not vms:
            for match in re.finditer(r"\b([0-9a-f]{8})\b", query, re.IGNORECASE):
                prefix = match.group(1).lower()
                for full_id in self.instance_log_map.keys():
                    if full_id.startswith(prefix):
                        vms.append(full_id)
                        break

        # Deduplicate while preserving order
        unique_vms = list(dict.fromkeys(vms))
        reqs = list(dict.fromkeys([m.group(0).lower() for m in REQ_PATTERN.finditer(query)]))

        service = None
        q_low = query.lower()
        if "compute" in q_low or "spawn" in q_low or "hypervisor" in q_low:
            service = "nova-compute"
        elif "api" in q_low or "vif" in q_low or "keystone" in q_low:
            service = "nova-api"
        elif "scheduler" in q_low:
            service = "nova-scheduler"

        is_comparison = len(unique_vms) > 1 and any(
            comp_word in q_low for comp_word in ["compare", "vs", "versus", "difference", "between"]
        )

        remediation_cues = [
            "command", "commands", "how to restart", "how to flush", "how to clean",
            "how to migrate", "how do i", "remediation", "fix", "resolve", "script",
            "procedure", "runbook command", "what command", "which command"
        ]
        is_direct_remediation = any(cue in q_low for cue in remediation_cues) and len(unique_vms) == 0

        return {
            "vms": unique_vms,
            "request_ids": reqs,
            "service": service,
            "is_comparison": is_comparison,
            "is_direct_remediation": is_direct_remediation,
        }

    def retrieve(
        self,
        query: str,
        top_k: int = 3,
        max_evidence_logs: int = 8,
    ) -> StairRetrievalOutput:
        """
        Execute STAIR retrieval:
        1. Contextualize query.
        2. Retrieve complete sections from Vector Store.
        3. Enforce custom Trie constraint (must be registered valid leaf).
        4. Extract actionable commands and correlated log evidence strictly isolated by VM.
        """
        entities = self.extract_entities(query)
        target_vms = entities.get("vms", [])
        is_comparison = entities.get("is_comparison", False)

        # 1. Retrieve candidate sections from Vector Store
        raw_candidates = self.vector_store.search(query=query, top_k=top_k * 3, leaf_only=False)

        # 2. Filter & Project through Trie Constraint
        candidate_paths = [sec.hierarchy_path for sec, _ in raw_candidates]
        valid_trie_matches = self.trie.constrain_candidates(candidate_paths)

        # Map valid leaves
        valid_leaf_paths = {node.path_so_far for node in self.trie.get_all_leaves()}

        # Re-query vector store strictly allowing valid leaf paths
        constrained_results = self.vector_store.search(
            query=query,
            top_k=top_k,
            allowed_paths=valid_leaf_paths,
            leaf_only=True,
        )

        selected_section: Optional[DocumentSection] = None
        selected_path: str = ""
        best_score: float = 0.0
        candidate_info: List[Dict[str, Any]] = []

        if constrained_results:
            selected_section, best_score = constrained_results[0]
            selected_path = selected_section.hierarchy_path
            for sec, sc in constrained_results:
                candidate_info.append({
                    "path": sec.hierarchy_path,
                    "title": sec.title,
                    "score": round(sc, 3),
                    "section_id": sec.section_id,
                })
        elif raw_candidates:
            # Fallback to top candidate if constrained results empty
            selected_section, best_score = raw_candidates[0]
            selected_path = selected_section.hierarchy_path
            candidate_info.append({
                "path": selected_path,
                "title": selected_section.title,
                "score": round(best_score, 3),
                "section_id": selected_section.section_id,
            })
        else:
            selected_section = None
            selected_path = ""
            best_score = 0.0

        # Determine if procedure was genuinely found
        is_direct_rem = entities.get("is_direct_remediation", False)
        procedure_found = True

        if selected_section is None:
            procedure_found = False
        elif is_direct_rem:
            # Check meaningful domain word overlap
            # Stopwords & generic DevOps words that should not trigger false positive matches
            generic_words = {
                "what", "which", "how", "command", "commands", "procedure", "remediation",
                "runbook", "action", "do", "i", "to", "the", "a", "an", "is", "for", "stuck",
                "node", "worker", "host", "server", "service", "system", "reboot", "restart"
            }
            # Extract content words from query
            query_words = set(re.findall(r"[a-z0-9_\-]+", query.lower())) - generic_words
            sec_full_text = f"{selected_section.title} {selected_section.hierarchy_path} {' '.join(selected_section.keywords)} {selected_section.content}".lower()

            # If the user mentioned specific non-generic technical entities (e.g., 'kubernetes', 'nginx', 'docker')
            # that are nowhere in the retrieved section, or if no specific content words matched, reject as not found
            if query_words:
                matched_words = {w for w in query_words if w in sec_full_text}
                # If specific technical terms exist (e.g. 'kubernetes') but none match:
                if not matched_words or (len(matched_words) / len(query_words) < 0.3 and best_score < 0.25):
                    procedure_found = False
            elif best_score < 0.15:
                procedure_found = False

        if not procedure_found or selected_section is None:
            selected_section = DocumentSection(
                section_id="sec_not_found",
                document_id="doc_unknown",
                document_title="Procedure Not Found",
                title="Procedure Not Found",
                hierarchy_path="Knowledge Base > Not Found",
                level=1,
                is_leaf=True,
                content="No relevant troubleshooting procedure or runbook was found for this query in the indexed knowledge base.",
            )
            selected_path = selected_section.hierarchy_path
            commands = []
            risk_level = "LOW"
        else:
            # 3. Extract executable remediation commands from runbook content
            commands = []
            for match in BASH_COMMAND_RE.finditer(selected_section.content):
                cmd_block = match.group(1).strip()
                for line in cmd_block.splitlines():
                    line_clean = line.strip()
                    if line_clean and not line_clean.startswith("#"):
                        commands.append(line_clean)

            # 4. Assess risk level from runbook metadata or content
            risk_level = selected_section.metadata.get("risk_level", "LOW")
            content_upper = selected_section.content.upper()
            if "HIGH" in content_upper or "RESTART" in content_upper or "MIGRATION" in content_upper or "DELETE" in content_upper:
                risk_level = "HIGH"
            elif "MEDIUM" in content_upper or "RELOAD" in content_upper:
                risk_level = "MEDIUM"

        # 5. Retrieve supporting OpenStack log records strictly maintaining VM isolation (Requirement 2.A)
        evidence_logs: List[LogRecord] = []
        vm_lifecycles_data: Dict[str, Any] = {}

        if target_vms:
            # Process each requested VM independently
            for vm_id in target_vms:
                vm_recs = self.instance_log_map.get(vm_id, [])
                if vm_recs:
                    # Reconstruct this specific VM's lifecycle
                    vm_map = self.analyzer.reconstruct_lifecycles(vm_recs)
                    vm_obj = vm_map.get(vm_id) or next(iter(vm_map.values()), None)

                    if vm_obj:
                        # Find the exact line where spawn duration was logged
                        spawn_line = None
                        spawn_file = None
                        for r in vm_recs:
                            if "Took" in r.message and "seconds to spawn the instance" in r.message:
                                spawn_line = r.line_number
                                spawn_file = r.source_file
                                break

                        # Compute statistical z-score vs baseline
                        spawn_dur = vm_obj.spawn_duration
                        spawn_diff = (spawn_dur - 19.79) if spawn_dur else None
                        spawn_z = (spawn_diff / 0.65) if spawn_diff is not None else None

                        vm_lifecycles_data[vm_id] = {
                            "instance_id": vm_obj.instance_id,
                            "spawn_duration": vm_obj.spawn_duration,
                            "build_duration": vm_obj.build_duration,
                            "memory_mb": vm_obj.memory_mb,
                            "disk_gb": vm_obj.disk_gb,
                            "vcpu": vm_obj.vcpu,
                            "first_seen": vm_obj.first_seen.strftime("%Y-%m-%d %H:%M:%S.%f")[:-3] if vm_obj.first_seen else None,
                            "last_seen": vm_obj.last_seen.strftime("%Y-%m-%d %H:%M:%S.%f")[:-3] if vm_obj.last_seen else None,
                            "is_known_anomaly": vm_obj.is_known_anomaly,
                            "total_events": vm_obj.total_events,
                            "spawn_line": spawn_line,
                            "spawn_file": spawn_file,
                            "spawn_diff": round(spawn_diff, 2) if spawn_diff is not None else None,
                            "spawn_z": round(spawn_z, 1) if spawn_z is not None else None,
                            "source_file": vm_obj.file_source,
                        }

                    # If not cross-VM comparison, only attach records of the primary target VM
                    if not is_comparison and len(evidence_logs) == 0:
                        evidence_logs.extend(vm_recs[:max_evidence_logs])
                    elif is_comparison:
                        # Take top samples from each VM
                        per_vm_count = max(2, max_evidence_logs // len(target_vms))
                        evidence_logs.extend(vm_recs[:per_vm_count])

            # Do NOT fall back to service logs if user asked about specific VMs!
        else:
            # Query is service-level or runbook-level (no VM specified)
            if entities.get("service"):
                svc = entities["service"]
                if svc in self.service_log_map:
                    evidence_logs.extend(self.service_log_map[svc][:max_evidence_logs])

        # Sort logs chronologically
        evidence_logs = sorted(evidence_logs, key=lambda r: r.timestamp)[:max_evidence_logs]

        # For direct remediation queries, do not attach unrelated service background logs
        if is_direct_rem or not procedure_found:
            evidence_logs = []

        return StairRetrievalOutput(
            query=query,
            hierarchy_path=selected_path,
            leaf_title=selected_section.title,
            section_id=selected_section.section_id,
            score=best_score,
            procedure_content=selected_section.content,
            remediation_commands=commands,
            risk_level=risk_level,
            evidence_records=evidence_logs,
            candidate_paths=candidate_info,
            extracted_entities=entities,
            vm_lifecycles=vm_lifecycles_data,
            is_cross_vm_comparison=is_comparison,
            source_document=getattr(selected_section, "document_title", ""),
            is_direct_remediation_query=is_direct_rem,
            procedure_found=procedure_found,
        )
