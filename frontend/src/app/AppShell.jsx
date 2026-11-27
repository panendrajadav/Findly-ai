import React, { useEffect, useRef, useState } from 'react';
import {
  LayoutDashboard, MessageSquare, AlertTriangle, BookOpen, ShieldCheck, Activity, LogOut, ChevronDown, Menu, X,
} from 'lucide-react';
import FindlyLogo from '../components/FindlyLogo';
import { api } from '../lib/api';
import { signOut } from '../lib/auth';
import { navigate } from '../lib/router';

export const NAV = [
  { path: '/app', label: 'Overview', icon: LayoutDashboard },
  { path: '/app/assistant', label: 'Assistant', icon: MessageSquare },
  { path: '/app/incidents', label: 'Incidents', icon: AlertTriangle },
  { path: '/app/runbooks', label: 'Runbooks', icon: BookOpen },
  { path: '/app/approvals', label: 'Approvals', icon: ShieldCheck },
  { path: '/app/system', label: 'System health', icon: Activity },
];

function useHealth() {
  const [health, setHealth] = useState(null);
  useEffect(() => {
    let alive = true;
    const check = () => api.health().then((h) => alive && setHealth(h)).catch(() => alive && setHealth({ status: 'OFFLINE' }));
    check();
    const t = setInterval(check, 30000);
    return () => { alive = false; clearInterval(t); };
  }, []);
  return health;
}

function UserMenu({ session }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const close = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);
  const initials = (session.name || session.email).split(/\s+/).map((p) => p[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)} className="flex items-center gap-1.5 rounded-full p-0.5 pr-1.5 hover:bg-slate-100">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-xs font-semibold text-white">{initials}</span>
        <ChevronDown className="h-4 w-4 text-slate-500" />
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-60 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-pop">
          <div className="border-b border-slate-100 px-4 py-3">
            <p className="text-sm font-medium text-slate-900">{session.name}</p>
            <p className="truncate text-xs text-slate-500">{session.email}</p>
          </div>
          <button
            onClick={() => { signOut(); navigate('/'); }}
            className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}

export default function AppShell({ session, route, children }) {
  const health = useHealth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const base = route.split('?')[0];
  const isActive = (p) => (p === '/app' ? base === '/app' || base === '/app/' : base.startsWith(p));
  const online = health?.status === 'HEALTHY';

  const NavLinks = ({ onClick }) => (
    <nav className="space-y-0.5">
      {NAV.map(({ path, label, icon: Icon }) => (
        <a
          key={path}
          href={`#${path}`}
          onClick={onClick}
          className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
            isActive(path) ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Icon className="h-4 w-4" /> {label}
        </a>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white">
        <div className="flex h-14 items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <button className="btn-ghost p-2 lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open menu">
              <Menu className="h-5 w-5" />
            </button>
            <a href="#/app"><FindlyLogo size={26} /></a>
            <span className="hidden text-slate-300 sm:inline">/</span>
            <span className="hidden text-sm font-medium text-slate-700 sm:inline">OpenStack demo</span>
          </div>
          <div className="flex items-center gap-3">
            <a href="#/app/system" className={online ? 'badge-green' : 'badge-red'} title="Backend status">
              <span className={`h-1.5 w-1.5 rounded-full ${online ? 'bg-emerald-500' : 'bg-red-500'}`} />
              {health == null ? 'Checking…' : online ? 'Operational' : 'Offline'}
            </a>
            <UserMenu session={session} />
          </div>
        </div>
      </header>

      <div className="flex">
        <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-60 flex-shrink-0 border-r border-slate-200 bg-white p-3 lg:block">
          <NavLinks />
        </aside>

        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-slate-900/30" onClick={() => setMobileOpen(false)} />
            <div className="absolute inset-y-0 left-0 w-64 bg-white p-3 shadow-pop">
              <div className="mb-3 flex items-center justify-between px-2 py-1">
                <FindlyLogo size={24} />
                <button className="btn-ghost p-1.5" onClick={() => setMobileOpen(false)} aria-label="Close menu"><X className="h-5 w-5" /></button>
              </div>
              <NavLinks onClick={() => setMobileOpen(false)} />
            </div>
          </div>
        )}

        <main className="min-w-0 flex-1">
          {health?.status === 'OFFLINE' && (
            <div className="border-b border-amber-200 bg-amber-50 px-6 py-2.5 text-sm text-amber-800">
              The backend isn&apos;t responding. If the service was idle it may be waking up. This can take up to a minute.
            </div>
          )}
          <div className="mx-auto max-w-6xl px-4 py-6 lg:px-8 lg:py-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
