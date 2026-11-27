import React, { useMemo, useState } from 'react';
import { X, MessageSquare, Search } from 'lucide-react';
import { api } from '../lib/api';
import { navigate } from '../lib/router';
import { pct, seconds, shortId } from '../lib/format';
import { PageHeader, StatCard, Loading, ErrorState, useAsync } from '../components/ui';
import { ask } from './Overview';

function DetailPanel({ id, summary, onClose }) {
  const res = useAsync(() => api.incident(id), [id]);
  const { error, loading } = res;
  // The detail endpoint doesn't run detection, so take anomaly fields from the ranked list.
  const data = res.data && summary
    ? { ...res.data, predicted_anomaly: summary.predicted_anomaly, anomaly_score: summary.anomaly_score, anomaly_reason: summary.anomaly_reason }
    : res.data;
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-slate-900/30" onClick={onClose} />
      <aside className="absolute inset-y-0 right-0 flex w-full max-w-xl flex-col bg-white shadow-pop">
        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-4">
          <div className="min-w-0">
            <p className="text-xs text-slate-500">Instance</p>
            <p className="truncate font-mono text-sm font-medium text-slate-900">{id}</p>
          </div>
          <button className="btn-ghost p-1.5" onClick={onClose} aria-label="Close"><X className="h-5 w-5" /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {loading && <Loading />}
          {error && <ErrorState error={error} />}
          {data && (
            <div className="space-y-6">
              <div className="flex flex-wrap gap-2">
                {data.predicted_anomaly ? <span className="badge-red">Anomalous</span> : <span className="badge-gray">Normal</span>}
                {data.is_known_anomaly && <span className="badge-amber">Confirmed in labels</span>}
                <span className="badge-gray">{data.file_source}</span>
              </div>
              {data.anomaly_reason && <p className="text-sm text-slate-700">{data.anomaly_reason}</p>}
              <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                {[
                  ['Spawn time', seconds(data.spawn_duration)],
                  ['Build time', seconds(data.build_duration)],
                  ['Deviation', data.anomaly_score ? `+${data.anomaly_score}σ` : '—'],
                  ['vCPU', data.vcpu ?? '—'],
                  ['Memory', data.memory_mb ? `${data.memory_mb} MB` : '—'],
                  ['Disk', data.disk_gb ? `${data.disk_gb} GB` : '—'],
                ].map(([k, v]) => (
                  <div key={k} className="rounded-lg border border-slate-200 px-3 py-2">
                    <dt className="text-xs text-slate-500">{k}</dt>
                    <dd className="mt-0.5 text-sm font-semibold text-slate-900">{v}</dd>
                  </div>
                ))}
              </dl>

              <button className="btn-primary w-full" onClick={() => ask(`Why did instance ${data.instance_id} take so long to spawn?`)}>
                <MessageSquare className="h-4 w-4" /> Ask the assistant about this VM
              </button>

              {data.milestones?.length > 0 && (
                <div>
                  <h3 className="mb-3 text-sm font-semibold text-slate-900">Lifecycle</h3>
                  <ol className="relative space-y-3 border-l border-slate-200 pl-5">
                    {data.milestones.map((m, i) => (
                      <li key={i} className="relative">
                        <span className="absolute -left-[25px] top-1.5 h-2 w-2 rounded-full bg-brand-600 ring-4 ring-white" />
                        <p className="text-sm text-slate-800">{m.event}</p>
                        <p className="font-mono text-xs text-slate-400">{m.time.replace('T', ' ')}</p>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              <div>
                <h3 className="mb-3 text-sm font-semibold text-slate-900">Log lines ({data.log_events.length})</h3>
                <div className="max-h-96 overflow-auto rounded-lg border border-slate-200">
                  {data.log_events.map((l) => (
                    <div key={l.line} className="border-b border-slate-100 px-3 py-2 font-mono text-[11px] last:border-b-0">
                      <span className="text-slate-400">#{l.line} {l.timestamp} </span>
                      <span className={l.level === 'ERROR' ? 'text-red-600' : l.level === 'WARNING' ? 'text-amber-600' : 'text-slate-500'}>{l.level} </span>
                      <span className="break-words text-slate-700">{l.message}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}

export default function Incidents({ route }) {
  const { data, error, loading, reload } = useAsync(() => api.incidents());
  const [filter, setFilter] = useState('anomalous');
  const [query, setQuery] = useState('');
  const selected = new URLSearchParams(route.split('?')[1] || '').get('id');

  const rows = useMemo(() => {
    if (!data) return [];
    return data.incidents
      .filter((i) => (filter === 'anomalous' ? i.predicted_anomaly : true))
      .filter((i) => i.instance_id.includes(query.trim().toLowerCase()));
  }, [data, filter, query]);

  const m = data?.evaluation_metrics;

  return (
    <>
      <PageHeader title="Incidents" subtitle="VM spawns compared against the normal baseline. Click a row for the full timeline." />
      {loading && <Loading />}
      {error && <ErrorState error={error} onRetry={reload} />}
      {data && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="VMs analysed" value={data.total_vms} />
            <StatCard label="Flagged" value={data.total_anomalies_detected} />
            <StatCard label="Recall" value={pct(m.recall)} hint={`${m.tp} of ${m.tp + m.fn} known incidents found`} />
            <StatCard label="Precision" value={pct(m.precision)} hint={`${m.fp} false alarm${m.fp === 1 ? '' : 's'}`} />
          </div>

          <div className="card">
            <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="inline-flex rounded-lg border border-slate-200 p-0.5 text-sm">
                {[['anomalous', 'Anomalous'], ['all', 'All VMs']].map(([k, l]) => (
                  <button key={k} onClick={() => setFilter(k)} className={`rounded-md px-3 py-1 font-medium ${filter === k ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'}`}>{l}</button>
                ))}
              </div>
              <div className="relative sm:w-72">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input className="input pl-9" placeholder="Filter by instance ID" value={query} onChange={(e) => setQuery(e.target.value)} />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="table-base">
                <thead><tr><th>Instance</th><th>Spawn</th><th>Build</th><th>Deviation</th><th>Resources</th><th>Status</th></tr></thead>
                <tbody>
                  {rows.map((i) => (
                    <tr key={i.instance_id} className="cursor-pointer hover:bg-slate-50" onClick={() => navigate(`/app/incidents?id=${i.instance_id}`)}>
                      <td className="font-mono text-xs" title={i.instance_id}>{shortId(i.instance_id)}</td>
                      <td className="font-medium text-slate-900">{seconds(i.spawn_duration)}</td>
                      <td>{seconds(i.build_duration)}</td>
                      <td>{i.anomaly_score ? `+${i.anomaly_score}σ` : '—'}</td>
                      <td className="text-xs text-slate-500">{i.vcpu} vCPU · {i.memory_mb} MB · {i.disk_gb} GB</td>
                      <td className="space-x-1 whitespace-nowrap">
                        {i.predicted_anomaly ? <span className="badge-red">Anomalous</span> : <span className="badge-gray">Normal</span>}
                        {i.is_known_anomaly && <span className="badge-amber">Confirmed</span>}
                      </td>
                    </tr>
                  ))}
                  {rows.length === 0 && <tr><td colSpan={6} className="py-10 text-center text-slate-500">No VMs match.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      {selected && <DetailPanel id={selected} summary={data?.incidents.find((i) => i.instance_id === selected)} onClose={() => navigate('/app/incidents')} />}
    </>
  );
}
