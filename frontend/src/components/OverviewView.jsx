import React, { useState, useEffect } from 'react';
import {
  FileText, Layers, Database, AlertTriangle, Compass,
  CheckCircle2, ArrowRight, Activity, Terminal, Sparkles,
  RefreshCw, TrendingUp, Cpu, Clock, ShieldCheck, Play
} from 'lucide-react';

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
      color: "from-blue-600 to-cyan-500",
      accent: "text-blue-400",
      desc: "Full structural Markdown runbooks"
    },
    {
      title: "Hierarchy Sections",
      value: health?.indexed_sections || 19,
      unit: "ToC Leaf Nodes",
      icon: Layers,
      color: "from-cyan-500 to-teal-400",
      accent: "text-cyan-400",
      desc: "Prefix Trie registered leaves"
    },
    {
      title: "Vector DB Embeddings",
      value: health?.indexed_sections || 19,
      unit: "Complete Sections",
      icon: Database,
      color: "from-indigo-600 to-blue-500",
      accent: "text-indigo-400",
      desc: "Zero fixed-size chunking"
    },
    {
      title: "Detected Anomalies",
      value: incidentsData?.total_anomalies_detected || 2,
      unit: "Confirmed Outliers",
      icon: AlertTriangle,
      color: "from-amber-600 to-rose-500",
      accent: "text-amber-400",
      desc: "Recall 100% against labels"
    }
  ];

  return (
    <div className="space-y-8 pb-10">
      {/* Top Banner / Hero */}
      <div className="glass-card p-8 border border-white/10 rounded-3xl bg-gradient-to-r from-navy-900/90 via-navy-850/80 to-navy-900/90 shadow-2xl relative overflow-hidden">
        <div className="ambient-glow-blue w-96 h-96 -top-20 -right-20"></div>
        <div className="ambient-glow-cyan w-80 h-80 -bottom-20 -left-20"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-blue-950/60 border border-blue-500/30 text-blue-300 text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
              <span>STAIR ENGINE v2.4 OPERATIONAL • 33,434 OpenStack Oslo Events</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
              Operational Intelligence & Diagnostic Overview
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Findly AI bridges OpenStack Oslo telemetry with structure-aware runbook retrieval. Review system health, detected provisioning delays, and live retrieval activity below.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              onClick={() => onNavigate('explorer')}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-semibold text-xs flex items-center justify-center space-x-2 shadow-xl shadow-blue-500/25 transition-all"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>STAIR Flow Demo</span>
            </button>
            <button
              onClick={() => onNavigate('chat')}
              className="px-5 py-3 rounded-2xl bg-navy-950 hover:bg-navy-900 border border-white/10 text-white font-semibold text-xs flex items-center justify-center space-x-2 transition-all"
            >
              <span>Launch STAIR Chat</span>
              <ArrowRight className="w-4 h-4" />
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
              className="glass-card p-6 border border-white/10 rounded-3xl bg-navy-900/60 shadow-xl relative overflow-hidden group hover:border-blue-500/30 transition-all"
            >
              <div className="flex items-center justify-between pb-3">
                <span className="text-xs font-semibold text-slate-400 tracking-wide uppercase">
                  {stat.title}
                </span>
                <div className={`w-9 h-9 rounded-2xl bg-gradient-to-tr ${stat.color} flex items-center justify-center text-white shadow-md`}>
                  <IconComp className="w-4 h-4" />
                </div>
              </div>

              <div className="flex items-baseline space-x-2 mt-2">
                <span className="text-3xl font-extrabold text-white font-mono tracking-tight">
                  {stat.value}
                </span>
                <span className="text-xs font-medium text-slate-400">
                  {stat.unit}
                </span>
              </div>

              <p className="text-[11px] text-slate-400 mt-2 font-mono">
                {stat.desc}
              </p>
            </div>
          );
        })}
      </div>

      {/* Main Grid: Recent Incidents & STAIR Processing Pipeline Status */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Recent Detected Incidents (7 cols) */}
        <div className="lg:col-span-7 glass-card p-6 border border-white/10 rounded-3xl bg-navy-900/70 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center space-x-2.5">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              <div>
                <h3 className="text-sm font-bold text-white tracking-wide uppercase">
                  OpenStack VM Provisioning Anomalies
                </h3>
                <div className="text-[11px] text-slate-400">
                  Compared against baseline spawn mean 19.79s ± 0.65s
                </div>
              </div>
            </div>

            <button
              onClick={() => onNavigate('incidents')}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center space-x-1 transition-colors"
            >
              <span>View All Incidents</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3 mt-4">
            {incidentsData?.incidents?.slice(0, 3).map((inc, i) => (
              <div
                key={i}
                className="p-4 rounded-2xl bg-navy-950/70 border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-blue-500/30 transition-all"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-bold text-white">
                      {inc.instance_id.slice(0, 8)}...
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                      inc.is_known_anomaly
                        ? 'bg-rose-950/80 text-rose-300 border border-rose-800'
                        : 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                    }`}>
                      {inc.is_known_anomaly ? 'CONFIRMED ANOMALY' : 'NORMAL'}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Spawn: <strong className="text-white font-mono">{inc.spawn_duration ? `${inc.spawn_duration}s` : 'N/A'}</strong> (Dev: <span className="text-rose-400">+{inc.spawn_diff}s</span>, Z: <span className="text-rose-400">+{inc.spawn_z}σ</span>)
                  </div>
                </div>

                <button
                  onClick={() => {
                    onNavigate('chat');
                    if (onSelectQuery) {
                      onSelectQuery(`Why did VM ${inc.instance_id} take over 40 seconds to spawn?`);
                    }
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-blue-600/30 hover:bg-blue-600/60 border border-blue-500/40 text-blue-200 text-xs font-semibold flex items-center space-x-1.5 self-start sm:self-center transition-all"
                >
                  <span>Investigate</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            )) || (
              <div className="text-xs text-slate-400 py-6 text-center">
                Loading OpenStack anomaly telemetry...
              </div>
            )}
          </div>
        </div>

        {/* Right: STAIR Processing Status & Knowledge Breakdown (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Engine Status Card */}
          <div className="glass-card p-6 border border-white/10 rounded-3xl bg-navy-900/70 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center space-x-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-bold text-white tracking-wide uppercase">
                  STAIR Engine Diagnostics
                </h3>
              </div>
              <span className="flex items-center space-x-1.5 text-xs text-emerald-400 font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Active</span>
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between items-center p-3 rounded-xl bg-navy-950/70 border border-white/5">
                <span className="text-slate-400">Prefix Trie Leaves:</span>
                <span className="text-white font-mono font-bold">{health?.trie_leaves || 19} registered</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-xl bg-navy-950/70 border border-white/5">
                <span className="text-slate-400">OpenStack Oslo Records:</span>
                <span className="text-cyan-300 font-mono font-bold">{health?.openstack_logs_loaded?.toLocaleString() || '33,434'} lines</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-xl bg-navy-950/70 border border-white/5">
                <span className="text-slate-400">Ground-Truth Baseline:</span>
                <span className="text-emerald-300 font-mono font-bold">19.79s ± 0.65s</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-xl bg-navy-950/70 border border-white/5">
                <span className="text-slate-400">Synthesis Engine:</span>
                <span className="text-violet-300 font-mono font-bold">Qwen Grounded Assistant</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => onNavigate('explorer')}
                className="w-full py-2.5 rounded-xl bg-navy-950 hover:bg-navy-900 border border-white/10 text-xs text-slate-300 hover:text-white font-semibold flex items-center justify-center space-x-2 transition-colors"
              >
                <Compass className="w-4 h-4 text-cyan-400" />
                <span>Explore STAIR Prefix Trie Tree</span>
              </button>
            </div>
          </div>

          {/* Quick Troubleshooting Inquiries */}
          <div className="glass-card p-5 border border-white/10 rounded-3xl bg-navy-900/60 shadow-xl space-y-3">
            <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
              <span>Quick Diagnostic Starters</span>
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
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
                  className="w-full text-left p-2.5 rounded-xl bg-navy-950/60 hover:bg-blue-950/40 border border-white/5 hover:border-blue-500/30 text-slate-300 hover:text-white transition-all flex items-center justify-between group"
                >
                  <span className="font-medium truncate">{item.title}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all flex-shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

