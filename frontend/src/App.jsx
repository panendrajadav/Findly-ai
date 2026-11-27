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
    },
    {
      id: 'overview',
      label: 'Overview',
      icon: LayoutDashboard,
    },
    {
      id: 'chat',
      label: 'Chat',
      icon: MessageSquare,
    },
    {
      id: 'incidents',
      label: 'Incidents',
      icon: AlertTriangle,
    },
    {
      id: 'knowledge',
      label: 'Runbooks',
      icon: BookOpen,
    },
    {
      id: 'explorer',
      label: 'Explorer',
      icon: Layers,
    },
    {
      id: 'actions',
      label: 'Actions',
      icon: ShieldCheck,
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
    },
  ];

  return (
    <div className="min-h-screen bg-[#0a0e14] text-[#FFFFFF] flex flex-col font-sans selection:bg-[#05AD98] selection:text-[#FFFFFF] relative overflow-x-hidden">
      {/* Background Subtle Gradient Atmosphere */}
      <div className="ambient-glow-teal w-[600px] h-[600px] -top-32 -left-32 fixed"></div>
      <div className="ambient-glow-silver w-[500px] h-[500px] top-1/2 -right-32 fixed"></div>

      {/* FLOATING MIDDLE GLASS NAVIGATION BAR */}
      <header className="sticky top-4 sm:top-5 z-50 w-full px-3 sm:px-6 flex justify-center pointer-events-none">
        <div className="glass-nav rounded-full px-3 py-1.5 flex items-center justify-between sm:justify-center space-x-1 sm:space-x-2 shadow-2xl border border-[#BBBFBF]/15 max-w-fit pointer-events-auto backdrop-blur-2xl bg-[#0a0e14]/90">
          
          {/* Brand Logo & Title on Left */}
          <button
            onClick={() => setActiveTab('intro')}
            className="flex items-center space-x-2 pl-1 pr-2 py-1 rounded-full hover:bg-white/5 transition-all group flex-shrink-0"
            title="Return to Introduction Page"
          >
            <FindlyLogo size={24} className="group-hover:rotate-12 transition-transform" />
            <span className="font-bold text-sm text-[#FFFFFF] tracking-tight">
              Findly AI
            </span>
            <span className="text-[9px] font-bold uppercase tracking-wider bg-[#05AD98]/10 text-[#05AD98] border border-[#05AD98]/25 px-1.5 py-0.5 rounded-full font-mono hidden sm:inline">
              STAIR
            </span>
          </button>

          {/* Subtle Vertical Divider */}
          <div className="h-4 w-[1px] bg-[#BBBFBF]/20 hidden md:block"></div>

          {/* Desktop Middle Navigation Pills (Single-line, no wrapping, sleek) */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const IconComp = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 flex items-center space-x-1.5 whitespace-nowrap ${
                    isActive
                      ? 'bg-[#05AD98] text-[#FFFFFF] shadow-md shadow-[#05AD98]/25 font-semibold'
                      : 'text-[#BBBFBF] hover:text-[#FFFFFF] hover:bg-white/5'
                  }`}
                >
                  <IconComp className={`w-3.5 h-3.5 ${isActive ? 'text-[#FFFFFF]' : 'text-[#878787] group-hover:text-[#FFFFFF]'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Subtle Vertical Divider */}
          <div className="h-4 w-[1px] bg-[#BBBFBF]/20 hidden md:block"></div>

          {/* Mobile Tab Switcher */}
          <div className="flex md:hidden items-center space-x-2">
            <span className="text-xs font-semibold text-[#05AD98] font-mono px-2 py-0.5 bg-[#05AD98]/10 rounded-full">
              {navItems.find(n => n.id === activeTab)?.label}
            </span>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 rounded-full bg-white/5 border border-[#BBBFBF]/15 text-[#FFFFFF]"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>

          {/* Engine Status Indicator on Right */}
          <div className="flex items-center space-x-1.5 pl-1 flex-shrink-0">
            <button
              onClick={checkConnection}
              title="Click to re-verify backend connectivity"
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono border transition-all ${
                health?.status === 'HEALTHY'
                  ? 'bg-white/5 border-[#BBBFBF]/15 text-[#BBBFBF] hover:text-[#FFFFFF] hover:border-[#05AD98]/40'
                  : 'bg-rose-950/80 border-rose-700 text-rose-200'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${health?.status === 'HEALTHY' ? 'bg-[#05AD98] animate-pulse' : 'bg-rose-500'}`}></span>
              <span className="hidden sm:inline">
                {health?.status === 'HEALTHY' ? 'Online' : 'Offline'}
              </span>
              <span className="text-[#05AD98] text-[10px] font-bold">
                {health?.indexed_sections || 19}L
              </span>
              <RefreshCw className={`w-3 h-3 text-[#878787] ${checkingHealth ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-black/75 backdrop-blur-md flex flex-col items-center justify-center p-6 md:hidden">
          <div className="w-full max-w-sm rounded-3xl bg-[#0f141c] border border-[#BBBFBF]/20 p-6 space-y-3 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#BBBFBF]/15">
              <div className="flex items-center space-x-2">
                <FindlyLogo size={24} />
                <span className="font-bold text-[#FFFFFF]">Navigation Menu</span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 rounded-full hover:bg-white/10 text-[#BBBFBF]"
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
                        ? 'bg-[#05AD98] text-[#FFFFFF] font-bold'
                        : 'text-[#BBBFBF] hover:text-[#FFFFFF] hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <IconComp className="w-4 h-4 text-[#05AD98]" />
                      <span>{item.label}</span>
                    </div>
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

      {/* Modern Clean Footer */}
      <footer className="py-6 px-8 text-center text-xs text-[#878787] border-t border-[#BBBFBF]/10 bg-[#0a0e14]/90">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="flex items-center space-x-2">
            <FindlyLogo size={18} />
            <span className="text-[#BBBFBF]">
              Findly AI • STAIR: Structure Aware Information Retriever • OpenStack Telemetry Ground-Truth
            </span>
          </div>
          <span className="flex items-center text-[#05AD98] font-mono font-medium">
            <span className="w-2 h-2 rounded-full bg-[#05AD98] mr-2"></span>
            <span className="text-[#BBBFBF]">33,434 OpenStack log records verified</span>
          </span>
        </div>
      </footer>
    </div>
  );
}
