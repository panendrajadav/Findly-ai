import React from 'react';
import { 
  ArrowRight, ShieldCheck, Layers, GitBranch, Terminal, 
  Sparkles, CheckCircle2, Play, Activity, Clock, Cpu, FileText
} from 'lucide-react';
import FindlyLogo from './FindlyLogo';

export default function IntroductionView({ onGetStarted, onExploreTour }) {
  const pillars = [
    {
      title: "Structure-Aware Retrieval (STAIR)",
      desc: "Extracts hierarchical Table of Contents trees and indivisible operational procedures, avoiding arbitrary fixed-size chunking.",
      icon: Layers,
      highlight: "Zero chunk fragmentation"
    },
    {
      title: "Prefix Trie Constrained Decoding",
      desc: "Registers valid hierarchy paths into a Prefix Trie, strictly constraining retrieval to authentic company runbook procedures.",
      icon: GitBranch,
      highlight: "100% registered leaves"
    },
    {
      title: "Strict Telemetry Isolation",
      desc: "Correlates exact OpenStack Oslo syslog line numbers strictly by instance UUID, completely eliminating cross-VM telemetry bleed.",
      icon: ShieldCheck,
      highlight: "Zero cross-VM bleed"
    },
    {
      title: "Human-in-the-Loop Operator Gate",
      desc: "Categorizes operational risk (HIGH, MEDIUM, LOW) and enforces explicit DevOps authorization before executing remediation commands.",
      icon: Terminal,
      highlight: "Operator authorized"
    }
  ];

  const metrics = [
    { label: "Oslo Syslog Events", value: "33,434", desc: "OpenStack Nova & Glance telemetry" },
    { label: "Prefix Trie Leaves", value: "19", desc: "Registered procedural leaf nodes" },
    { label: "Anomaly Recall", value: "100%", desc: "Verified against labeled ground truth" },
    { label: "Normal Baseline", value: "19.79s ± 0.65s", desc: "Hypervisor spawn duration mean" }
  ];

  return (
    <div className="relative min-h-[calc(100vh-100px)] flex flex-col justify-between max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-12">
      {/* Background Ambient Glows */}
      <div className="ambient-glow-green w-[550px] h-[550px] -top-32 -left-32"></div>
      <div className="ambient-glow-yellow w-[450px] h-[450px] top-1/2 -right-32"></div>
      <div className="ambient-glow-ivory w-[400px] h-[400px] bottom-0 left-1/3"></div>

      {/* Main Hero Container */}
      <div className="relative z-10 flex flex-col items-center text-center space-y-8 max-w-4xl mx-auto">
        {/* Top Floating Badge */}
        <div className="inline-flex items-center space-x-2.5 px-4 py-1.5 rounded-full bg-[#0d2015] border border-[#009B4D]/40 text-[#FAF5E9] text-xs font-mono shadow-lg shadow-black/40">
          <span className="w-2 h-2 rounded-full bg-[#009B4D] animate-ping"></span>
          <span className="w-2 h-2 rounded-full bg-[#009B4D]"></span>
          <span className="font-semibold tracking-wide text-brand-ivory">
            STAIR ENGINE v2.4 • OPENSTACK TELEMETRY GROUND TRUTH
          </span>
        </div>

        {/* Brand Icon Centerpiece */}
        <div className="relative group cursor-pointer" onClick={onGetStarted}>
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-[#009B4D] via-[#008240] to-[#0d2015] p-0.5 shadow-[0_0_50px_rgba(0,155,77,0.35)] flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
            <FindlyLogo size={72} />
          </div>
          <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#FFCC00] rounded-full border-3 border-[#050d08] flex items-center justify-center shadow-md">
            <span className="w-2 h-2 rounded-full bg-[#050d08]"></span>
          </span>
        </div>

        {/* Hero Headlines */}
        <div className="space-y-4">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#FAF5E9] tracking-tight leading-[1.15]">
            Precision DevOps Intelligence with{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#009B4D] via-[#00b85b] to-[#FFCC00]">
              Structure-Aware RAG
            </span>
          </h1>

          <p className="text-base sm:text-lg text-[#FAF5E9]/80 max-w-2xl mx-auto leading-relaxed">
            Findly AI bridges technical runbooks and OpenStack operational syslogs. Extract document hierarchies, constrain retrieval with a Prefix Trie, and resolve incidents with complete procedural integrity.
          </p>
        </div>

        {/* Primary Call to Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2 w-full sm:w-auto">
          <button
            onClick={onGetStarted}
            className="w-full sm:w-auto px-8 py-4 rounded-full bg-gradient-to-r from-[#009B4D] to-[#008240] hover:from-[#00b85b] hover:to-[#009B4D] text-[#FAF5E9] font-bold text-sm sm:text-base flex items-center justify-center space-x-3 shadow-xl shadow-[#009B4D]/30 transition-all duration-200 hover:scale-105 group"
          >
            <span>Get Started</span>
            <ArrowRight className="w-5 h-5 text-[#FFCC00] group-hover:translate-x-1 transition-transform" />
          </button>

          <button
            onClick={onExploreTour}
            className="w-full sm:w-auto px-7 py-4 rounded-full bg-[#0d2015]/80 hover:bg-[#12291c] border border-[#009B4D]/30 text-[#FAF5E9] font-semibold text-sm sm:text-base flex items-center justify-center space-x-2 transition-all duration-200"
          >
            <Play className="w-4 h-4 text-[#FFCC00] fill-current" />
            <span>Interactive STAIR Tour</span>
          </button>
        </div>
      </div>

      {/* Live Telemetry Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-16 relative z-10">
        {metrics.map((m, idx) => (
          <div
            key={idx}
            className="p-5 rounded-3xl bg-[#09160e]/90 border border-[#009B4D]/20 shadow-xl backdrop-blur-xl space-y-1 text-center"
          >
            <div className="text-2xl sm:text-3xl font-extrabold text-[#FAF5E9] font-mono">
              {m.value}
            </div>
            <div className="text-xs font-bold text-[#FFCC00] uppercase tracking-wider">
              {m.label}
            </div>
            <div className="text-[11px] text-[#FAF5E9]/60">
              {m.desc}
            </div>
          </div>
        ))}
      </div>

      {/* 4 Architectural Pillars (Bento Style) */}
      <div className="mt-16 relative z-10 space-y-6">
        <div className="text-center space-y-2">
          <div className="text-xs font-bold uppercase tracking-wider text-[#FFCC00] font-mono">
            Core Technical Innovations
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#FAF5E9] tracking-tight">
            How Findly Outperforms Ordinary Chunking
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {pillars.map((p, idx) => {
            const IconComp = p.icon;
            return (
              <div
                key={idx}
                className="p-6 rounded-3xl bg-[#09160e]/80 border border-[#009B4D]/25 hover:border-[#009B4D]/50 shadow-xl transition-all duration-200 space-y-3 group"
              >
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-[#0d2015] border border-[#009B4D]/40 flex items-center justify-center text-[#009B4D] group-hover:text-[#FFCC00] transition-colors shadow-inner">
                    <IconComp className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] font-mono font-bold px-3 py-1 rounded-full bg-[#0d2015] text-[#FFCC00] border border-[#FFCC00]/30">
                    {p.highlight}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-[#FAF5E9] tracking-tight">
                  {p.title}
                </h3>
                <p className="text-xs sm:text-sm text-[#FAF5E9]/75 leading-relaxed">
                  {p.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Ready to troubleshoot banner */}
      <div className="mt-16 p-8 rounded-3xl bg-gradient-to-r from-[#009B4D]/20 via-[#0d2015] to-[#FFCC00]/10 border border-[#009B4D]/30 shadow-2xl relative z-10 flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
        <div className="space-y-1">
          <h3 className="text-xl font-bold text-[#FAF5E9]">
            Ready to troubleshoot your infrastructure?
          </h3>
          <p className="text-xs sm:text-sm text-[#FAF5E9]/70">
            Open the STAIR Chat workspace to query logs, inspect anomalies, or retrieve operational runbooks.
          </p>
        </div>
        <button
          onClick={onGetStarted}
          className="px-6 py-3 rounded-full bg-[#009B4D] hover:bg-[#00b85b] text-[#FAF5E9] font-bold text-xs sm:text-sm flex items-center space-x-2 shadow-lg shadow-[#009B4D]/30 transition-all flex-shrink-0"
        >
          <span>Enter Workspace</span>
          <ArrowRight className="w-4 h-4 text-[#FFCC00]" />
        </button>
      </div>
    </div>
  );
}

