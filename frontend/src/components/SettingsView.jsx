import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon, Server, Cpu, Sliders, Shield,
  RefreshCw, CheckCircle2, AlertTriangle, Eye, Sparkles,
  Database, GitBranch, Radio, Terminal
} from 'lucide-react';

export default function SettingsView() {
  const [health, setHealth] = useState(null);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('');
  const [reducedMotion, setReducedMotion] = useState(false);
  const [autoVerifyCitations, setAutoVerifyCitations] = useState(true);
  const [strictOperatorApproval, setStrictOperatorApproval] = useState(true);

  const testBackend = () => {
    setTestingConnection(true);
    setConnectionStatus('Pinging /api/health...');
    fetch('/api/health')
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(d => {
        setHealth(d);
        setConnectionStatus(`Connected! Indexed ${d.indexed_sections} sections and loaded ${d.openstack_logs_loaded} logs.`);
      })
      .catch(err => {
        setConnectionStatus(`Connection failed: ${err.message}`);
      })
      .finally(() => {
        setTestingConnection(false);
      });
  };

  useEffect(() => {
    testBackend();
  }, []);

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-10">
      {/* Settings Header */}
      <div className="glass-card p-6 border border-white/10 rounded-3xl bg-navy-900/80 shadow-2xl relative overflow-hidden">
        <div className="ambient-glow-blue w-80 h-80 -top-20 -right-20"></div>
        <div className="flex items-center space-x-3.5 relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
            <SettingsIcon className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-white tracking-tight">
              Settings & Configuration
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Manage STAIR retrieval parameters, model inference configuration, and DevOps safety guardrails.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Backend & Environment */}
        <div className="glass-card p-6 border border-white/10 rounded-3xl bg-navy-900/70 shadow-xl space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-white/10 text-white font-bold text-sm">
            <Server className="w-4 h-4 text-cyan-400" />
            <span>FastAPI Backend Services</span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-slate-400 font-semibold block mb-1">API Server Base URL</label>
              <input
                type="text"
                readOnly
                value="http://127.0.0.1:8000"
                className="w-full bg-navy-950 p-2.5 rounded-xl border border-white/10 text-slate-200 font-mono text-xs focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-navy-950/70 border border-white/5">
              <div>
                <div className="font-semibold text-white">Live Engine Connectivity</div>
                <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                  {health ? `${health.status} (${health.service})` : 'Offline'}
                </div>
              </div>

              <button
                onClick={testBackend}
                disabled={testingConnection}
                className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center space-x-1.5 transition-all shadow-md shadow-blue-500/20"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${testingConnection ? 'animate-spin' : ''}`} />
                <span>Test Link</span>
              </button>
            </div>

            {connectionStatus && (
              <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-500/30 text-blue-200 text-[11px] font-mono leading-relaxed">
                {connectionStatus}
              </div>
            )}
          </div>
        </div>

        {/* Model & STAIR Retrieval */}
        <div className="glass-card p-6 border border-white/10 rounded-3xl bg-navy-900/70 shadow-xl space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-white/10 text-white font-bold text-sm">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <span>AI Model & STAIR Inference Engine</span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-slate-400 font-semibold block mb-1">Inference Engine</label>
              <div className="p-2.5 rounded-xl bg-navy-950 border border-white/10 text-white font-mono flex items-center justify-between">
                <span>Qwen Grounded Assistant (1.5B/3B)</span>
                <span className="text-[10px] text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded-full border border-cyan-800">
                  Active
                </span>
              </div>
            </div>

            <div>
              <label className="text-slate-400 font-semibold block mb-1">Decoding Constraint</label>
              <div className="p-2.5 rounded-xl bg-navy-950 border border-white/10 text-white font-mono flex items-center justify-between">
                <span>Prefix Trie Leaf Constrained</span>
                <span className="text-[10px] text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-800">
                  19 Leaves
                </span>
              </div>
            </div>

            <div>
              <label className="text-slate-400 font-semibold block mb-1">Vector Similarity Metric</label>
              <div className="p-2.5 rounded-xl bg-navy-950 border border-white/10 text-white font-mono">
                Cosine Distance (Qdrant Memory Collection)
              </div>
            </div>
          </div>
        </div>

        {/* Statistical Baselines */}
        <div className="glass-card p-6 border border-white/10 rounded-3xl bg-navy-900/70 shadow-xl space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-white/10 text-white font-bold text-sm">
            <Sliders className="w-4 h-4 text-cyan-400" />
            <span>OpenStack Normal Baselines</span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-navy-950/70 rounded-xl border border-white/5 space-y-1">
              <div className="flex justify-between font-mono">
                <span className="text-slate-400">Normal Spawn Mean (μ):</span>
                <span className="text-cyan-300 font-bold">19.79 seconds</span>
              </div>
              <div className="flex justify-between font-mono">
                <span className="text-slate-400">Spawn Std Deviation (σ):</span>
                <span className="text-cyan-300 font-bold">0.65 seconds</span>
              </div>
              <div className="flex justify-between font-mono">
                <span className="text-slate-400">Normal Operational Envelope:</span>
                <span className="text-white font-bold">18.1s – 22.2s</span>
              </div>
            </div>

            <div className="p-3 bg-navy-950/70 rounded-xl border border-white/5 space-y-1">
              <div className="flex justify-between font-mono">
                <span className="text-slate-400">Normal Build Mean (μ):</span>
                <span className="text-cyan-300 font-bold">20.59 seconds</span>
              </div>
              <div className="flex justify-between font-mono">
                <span className="text-slate-400">Build Std Deviation (σ):</span>
                <span className="text-cyan-300 font-bold">0.65 seconds</span>
              </div>
              <div className="flex justify-between font-mono">
                <span className="text-slate-400">Anomaly Flagging Threshold:</span>
                <span className="text-amber-300 font-bold">&gt; +3.0σ (outlier)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Safety & Safety Guardrails */}
        <div className="glass-card p-6 border border-white/10 rounded-3xl bg-navy-900/70 shadow-xl space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-white/10 text-white font-bold text-sm">
            <Shield className="w-4 h-4 text-cyan-400" />
            <span>DevOps Human-in-the-Loop Safeguards</span>
          </div>

          <div className="space-y-3 text-xs">
            <label className="flex items-center justify-between p-3 rounded-xl bg-navy-950/70 border border-white/5 cursor-pointer">
              <div>
                <div className="font-semibold text-white">Strict Operator Approval</div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Block autonomous execution of Medium and High risk bash procedures.
                </div>
              </div>
              <input
                type="checkbox"
                checked={strictOperatorApproval}
                onChange={(e) => setStrictOperatorApproval(e.target.checked)}
                className="w-4 h-4 accent-blue-500 rounded"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-navy-950/70 border border-white/5 cursor-pointer">
              <div>
                <div className="font-semibold text-white">Log Evidence Attribution</div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Mandate line-level Oslo syslog citations for every duration claim.
                </div>
              </div>
              <input
                type="checkbox"
                checked={autoVerifyCitations}
                onChange={(e) => setAutoVerifyCitations(e.target.checked)}
                className="w-4 h-4 accent-blue-500 rounded"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-navy-950/70 border border-white/5 cursor-pointer">
              <div>
                <div className="font-semibold text-white">Reduced Motion Mode</div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Disable continuous animated glows and stepper transitions.
                </div>
              </div>
              <input
                type="checkbox"
                checked={reducedMotion}
                onChange={(e) => setReducedMotion(e.target.checked)}
                className="w-4 h-4 accent-blue-500 rounded"
              />
            </label>
          </div>
        </div>
      </div>

      {/* Research Citations & Metadata */}
      <div className="glass-card p-6 border border-white/10 rounded-3xl bg-navy-900/50 shadow-xl text-xs space-y-2 text-slate-400">
        <div className="font-bold text-white uppercase tracking-wider text-[11px]">
          Research Foundation & Methodology
        </div>
        <p className="leading-relaxed">
          Findly AI implements the <strong>STAIR</strong> architecture (<em>Structure-Aware Information Retriever</em>, arXiv:2609.03874). In contrast to arbitrary fixed chunking, STAIR parses structural hierarchies, registers valid leaf paths inside a prefix Trie, and evaluates section embeddings for complete operational runbook delivery.
        </p>
      </div>
    </div>
  );
}

