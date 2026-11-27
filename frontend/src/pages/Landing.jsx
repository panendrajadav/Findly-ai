import React, { useEffect, useState } from 'react';
import {
  ArrowRight, BookOpen, Search, ShieldCheck, Activity, FileText, GitBranch, CheckCircle2,
} from 'lucide-react';
import FindlyLogo from '../components/FindlyLogo';
import { api } from '../lib/api';
import { navigate } from '../lib/router';
import { getSession } from '../lib/auth';

const features = [
  {
    icon: Search,
    title: 'Structure-aware retrieval',
    body: 'Runbooks are indexed by their table of contents, not cut into arbitrary chunks. Every answer resolves to one real section.',
  },
  {
    icon: Activity,
    title: 'Incident detection',
    body: 'Reconstructs every VM lifecycle from OpenStack logs and flags spawn-latency outliers against a measured baseline.',
  },
  {
    icon: FileText,
    title: 'Answers with citations',
    body: 'Responses quote exact log lines, timestamps and durations, so you can verify every claim in seconds.',
  },
  {
    icon: ShieldCheck,
    title: 'Human approval for risky actions',
    body: 'Restarts, migrations and deletes are never run automatically. They wait in a queue for an operator to approve.',
  },
];

const steps = [
  { title: 'Connect your runbooks', body: 'Upload Markdown, PDF, DOCX or text. Headings become a navigable hierarchy.' },
  { title: 'Ask in plain English', body: '“Why did this VM take 40 seconds to spawn?” Findly finds the section and the evidence.' },
  { title: 'Review and act', body: 'Get the exact procedure, then send risky commands for approval with a full audit trail.' },
];

