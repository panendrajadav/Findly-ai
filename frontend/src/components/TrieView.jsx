import React, { useState, useEffect } from 'react';
import {
  GitBranch, Folder, FileCode, CheckCircle2, Search,
  RefreshCw, Layers, Compass, ArrowRight, Play, Database,
  Sparkles, Check
} from 'lucide-react';
import StairInteractiveVisualizer from './StairInteractiveVisualizer';

export default function StairExplorerView({ onSelectQuery }) {
  const [activeSubTab, setActiveSubTab] = useState('visualizer'); // 'visualizer' | 'trie'
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

  const filteredLeaves = (Array.isArray(leaves) ? leaves : []).filter(l =>
    (l.path || '').toLowerCase().includes(filterPrefix.toLowerCase()) ||
    (l.segment || '').toLowerCase().includes(filterPrefix.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-2">
      {/* Sub-Navigation Switcher (Visualizer vs Trie Registry) */}
      <div className="flex items-center justify-between pb-2 border-b border-white/10">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveSubTab('visualizer')}
            className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center space-x-2 ${
              activeSubTab === 'visualizer'
                ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-500/25'
                : 'text-slate-400 hover:text-white bg-navy-950/60 hover:bg-navy-900 border border-white/5'
            }`}
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Interactive STAIR Demonstration</span>
          </button>

          <button
            onClick={() => setActiveSubTab('trie')}
            className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center space-x-2 ${
              activeSubTab === 'trie'
                ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-500/25'
                : 'text-slate-400 hover:text-white bg-navy-950/60 hover:bg-navy-900 border border-white/5'
            }`}
          >
            <GitBranch className="w-3.5 h-3.5" />
            <span>Prefix Trie Registry & Simulator</span>
          </button>
        </div>

        <div className="text-xs text-slate-400 font-mono hidden md:flex items-center space-x-2">
          <Layers className="w-3.5 h-3.5 text-cyan-400" />
          <span>{leaves.length || 19} Valid Registered Leaf Paths</span>
        </div>
      </div>

      {/* View 1: Interactive STAIR Architecture Demonstration */}
      {activeSubTab === 'visualizer' && (
        <StairInteractiveVisualizer onSelectQuery={onSelectQuery} />
      )}

      {/* View 2: Live Prefix Trie Registry & Routing Simulator */}
      {activeSubTab === 'trie' && (
        <div className="space-y-6">
          {/* Query-to-Leaf Routing Simulator */}
          <div className="glass-card p-6 border border-white/10 shadow-xl bg-navy-900/80 space-y-4 rounded-3xl">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center">
                  <GitBranch className="w-4 h-4 mr-2 text-cyan-400" />
                  Query-to-Leaf Routing Simulator
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  Input a query to evaluate how STAIR evaluates path embeddings against the Prefix Trie to project it strictly into a registered valid leaf node.
                </p>
              </div>

              <button
                onClick={fetchTrieData}
                title="Reload Trie structure"
                className="p-2 rounded-xl bg-navy-950 hover:bg-navy-900 border border-white/10 text-slate-400 hover:text-white transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            <form onSubmit={handleSimulateRouting} className="flex gap-3">
              <input
                type="text"
                value={simQuery}
                onChange={(e) => setSimQuery(e.target.value)}
                placeholder="Enter operational query (e.g. 'Spawn latency restart compute', 'claims bottleneck memory')..."
                className="flex-1 bg-navy-950 border border-white/10 rounded-2xl px-5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
              />
              <button
                type="submit"
                disabled={simLoading || !simQuery.trim()}
                className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white px-6 py-2.5 rounded-2xl text-xs font-bold flex items-center transition-all shadow-lg shadow-blue-500/25 flex-shrink-0"
              >
                {simLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin mr-2" /> : <ArrowRight className="w-3.5 h-3.5 mr-2" />}
                Simulate Routing
              </button>
            </form>

            {simResult && (
              <div className="p-5 rounded-2xl bg-navy-950 border border-white/10 space-y-3 text-xs">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-1 pb-2.5 border-b border-white/10">
                  <span className="text-slate-400">Trie Projected Leaf:</span>
                  <span className="font-mono text-cyan-300 font-bold bg-cyan-950/60 px-3 py-1 rounded-full border border-cyan-800">
                    {simResult.leaf_title}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-400">Validated Hierarchy Path:</span>
                  <span className="font-mono text-blue-300 font-medium">{simResult.hierarchy_path}</span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-400">Similarity Confidence:</span>
                  <span className="font-mono text-white">{simResult.score}</span>
                </div>
                {simResult.candidate_paths && simResult.candidate_paths.length > 0 && (
                  <div className="pt-2">
                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Candidate Leaf Paths Evaluated:</span>
                    <div className="mt-1.5 space-y-1.5">
                      {simResult.candidate_paths.map((c, i) => (
                        <div key={i} className="flex justify-between text-[11px] font-mono text-slate-400 bg-navy-900/60 px-3 py-1.5 rounded-xl border border-white/5">
                          <span className="truncate max-w-md">{c.path}</span>
                          <span className="text-cyan-400 font-semibold">{c.score}</span>
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
              placeholder="Filter Trie registered paths (e.g., 'Nova Compute', 'Spawn', 'Claims')..."
              className="w-full bg-navy-900/80 border border-white/10 rounded-2xl pl-11 pr-5 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 shadow-inner"
            />
          </div>

          {/* Leaves Card Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredLeaves.map((leaf, idx) => (
              <div
                key={idx}
                className="glass-card p-5 border border-white/10 hover:border-blue-500/40 transition-all rounded-3xl shadow-lg space-y-3 bg-navy-900/70"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-cyan-300 flex items-center">
                    <FileCode className="w-4 h-4 mr-2 text-cyan-400 flex-shrink-0" />
                    <span className="truncate">{leaf.segment}</span>
                  </span>
                  <span className="bg-blue-950/80 text-blue-300 border border-blue-800 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold flex-shrink-0">
                    VALID LEAF
                  </span>
                </div>

                <div className="text-[11px] font-mono text-slate-300 bg-navy-950 p-3.5 rounded-2xl border border-white/5 break-all select-all leading-relaxed">
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
      )}
    </div>
  );
}
