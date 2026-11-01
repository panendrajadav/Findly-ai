import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  Send, Bot, User, Terminal, Layers, FileText, AlertTriangle, 
  CheckCircle, Trash2, ArrowRight, Sparkles, 
  Cpu, Clock, ShieldCheck, Copy, Check, Radio
} from 'lucide-react';

export default function ChatView() {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState('');
  const [copiedCmd, setCopiedCmd] = useState('');
  const [options, setOptions] = useState({
    groundTruth: true,
    trieConstrained: true,
    evidenceCitations: true,
  });

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages, loading]);

  const quickInquiries = [
    {
      title: "VM 544fd51c Spawn Latency",
      desc: "Why did VM 544fd51c take over 40 seconds to spawn on the hypervisor?",
      icon: Clock,
      query: "Why did VM 544fd51c-4edc-4780-baae-ba1d80a0acfc take over 40 seconds to spawn?",
    },
    {
      title: "Cross-VM Latency Comparison",
      desc: "Compare measured provisioning duration and baseline deviation between anomalous VMs.",
      icon: Cpu,
      query: "Compare these two VMs.",
    },
    {
      title: "Resource Claims Verification",
      desc: "What resource limits, vCPU, and memory claims were placed for instance ae651dff?",
      icon: ShieldCheck,
      query: "What resource claims were placed for VM ae651dff-c7ad-43d6-ac96-bbcd820ccca8?",
    },
    {
      title: "Compute Service Remediation",
      desc: "Retrieve verified operational runbook commands to restart stuck compute threads.",
      icon: Terminal,
      query: "What commands restart nova-compute?",
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
      .replace(/⚠️\s*/g, '')
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
        setActionSuccess(`Action request ${d.action_id} submitted for DevOps Human-in-the-Loop review! Check the 'DevOps Actions' tab.`);
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
    <div className="relative max-w-5xl mx-auto flex flex-col min-h-[calc(100vh-180px)] justify-between">
      {/* Ambient glowing floating orbs for visual depth (Black & Emerald) */}
      <div className="glow-orb glow-orb-emerald w-[500px] h-[500px] -top-32 -left-32 animate-float-slow"></div>
      <div className="glow-orb glow-orb-mint w-[450px] h-[450px] top-1/2 -right-32 animate-float-reverse"></div>

      {/* Main Content Area */}
      <div className="relative z-10 flex-1 flex flex-col">
        {/* Welcome Hero State (When no messages yet) matching the uploaded reference design */}
        {messages.length === 0 ? (
          <div className="my-auto py-12 flex flex-col items-center text-center">
            {/* Glossy 3D Glowing Orb Accent */}
            <div className="relative mb-6">
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-emerald-600 via-emerald-400 to-teal-200 shadow-[0_0_40px_rgba(16,185,129,0.5)] flex items-center justify-center">
                <div className="w-6 h-6 rounded-full bg-white/30 blur-[2px] -translate-x-1 -translate-y-1"></div>
              </div>
            </div>

            {/* Status Pill Badge */}
            <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-[#0d121c] border border-emerald-500/30 text-emerald-300 text-xs font-mono mb-6 shadow-lg shadow-emerald-950/40">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>STAIR ENGINE v2.4 READY • 33,434 OpenStack Telemetry Lines Synced</span>
            </div>

            {/* Hero Title */}
            <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight max-w-2xl leading-tight">
              What would you like to investigate?
            </h1>
            <p className="text-sm md:text-base text-slate-400 mt-4 max-w-xl leading-relaxed">
              Query OpenStack Oslo telemetry, inspect VM provisioning anomalies, or retrieve verified operational runbooks.
            </p>

            {/* 4 Spacious Quick Inquiry Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-10 w-full max-w-3xl text-left">
              {quickInquiries.map((card, i) => {
                const IconComponent = card.icon;
                return (
                  <button
                    key={i}
                    onClick={() => handleSend(card.query)}
                    className="glass-card p-5 border border-white/5 hover:border-emerald-500/40 hover:bg-[#0f1422] rounded-2xl transition-all group flex items-start space-x-4 shadow-xl"
                  >
                    <div className="w-10 h-10 rounded-xl bg-[#141a27] border border-white/5 group-hover:border-emerald-500/40 flex items-center justify-center text-emerald-400 flex-shrink-0 transition-colors">
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-sm text-white group-hover:text-emerald-300 transition-colors flex items-center justify-between">
                        <span>{card.title}</span>
                        <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
                      </div>
                      <div className="text-xs text-slate-400 mt-1 leading-relaxed">
                        {card.desc}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          /* Active Chat Conversation */
          <div className="space-y-6 pb-6">
            <div className="flex justify-between items-center pb-2 border-b border-white/5">
              <div className="flex items-center space-x-2 text-xs text-slate-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span>Active Troubleshooting Session</span>
              </div>
              <button
                onClick={handleClearHistory}
                className="text-xs text-slate-400 hover:text-rose-400 flex items-center px-3 py-1 rounded-full hover:bg-white/5 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1" /> Clear Chat
              </button>
            </div>

            {actionSuccess && (
              <div className="p-4 bg-emerald-950/80 border border-emerald-500/80 text-emerald-200 text-xs rounded-2xl flex items-center shadow-lg shadow-emerald-950/40">
                <CheckCircle className="w-4 h-4 mr-2.5 text-emerald-400 flex-shrink-0" />
                <span>{actionSuccess}</span>
              </div>
            )}

            {messages.map((m, idx) => (
              <div key={idx} className={`flex space-x-4 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {m.role === 'assistant' && (
                  <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center flex-shrink-0 text-black shadow-lg shadow-emerald-500/20 mt-1">
                    <Sparkles className="w-4 h-4 text-black" />
                  </div>
                )}

                <div className={`max-w-3xl rounded-3xl p-6 text-xs transition-all ${
                  m.role === 'user'
                    ? 'bg-white text-slate-900 font-medium rounded-tr-sm shadow-xl text-sm leading-relaxed'
                    : 'glass-card bg-[#0b0f17]/95 text-slate-200 border border-emerald-500/20 rounded-tl-sm shadow-2xl space-y-4'
                }`}>
                  {m.role === 'user' ? (
                    <div>{m.query}</div>
                  ) : (
                    <>
                      {/* STAIR Breadcrumb Banner */}
                      {m.hierarchy_path && (
                        <div className="flex items-center space-x-2 text-[11px] bg-[#070a10] border-l-4 border-emerald-500 px-3.5 py-2 rounded-lg text-emerald-300 font-mono shadow-inner">
                          <Layers className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                          <span className="font-semibold text-slate-400">STAIR Path:</span>
                          <span className="truncate">{m.hierarchy_path}</span>
                        </div>
                      )}

                      {/* Properly Rendered Markdown Diagnostics */}
                      <div className="markdown-content text-slate-200">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {m.detailed_explanation}
                        </ReactMarkdown>
                      </div>

                      {/* Human-in-the-Loop Operator Warning Banner */}
                      {m.requires_approval && (
                        <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/40 text-amber-200 text-xs flex items-start space-x-3.5 shadow-md">
                          <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                          <div className="space-y-1">
                            <div className="font-semibold text-amber-300 text-sm tracking-wide">Operator Approval Required</div>
                            <div className="text-amber-200/90 leading-relaxed font-sans">
                              {cleanApprovalPrompt(m.approval_prompt) || 'The retrieved remediation procedure contains high-impact actions. Operator authorization is required prior to execution.'}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Actionable Remediation Procedures */}
                      {m.proposed_commands && m.proposed_commands.length > 0 && (
                        <div className="p-4 bg-[#070a10] rounded-2xl border border-white/5 space-y-3">
                          <div className="font-bold text-slate-300 flex items-center text-xs tracking-wider uppercase">
                            <Terminal className="w-4 h-4 mr-2 text-emerald-400" />
                            Retrieved Remediation Procedures:
                          </div>
                          {m.proposed_commands.map((cmdObj, cIdx) => (
                            <div key={cIdx} className="flex flex-col sm:flex-row sm:items-center justify-between bg-[#0e131d] p-3.5 rounded-xl border border-white/5 gap-3">
                              <div className="flex items-center space-x-2.5 flex-1 overflow-x-auto">
                                <button
                                  onClick={() => handleCopy(cmdObj.command)}
                                  className="text-slate-500 hover:text-white transition-colors p-1"
                                  title="Copy command"
                                >
                                  {copiedCmd === cmdObj.command ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                                </button>
                                <code className="text-emerald-400 font-mono text-xs break-all">{cmdObj.command}</code>
                              </div>
                              <div className="flex items-center space-x-2.5 flex-shrink-0">
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                  cmdObj.risk_level === 'HIGH' ? 'bg-rose-950/80 text-rose-300 border border-rose-800' :
                                  cmdObj.risk_level === 'MEDIUM' ? 'bg-amber-950/80 text-amber-300 border border-amber-800' :
                                  'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                                }`}>
                                  {cmdObj.risk_level} RISK
                                </span>
                                <button
                                  onClick={() => handleProposeAction(cmdObj.command, cmdObj.target, cmdObj.risk_level)}
                                  className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold px-3.5 py-1.5 rounded-full text-[11px] transition-all shadow-md shadow-emerald-500/25"
                                >
                                  Request Approval
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Supporting Grounded Evidence Citations */}
                      {options.evidenceCitations && m.evidence_citations && m.evidence_citations.length > 0 && (
                        <details className="mt-2 text-[11px] group bg-[#070a10] p-3.5 rounded-2xl border border-white/5">
                          <summary className="cursor-pointer text-slate-400 hover:text-white font-semibold select-none flex items-center justify-between">
                            <span className="flex items-center">
                              <FileText className="w-4 h-4 mr-2 text-emerald-400" />
                              Grounded Raw Log Citations ({m.evidence_citations.length} records isolated for this instance)
                            </span>
                            <span className="text-[10px] text-slate-500 group-open:rotate-180 transition-transform">▼</span>
                          </summary>
                          <div className="mt-3.5 space-y-2 max-h-60 overflow-y-auto pr-1">
                            {m.evidence_citations.map((c, cIdx) => (
                              <div key={cIdx} className="p-3 rounded-xl bg-[#0e131d] border border-white/5 text-[10.5px]">
                                <div className="text-slate-400 text-[10px] flex justify-between pb-1.5 border-b border-white/5">
                                  <span className="text-emerald-300 font-semibold">{c.file} • Line {c.line} • {c.service}</span>
                                  <span className="font-mono text-slate-400">{c.timestamp}</span>
                                </div>
                                <div className="text-slate-200 font-mono mt-1.5 text-[11px] leading-relaxed select-all">
                                  {c.message}
                                </div>
                              </div>
                            ))}
                          </div>
                        </details>
                      )}

                      {/* Verification footer note */}
                      <div className="text-[10px] text-slate-500 pt-1 border-t border-white/5">
                        Findly AI STAIR ground-truth telemetry verification — Unverified root causes are flagged.
                      </div>
                    </>
                  )}
                </div>

                {m.role === 'user' && (
                  <div className="w-9 h-9 rounded-2xl bg-[#141a27] border border-white/10 flex items-center justify-center flex-shrink-0 text-slate-200 shadow-md mt-1">
                    <User className="w-4 h-4 text-slate-300" />
                  </div>
                )}
              </div>
            ))}

            {/* Quick Suggestion Chips matching Image 2 */}
            <div className="flex flex-wrap gap-2 pt-2 justify-start">
              {suggestionChips.map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(chip)}
                  className="px-4 py-2 rounded-full bg-[#131722] hover:bg-[#1c2233] border border-white/10 hover:border-emerald-500/50 text-slate-300 hover:text-white text-xs transition-all shadow-sm flex items-center space-x-1.5"
                >
                  <span>{chip}</span>
                </button>
              ))}
            </div>

            {loading && (
              <div className="flex items-center space-x-3 text-slate-400 text-xs p-4 glass-card w-fit rounded-2xl border border-white/10">
                <div className="w-4 h-4 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin"></div>
                <span>STAIR retriever evaluating Prefix Trie and isolating log records...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Floating Bottom Capsule Input Bar with Emerald Accent */}
      <div className="relative z-10 pt-4 pb-2">
        <div className="glass-card p-2 rounded-full border border-white/10 flex items-center space-x-3 shadow-2xl bg-[#0b0f17]/90 backdrop-blur-2xl">
          <div className="hidden sm:flex items-center space-x-1.5 bg-[#141925] px-3 py-1.5 rounded-full border border-white/10 text-emerald-300 text-[11px] font-mono flex-shrink-0">
            <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
            <span>openstack_abnormal.log</span>
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask about VM spawning latency, resource claims, runbooks, or remediation..."
            className="flex-1 bg-transparent border-none text-sm text-white placeholder-slate-500 focus:outline-none pl-2"
          />
          <button
            onClick={() => handleSend()}
            disabled={loading || !query.trim()}
            className="w-10 h-10 rounded-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-30 text-black flex items-center justify-center transition-all shadow-lg shadow-emerald-500/30 flex-shrink-0"
            title="Send query"
          >
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* Option toggles matching Image 1 */}
        <div className="flex items-center justify-center space-x-8 pt-3 text-xs text-slate-400">
          <label className="flex items-center space-x-2 cursor-pointer hover:text-slate-200 transition-colors">
            <input
              type="checkbox"
              checked={options.groundTruth}
              onChange={(e) => setOptions(prev => ({ ...prev, groundTruth: e.target.checked }))}
              className="accent-emerald-500 rounded"
            />
            <span>Ground Truth Verification</span>
          </label>
          <label className="flex items-center space-x-2 cursor-pointer hover:text-slate-200 transition-colors">
            <input
              type="checkbox"
              checked={options.trieConstrained}
              onChange={(e) => setOptions(prev => ({ ...prev, trieConstrained: e.target.checked }))}
              className="accent-emerald-500 rounded"
            />
            <span>Trie-Constrained Path</span>
          </label>
          <label className="flex items-center space-x-2 cursor-pointer hover:text-slate-200 transition-colors">
            <input
              type="checkbox"
              checked={options.evidenceCitations}
              onChange={(e) => setOptions(prev => ({ ...prev, evidenceCitations: e.target.checked }))}
              className="accent-emerald-500 rounded"
            />
            <span>Raw Log Citations</span>
          </label>
        </div>

        {/* Disclaimer footer matching reference Image 1 */}
        <div className="flex justify-between items-center text-[10px] text-slate-500 pt-2 px-2">
          <span>Note: Root-cause assertions require hardware kernel metrics. Unverified claims are flagged as unsupported.</span>
          <span className="flex items-center space-x-1 text-emerald-400 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span>Telemetry verified</span>
          </span>
        </div>
      </div>
    </div>
  );
}