function Nav() {
  const session = getSession();
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <a href="#/" aria-label="Findly AI home"><FindlyLogo /></a>
        <nav className="hidden items-center gap-8 text-sm text-slate-600 md:flex">
          <a href="#features" onClick={(e) => { e.preventDefault(); document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' }); }} className="hover:text-slate-900">Features</a>
          <a href="#how" onClick={(e) => { e.preventDefault(); document.getElementById('how')?.scrollIntoView({ behavior: 'smooth' }); }} className="hover:text-slate-900">How it works</a>
          <a href="https://github.com/panendrajadav/Findly-ai" target="_blank" rel="noreferrer" className="hover:text-slate-900">GitHub</a>
        </nav>
        <div className="flex items-center gap-2">
          {session ? (
            <button className="btn-primary" onClick={() => navigate('/app')}>Open dashboard <ArrowRight className="h-4 w-4" /></button>
          ) : (
            <>
              <button className="btn-ghost" onClick={() => navigate('/login')}>Sign in</button>
              <button className="btn-primary" onClick={() => navigate('/login?mode=signup')}>Get started</button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

function ProductPreview() {
  return (
    <div className="card overflow-hidden shadow-pop">
      <div className="flex items-center gap-1.5 border-b border-slate-200 bg-slate-50 px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
        <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
        <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
        <span className="ml-3 text-xs text-slate-500">Assistant</span>
      </div>
      <div className="space-y-4 p-5 text-sm">
        <div className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-sm bg-brand-600 px-4 py-2.5 text-white">
          Why did VM 544fd51c take so long to spawn?
        </div>
        <div className="space-y-3 rounded-2xl rounded-bl-sm border border-slate-200 bg-white px-4 py-3">
          <div className="flex flex-wrap items-center gap-1 text-xs text-slate-500">
            <BookOpen className="h-3.5 w-3.5" /> Nova Compute Spawn Latency <span>›</span> Remediation <span>›</span>
            <span className="font-medium text-slate-700">Clean orphaned instance files</span>
          </div>
          <p className="text-slate-700">
            Spawn took <strong className="text-slate-900">41.81s</strong>, which is <strong className="text-slate-900">+33.9σ</strong> above the
            19.79s baseline. Claim: 1 vCPU, 2048 MB, 20 GB.
          </p>
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-xs text-slate-700">
            openstack_abnormal.log:11980 · Took 41.81 seconds to spawn
          </div>
          <div className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            <span>1 high-risk command needs approval</span>
            <span className="font-medium">Review →</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stats() {
  const [stats, setStats] = useState(null);
  useEffect(() => {
    Promise.all([api.health(), api.incidents()])
      .then(([h, inc]) => setStats({
        logs: h.openstack_logs_loaded,
        sections: h.indexed_sections,
        recall: inc.evaluation_metrics?.recall,
        f1: inc.evaluation_metrics?.f1_score,
      }))
      .catch(() => setStats(null));
  }, []);
  if (!stats) return null;
  const items = [
    { label: 'log lines analysed', value: stats.logs?.toLocaleString() },
    { label: 'runbook sections indexed', value: stats.sections },
    { label: 'known incidents caught', value: stats.recall != null ? `${Math.round(stats.recall * 100)}%` : '—' },
    { label: 'detection F1 score', value: stats.f1 != null ? stats.f1.toFixed(2) : '—' },
  ];
  return (
    <section className="border-y border-slate-200 bg-slate-50">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-6 py-10 md:grid-cols-4">
        {items.map((s) => (
          <div key={s.label}>
            <div className="text-2xl font-semibold tracking-tight text-slate-900">{s.value}</div>
            <div className="mt-1 text-sm text-slate-500">{s.label}</div>
          </div>
        ))}
      </div>
      <p className="mx-auto max-w-6xl px-6 pb-6 -mt-4 text-xs text-slate-400">Live numbers from this deployment&apos;s OpenStack demo dataset.</p>
    </section>
  );
}

export default function Landing() {
  return (
    <div className="min-h-screen bg-white">
      <Nav />

      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(37,99,235,0.08),transparent_60%)]" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 md:grid-cols-2 md:py-28">
          <div>
            <span className="badge-blue mb-5">
              <GitBranch className="h-3.5 w-3.5" /> Open source · OpenStack ready
            </span>
            <h1 className="text-4xl font-semibold leading-[1.1] tracking-tight text-slate-900 md:text-5xl">
              Find the root cause.<br />
              <span className="text-brand-600">Follow the right runbook.</span>
            </h1>
            <p className="mt-5 max-w-lg text-lg leading-relaxed text-slate-600">
              Findly AI reads your infrastructure logs and runbooks together, explains incidents with cited evidence,
              and keeps a human in charge of every risky fix.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button className="btn-primary px-5 py-2.5" onClick={() => navigate('/login?mode=signup')}>
                Get started free <ArrowRight className="h-4 w-4" />
              </button>
              <button className="btn-secondary px-5 py-2.5" onClick={() => navigate('/login')}>
                Sign in
              </button>
            </div>
            <ul className="mt-8 space-y-2 text-sm text-slate-600">
              {['Free demo workspace, nothing to install', 'Every answer cites its source', 'Risky commands always need approval'].map((t) => (
                <li key={t} className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600" /> {t}</li>
              ))}
            </ul>
          </div>
          <ProductPreview />
        </div>
      </section>

      <Stats />

      <section id="features" className="mx-auto max-w-6xl px-6 py-20">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-semibold tracking-tight text-slate-900">Built for on-call engineers</h2>
          <p className="mt-3 text-slate-600">Less searching through wikis and logs at 3 a.m. More time actually fixing things.</p>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {features.map(({ icon: Icon, title, body }) => (
            <div key={title} className="card p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-semibold text-slate-900">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="how" className="border-t border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="text-3xl font-semibold tracking-tight text-slate-900">How it works</h2>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {steps.map((s, i) => (
              <div key={s.title}>
                <div className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 bg-white text-sm font-semibold text-slate-700">{i + 1}</div>
                <h3 className="mt-4 font-semibold text-slate-900">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="flex flex-col items-start justify-between gap-6 rounded-2xl bg-brand-900 px-8 py-12 text-white md:flex-row md:items-center">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Try it on real OpenStack incidents</h2>
            <p className="mt-2 text-slate-300">The demo workspace comes loaded with 4 runbooks and an annotated incident dataset.</p>
          </div>
          <button className="btn bg-white px-5 py-2.5 text-brand-900 hover:bg-slate-100" onClick={() => navigate('/login?mode=signup')}>
            Open the demo <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </section>

      <footer className="border-t border-slate-200">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 text-sm text-slate-500 md:flex-row">
          <FindlyLogo size={22} />
          <p>© {new Date().getFullYear()} Findly AI. Built with FastAPI and React.</p>
        </div>
      </footer>
    </div>
  );
}
