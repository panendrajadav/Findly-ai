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
      <div className="p-6 border border-[#BBBFBF]/15 rounded-3xl bg-[#0f141c]/90 shadow-2xl relative overflow-hidden">
        <div className="ambient-glow-teal w-80 h-80 -top-20 -right-20 fixed pointer-events-none"></div>
        <div className="flex items-center space-x-3.5 relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-[#05AD98]/10 flex items-center justify-center text-[#FFFFFF] shadow-lg shadow-[#05AD98]/20 border border-[#05AD98]/25">
            <SettingsIcon className="w-6 h-6 text-[#05AD98]" />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-[#FFFFFF] tracking-tight">
              Settings & Configuration
            </h2>
            <p className="text-xs text-[#BBBFBF] mt-1">
              Manage STAIR retrieval parameters, model inference configuration, and DevOps safety guardrails.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Backend & Environment */}
        <div className="p-6 border border-[#BBBFBF]/15 rounded-3xl bg-[#0f141c]/90 shadow-xl space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-[#BBBFBF]/15 text-[#FFFFFF] font-bold text-sm">
            <Server className="w-4 h-4 text-[#05AD98]" />
            <span>FastAPI Backend Services</span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-[#BBBFBF] font-semibold block mb-1">API Server Base URL</label>
              <input
                type="text"
                readOnly
                value="http://127.0.0.1:8000"
                className="w-full bg-[#0a0e14] p-2.5 rounded-xl border border-[#BBBFBF]/15 text-[#FFFFFF] font-mono text-xs focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-[#0a0e14] border border-[#BBBFBF]/10">
              <div>
                <div className="font-semibold text-[#FFFFFF]">Live Engine Connectivity</div>
                <div className="text-[11px] text-[#05AD98] font-mono mt-0.5">
                  {health ? `${health.status} (${health.service})` : 'Offline'}
                </div>
              </div>

              <button
                onClick={testBackend}
                disabled={testingConnection}
                className="px-3.5 py-1.5 rounded-xl bg-[#05AD98] hover:bg-[#049683] text-[#FFFFFF] font-bold text-xs flex items-center space-x-1.5 transition-all shadow-md shadow-[#05AD98]/25"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-[#FFFFFF] ${testingConnection ? 'animate-spin' : ''}`} />
                <span>Test Link</span>
              </button>
            </div>

            {connectionStatus && (
              <div className="p-3 rounded-xl bg-[#05AD98]/10 border border-[#05AD98]/25 text-[#FFFFFF] text-[11px] font-mono leading-relaxed">
                {connectionStatus}
              </div>
            )}
          </div>
        </div>

        {/* Inference & STAIR Config */}
        <div className="p-6 border border-[#BBBFBF]/15 rounded-3xl bg-[#0f141c]/90 shadow-xl space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-[#BBBFBF]/15 text-[#FFFFFF] font-bold text-sm">
            <Cpu className="w-4 h-4 text-[#05AD98]" />
            <span>AI Inference Engine</span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-[#BBBFBF] font-semibold block mb-1">Synthesis Model</label>
              <div className="p-2.5 rounded-xl bg-[#0a0e14] border border-[#BBBFBF]/15 font-mono text-xs text-[#FFFFFF] flex justify-between items-center">
                <span>Qwen 2.5 Grounded Assistant</span>
                <span className="text-[10px] text-[#05AD98] font-bold uppercase">Ready</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#0a0e14] border border-[#BBBFBF]/10 space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-[#BBBFBF]">Context Chunking Policy:</span>
                <span className="text-[#05AD98] font-mono font-bold">STAIR Complete Sections</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#BBBFBF]">Prefix Trie Decoding:</span>
                <span className="text-[#05AD98] font-mono font-bold">Constrained Valid Leaves</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#BBBFBF]">Evidence Isolation:</span>
                <span className="text-[#FFFFFF] font-mono font-bold">Instance UUID Strict</span>
              </div>
            </div>
          </div>
        </div>

        {/* Statistical Baselines */}
        <div className="p-6 border border-[#BBBFBF]/15 rounded-3xl bg-[#0f141c]/90 shadow-xl space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-[#BBBFBF]/15 text-[#FFFFFF] font-bold text-sm">
            <Radio className="w-4 h-4 text-[#05AD98]" />
            <span>OpenStack Telemetry Baseline Thresholds</span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-[#0a0e14] rounded-xl border border-[#BBBFBF]/10 space-y-1">
              <div className="flex justify-between">
                <span className="text-[#BBBFBF]">Normal Spawn Mean (μ):</span>
                <span className="text-[#FFFFFF] font-mono font-bold">19.79 seconds</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#BBBFBF]">Standard Deviation (σ):</span>
                <span className="text-[#05AD98] font-mono font-bold">0.65 seconds</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#BBBFBF]">Normal Envelope:</span>
                <span className="text-[#05AD98] font-mono">18.1s – 22.2s</span>
              </div>
            </div>

            <div className="p-3 bg-[#0a0e14] rounded-xl border border-[#BBBFBF]/10 space-y-1">
              <div className="flex justify-between">
                <span className="text-[#BBBFBF]">Normal Build Mean (μ):</span>
                <span className="text-[#FFFFFF] font-mono font-bold">20.59 seconds</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#BBBFBF]">Build Std Dev (σ):</span>
                <span className="text-[#05AD98] font-mono font-bold">0.65 seconds</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#BBBFBF]">Build Normal Envelope:</span>
                <span className="text-[#05AD98] font-mono">18.9s – 23.3s</span>
              </div>
            </div>
          </div>
        </div>

        {/* Safety & UI Preferences */}
        <div className="p-6 border border-[#BBBFBF]/15 rounded-3xl bg-[#0f141c]/90 shadow-xl space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-[#BBBFBF]/15 text-[#FFFFFF] font-bold text-sm">
            <Shield className="w-4 h-4 text-[#05AD98]" />
            <span>DevOps Safety & Display Preferences</span>
          </div>

          <div className="space-y-3 text-xs">
            <label className="flex items-center justify-between p-3 rounded-xl bg-[#0a0e14] border border-[#BBBFBF]/10 cursor-pointer">
              <div>
                <div className="font-semibold text-[#FFFFFF]">Enforce Operator Approvals</div>
                <div className="text-[11px] text-[#878787]">Require human authorization for destructive actions</div>
              </div>
              <input
                type="checkbox"
                checked={strictOperatorApproval}
                onChange={(e) => setStrictOperatorApproval(e.target.checked)}
                className="accent-[#05AD98] rounded w-4 h-4"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-[#0a0e14] border border-[#BBBFBF]/10 cursor-pointer">
              <div>
                <div className="font-semibold text-[#FFFFFF]">Auto-Ground Citations</div>
                <div className="text-[11px] text-[#878787]">Display line numbers & timestamps with every answer</div>
              </div>
              <input
                type="checkbox"
                checked={autoVerifyCitations}
                onChange={(e) => setAutoVerifyCitations(e.target.checked)}
                className="accent-[#05AD98] rounded w-4 h-4"
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
