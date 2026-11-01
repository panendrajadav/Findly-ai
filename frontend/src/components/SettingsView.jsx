import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon, Server, Cpu, Sliders, Shield,
  RefreshCw, CheckCircle2, AlertTriangle, Eye, Sparkles,
  Database, GitBranch, Radio, Terminal
} from 'lucide-react';
import FindlyLogo from './FindlyLogo';

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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-8 pb-10 py-2">
      {/* Settings Header */}
      <div className="p-6 border border-[#009B4D]/30 rounded-3xl bg-[#09160e]/85 shadow-2xl relative overflow-hidden">
        <div className="ambient-glow-green w-80 h-80 -top-20 -right-20"></div>
        <div className="flex items-center space-x-3.5 relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#009B4D] to-[#008240] flex items-center justify-center text-[#FAF5E9] shadow-lg shadow-[#009B4D]/25 border border-[#009B4D]/30">
            <SettingsIcon className="w-6 h-6 text-[#FFCC00]" />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-[#FAF5E9] tracking-tight">
              Settings & Configuration
            </h2>
            <p className="text-xs text-[#FAF5E9]/70 mt-1">
              Manage STAIR retrieval parameters, model inference configuration, and DevOps safety guardrails.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Backend & Environment */}
        <div className="p-6 border border-[#009B4D]/30 rounded-3xl bg-[#09160e]/80 shadow-xl space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-[#009B4D]/25 text-[#FAF5E9] font-bold text-sm">
            <Server className="w-4 h-4 text-[#009B4D]" />
            <span>FastAPI Backend Services</span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-[#FAF5E9]/70 font-semibold block mb-1">API Server Base URL</label>
              <input
                type="text"
                readOnly
                value="http://127.0.0.1:8000"
                className="w-full bg-[#050d08] p-2.5 rounded-xl border border-[#009B4D]/30 text-[#FAF5E9] font-mono text-xs focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-[#050d08] border border-[#009B4D]/20">
              <div>
                <div className="font-semibold text-[#FAF5E9]">Live Engine Connectivity</div>
                <div className="text-[11px] text-[#FFCC00] font-mono mt-0.5">
                  {health ? `${health.status} (${health.service})` : 'Offline'}
                </div>
              </div>

              <button
                onClick={testBackend}
                disabled={testingConnection}
                className="px-3.5 py-1.5 rounded-xl bg-[#009B4D] hover:bg-[#00b85b] text-[#FAF5E9] font-bold text-xs flex items-center space-x-1.5 transition-all shadow-md shadow-[#009B4D]/25"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-[#FFCC00] ${testingConnection ? 'animate-spin' : ''}`} />
                <span>Test Link</span>
              </button>
            </div>

            {connectionStatus && (
              <div className="p-3 rounded-xl bg-[#0d2015] border border-[#009B4D]/40 text-[#FAF5E9] text-[11px] font-mono leading-relaxed">
                {connectionStatus}
              </div>
            )}
          </div>
        </div>

        {/* Inference & STAIR Config */}
        <div className="p-6 border border-[#009B4D]/30 rounded-3xl bg-[#09160e]/80 shadow-xl space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-[#009B4D]/25 text-[#FAF5E9] font-bold text-sm">
            <Cpu className="w-4 h-4 text-[#009B4D]" />
            <span>AI Inference Engine</span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-[#FAF5E9]/70 font-semibold block mb-1">Synthesis Model</label>
              <div className="p-2.5 rounded-xl bg-[#050d08] border border-[#009B4D]/25 font-mono text-xs text-[#FAF5E9] flex justify-between items-center">
                <span>Qwen 2.5 Grounded Assistant</span>
                <span className="text-[10px] text-[#009B4D] font-bold uppercase">Ready</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#050d08] border border-[#009B4D]/20 space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-[#FAF5E9]/70">Context Chunking Policy:</span>
                <span className="text-[#009B4D] font-mono font-bold">STAIR Complete Sections</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#FAF5E9]/70">Prefix Trie Decoding:</span>
                <span className="text-[#FFCC00] font-mono font-bold">Constrained Valid Leaves</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#FAF5E9]/70">Evidence Isolation:</span>
                <span className="text-[#FAF5E9] font-mono font-bold">Instance UUID Strict</span>
              </div>
            </div>
          </div>
        </div>

        {/* Statistical Baselines */}
        <div className="p-6 border border-[#009B4D]/30 rounded-3xl bg-[#09160e]/80 shadow-xl space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-[#009B4D]/25 text-[#FAF5E9] font-bold text-sm">
            <Radio className="w-4 h-4 text-[#009B4D]" />
            <span>OpenStack Telemetry Baseline Thresholds</span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-[#050d08] rounded-xl border border-[#009B4D]/20 space-y-1">
              <div className="flex justify-between">
                <span className="text-[#FAF5E9]/70">Normal Spawn Mean (μ):</span>
                <span className="text-[#FAF5E9] font-mono font-bold">19.79 seconds</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#FAF5E9]/70">Standard Deviation (σ):</span>
                <span className="text-[#009B4D] font-mono font-bold">0.65 seconds</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#FAF5E9]/70">Normal Envelope:</span>
                <span className="text-[#FFCC00] font-mono">18.1s – 22.2s</span>
              </div>
            </div>

            <div className="p-3 bg-[#050d08] rounded-xl border border-[#009B4D]/20 space-y-1">
              <div className="flex justify-between">
                <span className="text-[#FAF5E9]/70">Normal Build Mean (μ):</span>
                <span className="text-[#FAF5E9] font-mono font-bold">20.59 seconds</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#FAF5E9]/70">Build Std Dev (σ):</span>
                <span className="text-[#009B4D] font-mono font-bold">0.65 seconds</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#FAF5E9]/70">Build Normal Envelope:</span>
                <span className="text-[#FFCC00] font-mono">18.9s – 23.3s</span>
              </div>
            </div>
          </div>
        </div>

        {/* Safety & UI Preferences */}
        <div className="p-6 border border-[#009B4D]/30 rounded-3xl bg-[#09160e]/80 shadow-xl space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-[#009B4D]/25 text-[#FAF5E9] font-bold text-sm">
            <Shield className="w-4 h-4 text-[#009B4D]" />
            <span>DevOps Safety & Display Preferences</span>
          </div>

          <div className="space-y-3 text-xs">
            <label className="flex items-center justify-between p-3 rounded-xl bg-[#050d08] border border-[#009B4D]/20 cursor-pointer">
              <div>
                <div className="font-semibold text-[#FAF5E9]">Enforce Operator Approvals</div>
                <div className="text-[11px] text-[#FAF5E9]/60">Require human authorization for destructive actions</div>
              </div>
              <input
                type="checkbox"
                checked={strictOperatorApproval}
                onChange={(e) => setStrictOperatorApproval(e.target.checked)}
                className="accent-[#009B4D] rounded w-4 h-4"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-[#050d08] border border-[#009B4D]/20 cursor-pointer">
              <div>
                <div className="font-semibold text-[#FAF5E9]">Auto-Ground Citations</div>
                <div className="text-[11px] text-[#FAF5E9]/60">Display line numbers & timestamps with every answer</div>
              </div>
              <input
                type="checkbox"
                checked={autoVerifyCitations}
                onChange={(e) => setAutoVerifyCitations(e.target.checked)}
                className="accent-[#009B4D] rounded w-4 h-4"
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
