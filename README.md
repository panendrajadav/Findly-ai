# Findly AI — Structure-Aware RAG (STAIR) & OpenStack Incident Analysis

Findly AI is an enterprise-grade, structure-aware Retrieval-Augmented Generation (RAG) system for cloud infrastructure diagnostics and DevOps runbook automation. It implements the research-paper-inspired **STAIR (Structure Aware Information Retriever, arXiv:2609.03874)** architecture, replacing conventional arbitrary fixed-size chunking with hierarchical Table of Contents (ToC) representations and **Trie-constrained decoding**.

---

## Core System Architecture

```text
Findly-ai/
├── dataset/                           # OpenStack telemetry & labels (unmodified)
│   ├── anomaly_labels.txt             # 4 ground-truth anomalous VM UUIDs
│   ├── openstack_abnormal.log         # Telemetry containing injected provisioning faults
│   ├── openstack_normal1.log          # Baseline telemetry 1
│   └── openstack_normal2.log          # Baseline telemetry 2
├── runbooks/                          # Structured operational runbooks (Markdown ToC)
│   ├── nova_compute_spawn_latency.md
│   ├── hypervisor_resource_claims.md
│   ├── image_cache_invalid_disk.md
│   └── keystone_token_expiration.md
├── src/findly/                        # Core Python Engine
│   ├── trie.py                        # Custom Trie: Constrained retrieval to valid leaf sections
│   ├── database.py                    # SQLAlchemy persistence (PostgreSQL with SQLite fallback)
│   ├── models.py                      # Strongly-typed data schemas
│   ├── parser.py                      # 207k-line Oslo log streaming parser (0.50s throughput)
│   ├── analyzer.py                    # VM lifecycle reconstruction & baseline anomaly detector
│   ├── ingestion/
│   │   ├── doc_parser.py              # Ingests PDF, DOCX, TXT, MD preserving structural sections
│   │   └── runbook_loader.py          # Operational runbook loader
│   ├── stair/
│   │   ├── hierarchy.py               # Table of Contents representation
│   │   ├── vector_store.py            # Complete section vector store (no arbitrary chunking)
│   │   ├── retriever.py               # Trie-constrained structure-aware retriever
│   │   └── lora_trainer.py            # LoRA fine-tuning support for Qwen query-to-path routing
│   └── assistant/
│       ├── qwen_engine.py             # Qwen 1.5B/3B assistant with evidence-grounded synthesis
│       └── devops_workflow.py         # Human-in-the-Loop approval & safety engine
├── backend/                           # FastAPI Backend
│   ├── app.py                         # FastAPI server (serves REST API & mounted React SPA)
│   ├── state.py                       # Application state & singleton indexes
│   └── routes/
│       ├── documents.py               # Document ingestion & section endpoints
│       ├── stair.py                   # STAIR retrieval & Trie export endpoints
│       ├── incidents.py               # OpenStack anomaly analysis & drill-down endpoints
│       ├── chat.py                    # Grounded conversation with Qwen & citations
│       └── actions.py                 # DevOps action proposals & approvals
├── frontend/                          # Modern React Dashboard (Vite + Tailwind/CSS)
│   ├── package.json
│   ├── vite.config.js
│   ├── dist/                          # Pre-built production static bundle (served by FastAPI)
│   └── src/
│       ├── App.jsx                    # Multi-view navigation layout
│       └── components/
│           ├── IncidentsView.jsx      # Telemetry overview & anomaly ranking
│           ├── ChatView.jsx           # Grounded Qwen chat with STAIR path breadcrumb
│           ├── TrieView.jsx           # Interactive HierarchyTrie explorer
│           ├── ActionsView.jsx        # DevOps Human-in-the-Loop action approvals
│           └── DocumentsView.jsx      # Document ingestion & un-chunked section viewer
├── tests/                             # Automated test suite (31 passing tests)
├── train_stair_lora.py                # LoRA instruction dataset export & training runner
└── requirements.txt                   # Production dependencies
```

---

## Key Capabilities

