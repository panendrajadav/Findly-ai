import React from 'react';
import { AlertTriangle, Server, ShieldCheck, MessageSquare, ArrowRight, Sparkles } from 'lucide-react';
import { api } from '../lib/api';
import { navigate } from '../lib/router';
import { seconds, shortId, timeAgo } from '../lib/format';
import { PageHeader, StatCard, Loading, ErrorState, useAsync } from '../components/ui';

export const SUGGESTED = [
  'Which VMs are anomalous and why?',
  'Why did instance 544fd51c-4edc-4780-baae-ba1d80a0acfc take so long to spawn?',
  'Compare spawn times of 544fd51c-4edc-4780-baae-ba1d80a0acfc and ae651dff-c7ad-43d6-ac96-bbcd820ccca8',
  'How do I fix keystone token expiration errors?',
];

export const ask = (q) => navigate(`/app/assistant?q=${encodeURIComponent(q)}`);

export default function Overview({ session }) {
  const { data, error, loading, reload } = useAsync(() =>
    Promise.all([api.incidents(), api.actions(), api.evals(5)]).then(([inc, actions, evals]) => ({ inc, actions, evals })));

  const first = (session.name || '').split(' ')[0];

  return (
    <>
      <PageHeader
        title={`Welcome back${first ? `, ${first}` : ''}`}
        subtitle="Here's what's happening across your OpenStack environment."
        actions={(
          <button className="btn-primary" onClick={() => navigate('/app/assistant')}>
            <MessageSquare className="h-4 w-4" /> Ask the assistant
          </button>
        )}
      />
      {loading && <Loading />}
      {error && <ErrorState error={error} onRetry={reload} />}
      {data && <OverviewBody {...data} />}
    </>
  );
}

function OverviewBody({ inc, actions, evals }) {
  const flagged = inc.incidents.filter((i) => i.predicted_anomaly);
  const pending = actions.filter((a) => a.status === 'PENDING_APPROVAL');

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Server} label="VMs analysed" value={inc.total_vms} hint="Reconstructed from logs" />
        <StatCard icon={AlertTriangle} label="Incidents flagged" value={flagged.length} hint={`${inc.known_anomalies.length} confirmed in labels`} />
        <StatCard icon={ShieldCheck} label="Awaiting approval" value={pending.length} hint="High-risk commands" />
        <StatCard icon={MessageSquare} label="Questions answered" value={evals.summary.queries_evaluated || 0} hint="Since last restart" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card lg:col-span-2">
          <div className="card-header">
            <h2 className="card-title">Slowest VM spawns</h2>
            <a href="#/app/incidents" className="text-sm font-medium text-brand-600 hover:underline">View all</a>
          </div>
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead><tr><th>Instance</th><th>Spawn time</th><th>Deviation</th><th>Status</th></tr></thead>
              <tbody>
                {inc.incidents.slice(0, 6).map((i) => (
                  <tr key={i.instance_id} className="cursor-pointer hover:bg-slate-50" onClick={() => navigate(`/app/incidents?id=${i.instance_id}`)}>
                    <td className="font-mono text-xs">{shortId(i.instance_id)}</td>
                    <td className="font-medium text-slate-900">{seconds(i.spawn_duration)}</td>
                    <td>{i.anomaly_score ? `+${i.anomaly_score}σ` : '—'}</td>
                    <td>{i.predicted_anomaly ? <span className="badge-red">Anomalous</span> : <span className="badge-gray">Normal</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Try asking</h2>
            <Sparkles className="h-4 w-4 text-brand-600" />
          </div>
          <ul className="divide-y divide-slate-100">
            {SUGGESTED.map((q) => (
              <li key={q}>
                <button onClick={() => ask(q)} className="group flex w-full items-start justify-between gap-3 px-5 py-3 text-left text-sm text-slate-700 hover:bg-slate-50">
                  <span className="line-clamp-2 break-all sm:break-normal">{q}</span>
                  <ArrowRight className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-300 group-hover:text-brand-600" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Recent questions</h2>
          <a href="#/app/system" className="text-sm font-medium text-brand-600 hover:underline">Quality report</a>
        </div>
        {evals.records.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-slate-500">No questions yet. Ask the assistant something to get started.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {evals.records.map((r) => (
              <li key={r.timestamp + r.query} className="flex items-center justify-between gap-4 px-5 py-3 text-sm">
                <div className="min-w-0">
                  <p className="truncate text-slate-900">{r.query}</p>
                  <p className="truncate text-xs text-slate-500">{r.hierarchy_path || 'No matching runbook'}</p>
                </div>
                <span className="flex-shrink-0 text-xs text-slate-400">{timeAgo(r.timestamp)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
