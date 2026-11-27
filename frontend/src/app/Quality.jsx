import React, { useState } from 'react';
import { RefreshCw, CheckCircle2, XCircle } from 'lucide-react';
import { api } from '../lib/api';
import { PageHeader, StatCard, Loading, ErrorState, EmptyState, useAsync } from '../components/ui';
import LineChart, { SERIES_COLORS } from '../components/LineChart';

const shortDate = (iso) => (iso ? new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '');
const ms = (v) => (v == null ? '—' : `${Number(v) === 0 ? 0 : Number(v) < 10 ? Number(v).toFixed(1) : Math.round(v)} ms`);
const pctFmt = (v) => `${Math.round(v * 100)}%`;
const ENV_LABEL = { 'github-actions': 'CI', local: 'Local', 'local-backfill': 'Backfill' };

function Card({ title, subtitle, children, right }) {
  return (
    <div className="card">
      <div className="card-header">
        <div>
          <h2 className="card-title">{title}</h2>
          {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
        </div>
        {right}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function HistoryTable({ runs }) {
  return (
    <div className="overflow-x-auto">
      <table className="table-base">
        <thead>
          <tr><th>Date</th><th>Commit</th><th>Accuracy</th><th>p50</th><th>p95</th><th>Failed cases</th><th>Ran on</th></tr>
        </thead>
        <tbody>
          {[...runs].reverse().map((r) => (
            <tr key={`${r.commit}-${r.timestamp}`}>
              <td className="whitespace-nowrap text-xs">{shortDate(r.commit_date || r.timestamp)}</td>
              <td className="max-w-xs">
                <span className="font-mono text-xs text-slate-900">{r.commit}</span>
                <span className="ml-2 truncate text-xs text-slate-500">{r.commit_message}</span>
              </td>
              <td className="font-medium text-slate-900">{r.passed}/{r.total} · {pctFmt(r.accuracy)}</td>
              <td className="text-xs">{ms(r.latency_ms?.p50)}</td>
              <td className="text-xs">{ms(r.latency_ms?.p95)}</td>
              <td className="max-w-[220px] truncate text-xs text-slate-500" title={(r.failed_cases || []).join(', ')}>
                {(r.failed_cases || []).length ? r.failed_cases.join(', ') : 'None'}
              </td>
              <td><span className="badge-gray">{ENV_LABEL[r.environment] || r.environment || '—'}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Quality() {
  const [refresh, setRefresh] = useState(0);
  const { data, error, loading, reload } = useAsync(
    () => Promise.all([api.evalHistory(refresh > 0), api.evals(100)]).then(([history, live]) => ({ history, live })),
    [refresh],
  );
  const [showTable, setShowTable] = useState(false);

  return (
    <>
      <PageHeader
        title="Answer quality"
        subtitle="Accuracy and response time on a fixed set of test questions, recorded by CI for every commit."
        actions={<button className="btn-secondary" onClick={() => setRefresh((r) => r + 1)}><RefreshCw className="h-4 w-4" /> Refresh</button>}
      />
      {loading && !data && <Loading />}
      {error && <ErrorState error={error} onRetry={reload} />}
      {data && <QualityBody {...data} showTable={showTable} setShowTable={setShowTable} />}
    </>
  );
}

function QualityBody({ history, live, showTable, setShowTable }) {
  const runs = history.runs || [];
  if (!runs.length) {
    return (
      <div className="card">
        <EmptyState
          title="No evaluation runs yet"
          body={history.errors?.length ? `Couldn't load history: ${history.errors.join(' · ')}` : 'Results appear here after CI runs the eval on main.'}
        />
      </div>
    );
  }

  const last = runs[runs.length - 1];
  const prev = runs.length > 1 ? runs[runs.length - 2] : null;
  const delta = prev ? Math.round((last.accuracy - prev.accuracy) * 100) : null;
  const xLabels = runs.map((r) => r.commit);
  const xDetails = runs.map((r) => `${shortDate(r.commit_date || r.timestamp)} · ${r.commit_message || ''}`);
  const latest = history.latest?.commit === last.commit ? history.latest : null;

  const liveRecords = [...(live.records || [])].reverse();

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Latest accuracy"
          value={pctFmt(last.accuracy)}
          hint={`${last.passed} of ${last.total} questions · ${delta == null ? 'first run' : `${delta >= 0 ? '+' : ''}${delta} pts vs previous`}`}
        />
        <StatCard label="Median answer time" value={ms(last.latency_ms?.p50)} hint={`Commit ${last.commit}`} />
        <StatCard label="95th percentile" value={ms(last.latency_ms?.p95)} hint="Slowest 5% of questions" />
        <StatCard label="Runs recorded" value={runs.length} hint={history.source === 'github' ? 'From the eval-history branch' : 'From a local file'} />
      </div>

      <Card title="Accuracy per commit" subtitle="Share of test questions answered correctly">
        <LineChart
          ariaLabel={`Accuracy per commit, from ${pctFmt(runs[0].accuracy)} to ${pctFmt(last.accuracy)}`}
          series={[{ key: 'acc', label: 'Accuracy', color: SERIES_COLORS[0], values: runs.map((r) => r.accuracy) }]}
          xLabels={xLabels}
          xDetails={xDetails}
          yMax={1}
          yFormat={pctFmt}
        />
      </Card>

      <Card
        title="Response time per commit"
        subtitle="Time to retrieve and compose each answer. Compare runs from the same environment (see table)."
      >
        <LineChart
          ariaLabel="Median and 95th percentile answer time per commit"
          series={[
            { key: 'p50', label: 'p50', color: SERIES_COLORS[0], values: runs.map((r) => r.latency_ms?.p50 ?? null) },
            { key: 'p95', label: 'p95', color: SERIES_COLORS[1], values: runs.map((r) => r.latency_ms?.p95 ?? null) },
          ]}
          xLabels={xLabels}
          xDetails={xDetails}
          yFormat={ms}
        />
      </Card>

      <Card
        title="Run history"
        right={<button className="btn-ghost btn-sm" onClick={() => setShowTable(!showTable)}>{showTable ? 'Hide' : 'Show'} table</button>}
      >
        {showTable ? <HistoryTable runs={runs} /> : (
          <p className="text-sm text-slate-500">{runs.length} runs from {shortDate(runs[0].commit_date || runs[0].timestamp)} to {shortDate(last.commit_date || last.timestamp)}. Show the table for every value.</p>
        )}
      </Card>

      {latest && (
        <Card title={`Latest run · ${latest.commit}`} subtitle={latest.commit_message}>
          <ul className="divide-y divide-slate-100">
            {latest.cases.map((c) => (
              <li key={c.id} className="flex items-start gap-3 py-2.5 text-sm">
                {c.passed
                  ? <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-600" aria-label="Passed" />
                  : <XCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-600" aria-label="Failed" />}
                <div className="min-w-0 flex-1">
                  <p className="text-slate-900">{c.query}</p>
                  {!c.passed && <p className="mt-0.5 text-xs text-red-700">{c.failures.join('; ')}</p>}
                </div>
                <span className="flex-shrink-0 text-xs text-slate-500">{ms(c.latency_ms)}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card title="This deployment" subtitle="Response time of real questions asked here since the last restart">
        {liveRecords.length < 2 ? (
          <p className="text-sm text-slate-500">Ask the assistant a couple of questions to see live response times.</p>
        ) : (
          <LineChart
            ariaLabel="Response time of recent questions on this deployment"
            series={[{ key: 'live', label: 'Response time', color: SERIES_COLORS[0], values: liveRecords.map((r) => r.latency_ms) }]}
            xLabels={liveRecords.map((r) => new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))}
            xDetails={liveRecords.map((r) => r.query)}
            yFormat={ms}
            height={200}
          />
        )}
      </Card>
    </div>
  );
}
