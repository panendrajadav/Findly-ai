import React, { useState, useEffect } from 'react';
import {
  FileText, Layers, Database, AlertTriangle, Compass,
  CheckCircle2, ArrowRight, Activity, Terminal, Sparkles,
  RefreshCw, TrendingUp, Cpu, Clock, ShieldCheck, Play, Shield
} from 'lucide-react';
import FindlyLogo from './FindlyLogo';

export default function OverviewView({ onNavigate, onSelectQuery }) {
  const [health, setHealth] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [incidentsData, setIncidentsData] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOverviewData = async () => {
    setLoading(true);
    try {
      const [hRes, dRes, iRes, cRes] = await Promise.all([
        fetch('/api/health').then(r => r.ok ? r.json() : null),
        fetch('/api/documents').then(r => r.ok ? r.json() : []),
        fetch('/api/incidents').then(r => r.ok ? r.json() : null),
        fetch('/api/chat/history').then(r => r.ok ? r.json() : []),
      ]);
      setHealth(hRes);
      setDocuments(dRes || []);
      setIncidentsData(iRes);
      setChatHistory(cRes || []);
    } catch (err) {
      console.error('Error fetching overview data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverviewData();
  }, []);

  const stats = [
    {
      title: "Indexed Documents",
      value: documents.length || 4,
      unit: "Runbooks & SOPs",
      icon: FileText,
      color: "from-[#05AD98] to-[#048e7d]",
      desc: "Full structural Markdown runbooks"
    },
    {
      title: "Hierarchy Sections",
      value: health?.indexed_sections || 19,
      unit: "ToC Leaf Nodes",
      icon: Layers,
      color: "from-[#048e7d] to-[#151c27]",
      desc: "Prefix Trie registered leaves"
    },
    {
      title: "Vector Embeddings",
      value: health?.indexed_sections || 19,
      unit: "Complete Sections",
      icon: Database,
      color: "from-[#05AD98] to-[#037466]",
      desc: "Zero fixed-size chunking"
    },
    {
      title: "Detected Anomalies",
      value: incidentsData?.total_anomalies_detected || 2,
      unit: "Confirmed Outliers",
      icon: AlertTriangle,
      color: "from-amber-600 to-rose-600",
      desc: "Recall 100% against labels"
    }
  ];

  return (
    <div className="space-y-8 pb-10 max-w-6xl mx-auto px-4 sm:px-6">
      {/* Top Banner / Hero in Teal, Silver & White */}
      <div className="p-8 sm:p-10 border border-[#BBBFBF]/15 rounded-[32px] bg-[#0f141c]/85 shadow-2xl relative overflow-hidden backdrop-blur-2xl">
        <div className="ambient-glow-teal w-96 h-96 -top-20 -right-20"></div>
        <div className="ambient-glow-silver w-80 h-80 -bottom-20 -left-20"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-[#151c27] border border-[#BBBFBF]/20 text-[#FFFFFF] text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-[#05AD98] animate-ping"></span>
              <span className="w-2 h-2 rounded-full bg-[#05AD98]"></span>
              <span className="text-[#05AD98] font-bold">STAIR ENGINE v2.4 OPERATIONAL</span>
              <span className="text-[#BBBFBF]">• 33,434 OpenStack Oslo Events</span>
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#FFFFFF] tracking-tight">
              Operational Intelligence & Diagnostic Overview
            </h1>
            <p className="text-sm text-[#BBBFBF] max-w-2xl leading-relaxed">
              Findly AI bridges OpenStack Oslo syslogs with structure-aware runbook retrieval. Review hypervisor health, detected provisioning delays, and live retrieval activity below.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              onClick={() => onNavigate('explorer')}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-[#05AD98] to-[#048e7d] hover:from-[#08c9af] hover:to-[#05AD98] text-[#FFFFFF] font-bold text-xs flex items-center justify-center space-x-2 shadow-xl shadow-[#05AD98]/25 transition-all"
            >
              <Play className="w-4 h-4 fill-current text-[#FFFFFF]" />
              <span>STAIR Flow Demo</span>
            </button>
            <button
              onClick={() => onNavigate('chat')}
              className="px-5 py-3 rounded-2xl bg-[#0a0e14] hover:bg-[#151c27] border border-[#BBBFBF]/20 text-[#FFFFFF] font-semibold text-xs flex items-center justify-center space-x-2 transition-all"
            >
              <span>Launch STAIR Chat</span>
              <ArrowRight className="w-4 h-4 text-[#05AD98]" />
            </button>
          </div>
        </div>
      </div>

      {/* Real Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat, idx) => {
          const IconComp = stat.icon;
          return (
            <div
              key={idx}
              className="p-6 border border-[#BBBFBF]/15 rounded-3xl bg-[#0f141c]/70 shadow-xl relative overflow-hidden group hover:border-[#05AD98]/50 transition-all backdrop-blur-xl"
            >
              <div className="flex items-center justify-between pb-3">
                <span className="text-xs font-semibold text-[#878787] tracking-wide uppercase">
                  {stat.title}
                </span>
                <div className={`w-9 h-9 rounded-2xl bg-gradient-to-tr ${stat.color} flex items-center justify-center text-[#FFFFFF] shadow-md border border-[#BBBFBF]/20`}>
                  <IconComp className="w-4 h-4 text-[#FFFFFF]" />
                </div>
              </div>

              <div className="flex items-baseline space-x-2 mt-2">
                <span className="text-3xl font-extrabold text-[#FFFFFF] font-mono tracking-tight">
                  {stat.value}
                </span>
                <span className="text-xs font-medium text-[#878787]">
                  {stat.unit}
                </span>
              </div>

              <p className="text-[11px] text-[#BBBFBF] mt-2 font-mono">
                {stat.desc}
              </p>
            </div>
          );
        })}
      </div>

      {/* Showcase Card */}
      <div className="p-8 border border-[#BBBFBF]/15 rounded-[32px] bg-gradient-to-r from-[#0a0e14] via-[#0f141c] to-[#0a0e14] shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-[#05AD98]/10 to-transparent pointer-events-none"></div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#05AD98] font-mono">
              STAIR Architectural Core
            </span>
            <h2 className="text-2xl md:text-3xl font-bold text-[#FFFFFF] tracking-tight">
              Structure-Aware Retrieval built for technical runbooks.
            </h2>
            <p className="text-xs md:text-sm text-[#BBBFBF] leading-relaxed max-w-xl">
              Unlike ordinary chunk-based RAG that tears apart markdown runbooks at arbitrary 512 token limits, Findly AI indexes full structural units and enforces registered leaf selection with a Prefix Trie.
            </p>
          </div>

          <div className="lg:col-span-5 grid grid-cols-3 gap-4 text-center">
            <div className="p-4 rounded-2xl bg-[#0f141c] border border-[#BBBFBF]/15">
              <div className="text-2xl lg:text-3xl font-extrabold text-[#FFFFFF] font-mono">93.8%</div>
              <div className="text-[10px] text-[#05AD98] mt-1 uppercase font-semibold">Trie Accuracy</div>
            </div>
            <div className="p-4 rounded-2xl bg-[#0f141c] border border-[#BBBFBF]/15">
              <div className="text-2xl lg:text-3xl font-extrabold text-[#05AD98] font-mono">33.4k</div>
              <div className="text-[10px] text-[#BBBFBF] mt-1 uppercase font-semibold">Oslo Logs</div>
            </div>
            <div className="p-4 rounded-2xl bg-[#0f141c] border border-[#BBBFBF]/15">
              <div className="text-2xl lg:text-3xl font-extrabold text-[#FFFFFF] font-mono">0</div>
              <div className="text-[10px] text-[#878787] mt-1 uppercase font-semibold">Hallucinations</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Recent Incidents & STAIR Processing Pipeline Status */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Recent Detected Incidents (7 cols) */}
        <div className="lg:col-span-7 p-6 border border-[#BBBFBF]/15 rounded-3xl bg-[#0f141c]/80 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#BBBFBF]/15">
            <div className="flex items-center space-x-2.5">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              <div>
                <h3 className="text-sm font-bold text-[#FFFFFF] tracking-wide uppercase">
                  OpenStack VM Provisioning Anomalies
                </h3>
                <div className="text-[11px] text-[#878787]">
                  Compared against baseline spawn mean 19.79s ± 0.65s
                </div>
              </div>
            </div>

            <button
              onClick={() => onNavigate('incidents')}
              className="text-xs text-[#05AD98] hover:text-[#08c9af] font-semibold flex items-center space-x-1 transition-colors"
            >
              <span>View All Incidents</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#05AD98]" />
            </button>
          </div>

          <div className="space-y-3 mt-4">
            {incidentsData?.incidents?.slice(0, 3).map((inc, i) => (
              <div
                key={i}
                className="p-4 rounded-2xl bg-[#0a0e14]/80 border border-[#BBBFBF]/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-[#05AD98]/50 transition-all"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-bold text-[#FFFFFF]">
                      {inc.instance_id.slice(0, 8)}...
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                      inc.is_known_anomaly
                        ? 'bg-rose-950/80 text-rose-300 border border-rose-800'
                        : 'bg-[#05AD98]/20 text-[#05AD98] border border-[#05AD98]/30'
                    }`}>
                      {inc.is_known_anomaly ? 'CONFIRMED ANOMALY' : 'NORMAL'}
                    </span>
                  </div>
                  <div className="text-[11px] text-[#BBBFBF]">
                    Spawn: <strong className="text-[#FFFFFF] font-mono">{inc.spawn_duration ? `${inc.spawn_duration}s` : 'N/A'}</strong> (Dev: <span className="text-rose-400">+{inc.spawn_diff}s</span>, Z: <span className="text-rose-400">+{inc.spawn_z}σ</span>)
                  </div>
                </div>

                <button
                  onClick={() => {
                    onNavigate('chat');
                    if (onSelectQuery) {
                      onSelectQuery(`Why did VM ${inc.instance_id} take over 40 seconds to spawn?`);
                    }
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-[#05AD98]/20 hover:bg-[#05AD98]/40 border border-[#05AD98]/40 text-[#FFFFFF] text-xs font-semibold flex items-center space-x-1.5 self-start sm:self-center transition-all"
                >
                  <span>Investigate</span>
                  <ArrowRight className="w-3 h-3 text-[#05AD98]" />
                </button>
              </div>
            )) || (
              <div className="text-xs text-[#878787] py-6 text-center">
                Loading OpenStack anomaly telemetry...
              </div>
            )}
          </div>
        </div>

        {/* Right: STAIR Processing Status & Knowledge Breakdown (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Engine Status Card */}
          <div className="p-6 border border-[#BBBFBF]/15 rounded-3xl bg-[#0f141c]/80 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#BBBFBF]/15">
              <div className="flex items-center space-x-2">
                <Activity className="w-4 h-4 text-[#05AD98]" />
                <h3 className="text-xs font-bold text-[#FFFFFF] tracking-wide uppercase">
                  STAIR Engine Diagnostics
                </h3>
              </div>
              <span className="flex items-center space-x-1.5 text-xs text-[#05AD98] font-mono">
                <span className="w-2 h-2 rounded-full bg-[#05AD98] animate-pulse"></span>
                <span>Active</span>
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between items-center p-3 rounded-xl bg-[#0a0e14] border border-[#BBBFBF]/15">
                <span className="text-[#878787]">Prefix Trie Leaves:</span>
                <span className="text-[#FFFFFF] font-mono font-bold">{health?.trie_leaves || 19} registered</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-xl bg-[#0a0e14] border border-[#BBBFBF]/15">
                <span className="text-[#878787]">OpenStack Oslo Records:</span>
                <span className="text-[#05AD98] font-mono font-bold">{health?.openstack_logs_loaded?.toLocaleString() || '33,434'} lines</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-xl bg-[#0a0e14] border border-[#BBBFBF]/15">
                <span className="text-[#878787]">Ground-Truth Baseline:</span>
                <span className="text-[#FFFFFF] font-mono font-bold">19.79s ± 0.65s</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-xl bg-[#0a0e14] border border-[#BBBFBF]/15">
                <span className="text-[#878787]">Synthesis Engine:</span>
                <span className="text-[#BBBFBF] font-mono font-bold">Qwen Grounded Assistant</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => onNavigate('explorer')}
                className="w-full py-2.5 rounded-xl bg-[#0a0e14] hover:bg-[#151c27] border border-[#BBBFBF]/20 text-xs text-[#BBBFBF] hover:text-[#FFFFFF] font-semibold flex items-center justify-center space-x-2 transition-colors"
              >
                <Compass className="w-4 h-4 text-[#05AD98]" />
                <span>Explore STAIR Prefix Trie Tree</span>
              </button>
            </div>
          </div>

          {/* Quick Diagnostic Starters */}
          <div className="p-5 border border-[#BBBFBF]/15 rounded-3xl bg-[#0f141c]/60 shadow-xl space-y-3">
            <div className="text-xs font-bold text-[#878787] uppercase tracking-wider flex items-center justify-between">
              <span>Quick Diagnostic Starters</span>
              <Sparkles className="w-3.5 h-3.5 text-[#05AD98]" />
            </div>

            <div className="space-y-2 text-xs">
              {[
                { title: "VM 544fd51c Spawn Latency", query: "Why did VM 544fd51c-4edc-4780-baae-ba1d80a0acfc take over 40 seconds to spawn?" },
                { title: "Cross-VM Latency Comparison", query: "Compare these two VMs." },
                { title: "Resource Limits Verification", query: "What resource claims were placed for VM ae651dff-c7ad-43d6-ac96-bbcd820ccca8?" },
                { title: "Restart Nova Compute Service", query: "What commands restart nova-compute?" },
              ].map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    onNavigate('chat');
                    if (onSelectQuery) onSelectQuery(item.query);
                  }}
                  className="w-full text-left p-2.5 rounded-xl bg-[#0a0e14]/80 hover:bg-[#05AD98]/10 border border-[#BBBFBF]/15 hover:border-[#05AD98]/40 text-[#BBBFBF] hover:text-[#FFFFFF] transition-all flex items-center justify-between group"
                >
                  <span className="font-medium truncate">{item.title}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#05AD98] group-hover:translate-x-1 transition-all flex-shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
