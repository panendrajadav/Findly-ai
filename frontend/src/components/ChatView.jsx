import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  Send, Bot, User, Terminal, Layers, FileText, AlertTriangle, 
  CheckCircle2, Trash2, ArrowRight, Sparkles, 
  Cpu, Clock, ShieldCheck, Copy, Check, Radio, Shield, Search,
  Activity, RefreshCw
} from 'lucide-react';
import FindlyLogo from './FindlyLogo';

export default function ChatView({ externalQuery }) {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchPhase, setSearchPhase] = useState(0);
  const [actionSuccess, setActionSuccess] = useState('');
  const [copiedCmd, setCopiedCmd] = useState('');
  const [options, setOptions] = useState({
    groundTruth: true,
    trieConstrained: true,
    evidenceCitations: true,
  });

  const messagesEndRef = useRef(null);

  const searchPhases = [
    "Parsing technical entities & VM UUID tokens...",
    "Navigating hierarchy path on Prefix Trie...",
    "Validating registered leaf constraint...",
    "Isolating OpenStack Oslo syslog telemetry...",
    "Synthesizing evidence-grounded diagnosis with Qwen..."
  ];

  // Cycling search progress phase animation
  useEffect(() => {
    let interval;
    if (loading) {
      setSearchPhase(0);
      interval = setInterval(() => {
        setSearchPhase((prev) => (prev + 1) % searchPhases.length);
      }, 900);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages, loading]);

  useEffect(() => {
    if (externalQuery && externalQuery.trim()) {
      handleSend(externalQuery);
    }
  }, [externalQuery]);

  const quickActionPills = [
    {
      label: "Analyze Nova Spawn Latency",
      query: "Why did VM 544fd51c-4edc-4780-baae-ba1d80a0acfc take over 40 seconds to spawn?",
      icon: Clock,
    },
    {
      label: "Compare Provisioning Baselines",
      query: "Compare these two VMs.",
      icon: Cpu,
    },
    {
      label: "Verify Resource Claims",
      query: "What resource claims were placed for VM ae651dff-c7ad-43d6-ac96-bbcd820ccca8?",
      icon: ShieldCheck,
    },
    {
      label: "Compute Remediation",
      query: "What commands restart nova-compute?",
      icon: Terminal,
    },
  ];

  const suggestionChips = [
    "What resource claims were placed for VM ae651dff-c7ad-43d6-ac96-bbcd820ccca8?",
    "Why did VM 544fd51c-4edc-4780-baae-ba1d80a0acfc take over 40 seconds to spawn?",
    "Compare these two VMs.",
    "What commands restart nova-compute?",
  ];

  const cleanApprovalPrompt = (prompt) => {
    if (!prompt) return '';
    return prompt
      .replace(/[\U00010000-\U0010ffff]|[\u2600-\u27bf]|[\u2300-\u23ff]/g, '')
      .replace(/\*\*/g, '')
      .replace(/HUMAN-IN-THE-LOOP OPERATOR APPROVAL REQUIRED:\s*/i, '')
      .trim();
  };

  const handleSend = (textToSend) => {
    const q = textToSend || query;
    if (!q.trim()) return;

    const userMsg = { role: 'user', query: q };
    setMessages(prev => [...prev, userMsg]);
    setQuery('');
    setLoading(true);
    setActionSuccess('');

    fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: q, session_id: 'default' })
    })
      .then(async (res) => {
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.detail || `HTTP ${res.status}: Failed to reach STAIR API`);
        }
        return res.json();
      })
      .then(data => {
        setMessages(prev => [...prev, { role: 'assistant', ...data }]);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setMessages(prev => [...prev, {
          role: 'assistant',
          summary: 'Retrieval or Inference Error',
          detailed_explanation: `### Connection Error\n\nFailed to contact backend: \`${err.message}\`.\n\nPlease verify that the FastAPI backend server is active at \`http://127.0.0.1:8000\`.`,
          hierarchy_path: 'System > Error',
          proposed_commands: [],
          evidence_citations: []
        }]);
        setLoading(false);
      });
  };

  const handleProposeAction = (cmd, targetResource, riskLevel) => {
    fetch('/api/actions/propose', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        command: cmd,
        target_resource: targetResource || 'compute-host-01',
        runbook_title: 'Nova Remediation Runbook',
        risk_level: riskLevel || 'HIGH',
        rationale: 'Submitted via STAIR Chat recommendation for operator sign-off.',
      })
    })
      .then(r => {
        if (!r.ok) throw new Error('Failed to propose action');
        return r.json();
      })
      .then(d => {
        setActionSuccess(`Action request ${d.action_id} submitted for DevOps Human-in-the-Loop review! Check the 'Actions' tab.`);
        setTimeout(() => setActionSuccess(''), 6000);
      })
      .catch(err => {
        console.error(err);
        setActionSuccess('Failed to submit action request.');
      });
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(text);
    setTimeout(() => setCopiedCmd(''), 2500);
  };

  const handleClearHistory = () => {
    setMessages([]);
  };

  return (
    <div className="relative max-w-5xl mx-auto flex flex-col min-h-[calc(100vh-140px)] justify-between px-2 sm:px-4">
      {/* Ambient background glows in Teal & Silver */}
      <div className="ambient-glow-teal w-[500px] h-[500px] -top-32 -left-32"></div>
      <div className="ambient-glow-silver w-[450px] h-[450px] top-1/2 -right-32"></div>

      {/* Main Workspace Body */}
      <div className="relative z-10 flex-1 flex flex-col justify-center">
        {messages.length === 0 ? (
          /* SIGNATURE HERO SCREEN IN TEAL, SILVER & WHITE */
          <div className="py-6 sm:py-10 flex flex-col items-center">
            {/* Top Meta Header */}
            <div className="w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
              <div>
                <div className="flex items-center space-x-2 text-xs font-mono text-[#05AD98] mb-2">
                  <span className="w-2 h-2 rounded-full bg-[#05AD98] animate-ping"></span>
                  <span className="w-2 h-2 rounded-full bg-[#05AD98]"></span>
                  <span className="font-semibold tracking-wide uppercase text-[11px] text-[#BBBFBF]">
                    STAIR ENGINE v2.4 READY · 33,434 OpenStack Telemetry Records Synced
                  </span>
                </div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#FFFFFF] tracking-tight">
                  AI Infrastructure Scanner.
                </h1>
                <p className="text-sm sm:text-base text-[#BBBFBF] mt-2 max-w-2xl leading-relaxed">
                  Scan Oslo syslogs, isolate hypervisor provisioning anomalies, or retrieve verified operational runbooks — with full STAIR structure awareness.
                </p>
              </div>

              {/* Telemetry Isolation Pill Badge */}
              <div className="hidden lg:flex items-center space-x-3 px-4 py-3 rounded-2xl bg-[#0f141c]/85 border border-[#BBBFBF]/15 shadow-lg flex-shrink-0">
                <Shield className="w-5 h-5 text-[#05AD98] flex-shrink-0" />
                <div className="text-left text-xs">
                  <div className="font-semibold text-[#FFFFFF]">Telemetry Isolation</div>
                  <div className="text-[10px] text-[#05AD98]">Zero cross-VM telemetry bleed</div>
                </div>
              </div>
            </div>

            {/* Central Canvas Card */}
            <div className="w-full rounded-[32px] bg-[#0f141c]/85 border border-[#BBBFBF]/15 p-8 sm:p-12 md:p-14 shadow-2xl relative overflow-hidden backdrop-blur-2xl">
              {/* Soft decorative spheres */}
              <div className="absolute -top-12 -left-12 w-48 h-48 rounded-full bg-[#05AD98]/10 blur-2xl pointer-events-none"></div>
              <div className="absolute -bottom-12 -right-12 w-48 h-48 rounded-full bg-[#05AD98]/10 blur-2xl pointer-events-none"></div>

              {/* Central Logo Element */}
              <div className="flex flex-col items-center text-center max-w-2xl mx-auto">
                <div className="relative mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-[#151c27] border border-[#BBBFBF]/20 flex items-center justify-center shadow-[0_0_35px_rgba(5,173,152,0.3)]">
                    <FindlyLogo size={42} />
                  </div>
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[#05AD98] rounded-full border-2 border-[#0a0e14] animate-ping"></span>
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[#05AD98] rounded-full border-2 border-[#0a0e14]"></span>
                </div>

                {/* Card Title & Subtitle */}
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#FFFFFF] tracking-tight">
                  What would you like to know about your infrastructure?
                </h2>
                <p className="text-xs sm:text-sm text-[#BBBFBF] mt-3 max-w-lg leading-relaxed">
                  Inspect hypervisor logs, isolate VM provisioning bottlenecks, or ask a question.
                </p>

                {/* Clean Horizontal Action Pills */}
                <div className="flex flex-wrap items-center justify-center gap-2.5 mt-8 mb-8">
                  {quickActionPills.map((pill, idx) => {
                    const IconComp = pill.icon;
                    return (
                      <button
                        key={idx}
                        onClick={() => handleSend(pill.query)}
                        className="px-4 py-2.5 rounded-full bg-[#151c27]/80 hover:bg-[#05AD98]/20 border border-[#BBBFBF]/20 hover:border-[#05AD98] text-[#FFFFFF] text-xs font-medium transition-all shadow-sm flex items-center space-x-2 group"
                      >
                        <IconComp className="w-3.5 h-3.5 text-[#05AD98] group-hover:scale-110 transition-transform" />
                        <span>{pill.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Embedded Floating Input Bar */}
                <div className="w-full max-w-2xl bg-[#0a0e14]/90 rounded-2xl p-2 border border-[#BBBFBF]/20 focus-within:border-[#05AD98] transition-all shadow-xl flex items-center space-x-3">
                  <div className="hidden sm:flex items-center space-x-1.5 bg-[#151c27] px-3 py-1.5 rounded-xl border border-[#BBBFBF]/15 text-[#BBBFBF] text-[11px] font-mono flex-shrink-0">
                    <Radio className="w-3 h-3 text-[#05AD98] animate-pulse" />
                    <span>openstack_abnormal.log (33.4k)</span>
                  </div>

                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Ask about VM spawn times, memory claims, runbooks, or remediation..."
                    className="flex-1 bg-transparent border-none text-xs sm:text-sm text-[#FFFFFF] placeholder-[#878787] focus:outline-none pl-2 py-1"
                  />

                  <button
                    onClick={() => handleSend()}
                    disabled={loading || !query.trim()}
                    className="w-10 h-10 rounded-xl bg-[#05AD98] hover:bg-[#08c9af] disabled:opacity-30 text-[#FFFFFF] flex items-center justify-center transition-all shadow-lg shadow-[#05AD98]/30 flex-shrink-0"
                    title="Send query"
                  >
                    <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                  </button>
                </div>

                {/* Checkbox Options Row */}
                <div className="flex flex-wrap items-center justify-center gap-6 mt-5 text-[11px] text-[#BBBFBF]">
                  <label className="flex items-center space-x-2 cursor-pointer hover:text-[#FFFFFF] transition-colors">
                    <input
                      type="checkbox"
                      checked={options.groundTruth}
                      onChange={(e) => setOptions(prev => ({ ...prev, groundTruth: e.target.checked }))}
                      className="accent-[#05AD98] rounded"
                    />
                    <span>Ground Truth Verification</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer hover:text-[#FFFFFF] transition-colors">
                    <input
                      type="checkbox"
                      checked={options.trieConstrained}
                      onChange={(e) => setOptions(prev => ({ ...prev, trieConstrained: e.target.checked }))}
                      className="accent-[#05AD98] rounded"
                    />
                    <span>Trie-Constrained Path</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer hover:text-[#FFFFFF] transition-colors">
                    <input
                      type="checkbox"
                      checked={options.evidenceCitations}
                      onChange={(e) => setOptions(prev => ({ ...prev, evidenceCitations: e.target.checked }))}
                      className="accent-[#05AD98] rounded"
                    />
                    <span>Raw Log Citations</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Bottom Footnote */}
            <div className="w-full flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#878787] mt-6 px-4 gap-2">
              <div>
                <strong className="text-[#BBBFBF]">Note:</strong> Statistical deviations are calculated against normal baseline (19.79s ± 0.65s). Unverified hardware claims are flagged.
              </div>
              <div className="flex items-center space-x-1.5 text-[#05AD98] font-mono text-[10px]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#05AD98]"></span>
                <span className="text-[#BBBFBF]">Telemetry synced</span>
              </div>
            </div>
          </div>
        ) : (
          /* ACTIVE CHAT CONVERSATION */
          <div className="space-y-6 pb-6 pt-2">
            {/* Header: Assistant Online Info & Clear Button */}
            <div className="flex items-center justify-between pb-3 border-b border-[#BBBFBF]/15">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="w-8 h-8 rounded-full bg-[#151c27] border border-[#BBBFBF]/25 flex items-center justify-center text-[#FFFFFF] shadow-md shadow-[#05AD98]/20">
                    <FindlyLogo size={22} />
                  </div>
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#05AD98] rounded-full border-2 border-[#0a0e14]"></span>
                </div>
                <div>
                  <div className="text-xs font-bold text-[#FFFFFF] tracking-wide">
                    Findly STAIR Assistant
                  </div>
                  <div className="text-[10px] text-[#05AD98] font-mono">
                    Online · answers with verified ground truth
                  </div>
                </div>
              </div>

              <button
                onClick={handleClearHistory}
                className="text-xs text-[#878787] hover:text-rose-400 flex items-center px-3 py-1.5 rounded-full hover:bg-white/5 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1" /> Clear Chat
              </button>
            </div>

            {actionSuccess && (
              <div className="p-4 bg-[#05AD98]/15 border border-[#05AD98] text-[#FFFFFF] text-xs rounded-2xl flex items-center shadow-lg shadow-[#05AD98]/20">
                <CheckCircle2 className="w-4 h-4 mr-2.5 text-[#05AD98] flex-shrink-0" />
                <span>{actionSuccess}</span>
              </div>
            )}

            {/* Conversation Messages */}
            <div className="space-y-6">
              {messages.map((m, idx) => (
                <div key={idx} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                  {m.role === 'user' ? (
                    /* User Message Bubble: Crisp White Card */
                    <div className="bg-[#FFFFFF] text-[#0a0e14] font-medium px-5 py-3.5 rounded-2xl rounded-tr-sm shadow-md text-sm leading-relaxed max-w-2xl select-text">
                      {m.query}
                    </div>
                  ) : (
                    /* Assistant Message: Elevated Container */
                    <div className="w-full max-w-3xl bg-[#0f141c]/95 border border-[#BBBFBF]/15 rounded-2xl p-6 text-[#FFFFFF] shadow-xl space-y-4">
                      {/* STAIR Breadcrumb Path */}
                      {m.hierarchy_path && (
                        <div className="flex items-center space-x-2 text-[11px] bg-[#0a0e14] border-l-4 border-[#05AD98] px-3.5 py-2 rounded-xl text-[#FFFFFF] font-mono shadow-inner">
                          <Layers className="w-3.5 h-3.5 text-[#05AD98] flex-shrink-0" />
                          <span className="font-semibold text-[#878787]">STAIR Path:</span>
                          <span className="truncate text-[#05AD98] font-medium">{m.hierarchy_path}</span>
                        </div>
                      )}

                      {/* Rendered Diagnostic Markdown */}
                      <div className="markdown-content text-xs sm:text-sm">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {m.detailed_explanation}
                        </ReactMarkdown>
                      </div>

                      {/* Operator Approval Warning Banner */}
                      {m.requires_approval && (
                        <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/50 text-[#FFFFFF] text-xs flex items-start space-x-3.5 shadow-md">
                          <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                          <div className="space-y-1">
                            <div className="font-bold text-amber-400 text-sm tracking-wide">
                              Operator Approval Required
                            </div>
                            <div className="text-[#BBBFBF] leading-relaxed font-sans">
                              {cleanApprovalPrompt(m.approval_prompt) || 'The retrieved remediation procedure contains high-impact actions. Operator authorization is required prior to execution.'}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Actionable Remediation Procedures */}
                      {m.proposed_commands && m.proposed_commands.length > 0 && (
                        <div className="p-4 bg-[#0a0e14] rounded-2xl border border-[#BBBFBF]/15 space-y-3">
                          <div className="font-bold text-[#FFFFFF] flex items-center text-xs tracking-wider uppercase">
                            <Terminal className="w-4 h-4 mr-2 text-[#05AD98]" />
                            Retrieved Remediation Procedures:
                          </div>
                          {m.proposed_commands.map((cmdObj, cIdx) => (
                            <div key={cIdx} className="flex flex-col sm:flex-row sm:items-center justify-between bg-[#151c27] p-3.5 rounded-xl border border-[#BBBFBF]/10 gap-3">
                              <div className="flex items-center space-x-2.5 flex-1 overflow-x-auto">
                                <button
                                  onClick={() => handleCopy(cmdObj.command)}
                                  className="text-[#878787] hover:text-[#FFFFFF] transition-colors p-1"
                                  title="Copy command"
                                >
                                  {copiedCmd === cmdObj.command ? <Check className="w-4 h-4 text-[#05AD98]" /> : <Copy className="w-4 h-4" />}
                                </button>
                                <code className="text-[#05AD98] font-mono text-xs break-all">{cmdObj.command}</code>
                              </div>
                              <div className="flex items-center space-x-2.5 flex-shrink-0">
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                  cmdObj.risk_level === 'HIGH' ? 'bg-rose-950/80 text-rose-300 border border-rose-800' :
                                  cmdObj.risk_level === 'MEDIUM' ? 'bg-amber-950/80 text-amber-300 border border-amber-800' :
                                  'bg-[#05AD98]/20 text-[#05AD98] border border-[#05AD98]/40'
                                }`}>
                                  {cmdObj.risk_level} RISK
                                </span>
                                <button
                                  onClick={() => handleProposeAction(cmdObj.command, cmdObj.target, cmdObj.risk_level)}
                                  className="bg-[#05AD98] hover:bg-[#08c9af] text-[#FFFFFF] font-bold px-3.5 py-1.5 rounded-full text-[11px] transition-all shadow-md shadow-[#05AD98]/25"
                                >
                                  Request Approval
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Supporting Raw Log Citations */}
                      {options.evidenceCitations && m.evidence_citations && m.evidence_citations.length > 0 && (
                        <details className="mt-2 text-[11px] group bg-[#0a0e14] p-3.5 rounded-2xl border border-[#BBBFBF]/15">
                          <summary className="cursor-pointer text-[#BBBFBF] hover:text-[#FFFFFF] font-semibold select-none flex items-center justify-between">
                            <span className="flex items-center">
                              <FileText className="w-4 h-4 mr-2 text-[#05AD98]" />
                              Grounded Raw Log Citations ({m.evidence_citations.length} records isolated for this instance)
                            </span>
                            <span className="text-[10px] text-[#878787] group-open:rotate-180 transition-transform">▼</span>
                          </summary>
                          <div className="mt-3.5 space-y-2 max-h-60 overflow-y-auto pr-1">
                            {m.evidence_citations.map((c, cIdx) => (
                              <div key={cIdx} className="p-3 rounded-xl bg-[#0f141c] border border-[#BBBFBF]/10 text-[10.5px]">
                                <div className="text-[#878787] text-[10px] flex justify-between pb-1.5 border-b border-[#BBBFBF]/10">
                                  <span className="text-[#05AD98] font-semibold">{c.file} • Line {c.line} • {c.service}</span>
                                  <span className="font-mono text-[#878787]">{c.timestamp}</span>
                                </div>
                                <div className="text-[#FFFFFF] font-mono mt-1.5 text-[11px] leading-relaxed select-all">
                                  {c.message}
                                </div>
                              </div>
                            ))}
                          </div>
                        </details>
                      )}

                      {/* Ground-truth disclaimer subtext */}
                      <div className="text-[10px] text-[#878787] pt-2 border-t border-[#BBBFBF]/10">
                        Findly AI supports operational awareness — it isolates telemetry and never invents runbook commands.
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Quick Follow-up Suggestion Chips */}
            <div className="flex flex-col sm:flex-row flex-wrap gap-2 pt-2">
              {suggestionChips.map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(chip)}
                  className="px-4 py-2.5 rounded-full bg-[#0f141c] hover:bg-[#151c27] border border-[#BBBFBF]/15 hover:border-[#05AD98] text-[#FFFFFF] text-xs font-medium transition-all shadow-sm text-left flex items-center space-x-2"
                >
                  <ArrowRight className="w-3 h-3 text-[#05AD98] flex-shrink-0" />
                  <span>{chip}</span>
                </button>
              ))}
            </div>

            {/* SMOOTH SEARCHING RADAR & PIPELINE SCANNER ANIMATION */}
            {loading && (
              <div className="relative overflow-hidden p-5 bg-[#0f141c]/95 rounded-2xl border border-[#05AD98]/40 shadow-2xl space-y-3 max-w-lg">
                {/* Horizontal scan beam animation */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#05AD98]/15 to-transparent animate-scan-beam pointer-events-none"></div>

                <div className="flex items-center space-x-4">
                  {/* Concentric radar scanner ring */}
                  <div className="relative flex items-center justify-center w-8 h-8 flex-shrink-0">
                    <span className="absolute w-8 h-8 rounded-full border border-[#05AD98] animate-pulse-radar"></span>
                    <span className="w-3 h-3 rounded-full bg-[#05AD98]"></span>
                    <span className="absolute w-1.5 h-1.5 rounded-full bg-[#FFFFFF]"></span>
                  </div>

                  <div className="space-y-1 flex-1">
                    <div className="flex items-center justify-between text-xs font-bold text-[#FFFFFF]">
                      <span>STAIR Retrieval Active</span>
                      <span className="text-[10px] font-mono text-[#05AD98]">
                        Phase {searchPhase + 1}/5
                      </span>
                    </div>
                    <div className="text-xs font-mono text-[#05AD98] transition-all duration-300">
                      {searchPhases[searchPhase]}
                    </div>
                  </div>
                </div>

                {/* Micro Progress Bar in Teal */}
                <div className="w-full h-1 bg-[#0a0e14] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#05AD98] via-[#08c9af] to-[#FFFFFF] transition-all duration-300"
                    style={{ width: `${((searchPhase + 1) / searchPhases.length) * 100}%` }}
                  ></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Floating Bottom Capsule Input Bar (Active when in chat mode) */}
      {messages.length > 0 && (
        <div className="relative z-10 pt-3 pb-3">
          <div className="bg-[#0f141c]/95 p-2 rounded-2xl sm:rounded-full border border-[#BBBFBF]/15 flex items-center space-x-3 shadow-2xl backdrop-blur-2xl">
            <div className="hidden sm:flex items-center space-x-1.5 bg-[#0a0e14] px-3 py-1.5 rounded-full border border-[#BBBFBF]/15 text-[#BBBFBF] text-[11px] font-mono flex-shrink-0">
              <Radio className="w-3 h-3 text-[#05AD98] animate-pulse" />
              <span>openstack_abnormal.log</span>
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask anything about your infrastructure, VM latency, runbooks..."
              className="flex-1 bg-transparent border-none text-xs sm:text-sm text-[#FFFFFF] placeholder-[#878787] focus:outline-none pl-2"
            />
            <button
              onClick={() => handleSend()}
              disabled={loading || !query.trim()}
              className="w-10 h-10 rounded-full bg-[#05AD98] hover:bg-[#08c9af] disabled:opacity-30 text-[#FFFFFF] flex items-center justify-center transition-all shadow-lg shadow-[#05AD98]/30 flex-shrink-0"
              title="Send query"
            >
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>

          {/* Option toggles */}
          <div className="flex items-center justify-center space-x-6 pt-2 text-[11px] text-[#BBBFBF]">
            <label className="flex items-center space-x-1.5 cursor-pointer hover:text-[#FFFFFF] transition-colors">
              <input
                type="checkbox"
                checked={options.groundTruth}
                onChange={(e) => setOptions(prev => ({ ...prev, groundTruth: e.target.checked }))}
                className="accent-[#05AD98] rounded"
              />
              <span>Ground Truth</span>
            </label>
            <label className="flex items-center space-x-1.5 cursor-pointer hover:text-[#FFFFFF] transition-colors">
              <input
                type="checkbox"
                checked={options.trieConstrained}
                onChange={(e) => setOptions(prev => ({ ...prev, trieConstrained: e.target.checked }))}
                className="accent-[#05AD98] rounded"
              />
              <span>Trie Constrained</span>
            </label>
            <label className="flex items-center space-x-1.5 cursor-pointer hover:text-[#FFFFFF] transition-colors">
              <input
                type="checkbox"
                checked={options.evidenceCitations}
                onChange={(e) => setOptions(prev => ({ ...prev, evidenceCitations: e.target.checked }))}
                className="accent-[#05AD98] rounded"
              />
              <span>Log Citations</span>
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
