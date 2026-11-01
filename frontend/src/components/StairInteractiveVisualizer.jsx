import React, { useState, useEffect, useRef } from 'react';
import {
  FileText, GitBranch, Search, Compass, CheckCircle2,
  Database, Bot, Play, Pause, SkipForward, SkipBack,
  RotateCcw, Info, Check, ShieldAlert, Layers, ArrowRight,
  Terminal, Sparkles, AlertCircle, Eye
} from 'lucide-react';

export default function StairInteractiveVisualizer({ onSelectQuery }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(3000); // ms per step
  const timerRef = useRef(null);

  const steps = [
    {
      id: 1,
      title: "Document Ingestion",
      shortTitle: "Ingestion",
      icon: FileText,
      badge: "Stage 01",
      color: "from-blue-600 to-cyan-500",
      accentColor: "text-blue-400",
      borderColor: "border-blue-500/40",
      bgGlow: "rgba(59, 130, 246, 0.15)",
      summary: "Technical documents, standard operating procedures, and OpenStack operational logs enter the ingestion pipeline.",
      details: [
        "Parses Markdown headings, Docx sections, and Oslo syslog streams without destroying structural integrity.",
        "Ingests 4 operational runbooks and 33,434 OpenStack log records.",
        "Preserves document headers, risk classifications, and executable command blocks."
      ],
      sampleData: {
        type: "Document Stream",
        file: "nova_compute_spawn_latency.md (Runbook)",
        attributes: {
          category: "hypervisor-performance",
          service: "nova-compute",
          default_risk: "HIGH",
          telemetry_source: "openstack_abnormal.log (12,410 lines)"
        }
      }
    },
    {
      id: 2,
      title: "Structural Analysis (STAIR ToC)",
      shortTitle: "Structure ToC",
      icon: GitBranch,
      badge: "Stage 02",
      color: "from-cyan-500 to-teal-400",
      accentColor: "text-cyan-400",
      borderColor: "border-cyan-500/40",
      bgGlow: "rgba(6, 182, 212, 0.15)",
      summary: "STAIR extracts the logical Table of Contents (ToC) tree, defining parent-child relationships rather than arbitrary fixed chunks.",
      details: [
        "Builds a multi-level hierarchical tree representing the full organizational context of every procedure.",
        "Generates 19 distinct Table of Contents leaf sections across all service categories.",
        "Guarantees that troubleshooting workflows are stored as complete, indivisible operational units."
      ],
      sampleData: {
        type: "Extracted Hierarchy Tree",
        root: "Nova Compute Spawn Latency",
        children: [
          "├── Overview (Leaf)",
          "├── Telemetry Diagnosis & Anomaly Verification (Leaf)",
          "├── Root Cause Analysis (Leaf)",
          "└── Remediation Procedures",
          "    ├── Action 1: Audit Compute Node Load (Safe)",
          "    ├── Action 2: Clean Orphaned Stale Files (Medium)",
          "    └── Action 3: Restart Nova Compute Service (High Risk)"
        ]
      }
    },
    {
      id: 3,
      title: "Query Understanding",
      shortTitle: "Query Parsing",
      icon: Search,
      badge: "Stage 03",
      color: "from-indigo-500 to-blue-500",
      accentColor: "text-indigo-400",
      borderColor: "border-indigo-500/40",
      bgGlow: "rgba(99, 102, 241, 0.15)",
      summary: "User inquiry or alert is parsed for technical entities, VM identifiers, request tokens, and remediation cues.",
      details: [
        "Detects full 36-char and 8-char VM UUIDs with high-precision regex.",
        "Classifies inquiry type: Single VM Diagnosis, Cross-VM Comparison, or Direct Remediation.",
        "Isolates log queries strictly by instance UUID to eliminate cross-VM telemetry bleed."
      ],
      sampleData: {
        type: "Entity Extraction Output",
        inputQuery: "Why did VM 544fd51c-4edc-4780-baae-ba1d80a0acfc take over 40 seconds to spawn?",
        parsedEntities: {
          vms: ["544fd51c-4edc-4780-baae-ba1d80a0acfc"],
          service: "nova-compute",
          metric_focus: "hypervisor_spawn_latency",
          is_comparison: false,
          is_direct_remediation: false
        }
      }
    },
    {
      id: 4,
      title: "Hierarchy Path Selection",
      shortTitle: "Path Routing",
      icon: Compass,
      badge: "Stage 04",
      color: "from-violet-500 to-purple-500",
      accentColor: "text-violet-400",
      borderColor: "border-violet-500/40",
      bgGlow: "rgba(139, 92, 246, 0.15)",
      summary: "STAIR navigates the document hierarchy to locate the exact operational section matching the symptom.",
      details: [
        "Evaluates contextual path embeddings against the inquiry.",
        "Resolves multi-VM latency inquiries to 'Nova Compute Spawn Latency' rather than unrelated runbooks.",
        "Candidate path projection avoids losing procedural context."
      ],
      sampleData: {
        type: "Selected Hierarchy Path",
        path: "Nova Compute Spawn Latency > Nova Compute Spawn Latency Runbook > Overview",
        leaf_title: "Overview",
        relevance_score: 0.884,
        category: "hypervisor_bottleneck"
      }
    },
    {
      id: 5,
      title: "Prefix Trie Validation",
      shortTitle: "Trie Constraint",
      icon: CheckCircle2,
      badge: "Stage 05",
      color: "from-emerald-500 to-teal-500",
      accentColor: "text-emerald-400",
      borderColor: "border-emerald-500/40",
      bgGlow: "rgba(16, 185, 129, 0.15)",
      summary: "A custom Prefix Trie constrains decoding to valid registered hierarchy paths, preventing hallucinated sections.",
      details: [
        "Validates that every step in the hierarchy path exists in the Trie registry.",
        "Rejects false positive paths that do not lead to a registered leaf section.",
        "Guarantees that 100% of retrieved procedures correspond to authentic company runbooks."
      ],
      sampleData: {
        type: "Prefix Trie Validation",
        registered_paths_checked: 19,
        path_segments: ["Nova Compute Spawn Latency", "Nova Compute Spawn Latency Runbook", "Overview"],
        validation_status: "VERIFIED_VALID_LEAF",
        trie_constrained_leaf: true,
        invalid_path_rejected: false
      }
    },
    {
      id: 6,
      title: "Complete Vector Retrieval",
      shortTitle: "Vector Store",
      icon: Database,
      badge: "Stage 06",
      color: "from-cyan-500 to-blue-600",
      accentColor: "text-cyan-400",
      borderColor: "border-cyan-500/40",
      bgGlow: "rgba(6, 182, 212, 0.15)",
      summary: "Retrieves complete procedural section content and correlates strictly isolated OpenStack log evidence.",
      details: [
        "Zero chunk fragmentation: the full 2,140 character runbook procedure is delivered intact.",
        "Correlates exact log records from openstack_abnormal.log (lines 11901, 11980, 11983).",
        "Calculates exact baseline statistical deviations: +22.02s (+33.9σ outlier)."
      ],
      sampleData: {
        type: "Retrieved Payload",
        complete_section_length: "2,140 characters",
        bash_commands_extracted: ["uptime && free -m && iostat -xz 1 5", "systemctl restart nova-compute"],
        isolated_log_records: [
          { line: 11901, message: "Attempting claim: memory 2048 MB, disk 20 GB, vcpus 1 CPU" },
          { line: 11980, message: "Took 41.81 seconds to spawn the instance on the hypervisor." },
          { line: 11983, message: "Took 42.81 seconds to build instance." }
        ]
      }
    },
    {
      id: 7,
      title: "Qwen Evidence Synthesis",
      shortTitle: "Grounded AI",
      icon: Bot,
      badge: "Stage 07",
      color: "from-blue-600 to-indigo-600",
      accentColor: "text-blue-400",
      borderColor: "border-blue-500/40",
      bgGlow: "rgba(37, 99, 235, 0.15)",
      summary: "Qwen synthesizes an evidence-grounded diagnostic report with exact line citations and human-in-the-loop safety gates.",
      details: [
        "Separates observed telemetry facts from unsupported hardware hypotheses.",
        "States clearly that host kernel metrics (CPU stolen time, IOPS) are missing from Oslo logs.",
        "Enforces Human-in-the-Loop review: destructive commands require operator authorization."
      ],
      sampleData: {
        type: "Synthesized Output",
        assessment: "Anomalous provisioning latency (+33.9σ deviation above 19.79s normal baseline).",
        citations: "Lines 11901, 11980, 11983 in openstack_abnormal.log",
        unknown_root_cause_admission: "OS kernel telemetry is not captured in Oslo logs; CPU starvation is unverified.",
        requires_operator_approval: true,
        action: "systemctl restart nova-compute (HIGH RISK)"
      }
    }
  ];

  // Auto-play timer
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setCurrentStep((prev) => (prev + 1) % steps.length);
      }, playbackSpeed);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, playbackSpeed, steps.length]);

  const activeStep = steps[currentStep];

  const handleNext = () => {
    setCurrentStep((prev) => (prev + 1) % steps.length);
  };

  const handlePrev = () => {
    setCurrentStep((prev) => (prev - 1 + steps.length) % steps.length);
  };

  const handleReset = () => {
    setCurrentStep(0);
    setIsPlaying(false);
  };

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="glass-card p-6 border border-white/10 rounded-3xl bg-gradient-to-r from-navy-900/90 via-navy-850/80 to-navy-900/90 backdrop-blur-xl relative overflow-hidden shadow-2xl">
        <div className="ambient-glow-blue w-96 h-96 -top-20 -right-20"></div>
        <div className="ambient-glow-cyan w-80 h-80 -bottom-20 -left-20"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-blue-950/60 border border-blue-500/30 text-blue-300 text-xs font-mono">
              <Sparkles className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
              <span>Interactive Architecture Demonstration • arXiv:2609.03874</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              STAIR Retrieval Pipeline Walkthrough
            </h2>
            <p className="text-xs md:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Explore step-by-step how Findly AI uses Structure-Aware Information Retrieval (STAIR) and Prefix Trie validation to deliver exact runbooks with zero chunk fragmentation.
            </p>
          </div>

          {/* Playback Controls */}
          <div className="flex items-center space-x-2.5 bg-navy-950/80 p-2 rounded-2xl border border-white/10 shadow-lg">
            <button
              onClick={handlePrev}
              title="Previous Step"
              className="p-2.5 rounded-xl hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-semibold text-xs flex items-center space-x-2 shadow-lg shadow-blue-500/25 transition-all"
            >
              {isPlaying ? (
                <>
                  <Pause className="w-4 h-4 fill-current" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Auto Play</span>
                </>
              )}
            </button>

            <button
              onClick={handleNext}
              title="Next Step"
              className="p-2.5 rounded-xl hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
            >
              <SkipForward className="w-4 h-4" />
            </button>

            <button
              onClick={handleReset}
              title="Reset to Stage 1"
              className="p-2.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Connected Pipeline Stepper (7 Stages) */}
      <div className="relative glass-card p-6 border border-white/10 rounded-3xl bg-navy-900/60 shadow-xl overflow-x-auto">
        <div className="min-w-[760px]">
          {/* Progress Connector Track */}
          <div className="relative flex items-center justify-between">
            <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-1 bg-navy-800 rounded-full z-0">
              <div
                className="h-full bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400 rounded-full transition-all duration-500"
                style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
              ></div>
            </div>

            {/* Stepper Nodes */}
            {steps.map((step, idx) => {
              const IconComp = step.icon;
              const isActive = idx === currentStep;
              const isPast = idx < currentStep;

              return (
                <button
                  key={step.id}
                  onClick={() => {
                    setCurrentStep(idx);
                    setIsPlaying(false);
                  }}
                  className={`relative z-10 flex flex-col items-center group focus:outline-none transition-all ${
                    isActive ? 'scale-110' : 'hover:scale-105 opacity-80 hover:opacity-100'
                  }`}
                >
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-xl ${
                      isActive
                        ? `bg-gradient-to-tr ${step.color} text-white ring-4 ring-blue-500/30 shadow-blue-500/40`
                        : isPast
                        ? 'bg-blue-950/80 border border-blue-500/50 text-blue-300'
                        : 'bg-navy-950 border border-white/10 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <IconComp className="w-5 h-5" />
                  </div>
                  <span className={`text-[11px] font-semibold mt-2.5 tracking-tight transition-colors ${
                    isActive ? 'text-cyan-300 font-bold' : isPast ? 'text-slate-300' : 'text-slate-500'
                  }`}>
                    {step.shortTitle}
                  </span>
                  <span className="text-[9px] font-mono text-slate-500">
                    Step {step.id}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Stage Detail Deep Dive Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Stage Explanation & Highlights (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="glass-card p-6 border border-white/10 rounded-3xl bg-navy-900/80 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-2xl bg-gradient-to-tr ${activeStep.color} flex items-center justify-center text-white shadow-lg`}>
                  <activeStep.icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 font-mono">
                    {activeStep.badge} OF 07
                  </div>
                  <h3 className="text-xl font-bold text-white tracking-tight">
                    {activeStep.title}
                  </h3>
                </div>
              </div>

              <span className="text-xs px-3 py-1 rounded-full bg-blue-950/60 border border-blue-500/30 text-blue-300 font-mono">
                Interactive Inspector
              </span>
            </div>

            {/* Stage Summary */}
            <p className="text-sm text-slate-200 mt-4 leading-relaxed font-normal">
              {activeStep.summary}
            </p>

            {/* Key Architectural Details */}
            <div className="mt-5 space-y-2.5">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Key Architectural Mechanics:
              </div>
              {activeStep.details.map((item, i) => (
                <div key={i} className="flex items-start space-x-2.5 text-xs text-slate-300 bg-navy-950/60 p-3 rounded-xl border border-white/5">
                  <Check className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{item}</span>
                </div>
              ))}
            </div>

            {/* Stepper Navigation Buttons */}
            <div className="flex items-center justify-between pt-6 mt-6 border-t border-white/10">
              <button
                onClick={handlePrev}
                disabled={currentStep === 0}
                className="px-4 py-2 rounded-xl bg-navy-950 hover:bg-white/5 disabled:opacity-30 border border-white/10 text-xs text-slate-300 font-medium transition-colors"
              >
                ← Previous Stage
              </button>

              <div className="text-xs text-slate-400 font-mono">
                {currentStep + 1} of {steps.length}
              </div>

              <button
                onClick={handleNext}
                disabled={currentStep === steps.length - 1}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-30 text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition-all"
              >
                Next Stage →
              </button>
            </div>
          </div>

          {/* Educational Comparison Box: Traditional RAG vs STAIR */}
          <div className="glass-card p-6 border border-white/10 rounded-3xl bg-navy-900/50 shadow-xl space-y-4">
            <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-slate-300">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>Architectural Advantage: Chunk-Based RAG vs. STAIR</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* Ordinary Chunking */}
              <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-500/20 space-y-2">
                <div className="font-bold text-rose-300 flex items-center space-x-1.5">
                  <AlertCircle className="w-4 h-4 text-rose-400" />
                  <span>Ordinary Chunk-Based RAG</span>
                </div>
                <ul className="text-slate-400 space-y-1.5 list-disc pl-4 leading-relaxed">
                  <li>Cuts documents arbitrarily at fixed 512 token boundaries.</li>
                  <li>Splits commands away from prerequisites and warnings.</li>
                  <li>Loses hierarchical context (e.g. section titles and parent nodes).</li>
                  <li>Prone to hallucinating instructions across fragmented snippets.</li>
                </ul>
              </div>

              {/* Findly STAIR */}
              <div className="p-4 rounded-2xl bg-cyan-950/20 border border-cyan-500/30 space-y-2">
                <div className="font-bold text-cyan-300 flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                  <span>Findly Structure-Aware RAG (STAIR)</span>
                </div>
                <ul className="text-slate-300 space-y-1.5 list-disc pl-4 leading-relaxed">
                  <li>Preserves full document Table of Contents hierarchy.</li>
                  <li>Prefix Trie constrains search strictly to registered leaves.</li>
                  <li>Retrieves complete, executable procedural units intact.</li>
                  <li>Grounds every claim in isolated log telemetry and baseline stats.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Live Data Inspector & Artifact View (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-card p-6 border border-white/10 rounded-3xl bg-navy-900/90 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center space-x-2">
                <Terminal className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold text-white tracking-wide uppercase">
                  Live Stage Telemetry Data
                </span>
              </div>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/50 border border-cyan-500/30 px-2 py-0.5 rounded-full">
                {activeStep.sampleData.type}
              </span>
            </div>

            {/* Code / Visual Data Display */}
            <div className="bg-navy-950 p-4 rounded-2xl border border-white/10 text-xs font-mono text-slate-300 overflow-x-auto max-h-96">
              <pre className="text-[11px] leading-relaxed text-cyan-200">
                {JSON.stringify(activeStep.sampleData, null, 2)}
              </pre>
            </div>

            {/* Quick Action Button for Testing Query */}
            {onSelectQuery && activeStep.id >= 3 && (
              <button
                onClick={() => onSelectQuery("Why did VM 544fd51c-4edc-4780-baae-ba1d80a0acfc take over 40 seconds to spawn?")}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-semibold text-xs flex items-center justify-center space-x-2 shadow-lg shadow-blue-500/20 transition-all"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Test This Query in STAIR Chat</span>
              </button>
            )}
          </div>

          {/* Live Baseline Stats Callout */}
          <div className="glass-card p-5 border border-white/10 rounded-3xl bg-navy-900/60 shadow-xl space-y-3">
            <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
              <span>Ground Truth Normal Envelope</span>
              <span className="text-[10px] text-blue-400 font-mono">1,869 Normal Events</span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-navy-950/80 rounded-xl border border-white/5">
                <div className="text-slate-400 text-[10px]">Normal Spawn Mean</div>
                <div className="text-base font-bold text-white font-mono mt-0.5">19.79s ± 0.65s</div>
                <div className="text-[10px] text-cyan-400 mt-1">Normal envelope: 18.1s – 22.2s</div>
              </div>
              <div className="p-3 bg-navy-950/80 rounded-xl border border-white/5">
                <div className="text-slate-400 text-[10px]">Normal Build Mean</div>
                <div className="text-base font-bold text-white font-mono mt-0.5">20.59s ± 0.65s</div>
                <div className="text-[10px] text-cyan-400 mt-1">Normal envelope: 18.9s – 23.3s</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

