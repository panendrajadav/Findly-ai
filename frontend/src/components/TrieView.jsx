import React, { useState, useEffect } from 'react';
import { GitBranch, Folder, FileCode, CheckCircle2, Search, RefreshCw, Layers, Compass, ArrowRight } from 'lucide-react';

export default function StairExplorerView() {
  const [trieData, setTrieData] = useState(null);
  const [leaves, setLeaves] = useState([]);
  const [filterPrefix, setFilterPrefix] = useState('');
  const [loading, setLoading] = useState(true);

  // Query-to-Leaf Simulator state
  const [simQuery, setSimQuery] = useState('');
  const [simResult, setSimResult] = useState(null);
  const [simLoading, setSimLoading] = useState(false);

  const fetchTrieData = () => {
    setLoading(true);
    Promise.all([
      fetch('/api/stair/trie').then(r => {
        if (!r.ok) throw new Error('Trie API error');
        return r.json();
      }),
      fetch('/api/stair/leaves').then(r => {
        if (!r.ok) throw new Error('Leaves API error');
        return r.json();
      })
    ])
      .then(([tData, lData]) => {
        setTrieData(tData);
        setLeaves(Array.isArray(lData) ? lData : []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchTrieData();
  }, []);

  const handleSimulateRouting = (e) => {
    e.preventDefault();
    if (!simQuery.trim()) return;

    setSimLoading(true);
    fetch('/api/stair/retrieve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: simQuery })
    })
      .then(r => r.json())
      .then(d => {
        setSimResult(d);
        setSimLoading(false);
      })
      .catch(err => {
        console.error(err);
        setSimLoading(false);
      });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-80 text-slate-400 space-y-3">
        <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin"></div>
        <span className="text-sm font-medium">Traversing custom STAIR Prefix Trie and hierarchical ToC...</span>
      </div>
    );
  }

  const filteredLeaves = (Array.isArray(leaves) ? leaves : []).filter(l =>
    (l.path || '').toLowerCase().includes(filterPrefix.toLowerCase()) ||
    (l.segment || '').toLowerCase().includes(filterPrefix.toLowerCase())
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto py-2">
      {/* Overview Card */}
      <div className="glass-card p-8 border border-white/10 shadow-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-[#0a0e16]/80 rounded-3xl">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center">
            <Compass className="w-6 h-6 mr-3 text-emerald-400" />
            STAIR Explorer: Hierarchical ToC & Prefix Trie
          </h3>
          <p className="text-xs md:text-sm text-slate-400 mt-2 max-w-2xl leading-relaxed">
            STAIR (arXiv:2609.03874) incorporates the full operational Table of Contents as retrieval context. Candidate decoding is strictly constrained by a custom Prefix Trie, mathematically preventing hallucinated section predictions.
          </p>
        </div>

        <div className="flex items-center space-x-3 text-xs flex-shrink-0">
          <div className="px-5 py-2.5 rounded-full bg-[#10141f] border border-emerald-500/30 text-emerald-300 flex items-center shadow-lg">
            <Layers className="w-4 h-4 mr-2 text-emerald-400" />
            <span>Registered Valid Leaves: <strong>{trieData?.total_leaves || leaves.length}</strong></span>
          </div>
          <button
            onClick={fetchTrieData}
            className="text-xs text-slate-400 hover:text-white bg-[#10141f] px-4 py-2.5 rounded-full border border-white/10"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Query-to-Leaf Routing Simulator */}
      <div className="glass-card p-6 border border-white/10 shadow-xl bg-[#0a0e16]/80 space-y-5 rounded-3xl">
        <div>
          <h4 className="text-sm font-bold text-white flex items-center">
            <GitBranch className="w-4 h-4 mr-2 text-emerald-400" />
            Query-to-Leaf Routing Simulator
          </h4>
          <p className="text-xs text-slate-400 mt-1">
            Test how STAIR evaluates an input query against the Trie and projects it strictly into a registered valid leaf node.
          </p>
        </div>

        <form onSubmit={handleSimulateRouting} className="flex gap-3">
          <input
            type="text"
            value={simQuery}
            onChange={(e) => setSimQuery(e.target.value)}
            placeholder="Enter operational query (e.g. 'Spawn latency restart compute', 'PKI Fernet token expired keystone')..."
            className="flex-1 bg-[#06080d] border border-white/10 rounded-full px-5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
          <button
            type="submit"
            disabled={simLoading || !simQuery.trim()}
            className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-black px-6 py-2.5 rounded-full text-xs font-bold flex items-center transition-all shadow-lg shadow-emerald-500/25"
          >
            {simLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin mr-2" /> : <ArrowRight className="w-3.5 h-3.5 mr-2" />}
            Simulate Routing
          </button>
        </form>

        {simResult && (
          <div className="p-5 rounded-2xl bg-[#06080d] border border-white/5 space-y-3 text-xs animate-fadeIn">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-1 pb-2.5 border-b border-white/5">
              <span className="text-slate-400">Trie Projected Leaf:</span>
              <span className="font-mono text-emerald-400 font-bold bg-emerald-950/40 px-3 py-1 rounded-full border border-emerald-800/60">
                {simResult.leaf_title}
              </span>
            </div>
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-slate-500">Hierarchy Path:</span>
              <span className="font-mono text-emerald-300 font-medium">{simResult.hierarchy_path}</span>
            </div>
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-slate-500">Similarity Confidence Score:</span>
              <span className="font-mono text-white">{simResult.score}</span>
            </div>
            {simResult.candidate_paths && simResult.candidate_paths.length > 0 && (
              <div className="pt-2">
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Candidate Leaf Paths Evaluated:</span>
                <div className="mt-1.5 space-y-1.5">
                  {simResult.candidate_paths.map((c, i) => (
                    <div key={i} className="flex justify-between text-[11px] font-mono text-slate-400 bg-black/40 px-3 py-1.5 rounded-xl">
                      <span className="truncate max-w-md">{c.path}</span>
                      <span className="text-emerald-400 font-semibold">{c.score}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Search Input for Leaves */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-500 absolute left-4 top-3.5" />
        <input
          type="text"
          value={filterPrefix}
          onChange={(e) => setFilterPrefix(e.target.value)}
          placeholder="Filter Trie registered paths (e.g., 'Nova Compute', 'Spawn', 'Claims', 'Token')..."
          className="w-full bg-[#0a0e16]/80 border border-white/10 rounded-full pl-11 pr-5 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 shadow-inner"
        />
      </div>

      {/* Leaves Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredLeaves.map((leaf, idx) => (
          <div
            key={idx}
            className="glass-card p-5 border border-white/5 hover:border-emerald-500/50 transition-all rounded-2xl shadow-lg space-y-3 bg-[#0a0e16]/80"
          >
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-emerald-300 flex items-center">
                <FileCode className="w-4 h-4 mr-2 text-emerald-400 flex-shrink-0" />
                <span className="truncate">{leaf.segment}</span>
              </span>
              <span className="bg-emerald-950/80 text-emerald-300 border border-emerald-800 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold flex-shrink-0">
                VALID LEAF
              </span>
            </div>

            <div className="text-[11px] font-mono text-slate-300 bg-[#06080d] p-3.5 rounded-xl border border-white/5 break-all select-all leading-relaxed">
              {leaf.path}
            </div>

            {leaf.metadata?.title && (
              <div className="text-[11px] text-slate-400 flex justify-between items-center pt-1.5 border-t border-white/5">
                <span>Runbook: <span className="text-slate-200 font-medium">{leaf.metadata.title}</span></span>
                <span className="text-[10px] text-slate-500 font-mono">{leaf.section_id}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
