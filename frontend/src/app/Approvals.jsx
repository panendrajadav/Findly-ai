import React, { useState } from 'react';
import { ShieldCheck, Check, X } from 'lucide-react';
import { api } from '../lib/api';
import { riskBadge, timeAgo } from '../lib/format';
import { PageHeader, Loading, ErrorState, EmptyState, useAsync } from '../components/ui';

const STATUS = {
  PENDING_APPROVAL: ['badge-amber', 'Pending'],
  APPROVED: ['badge-green', 'Approved'],
  EXECUTED: ['badge-green', 'Executed'],
  REJECTED: ['badge-gray', 'Rejected'],
};

export default function Approvals({ session }) {
  const { data, error, loading, reload } = useAsync(() => api.actions());
  const [tab, setTab] = useState('PENDING_APPROVAL');
  const [busy, setBusy] = useState(null);

  const review = async (id, decision) => {
    setBusy(id);
    try { await api.reviewAction(id, decision, session.name); reload(); } finally { setBusy(null); }
  };

  const rows = (data || []).filter((a) => (tab === 'PENDING_APPROVAL' ? a.status === tab : a.status !== 'PENDING_APPROVAL'));
  const pendingCount = (data || []).filter((a) => a.status === 'PENDING_APPROVAL').length;

  return (
    <>
      <PageHeader title="Approvals" subtitle="High-risk commands suggested by the assistant wait here for a human decision." />
      <div className="mb-4 flex gap-6 border-b border-slate-200 text-sm">
        {[['PENDING_APPROVAL', `Pending${pendingCount ? ` (${pendingCount})` : ''}`], ['HISTORY', 'History']].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} className={`-mb-px border-b-2 pb-2.5 font-medium ${tab === k ? 'border-brand-600 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>{l}</button>
        ))}
      </div>
      {loading && <Loading />}
      {error && <ErrorState error={error} onRetry={reload} />}
      {data && (
        <div className="card">
          {rows.length === 0 ? (
            <EmptyState
              icon={ShieldCheck}
              title={tab === 'PENDING_APPROVAL' ? 'Nothing waiting for approval' : 'No decisions yet'}
              body={tab === 'PENDING_APPROVAL' ? 'When the assistant suggests a risky command, use “Request approval” and it shows up here.' : 'Approved and rejected requests will be listed here.'}
            />
          ) : (
            <ul className="divide-y divide-slate-100">
              {rows.map((a) => {
                const [cls, label] = STATUS[a.status] || ['badge-gray', a.status];
                return (
                  <li key={a.action_id} className="flex flex-col gap-3 px-5 py-4 md:flex-row md:items-center md:justify-between">
                    <div className="min-w-0 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={cls}>{label}</span>
                        <span className={riskBadge(a.risk_level)}>{a.risk_level}</span>
                        <span className="text-xs text-slate-500">{a.runbook_title} · {timeAgo(a.requested_at)}</span>
                      </div>
                      <code className="block truncate rounded bg-slate-50 px-2 py-1 font-mono text-xs text-slate-800">{a.command}</code>
                      <p className="text-xs text-slate-500">{a.rationale}</p>
                      {a.reviewed_by && <p className="text-xs text-slate-500">Reviewed by {a.reviewed_by} {timeAgo(a.reviewed_at)}</p>}
                    </div>
                    {a.status === 'PENDING_APPROVAL' && (
                      <div className="flex flex-shrink-0 gap-2">
                        <button className="btn-secondary btn-sm" disabled={busy === a.action_id} onClick={() => review(a.action_id, 'REJECT')}><X className="h-3.5 w-3.5" /> Reject</button>
                        <button className="btn-primary btn-sm" disabled={busy === a.action_id} onClick={() => review(a.action_id, 'APPROVE')}><Check className="h-3.5 w-3.5" /> Approve</button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </>
  );
}
