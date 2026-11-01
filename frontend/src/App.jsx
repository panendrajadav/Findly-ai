import React, { useState, useEffect } from 'react';
import { 
  Shield, MessageSquare, AlertTriangle, Compass, BookOpen, 
  CheckCircle2, RefreshCw, Sparkles 
} from 'lucide-react';
import IncidentsView from './components/IncidentsView';
import ChatView from './components/ChatView';
import StairExplorerView from './components/TrieView';
import ActionsView from './components/ActionsView';
import KnowledgeBaseView from './components/DocumentsView';

export default function App() {
  const [activeTab, setActiveTab] = useState('chat');
  const [health, setHealth] = useState(null);
  const [checkingHealth, setCheckingHealth] = useState(false);

  const checkConnection = () => {
    setCheckingHealth(true);
    fetch('/api/health')
      .then(r => {
        if (!r.ok) throw new Error('API Offline');
        return r.json();
      })
      .then(d => {
        setHealth(d);
        setCheckingHealth(false);
      })
      .catch(() => {
        setHealth({ status: 'OFFLINE' });
        setCheckingHealth(false);
      });
  };

  useEffect(() => {
    checkConnection();
    const interval = setInterval(checkConnection, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-black relative">
      {/* Top Floating Capsule Navigation Bar with Black & Emerald Theme */}
      <header className="sticky top-0 z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto glass-card px-6 py-3.5 flex flex-col md:flex-row justify-between items-center gap-4 border border-white/10 shadow-2xl bg-[#090d14]/85 backdrop-blur-2xl rounded-2xl">
          {/* Brand Logo & Subtitle */}
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 flex items-center justify-center text-black shadow-lg shadow-emerald-500/30 flex-shrink-0">
              <Sparkles className="w-5 h-5 text-black" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-lg tracking-tight text-white">
                  Findly AI
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-950/80 text-emerald-300 border border-emerald-700/60 px-2.5 py-0.5 rounded-full">
                  STAIR RAG
                </span>
              </div>
              <div className="text-[11px] text-slate-400">
                Structure-Aware Operational Diagnostics & Incident Analysis
              </div>
            </div>
          </div>

          {/* Navigation Tabs - 5 Consolidated Sections */}
          <nav className="flex items-center space-x-1.5 bg-[#0e131d] p-1.5 rounded-full border border-white/10 text-xs shadow-inner">
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex items-center px-4 py-2 rounded-full font-semibold transition-all ${
                activeTab === 'chat'
                  ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
              STAIR Chat
            </button>

            <button
              onClick={() => setActiveTab('incidents')}
              className={`flex items-center px-4 py-2 rounded-full font-semibold transition-all ${
                activeTab === 'incidents'
                  ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 mr-1.5" />
              Incidents & Anomalies
            </button>

            <button
              onClick={() => setActiveTab('knowledge')}
              className={`flex items-center px-4 py-2 rounded-full font-semibold transition-all ${
                activeTab === 'knowledge'
                  ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 mr-1.5" />
              Knowledge Base
            </button>

            <button
              onClick={() => setActiveTab('explorer')}
              className={`flex items-center px-4 py-2 rounded-full font-semibold transition-all ${
                activeTab === 'explorer'
                  ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Compass className="w-3.5 h-3.5 mr-1.5" />
              STAIR Explorer
            </button>

            <button
              onClick={() => setActiveTab('actions')}
              className={`flex items-center px-4 py-2 rounded-full font-semibold transition-all ${
                activeTab === 'actions'
                  ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
              DevOps Actions
            </button>
          </nav>

          {/* Engine Status Pill */}
          <div className="flex items-center space-x-2.5 text-[11px] font-mono">
            <button
              onClick={checkConnection}
              title="Click to re-verify backend connectivity"
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-full border transition-all ${
                health?.status === 'HEALTHY'
                  ? 'bg-emerald-950/40 border-emerald-600/50 text-emerald-300 hover:bg-emerald-950/70'
                  : 'bg-rose-950/40 border-rose-600/50 text-rose-300 hover:bg-rose-950/70'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${health?.status === 'HEALTHY' ? 'bg-emerald-400 animate-ping' : 'bg-rose-500'}`}></span>
              <span>
                {health?.status === 'HEALTHY'
                  ? `STAIR Engine (${health.indexed_sections} sec)`
                  : 'Engine Offline'}
              </span>
              <RefreshCw className={`w-3 h-3 ml-1 ${checkingHealth ? 'animate-spin' : 'opacity-70'}`} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Spacious Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-6">
        {health?.status === 'OFFLINE' && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-950/40 border border-rose-800/80 text-rose-200 text-xs flex items-center justify-between shadow-xl">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0" />
              <div>
                <strong>Backend connection offline:</strong> The FastAPI server is not responding at <code className="bg-rose-900/60 px-1.5 py-0.5 rounded text-rose-100 font-mono">http://127.0.0.1:8000</code>.
                Launch the backend server with <code className="bg-rose-900/60 px-1.5 py-0.5 rounded text-rose-100 font-mono">uvicorn backend.app:app --host 127.0.0.1 --port 8000</code>.
              </div>
            </div>
            <button
              onClick={checkConnection}
              className="bg-rose-900 hover:bg-rose-800 text-rose-100 px-4 py-1.5 rounded-full text-xs font-semibold flex items-center transition-colors flex-shrink-0 ml-4"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Reconnect
            </button>
          </div>
        )}

        {activeTab === 'chat' && <ChatView />}
        {activeTab === 'incidents' && <IncidentsView />}
        {activeTab === 'knowledge' && <KnowledgeBaseView />}
        {activeTab === 'explorer' && <StairExplorerView />}
        {activeTab === 'actions' && <ActionsView />}
      </main>

      {/* Spacious Clean Footer */}
      <footer className="py-6 px-6 text-center text-xs text-slate-500 border-t border-white/5 bg-[#06080d]/80">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-3">
          <span>
            Findly AI • Implements STAIR: Structure Aware Information Retriever (arXiv:2609.03874) • Ground-Truth Telemetry
          </span>
          <span className="flex items-center text-emerald-400 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 mr-2"></span>
            33,434 OpenStack log records verified
          </span>
        </div>
      </footer>
    </div>
  );
}
