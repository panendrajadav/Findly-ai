import React, { useState, useEffect, useRef } from 'react';
import {
  FileText, GitBranch, Search, Compass, CheckCircle2,
  Database, Bot, Play, Pause, SkipForward, SkipBack,
  RotateCcw, Info, Check, ShieldAlert, Layers, ArrowRight,
  Terminal, Sparkles, AlertCircle, Eye, Cpu, Clock, ShieldCheck
} from 'lucide-react';
import FindlyLogo from './FindlyLogo';

export default function StairInteractiveVisualizer({ onSelectQuery }) {
  const [activeScenario, setActiveScenario] = useState('single_vm'); // 'single_vm' | 'comparison' | 'remediation'
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(3000); // ms per step
  const timerRef = useRef(null);

  const scenarios = {
    single_vm: {
      name: "Single VM Provisioning Outlier",
      icon: Clock,
      query: "Why did VM 544fd51c-4edc-4780-baae-ba1d80a0acfc take over 40 seconds to spawn?",
      stepData: [
        {
          sample: {
            type: "Document Stream Ingestion",
            file: "nova_compute_spawn_latency.md",
            category: "hypervisor-performance",
            telemetry_records: "33,434 OpenStack Oslo Syslog Lines",
            risk_classification: "HIGH"
          }
        },
        {
          sample: {
            type: "Extracted Table of Contents",
            tree_root: "Nova Compute Spawn Latency",
            subsections: [
              "├── Overview (Leaf)",
              "├── Telemetry Diagnosis & Anomaly Verification (Leaf)",
              "├── Root Cause Analysis (Leaf)",
              "└── Remediation Procedures (Leaf Branches)"
            ]
          }
        },
        {
          sample: {
            type: "Entity Extraction",
            target_instance: "544fd51c-4edc-4780-baae-ba1d80a0acfc",
            service: "nova-compute",
            classification: "single_instance_anomaly",
            metric_target: "spawn_duration"
          }
        },
        {
          sample: {
            type: "Selected Hierarchy Path",
            path: "Nova Compute Spawn Latency > Nova Compute Spawn Latency Runbook > Overview",
            leaf_title: "Overview",
            routing_confidence: 0.884,
            category: "hypervisor_bottleneck"
          }
        },
        {
          sample: {
            type: "Prefix Trie Validation",
            trie_status: "VERIFIED_VALID_LEAF",
            segments_matched: 3,
            path_exists_in_trie: true,
            arbitrary_hallucination_blocked: true
          }
        },
        {
          sample: {
            type: "Vector & Telemetry Payload",
            complete_section_length: "2,140 chars (indivisible procedural block)",
            isolated_lines: [11901, 11980, 11983],
            measured_spawn: "41.81 seconds",
            baseline_mean: "19.79 seconds",
            deviation: "+22.02s (+33.9σ outlier)"
          }
        },
        {
          sample: {
            type: "Synthesized Grounded Diagnostic",
            assessment: "Anomalous hypervisor provisioning latency (+33.9σ above baseline).",
            citations: "Lines 11901, 11980, 11983 in openstack_abnormal.log",
            unknown_root_cause_admission: "OS kernel telemetry is missing from Oslo logs; CPU starvation is unverified.",
            action_risk: "HIGH",
            approval_required: true
          }
        }
      ]
    },
    comparison: {
      name: "Cross-VM Latency Comparison",
      icon: Cpu,
      query: "Compare these two VMs.",
      stepData: [
        {
          sample: {
            type: "Document Stream Ingestion",
            file: "nova_compute_spawn_latency.md",
            category: "hypervisor-comparison",
            telemetry_records: "33,434 OpenStack Oslo Syslog Lines"
          }
        },
        {
          sample: {
            type: "Extracted Table of Contents",
            tree_root: "Nova Compute Spawn Latency",
            registered_leaves: 19
          }
        },
        {
          sample: {
            type: "Dual Entity Extraction",
            vms_detected: [
              "544fd51c-4edc-4780-baae-ba1d80a0acfc",
              "ae651dff-c7ad-43d6-ac96-bbcd820ccca8"
            ],
            classification: "cross_instance_comparison"
          }
        },
        {
          sample: {
            type: "Selected Hierarchy Path",
            path: "Nova Compute Spawn Latency > Nova Compute Spawn Latency Runbook > Overview",
            leaf_title: "Overview",
            routing_note: "Routed to Nova Compute Spawn Latency (not Image Cache Invalid Disk)"
          }
        },
        {
          sample: {
            type: "Prefix Trie Validation",
            trie_status: "VERIFIED_VALID_LEAF",
            registered_leaves_checked: 19
          }
        },
        {
          sample: {
            type: "Correlated Telemetry Records",
            vm_544fd51c: { spawn: "41.81s", deviation: "+22.02s", z_score: "+33.9σ" },
            vm_ae651dff: { spawn: "19.46s", deviation: "-0.33s", z_score: "-0.5σ (Normal)" }
          }
        },
        {
          sample: {
            type: "Comparative Synthesis",
            result: "VM 544fd51c experienced an extreme hypervisor delay (+33.9σ), whereas VM ae651dff completed within the normal statistical envelope (18.1s - 22.2s)."
          }
        }
      ]
    },
    remediation: {
      name: "Remediation Command Retrieval",
      icon: Terminal,
      query: "What commands restart nova-compute?",
      stepData: [
        {
          sample: {
            type: "Document Stream Ingestion",
            runbook: "nova_compute_spawn_latency.md",
            procedure_units: "Remediation Procedures"
          }
        },
        {
          sample: {
            type: "Extracted Table of Contents",
            target_node: "Action 3: Restart Nova Compute Service"
          }
        },
        {
          sample: {
            type: "Remediation Intent Classification",
            command_type: "service_restart",
            service: "nova-compute",
            is_direct_remediation: true
          }
        },
        {
          sample: {
            type: "Selected Hierarchy Path",
            path: "Nova Compute Spawn Latency > Remediation Procedures > Action 3: Restart Nova Compute Service",
            leaf_title: "Action 3: Restart Nova Compute Service"
          }
        },
        {
          sample: {
            type: "Prefix Trie Validation",
            trie_status: "VERIFIED_VALID_LEAF",
            remediation_leaf_registered: true
          }
        },
        {
          sample: {
            type: "Extracted Procedural Block",
            command: "systemctl restart nova-compute",
            verification_command: "systemctl status nova-compute",
            risk_level: "HIGH"
          }
        },
        {
          sample: {
            type: "Synthesized Output & Safety Gate",
            action: "systemctl restart nova-compute",
            approval_requirement: "HUMAN-IN-THE-LOOP OPERATOR APPROVAL REQUIRED",
            unrelated_anomalies_suppressed: true
          }
        }
      ]
    }
  };

  const currentScenarioData = scenarios[activeScenario];

  const steps = [
    {
      id: 1,
      title: "Document Ingestion",
      shortTitle: "Ingestion",
      icon: FileText,
      badge: "Stage 01",
      summary: "Technical documents, standard operating procedures, and OpenStack operational logs enter the ingestion pipeline.",
      details: [
        "Parses Markdown headings, Docx sections, and Oslo syslog streams without destroying structural integrity.",
        "Ingests 4 operational runbooks and 33,434 OpenStack log records.",
        "Preserves document headers, risk classifications, and executable command blocks."
      ]
    },
    {
      id: 2,
      title: "Structural Analysis (STAIR ToC)",
      shortTitle: "Structure ToC",
      icon: GitBranch,
      badge: "Stage 02",
      summary: "STAIR extracts the logical Table of Contents (ToC) tree, defining parent-child relationships rather than arbitrary fixed chunks.",
      details: [
        "Builds a multi-level hierarchical tree representing the full organizational context of every procedure.",
        "Generates 19 distinct Table of Contents leaf sections across all service categories.",
        "Guarantees that troubleshooting workflows are stored as complete, indivisible operational units."
      ]
    },
    {
      id: 3,
      title: "Query Understanding",
      shortTitle: "Query Parsing",
      icon: Search,
      badge: "Stage 03",
      summary: "User inquiry or alert is parsed for technical entities, VM identifiers, request tokens, and remediation cues.",
      details: [
        "Detects full 36-char and 8-char VM UUIDs with high-precision regex.",
        "Classifies inquiry type: Single VM Diagnosis, Cross-VM Comparison, or Direct Remediation.",
        "Isolates log queries strictly by instance UUID to eliminate cross-VM telemetry bleed."
      ]
    },
    {
      id: 4,
      title: "Hierarchy Path Selection",
      shortTitle: "Path Routing",
      icon: Compass,
      badge: "Stage 04",
      summary: "STAIR navigates the document hierarchy to locate the exact operational section matching the symptom.",
      details: [
        "Evaluates contextual path embeddings against the inquiry.",
        "Resolves multi-VM latency inquiries to 'Nova Compute Spawn Latency' rather than unrelated runbooks.",
        "Candidate path projection avoids losing procedural context."
      ]
    },
    {
      id: 5,
      title: "Prefix Trie Validation",
      shortTitle: "Trie Constraint",
      icon: CheckCircle2,
      badge: "Stage 05",
      summary: "A custom Prefix Trie constrains decoding to valid registered hierarchy paths, preventing hallucinated sections.",
      details: [
        "Validates that every step in the hierarchy path exists in the Trie registry.",
        "Rejects false positive paths that do not lead to a registered leaf section.",
        "Guarantees that 100% of retrieved procedures correspond to authentic company runbooks."
      ]
    },
    {
      id: 6,
      title: "Complete Vector Retrieval",
      shortTitle: "Vector Store",
      icon: Database,
      badge: "Stage 06",
      summary: "Retrieves complete procedural section content and correlates strictly isolated OpenStack log evidence.",
      details: [
        "Zero chunk fragmentation: the full 2,140 character runbook procedure is delivered intact.",
        "Correlates exact log records from openstack_abnormal.log (lines 11901, 11980, 11983).",
        "Calculates exact baseline statistical deviations: +22.02s (+33.9σ outlier)."
      ]
    },
    {
      id: 7,
      title: "Qwen Evidence Synthesis",
      shortTitle: "Grounded AI",
      icon: Bot,
      badge: "Stage 07",
      summary: "Qwen synthesizes an evidence-grounded diagnostic report with exact line citations and human-in-the-loop safety gates.",
      details: [
        "Separates observed telemetry facts from unsupported hardware hypotheses.",
        "States clearly that host kernel metrics (CPU stolen time, IOPS) are missing from Oslo logs.",
        "Enforces Human-in-the-Loop review: destructive commands require operator authorization."
      ]
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
  const activeStepData = currentScenarioData.stepData[currentStep]?.sample || {};

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
    <div className="space-y-6 max-w-6xl mx-auto px-4 sm:px-6">
      {/* Top Hero Banner in Green, Tangerine Yellow & Ivory */}
      <div className="p-8 border border-[#009B4D]/30 rounded-3xl bg-[#09160e]/85 shadow-2xl relative overflow-hidden backdrop-blur-2xl">
        <div className="ambient-glow-green w-96 h-96 -top-20 -right-20"></div>
        <div className="ambient-glow-yellow w-80 h-80 -bottom-20 -left-20"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-[#0d2015] border border-[#009B4D]/40 text-[#FAF5E9] text-xs font-mono">
              <Sparkles className="w-3.5 h-3.5 text-[#FFCC00] animate-pulse" />
              <span>Interactive Architecture Demonstration • arXiv:2609.03874</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-[#FAF5E9] tracking-tight">
              STAIR Retrieval Pipeline Walkthrough
            </h2>
            <p className="text-xs md:text-sm text-[#FAF5E9]/80 max-w-2xl leading-relaxed">
              Explore step-by-step how Findly AI uses Structure-Aware Information Retrieval (STAIR) and Prefix Trie validation to deliver exact runbooks with zero chunk fragmentation.
            </p>
          </div>

          {/* Playback Controls */}
          <div className="flex items-center space-x-2.5 bg-[#050d08]/90 p-2 rounded-2xl border border-[#009B4D]/30 shadow-lg">
            <button
              onClick={handlePrev}
              title="Previous Step"
              className="p-2.5 rounded-xl hover:bg-white/10 text-[#FAF5E9]/80 hover:text-[#FAF5E9] transition-colors"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#009B4D] to-[#008240] hover:from-[#00b85b] hover:to-[#009B4D] text-[#FAF5E9] font-bold text-xs flex items-center space-x-2 shadow-lg shadow-[#009B4D]/25 transition-all"
            >
              {isPlaying ? (
                <>
                  <Pause className="w-4 h-4 fill-current text-[#FFCC00]" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current text-[#FFCC00]" />
                  <span>Auto Play</span>
                </>
              )}
            </button>

            <button
              onClick={handleNext}
              title="Next Step"
              className="p-2.5 rounded-xl hover:bg-white/10 text-[#FAF5E9]/80 hover:text-[#FAF5E9] transition-colors"
            >
              <SkipForward className="w-4 h-4" />
            </button>

            <button
              onClick={handleReset}
              title="Reset to Stage 1"
              className="p-2.5 rounded-xl hover:bg-white/10 text-[#FAF5E9]/60 hover:text-[#FAF5E9] transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scenario Switcher Pills */}
        <div className="mt-6 pt-5 border-t border-[#009B4D]/25 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="text-xs text-[#FAF5E9]/70 font-semibold uppercase tracking-wider">
            Select Active Inquiry Scenario:
          </div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(scenarios).map(([key, s]) => {
              const IconComp = s.icon;
              const isSelected = activeScenario === key;
              return (
                <button
                  key={key}
                  onClick={() => {
                    setActiveScenario(key);
                    setCurrentStep(0);
                    setIsPlaying(false);
                  }}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all flex items-center space-x-2 ${
                    isSelected
                      ? 'bg-[#009B4D] text-[#FAF5E9] shadow-md shadow-[#009B4D]/30 font-bold'
                      : 'bg-[#050d08] text-[#FAF5E9]/70 hover:text-[#FAF5E9] border border-[#009B4D]/20 hover:border-[#009B4D]/50'
                  }`}
                >
                  <IconComp className="w-3.5 h-3.5 text-[#FFCC00]" />
                  <span>{s.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Interactive Connected Pipeline Stepper (7 Stages) */}
      <div className="relative p-6 border border-[#009B4D]/30 rounded-3xl bg-[#09160e]/60 shadow-xl overflow-x-auto">
        <div className="min-w-[760px]">
          {/* Progress Connector Track */}
          <div className="relative flex items-center justify-between">
            <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-1 bg-[#050d08] rounded-full z-0">
              <div
                className="h-full bg-gradient-to-r from-[#009B4D] via-[#00b85b] to-[#FFCC00] rounded-full transition-all duration-500"
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
                        ? 'bg-gradient-to-tr from-[#009B4D] to-[#008240] text-[#FAF5E9] ring-4 ring-[#009B4D]/40 shadow-[#009B4D]/50'
                        : isPast
                        ? 'bg-[#0d2015] border border-[#009B4D]/60 text-[#009B4D]'
                        : 'bg-[#050d08] border border-[#009B4D]/25 text-[#FAF5E9]/50 hover:text-[#FAF5E9]'
                    }`}
                  >
                    <IconComp className={`w-5 h-5 ${isActive ? 'text-[#FFCC00]' : ''}`} />
                  </div>
                  <span className={`text-[11px] font-semibold mt-2.5 tracking-tight transition-colors ${
                    isActive ? 'text-[#009B4D] font-bold' : isPast ? 'text-[#FAF5E9]' : 'text-[#FAF5E9]/50'
                  }`}>
                    {step.shortTitle}
                  </span>
                  <span className="text-[9px] font-mono text-[#FFCC00]">
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
          <div className="p-6 border border-[#009B4D]/30 rounded-3xl bg-[#09160e]/85 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-[#009B4D]/25">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#009B4D] to-[#008240] flex items-center justify-center text-[#FAF5E9] shadow-lg border border-[#009B4D]/30">
                  <activeStep.icon className="w-5 h-5 text-[#FFCC00]" />
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#FFCC00] font-mono">
                    {activeStep.badge} OF 07
                  </div>
                  <h3 className="text-xl font-bold text-[#FAF5E9] tracking-tight">
                    {activeStep.title}
                  </h3>
                </div>
              </div>

              <span className="text-xs px-3 py-1 rounded-full bg-[#0d2015] border border-[#009B4D]/40 text-[#FAF5E9] font-mono">
                Interactive Inspector
              </span>
            </div>

            {/* Stage Summary */}
            <p className="text-sm text-[#FAF5E9]/85 mt-4 leading-relaxed font-normal">
              {activeStep.summary}
            </p>

            {/* Key Architectural Details */}
            <div className="mt-5 space-y-2.5">
              <div className="text-xs font-semibold text-[#FAF5E9]/70 uppercase tracking-wider">
                Key Architectural Mechanics:
              </div>
              {activeStep.details.map((item, i) => (
                <div key={i} className="flex items-start space-x-2.5 text-xs text-[#FAF5E9]/90 bg-[#050d08]/70 p-3 rounded-xl border border-[#009B4D]/15">
                  <Check className="w-4 h-4 text-[#009B4D] flex-shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{item}</span>
                </div>
              ))}
            </div>

            {/* Stepper Navigation Buttons */}
            <div className="flex items-center justify-between pt-6 mt-6 border-t border-[#009B4D]/25">
              <button
                onClick={handlePrev}
                disabled={currentStep === 0}
                className="px-4 py-2 rounded-xl bg-[#050d08] hover:bg-white/5 disabled:opacity-30 border border-[#009B4D]/30 text-xs text-[#FAF5E9]/80 font-medium transition-colors"
              >
                Previous Stage
              </button>

              <div className="text-xs text-[#FFCC00] font-mono">
                {currentStep + 1} of {steps.length}
              </div>

              <button
                onClick={handleNext}
                disabled={currentStep === steps.length - 1}
                className="px-4 py-2 rounded-xl bg-[#009B4D] hover:bg-[#00b85b] disabled:opacity-30 text-[#FAF5E9] text-xs font-bold shadow-md shadow-[#009B4D]/20 transition-all"
              >
                Next Stage
              </button>
            </div>
          </div>

          {/* Educational Comparison Box: Traditional RAG vs STAIR */}
          <div className="p-6 border border-[#009B4D]/25 rounded-3xl bg-[#09160e]/50 shadow-xl space-y-4">
            <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-[#FAF5E9]/80">
              <Layers className="w-4 h-4 text-[#009B4D]" />
              <span>Architectural Advantage: Chunk-Based RAG vs. STAIR</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* Ordinary Chunking */}
              <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-500/20 space-y-2">
                <div className="font-bold text-rose-300 flex items-center space-x-1.5">
                  <AlertCircle className="w-4 h-4 text-rose-400" />
                  <span>Ordinary Chunk-Based RAG</span>
                </div>
                <ul className="text-[#FAF5E9]/70 space-y-1.5 list-disc pl-4 leading-relaxed">
                  <li>Cuts documents arbitrarily at fixed 512 token boundaries.</li>
                  <li>Splits commands away from prerequisites and warnings.</li>
                  <li>Loses hierarchical context (e.g. section titles and parent nodes).</li>
                  <li>Prone to hallucinating instructions across fragmented snippets.</li>
                </ul>
              </div>

              {/* Findly STAIR */}
              <div className="p-4 rounded-2xl bg-[#0d2015] border border-[#009B4D]/40 space-y-2">
                <div className="font-bold text-[#009B4D] flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#FFCC00]" />
                  <span>Findly Structure-Aware RAG (STAIR)</span>
                </div>
                <ul className="text-[#FAF5E9]/90 space-y-1.5 list-disc pl-4 leading-relaxed">
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
          <div className="p-6 border border-[#009B4D]/30 rounded-3xl bg-[#09160e]/90 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#009B4D]/25">
              <div className="flex items-center space-x-2">
                <Terminal className="w-4 h-4 text-[#009B4D]" />
                <span className="text-xs font-bold text-[#FAF5E9] tracking-wide uppercase">
                  Scenario Telemetry Data
                </span>
              </div>
              <span className="text-[10px] font-mono text-[#FFCC00] bg-[#0d2015] border border-[#FFCC00]/30 px-2 py-0.5 rounded-full">
                {activeStepData.type || "Live Pipeline"}
              </span>
            </div>

            {/* Code / Visual Data Display */}
            <div className="bg-[#050d08] p-4 rounded-2xl border border-[#009B4D]/25 text-xs font-mono text-[#FAF5E9] overflow-x-auto max-h-96">
              <pre className="text-[11px] leading-relaxed text-[#FAF5E9]">
                {JSON.stringify(activeStepData, null, 2)}
              </pre>
            </div>

            {/* Quick Action Button for Testing Query */}
            {onSelectQuery && (
              <button
                onClick={() => onSelectQuery(currentScenarioData.query)}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#009B4D] to-[#008240] hover:from-[#00b85b] hover:to-[#009B4D] text-[#FAF5E9] font-bold text-xs flex items-center justify-center space-x-2 shadow-lg shadow-[#009B4D]/20 transition-all"
              >
                <Eye className="w-3.5 h-3.5 text-[#FFCC00]" />
                <span>Test Scenario in STAIR Chat</span>
              </button>
            )}
          </div>

          {/* Live Baseline Stats Callout */}
          <div className="p-5 border border-[#009B4D]/30 rounded-3xl bg-[#09160e]/60 shadow-xl space-y-3">
            <div className="text-xs font-bold text-[#FAF5E9]/80 uppercase tracking-wider flex items-center justify-between">
              <span>Ground Truth Normal Envelope</span>
              <span className="text-[10px] text-[#FFCC00] font-mono">1,869 Normal Events</span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-[#050d08] rounded-xl border border-[#009B4D]/20">
                <div className="text-[#FAF5E9]/60 text-[10px]">Normal Spawn Mean</div>
                <div className="text-base font-bold text-[#FAF5E9] font-mono mt-0.5">19.79s ± 0.65s</div>
                <div className="text-[10px] text-[#009B4D] mt-1">Normal envelope: 18.1s – 22.2s</div>
              </div>
              <div className="p-3 bg-[#050d08] rounded-xl border border-[#009B4D]/20">
                <div className="text-[#FAF5E9]/60 text-[10px]">Normal Build Mean</div>
                <div className="text-base font-bold text-[#FAF5E9] font-mono mt-0.5">20.59s ± 0.65s</div>
                <div className="text-[10px] text-[#009B4D] mt-1">Normal envelope: 18.9s – 23.3s</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
