import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, MessageSquare, AlertTriangle, BookOpen, 
  Layers, ShieldCheck, Settings, Sparkles, RefreshCw,
  ChevronLeft, ChevronRight, Menu, X, ExternalLink, Activity,
  Play, CheckCircle2, Terminal
} from 'lucide-react';
import OverviewView from './components/OverviewView';
import ChatView from './components/ChatView';
import IncidentsView from './components/IncidentsView';
import KnowledgeBaseView from './components/DocumentsView';
import StairExplorerView from './components/TrieView';
import ActionsView from './components/ActionsView';
import SettingsView from './components/SettingsView';

export default function App() {
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' is primary workspace
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [health, setHealth] = useState(null);
  const [checkingHealth, setCheckingHealth] = useState(false);
  const [pendingQuery, setPendingQuery] = useState('');

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

  const handleSelectQueryFromOtherView = (queryText) => {
    setPendingQuery(queryText);
    setActiveTab('chat');
  };

  const navItems = [
    {
      id: 'overview',
      label: 'Overview',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'chat',
      label: 'STAIR Chat',
      icon: MessageSquare,
      badge: 'Primary',
    },
    {
      id: 'incidents',
      label: 'Incidents & Anomalies',
      icon: AlertTriangle,
      badge: '2 New',
    },
    {
      id: 'knowledge',
      label: 'Knowledge Base',
      icon: BookOpen,
      badge: '4 Docs',
    },
    {
      id: 'explorer',
      label: 'STAIR Explorer',
      icon: Layers,
      badge: 'Interactive',
    },
    {
      id: 'actions',
      label: 'DevOps Actions',
      icon: ShieldCheck,
      badge: null,
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      badge: null,
    },
  ];

  const currentTabLabel = navItems.find(n => n.id === activeTab)?.label || 'Workspace';

  return (
    <div className="min-h-screen bg-navy-950 text-slate-100 flex font-sans selection:bg-blue-600 selection:text-white relative overflow-hidden">
      {/* Background Subtle Gradient Atmosphere */}
      <div className="ambient-glow-blue w-[600px] h-[600px] -top-32 -left-32 fixed"></div>
      <div className="ambient-glow-cyan w-[500px] h-[500px] top-1/2 -right-32 fixed"></div>

      {/* Sidebar Navigation */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 bg-navy-900/95 border-r border-white/10 backdrop-blur-2xl transition-all duration-300 flex flex-col justify-between ${
          sidebarCollapsed ? 'w-20' : 'w-64'
        } ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
      >
        {/* Brand Logo & Header */}
        <div>
          <div className="h-20 flex items-center px-5 border-b border-white/10 justify-between">
            <div className="flex items-center space-x-3.5 overflow-hidden">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-cyan-500 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/30 flex-shrink-0">
                <Sparkles className="w-5 h-5 text-white animate-pulse" />
              </div>
              {!sidebarCollapsed && (
                <div className="truncate">
                  <div className="flex items-center space-x-2">
                    <span className="font-extrabold text-lg text-white tracking-tight">
                      Findly AI
                    </span>
                    <span className="text-[9px] font-bold uppercase tracking-wider bg-blue-950 text-cyan-300 border border-cyan-800/60 px-1.5 py-0.5 rounded-full font-mono">
                      STAIR
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">
                    DevOps Troubleshooting
                  </div>
                </div>
              )}
            </div>

            {/* Collapse toggle (desktop only) */}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="hidden md:flex p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
              title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1.5">
            {navItems.map((item) => {
              const IconComp = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  title={sidebarCollapsed ? item.label : undefined}
                  className={`w-full flex items-center px-3.5 py-3 rounded-2xl text-xs font-semibold transition-all group relative ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-600/25'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <IconComp className={`w-4 h-4 flex-shrink-0 transition-colors ${
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-cyan-400'
                  }`} />

                  {!sidebarCollapsed && (
                    <div className="flex items-center justify-between w-full ml-3 truncate">
                      <span className="truncate">{item.label}</span>
                      {item.badge && (
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider font-mono ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : 'bg-navy-950 text-cyan-300 border border-cyan-800/40'
                        }`}>
                          {item.badge}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Active Indicator Bar on collapsed state */}
                  {sidebarCollapsed && isActive && (
                    <div className="absolute right-0 top-2 bottom-2 w-1 bg-cyan-400 rounded-l-full"></div>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Engine Health & Telemetry Info */}
        <div className="p-4 border-t border-white/10 space-y-3">
          {!sidebarCollapsed ? (
            <div className="bg-navy-950 p-3.5 rounded-2xl border border-white/5 text-[11px] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium">STAIR Backend</span>
                <span className="flex items-center space-x-1.5 text-cyan-400 font-mono">
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    health?.status === 'HEALTHY' ? 'bg-cyan-400 animate-pulse' : 'bg-rose-500'
                  }`}></span>
                  <span>{health?.status === 'HEALTHY' ? 'Online' : 'Offline'}</span>
                </span>
              </div>
              <div className="text-[10px] text-slate-500 font-mono">
                {health?.indexed_sections || 19} ToC leaves • 33k logs
              </div>
            </div>
          ) : (
            <div className="flex justify-center" title={`STAIR Engine: ${health?.status || 'Checking'}`}>
              <span className={`w-3 h-3 rounded-full ${
                health?.status === 'HEALTHY' ? 'bg-cyan-400 animate-pulse' : 'bg-rose-500'
              }`}></span>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden"
        ></div>
      )}

      {/* Main Workspace View Container */}
      <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${
        sidebarCollapsed ? 'md:ml-20' : 'md:ml-64'
      }`}>
        {/* Top Header Bar */}
        <header className="h-20 sticky top-0 z-20 px-6 border-b border-white/10 bg-navy-950/80 backdrop-blur-2xl flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl bg-navy-900 border border-white/10 text-slate-300"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <div>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">
                Workspace
              </div>
              <h2 className="text-lg md:text-xl font-bold text-white tracking-tight">
                {currentTabLabel}
              </h2>
            </div>
          </div>

          {/* Quick Engine Telemetry Pill & Demo Launcher */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setActiveTab('explorer')}
              className="hidden sm:flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-blue-950/60 border border-blue-500/30 text-blue-200 text-xs font-semibold hover:bg-blue-900/60 transition-colors shadow-sm"
            >
              <Play className="w-3.5 h-3.5 text-cyan-400 fill-current" />
              <span>Interactive STAIR Tour</span>
            </button>

            <button
              onClick={checkConnection}
              title="Click to re-verify backend connectivity"
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-full border transition-all text-xs font-mono ${
                health?.status === 'HEALTHY'
                  ? 'bg-blue-950/40 border-cyan-500/40 text-cyan-300 hover:bg-blue-950/70'
                  : 'bg-rose-950/40 border-rose-600/50 text-rose-300 hover:bg-rose-950/70'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${health?.status === 'HEALTHY' ? 'bg-cyan-400 animate-ping' : 'bg-rose-500'}`}></span>
              <span>
                {health?.status === 'HEALTHY'
                  ? `STAIR Engine (${health.indexed_sections} leaves)`
                  : 'Engine Offline'}
              </span>
              <RefreshCw className={`w-3 h-3 ml-1 ${checkingHealth ? 'animate-spin' : 'opacity-70'}`} />
            </button>
          </div>
        </header>

        {/* Offline Warning Banner */}
        {health?.status === 'OFFLINE' && (
          <div className="m-6 p-4 rounded-2xl bg-rose-950/40 border border-rose-800/80 text-rose-200 text-xs flex items-center justify-between shadow-xl">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0" />
              <div>
                <strong>Backend connection offline:</strong> The FastAPI server is not responding at <code className="bg-rose-900/60 px-1.5 py-0.5 rounded text-rose-100 font-mono">http://127.0.0.1:8000</code>.
                Launch the backend server with <code className="bg-rose-900/60 px-1.5 py-0.5 rounded text-rose-100 font-mono">python -m uvicorn backend.app:app --host 127.0.0.1 --port 8000</code>.
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

        {/* View Routing */}
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
          {activeTab === 'overview' && (
            <OverviewView
              onNavigate={(tabId) => setActiveTab(tabId)}
              onSelectQuery={handleSelectQueryFromOtherView}
            />
          )}
          {activeTab === 'chat' && (
            <ChatView externalQuery={pendingQuery} />
          )}
          {activeTab === 'incidents' && (
            <IncidentsView />
          )}
          {activeTab === 'knowledge' && (
            <KnowledgeBaseView />
          )}
          {activeTab === 'explorer' && (
            <StairExplorerView onSelectQuery={handleSelectQueryFromOtherView} />
          )}
          {activeTab === 'actions' && (
            <ActionsView />
          )}
          {activeTab === 'settings' && (
            <SettingsView />
          )}
        </main>

        {/* Modern Clean Footer */}
        <footer className="py-6 px-8 text-center text-xs text-slate-500 border-t border-white/5 bg-navy-950/90">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-3">
            <span>
              Findly AI • Implements STAIR: Structure Aware Information Retriever (arXiv:2609.03874) • OpenStack Oslo Ground-Truth
            </span>
            <span className="flex items-center text-cyan-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-cyan-400 mr-2"></span>
              33,434 OpenStack log records verified
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}