### 1. Document Ingestion (No Arbitrary Chunking)
- Ingests **PDFs**, **DOCX**, **TXT**, and **Markdown runbooks**.
- Preserves the document's true structural hierarchy (Headings `#`, `##`, `###`, styles, and runbook step blocks).
- Stores **complete semantic sections** rather than blind 512-token chunks with arbitrary window overlap.

### 2. STAIR (Structure Aware Information Retriever — arXiv:2609.03874)
- **Hierarchical Table of Contents**: Embeds full ancestor paths (`Root > Service > Subsystem > Leaf`) as retrieval context.
- **Custom Trie Constraint**: Implements `HierarchyTrie`. Traverses path segments and enforces that predictions resolve strictly to registered valid leaf sections, preventing hallucinated retrieval destinations.
- **Complete Section Vector Store**: Scores query against full section context (path, title, keywords, and complete procedure body).

### 3. OpenStack Incident Analysis & "Log Severity Trap"
- Ingests and correlates all 207,820 lines across `openstack_abnormal.log`, `openstack_normal1.log`, and `openstack_normal2.log`.
- Reconstructs VM lifecycles (claims, image creation, spawn delay, build timing, power state events, teardown).
- **The Log Severity Trap**: Uncovered that the 4 labeled anomalous VMs (`544fd51c`, `ae651dff`, `a445709b`, `1643649d`) were logged strictly as `INFO` with delayed spawn times (29.5s to 50.7s vs 19.8s normal baseline). Abnormal logs contain **0 ERROR lines**, while normal baseline logs contain routine background periodic cache check errors.
- Findly AI achieves **100% Recall** on all 4 labeled anomalies, ranking them as the top 4 slowest instances in the dataset.

### 4. Qwen 1.5B/3B Assistant & LoRA Fine-Tuning
- Grounded conversational assistant synthesizing root causes, citing exact source logs, and extracting remediation actions.
- `train_stair_lora.py` exports instruction-tuning datasets mapping operational alerts to valid leaf paths and provides PEFT/LoRA adapter configurations.

### 5. DevOps Human-in-the-Loop Safety Workflow
- **Safety Invariant**: Destructive or high-risk actions (e.g. `systemctl restart nova-compute`, `nova live-migration`, `rm -rf`) are **never executed automatically**.
- When risky commands are recommended by the runbook, the assistant flags them for operator approval.
- Operators review, approve, or reject proposed actions with an audit trail stored in PostgreSQL/database.

---

## Getting Started

### 1. Installation

```bash
pip install -r requirements.txt
```

### 2. Run the Full Application (FastAPI + React Dashboard)

Start the unified FastAPI server (which automatically serves both the REST API and the pre-built React frontend at the root):

```bash
uvicorn backend.app:app --host 127.0.0.1 --port 8000
```

Open your browser to:
- **React Dashboard**: [http://127.0.0.1:8000](http://127.0.0.1:8000)
- **Interactive Swagger API Docs**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **API Health Check**: [http://127.0.0.1:8000/api/health](http://127.0.0.1:8000/api/health)

*(Optional)* Run the React frontend in Vite development mode with hot-reloading:
```bash
cd frontend
npm run dev
```

### 3. Run the STAIR LoRA Fine-Tuning Pipeline

Generate instruction-tuning samples for fine-tuning Qwen 1.5B/3B on hierarchy path routing:

```bash
python train_stair_lora.py --export-dataset --output-path data/stair_lora_train.jsonl
```

### 4. Run Automated Tests

Execute the complete test suite:

```bash
pytest -v
```

All 31 automated tests verify:
- Oslo log parser (API lines, compute events, tracebacks, fallbacks)
- VM lifecycle reconstruction and 100% anomaly recall
- Custom `HierarchyTrie` (insert, prefix validation, valid continuations, candidate constraint)
- Structural document ingestion for Markdown, TXT, DOCX, and PDF without arbitrary chunking
- STAIR structure-aware retrieval and benchmark accuracy
- Strict VM isolation without cross-VM pollution
- Unsupported root-cause rejection (CPU starvation/disk contention unproven claims)
- Qwen assistant grounded synthesis with exact numerical precision
- DevOps action proposal, risk assessment, and approval/rejection workflow
- Complete FastAPI REST API endpoints
