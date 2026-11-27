import React from 'react';
import { RefreshCw } from 'lucide-react';
import { api } from '../lib/api';
import { pct, timeAgo } from '../lib/format';
import { PageHeader, StatCard, Loading, ErrorState, useAsync } from '../components/ui';

const uptime = (s) => {
  if (s == null) return '—';
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`;
};

export default function System() {
  const { data, error, loading, reload } = useAsync(() =>
    Promise.all([api.health(), api.metrics(), api.evals(25)]).then(([health, metrics, evals]) => ({ health, metrics, evals })));

  return (
    <>
      <PageHeader
        title="System health"
        subtitle="Live service metrics and answer-quality checks for this deployment."
        actions={<button className="btn-secondary" onClick={reload}><RefreshCw className="h-4 w-4" /> Refresh</button>}
      />
      {loading && !data && <Loading />}
      {error && <ErrorState error={error} onRetry={reload} />}
      {data && (() => {
        const { health, metrics, evals } = data;
        const r = metrics.requests;
        const e = evals.summary;
        return (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label="Status" value={health.status === 'HEALTHY' ? 'Operational' : health.status} hint={`Up ${uptime(r.uptime_seconds)}`} />
              <StatCard label="Requests" value={r.requests_total.toLocaleString()} hint={`${pct(r.error_rate)} server errors`} />
              <StatCard label="Latency p50 / p95" value={`${r.latency_ms.p50} / ${r.latency_ms.p95} ms`} />
              <StatCard label="Indexed" value={`${health.indexed_sections} sections`} hint={`${health.openstack_logs_loaded.toLocaleString()} log lines`} />
            </div>

            <div className="card">
              <div className="card-header"><h2 className="card-title">Answer quality</h2><span className="text-xs text-slate-500">{e.queries_evaluated || 0} questions since restart</span></div>
              {e.queries_evaluated ? (
                <div className="grid gap-px bg-slate-100 sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    ['Matched a runbook', pct(e.procedure_found_rate)],
                    ['Backed by log evidence', pct(e.grounded_with_evidence_rate)],
                    ['Valid section path', pct(e.trie_valid_leaf_rate)],
                    ['Avg. answer time', `${e.latency_ms.p50} ms`],
                  ].map(([k, v]) => (
                    <div key={k} className="bg-white px-5 py-4">
                      <p className="text-xs text-slate-500">{k}</p>
                      <p className="mt-1 text-lg font-semibold text-slate-900">{v}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="px-5 py-8 text-center text-sm text-slate-500">Quality checks appear after the first question.</p>
              )}
            </div>

            <div className="card">
              <div className="card-header"><h2 className="card-title">Recent questions</h2></div>
              <div className="overflow-x-auto">
                <table className="table-base">
                  <thead><tr><th>Question</th><th>Runbook section</th><th>Score</th><th>Evidence</th><th>Time</th><th /></tr></thead>
                  <tbody>
                    {evals.records.map((x) => (
                      <tr key={x.timestamp + x.query}>
                        <td className="max-w-xs truncate text-slate-900" title={x.query}>{x.query}</td>
                        <td className="max-w-xs truncate text-xs" title={x.hierarchy_path}>
                          {x.procedure_found ? x.hierarchy_path.split(' > ').slice(-1)[0] : <span className="badge-amber">No match</span>}
                        </td>
                        <td className="font-mono text-xs">{x.retrieval_score.toFixed(2)}</td>
                        <td>{x.citation_count}</td>
                        <td className="whitespace-nowrap text-xs">{Math.round(x.latency_ms)} ms</td>
                        <td className="whitespace-nowrap text-xs text-slate-400">{timeAgo(x.timestamp)}</td>
                      </tr>
                    ))}
                    {evals.records.length === 0 && <tr><td colSpan={6} className="py-8 text-center text-slate-500">No questions yet.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="card">
              <div className="card-header"><h2 className="card-title">Endpoints</h2></div>
              <div className="overflow-x-auto">
                <table className="table-base">
                  <thead><tr><th>Route</th><th>Requests</th><th>Errors</th><th>p50</th><th>p95</th></tr></thead>
                  <tbody>
                    {Object.entries(r.routes).sort((a, b) => b[1].count - a[1].count).map(([k, v]) => (
                      <tr key={k}>
                        <td className="font-mono text-xs">{k}</td>
                        <td>{v.count}</td>
                        <td>{v.errors}</td>
                        <td className="text-xs">{v.p50_ms} ms</td>
                        <td className="text-xs">{v.p95_ms} ms</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      })()}
    </>
  );
}
