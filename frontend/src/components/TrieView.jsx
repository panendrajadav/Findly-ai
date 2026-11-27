import React, { useState, useEffect } from 'react';
import {
  GitBranch, Folder, FileCode, CheckCircle2, Search,
  RefreshCw, Layers, Compass, ArrowRight, Play, Database,
  Sparkles, Check
} from 'lucide-react';
import StairInteractiveVisualizer from './StairInteractiveVisualizer';
import FindlyLogo from './FindlyLogo';

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
    <div className="space-y-6 max-w-6xl mx-auto px-4 sm:px-6 py-2">
      {/* Sub-Navigation Switcher (Visualizer vs Trie Registry) */}
      <div className="flex items-center justify-between pb-2 border-b border-[#BBBFBF]/15">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveSubTab('visualizer')}
            className={`px-5 py-2.5 rounded-full text-xs font-semibold transition-all flex items-center space-x-2 ${
              activeSubTab === 'visualizer'
                ? 'bg-[#05AD98] text-[#FFFFFF] shadow-lg shadow-[#05AD98]/25'
                : 'text-[#BBBFBF] hover:text-[#FFFFFF] bg-[#0f141c] hover:bg-[#151c27] border border-[#BBBFBF]/15'
            }`}
          >
            <Play className="w-3.5 h-3.5 fill-current text-[#FFFFFF]" />
            <span>Interactive STAIR Demonstration</span>
          </button>

          <button
            onClick={() => setActiveSubTab('trie')}
            className={`px-5 py-2.5 rounded-full text-xs font-semibold transition-all flex items-center space-x-2 ${
              activeSubTab === 'trie'
                ? 'bg-[#05AD98] text-[#FFFFFF] shadow-lg shadow-[#05AD98]/25'
                : 'text-[#BBBFBF] hover:text-[#FFFFFF] bg-[#0f141c] hover:bg-[#151c27] border border-[#BBBFBF]/15'
            }`}
          >
            <GitBranch className="w-3.5 h-3.5 text-[#05AD98]" />
            <span>Prefix Trie Registry & Simulator</span>
          </button>
        </div>

        <div className="text-xs text-[#878787] font-mono hidden md:flex items-center space-x-2">
          <Layers className="w-3.5 h-3.5 text-[#05AD98]" />
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
          <div className="p-6 border border-[#BBBFBF]/15 shadow-xl bg-[#0f141c]/90 space-y-4 rounded-3xl">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="text-sm font-bold text-[#FFFFFF] flex items-center">
                  <GitBranch className="w-4 h-4 mr-2 text-[#05AD98]" />
                  Query-to-Leaf Routing Simulator
                </h4>
                <p className="text-xs text-[#BBBFBF] mt-1">
                  Input a query to evaluate how STAIR calculates path embeddings against the Prefix Trie to project it strictly into a registered valid leaf node.
                </p>
              </div>

              <button
                onClick={fetchTrieData}
                title="Reload Trie structure"
                className="p-2 rounded-xl bg-[#0a0e14] hover:bg-[#151c27] border border-[#BBBFBF]/15 text-[#BBBFBF] hover:text-[#FFFFFF] transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5 text-[#05AD98]" />
              </button>
            </div>

            <form onSubmit={handleSimulateRouting} className="flex gap-3">
              <input
                type="text"
                value={simQuery}
                onChange={(e) => setSimQuery(e.target.value)}
                placeholder="Enter operational query (e.g. 'Spawn latency restart compute', 'claims bottleneck memory')..."
                className="flex-1 bg-[#0a0e14] border border-[#BBBFBF]/20 rounded-2xl px-5 py-2.5 text-xs text-[#FFFFFF] placeholder-[#878787] focus:outline-none focus:border-[#05AD98] font-mono"
              />
              <button
                type="submit"
                disabled={simLoading || !simQuery.trim()}
                className="bg-[#05AD98] hover:bg-[#049683] disabled:opacity-40 text-[#FFFFFF] px-6 py-2.5 rounded-2xl text-xs font-bold flex items-center transition-all shadow-lg shadow-[#05AD98]/25 flex-shrink-0"
              >
                {simLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin mr-2" /> : <ArrowRight className="w-3.5 h-3.5 mr-2 text-[#FFFFFF]" />}
                Simulate Routing
              </button>
            </form>

            {simResult && (
              <div className="p-5 rounded-2xl bg-[#0a0e14] border border-[#BBBFBF]/15 space-y-3 text-xs">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-1 pb-2.5 border-b border-[#BBBFBF]/15">
                  <span className="text-[#BBBFBF]">Trie Projected Leaf:</span>
                  <span className="font-mono text-[#05AD98] font-bold bg-[#05AD98]/10 px-3 py-1 rounded-full border border-[#05AD98]/30">
                    {simResult.leaf_title}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-[#BBBFBF]">Validated Hierarchy Path:</span>
                  <span className="font-mono text-[#FFFFFF] font-medium">{simResult.hierarchy_path}</span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-[#BBBFBF]">Similarity Confidence:</span>
                  <span className="font-mono text-[#05AD98] font-semibold">{simResult.score}</span>
                </div>
                {simResult.candidate_paths && simResult.candidate_paths.length > 0 && (
                  <div className="pt-2">
                    <span className="text-[10px] text-[#878787] uppercase font-bold tracking-wider">Candidate Leaf Paths Evaluated:</span>
                    <div className="mt-1.5 space-y-1.5">
                      {simResult.candidate_paths.map((c, i) => (
                        <div key={i} className="flex justify-between text-[11px] font-mono text-[#BBBFBF] bg-[#0f141c] px-3 py-1.5 rounded-xl border border-[#BBBFBF]/10">
                          <span className="truncate max-w-md">{c.path}</span>
                          <span className="text-[#05AD98] font-semibold">{c.score}</span>
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
            <Search className="w-4 h-4 text-[#878787] absolute left-4 top-3.5" />
            <input
              type="text"
              value={filterPrefix}
              onChange={(e) => setFilterPrefix(e.target.value)}
              placeholder="Filter Trie registered paths (e.g., 'Nova Compute', 'Spawn', 'Claims')..."
              className="w-full bg-[#0f141c]/90 border border-[#BBBFBF]/15 rounded-2xl pl-11 pr-5 py-3 text-xs text-[#FFFFFF] placeholder-[#878787] focus:outline-none focus:border-[#05AD98] shadow-inner"
            />
          </div>

          {/* Leaves Card Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredLeaves.map((leaf, idx) => (
              <div
                key={idx}
                className="p-5 border border-[#BBBFBF]/15 hover:border-[#05AD98]/50 transition-all rounded-3xl shadow-lg space-y-3 bg-[#0f141c]/90"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#05AD98] flex items-center">
                    <FileCode className="w-4 h-4 mr-2 text-[#05AD98] flex-shrink-0" />
                    <span className="truncate text-[#FFFFFF]">{leaf.segment}</span>
                  </span>
                  <span className="bg-[#05AD98]/10 text-[#05AD98] border border-[#05AD98]/30 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold flex-shrink-0">
                    VALID LEAF
                  </span>
                </div>

                <div className="text-[11px] font-mono text-[#BBBFBF] bg-[#0a0e14] p-3.5 rounded-2xl border border-[#BBBFBF]/10 break-all select-all leading-relaxed">
                  {leaf.path}
                </div>

                {leaf.metadata?.title && (
                  <div className="text-[11px] text-[#878787] flex justify-between items-center pt-1.5 border-t border-[#BBBFBF]/10">
                    <span>Runbook: <span className="text-[#BBBFBF] font-medium">{leaf.metadata.title}</span></span>
                    <span className="text-[10px] text-[#05AD98] font-mono">{leaf.section_id}</span>
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
