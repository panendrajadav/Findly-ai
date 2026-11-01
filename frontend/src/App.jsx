import React, { useState, useEffect } from 'react';
import { 
  Home, LayoutDashboard, MessageSquare, AlertTriangle, BookOpen, 
  Layers, ShieldCheck, Settings, Sparkles, RefreshCw,
  Menu, X, Activity, Play, Terminal
} from 'lucide-react';
import FindlyLogo from './components/FindlyLogo';
import IntroductionView from './components/IntroductionView';
import OverviewView from './components/OverviewView';
import ChatView from './components/ChatView';
import IncidentsView from './components/IncidentsView';
import KnowledgeBaseView from './components/DocumentsView';
import StairExplorerView from './components/TrieView';
import ActionsView from './components/ActionsView';
import SettingsView from './components/SettingsView';

export default function App() {
  const [activeTab, setActiveTab] = useState('intro'); // Start on Introduction page as requested
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
      id: 'intro',
      label: 'Intro',
      icon: Home,
      badge: null,
    },
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
      badge: 'Active',
    },
    {
      id: 'incidents',
      label: 'Incidents',
      icon: AlertTriangle,
      badge: '2 New',
    },
    {
      id: 'knowledge',
      label: 'Runbooks',
      icon: BookOpen,
      badge: '4 Docs',
    },
    {
      id: 'explorer',
      label: 'STAIR Explorer',
      icon: Layers,
      badge: null,
    },
    {
      id: 'actions',
      label: 'Actions',
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

  return (
    <div className="min-h-screen bg-[#050d08] text-[#FAF5E9] flex flex-col font-sans selection:bg-[#009B4D] selection:text-[#FAF5E9] relative overflow-x-hidden">
      {/* Background Subtle Gradient Atmosphere in Green, Tangerine Yellow & Ivory */}
      <div className="ambient-glow-green w-[600px] h-[600px] -top-32 -left-32 fixed"></div>
      <div className="ambient-glow-yellow w-[500px] h-[500px] top-1/2 -right-32 fixed"></div>

      {/* FLOATING MIDDLE GLASS NAVIGATION BAR */}
      <header className="sticky top-3 sm:top-5 z-50 w-full px-3 sm:px-6 flex justify-center pointer-events-none">
        <div className="glass-nav rounded-full px-2.5 sm:px-4 py-2 flex items-center justify-between sm:justify-center space-x-1.5 sm:space-x-3 shadow-2xl border border-[#009B4D]/35 max-w-5xl w-full sm:w-auto pointer-events-auto backdrop-blur-2xl bg-[#09160e]/85">
          
          {/* Brand Logo & Title on Left */}
          <button
            onClick={() => setActiveTab('intro')}
            className="flex items-center space-x-2 pl-1 pr-2 sm:pr-3 py-1 rounded-full hover:bg-white/5 transition-all group flex-shrink-0"
            title="Return to Introduction Page"
          >
            <FindlyLogo size={28} className="group-hover:rotate-12 transition-transform" />
            <span className="font-extrabold text-sm sm:text-base text-[#FAF5E9] tracking-tight hidden md:inline">
              Findly AI
            </span>
            <span className="text-[9px] font-bold uppercase tracking-wider bg-[#0d2015] text-[#FFCC00] border border-[#FFCC00]/40 px-1.5 py-0.5 rounded-full font-mono hidden lg:inline">
              STAIR
            </span>
          </button>

          {/* Desktop Middle Navigation Pills */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const IconComp = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 flex items-center space-x-1.5 relative group ${
                    isActive
                      ? 'bg-[#009B4D] text-[#FAF5E9] shadow-md shadow-[#009B4D]/30 font-bold'
                      : 'text-[#FAF5E9]/70 hover:text-[#FAF5E9] hover:bg-[#009B4D]/15'
                  }`}
                >
                  <IconComp className={`w-3.5 h-3.5 ${isActive ? 'text-[#FAF5E9]' : 'text-[#FAF5E9]/70 group-hover:text-[#FFCC00]'}`} />
                  <span>{item.label}</span>

                  {/* Active Tangerine Yellow Dot */}
                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#FFCC00]"></span>
                  )}

                  {/* Notification badge */}
                  {!isActive && item.badge && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#FFCC00]"></span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Mobile Tab Pill Switcher (Dropdown / Compact) */}
          <div className="flex md:hidden items-center space-x-2">
            <span className="text-xs font-bold text-[#FFCC00] font-mono">
              {navItems.find(n => n.id === activeTab)?.label}
            </span>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 rounded-full bg-[#0d2015] border border-[#009B4D]/40 text-[#FAF5E9]"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>

          {/* Engine Status Indicator on Right */}
          <div className="flex items-center space-x-2 pl-1 sm:pl-2 border-l border-[#009B4D]/25 flex-shrink-0">
            <button
              onClick={checkConnection}
              title="Click to re-verify backend connectivity"
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono border transition-all ${
                health?.status === 'HEALTHY'
                  ? 'bg-[#0d2015] border-[#009B4D]/40 text-[#FAF5E9] hover:border-[#009B4D]'
                  : 'bg-rose-950/80 border-rose-700 text-rose-200'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${health?.status === 'HEALTHY' ? 'bg-[#009B4D] animate-ping' : 'bg-rose-500'}`}></span>
              <span className="hidden sm:inline">
                {health?.status === 'HEALTHY' ? 'STAIR Online' : 'Offline'}
              </span>
              <span className="text-[#FFCC00] text-[10px] font-bold">
                {health?.indexed_sections || 19}L
              </span>
              <RefreshCw className={`w-3 h-3 text-[#FAF5E9]/50 ${checkingHealth ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-black/70 backdrop-blur-md flex flex-col items-center justify-center p-6 md:hidden">
          <div className="w-full max-w-sm rounded-3xl bg-[#09160e] border border-[#009B4D]/40 p-6 space-y-3 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#009B4D]/30">
              <div className="flex items-center space-x-2">
                <FindlyLogo size={24} />
                <span className="font-bold text-[#FAF5E9]">Navigation Menu</span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 rounded-full hover:bg-white/10 text-[#FAF5E9]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-1.5">
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
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-[#009B4D] text-[#FAF5E9] font-bold'
                        : 'text-[#FAF5E9]/80 hover:bg-[#009B4D]/15'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <IconComp className="w-4 h-4 text-[#FFCC00]" />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#0d2015] text-[#FFCC00] border border-[#FFCC00]/30 font-mono">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Offline Alert Banner */}
      {health?.status === 'OFFLINE' && (
        <div className="max-w-4xl mx-auto my-3 px-4 w-full">
          <div className="p-4 rounded-2xl bg-rose-950/70 border border-rose-700 text-rose-200 text-xs flex items-center justify-between shadow-xl">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0" />
              <div>
                <strong>Backend connection offline:</strong> The FastAPI server is not responding at <code className="bg-rose-900/60 px-1.5 py-0.5 rounded text-rose-100 font-mono">http://127.0.0.1:8000</code>.
              </div>
            </div>
            <button
              onClick={checkConnection}
              className="bg-rose-900 hover:bg-rose-800 text-rose-100 px-4 py-1.5 rounded-full text-xs font-semibold flex items-center transition-colors flex-shrink-0 ml-4"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Reconnect
            </button>
          </div>
        </div>
      )}

      {/* MAIN VIEW ROUTING */}
      <main className="flex-1 w-full pb-12 transition-all duration-300">
        {/* View 1: Introduction Landing Page */}
        {activeTab === 'intro' && (
          <IntroductionView
            onGetStarted={() => setActiveTab('chat')}
            onExploreTour={() => setActiveTab('explorer')}
          />
        )}

        {/* View 2: STAIR Chat Workspace */}
        {activeTab === 'chat' && (
          <ChatView externalQuery={pendingQuery} />
        )}

        {/* View 3: Operational Overview Dashboard */}
        {activeTab === 'overview' && (
          <OverviewView
            onNavigate={(tabId) => setActiveTab(tabId)}
            onSelectQuery={handleSelectQueryFromOtherView}
          />
        )}

        {/* View 4: Incidents & Anomalies */}
        {activeTab === 'incidents' && (
          <IncidentsView />
        )}

        {/* View 5: Technical Runbooks & Knowledge Base */}
        {activeTab === 'knowledge' && (
          <KnowledgeBaseView />
        )}

        {/* View 6: STAIR Prefix Trie Explorer */}
        {activeTab === 'explorer' && (
          <StairExplorerView onSelectQuery={handleSelectQueryFromOtherView} />
        )}

        {/* View 7: DevOps Action Approvals & Audit Trail */}
        {activeTab === 'actions' && (
          <ActionsView />
        )}

        {/* View 8: Settings & Baselines */}
        {activeTab === 'settings' && (
          <SettingsView />
        )}
      </main>

      {/* Modern Clean Footer in Green, Tangerine & Ivory */}
      <footer className="py-6 px-8 text-center text-xs text-[#FAF5E9]/60 border-t border-[#009B4D]/20 bg-[#050d08]/90">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="flex items-center space-x-2">
            <FindlyLogo size={18} />
            <span>
              Findly AI • STAIR: Structure Aware Information Retriever • OpenStack Telemetry Ground-Truth
            </span>
          </div>
          <span className="flex items-center text-[#009B4D] font-mono font-medium">
            <span className="w-2 h-2 rounded-full bg-[#009B4D] mr-2"></span>
            <span className="text-[#FAF5E9]">33,434 OpenStack log records verified</span>
          </span>
        </div>
      </footer>
    </div>
  );
}
