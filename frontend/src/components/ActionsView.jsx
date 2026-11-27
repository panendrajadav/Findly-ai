import React, { useState, useEffect } from 'react';
import { ShieldCheck, AlertOctagon, CheckCircle2, XCircle, Clock, Terminal, RefreshCw, Shield } from 'lucide-react';
import FindlyLogo from './FindlyLogo';

export default function ActionsView() {
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewingId, setReviewingId] = useState(null);
  const [filter, setFilter] = useState('ALL'); // ALL, PENDING, APPROVED, REJECTED
  const [statusNotice, setStatusNotice] = useState('');

  const fetchActions = () => {
    setLoading(true);
    fetch('/api/actions')
      .then(r => {
        if (!r.ok) throw new Error('Failed to fetch actions');
        return r.json();
      })
      .then(d => {
        setActions(Array.isArray(d) ? d : []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setActions([]);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchActions();
  }, []);

  const handleReview = (actionId, decision) => {
    setReviewingId(actionId);
    setStatusNotice('');
    fetch(`/api/actions/${actionId}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        decision: decision,
        reviewer_name: 'Lead SRE Operator',
      })
    })
      .then(r => {
        if (!r.ok) throw new Error('Failed to process review');
        return r.json();
      })
      .then(res => {
        setReviewingId(null);
        setStatusNotice(`Action ${actionId} has been ${decision === 'APPROVE' ? 'APPROVED for execution' : 'REJECTED'}.`);
        setTimeout(() => setStatusNotice(''), 5000);
        fetchActions();
      })
      .catch(err => {
        console.error(err);
        setReviewingId(null);
        setStatusNotice('Error processing review decision.');
      });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-80 text-[#878787] space-y-3">
        <div className="w-8 h-8 rounded-full border-2 border-[#05AD98] border-t-transparent animate-spin"></div>
        <span className="text-sm font-medium">Loading DevOps Action Approvals & Safety Invariants...</span>
      </div>
    );
  }

  const pending = actions.filter(a => a.status === 'PENDING_APPROVAL');
  const history = actions.filter(a => a.status !== 'PENDING_APPROVAL');

  const displayedHistory = history.filter(a => {
    if (filter === 'APPROVED') return a.status === 'APPROVED';
    if (filter === 'REJECTED') return a.status === 'REJECTED';
    return true;
  });

  return (
    <div className="space-y-8 max-w-6xl mx-auto px-4 sm:px-6 py-2">
      {/* Policy Safety Invariant Banner */}
      <div className="p-6 rounded-3xl bg-[#0f141c]/90 border border-[#BBBFBF]/15 text-[#FFFFFF] text-xs flex items-start space-x-4 shadow-xl">
        <ShieldCheck className="w-6 h-6 text-[#05AD98] flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-bold text-[#05AD98] text-sm">
            Human-in-the-Loop Safety Invariant
          </div>
          <p className="leading-relaxed text-[#BBBFBF]">
            Findly AI is architected with strict guardrails: the AI assistant can analyze incidents, isolate baseline deviations, and recommend remediation commands, but it is <strong>strictly prohibited</strong> from executing destructive or high-risk commands autonomously. Every operational change requires human operator sign-off.
          </p>
        </div>
      </div>

      {statusNotice && (
        <div className="p-4 bg-[#05AD98]/10 border border-[#05AD98]/30 text-[#FFFFFF] text-xs rounded-2xl flex items-center shadow-lg">
          <CheckCircle2 className="w-4 h-4 mr-2.5 text-[#05AD98] flex-shrink-0" />
          <span>{statusNotice}</span>
        </div>
      )}

      {/* Pending Approvals Queue */}
      <div className="p-6 border border-[#BBBFBF]/15 shadow-2xl rounded-3xl bg-[#0f141c]/90 space-y-4">
        <div className="flex justify-between items-center pb-2 border-b border-[#BBBFBF]/15">
          <h3 className="text-base font-bold text-[#FFFFFF] flex items-center">
            <AlertOctagon className="w-5 h-5 mr-2.5 text-[#05AD98]" />
            Pending Operator Authorization Queue ({pending.length})
          </h3>
          <button
            onClick={fetchActions}
            className="text-xs text-[#BBBFBF] hover:text-[#FFFFFF] flex items-center bg-[#0a0e14] px-3.5 py-1.5 rounded-full border border-[#BBBFBF]/15 transition-colors"
          >
            <RefreshCw className="w-3 h-3 mr-1.5 text-[#05AD98]" /> Refresh
          </button>
        </div>

        {pending.length === 0 ? (
          <div className="text-center py-10 text-[#878787] text-xs">
            No actions currently pending operator review. Propose commands from STAIR Chat to queue them here.
          </div>
        ) : (
          <div className="space-y-3">
            {pending.map((act) => (
              <div
                key={act.action_id}
                className="p-5 rounded-2xl bg-[#0a0e14]/90 border border-[#BBBFBF]/15 space-y-3 hover:border-[#05AD98]/50 transition-all shadow-md"
              >
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-bold text-[#FFFFFF]">
                      {act.action_id}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      act.risk_level === 'HIGH' ? 'bg-rose-950/80 text-rose-300 border border-rose-800' :
                      act.risk_level === 'MEDIUM' ? 'bg-amber-950/60 text-amber-300 border border-amber-700/50' :
                      'bg-[#05AD98]/10 text-[#05AD98] border border-[#05AD98]/30'
                    }`}>
                      {act.risk_level} RISK
                    </span>
                    <span className="text-[11px] text-[#878787]">Target: <strong className="text-[#FFFFFF]">{act.target_resource}</strong></span>
                  </div>

                  <div className="text-[11px] text-[#878787] font-mono">
                    {act.timestamp}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#0f141c] border border-[#BBBFBF]/10">
                  <div className="text-[10px] text-[#05AD98] uppercase font-bold tracking-wider mb-1">
                    Executable Command:
                  </div>
                  <code className="text-[#FFFFFF] font-mono text-xs break-all">
                    {act.command}
                  </code>
                </div>

                <div className="text-xs text-[#BBBFBF]">
                  <strong className="text-[#FFFFFF]">Rationale:</strong> {act.rationale || 'Retrieved from runbook procedure.'}
                </div>

                <div className="flex justify-end space-x-3 pt-2 border-t border-[#BBBFBF]/10">
                  <button
                    onClick={() => handleReview(act.action_id, 'REJECT')}
                    disabled={reviewingId === act.action_id}
                    className="px-4 py-1.5 rounded-full bg-rose-950/80 hover:bg-rose-900 border border-rose-800 text-rose-200 text-xs font-bold transition-colors"
                  >
                    Reject Action
                  </button>
                  <button
                    onClick={() => handleReview(act.action_id, 'APPROVE')}
                    disabled={reviewingId === act.action_id}
                    className="px-5 py-1.5 rounded-full bg-[#05AD98] hover:bg-[#049683] text-[#FFFFFF] text-xs font-bold transition-all shadow-md shadow-[#05AD98]/25"
                  >
                    Authorize & Approve
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Audit History Log */}
      <div className="p-6 border border-[#BBBFBF]/15 shadow-2xl rounded-3xl bg-[#0f141c]/90 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 pb-2 border-b border-[#BBBFBF]/15">
          <h3 className="text-base font-bold text-[#FFFFFF] flex items-center">
            <Clock className="w-5 h-5 mr-2 text-[#05AD98]" />
            Remediation Approval Audit Trail ({history.length})
          </h3>

          <div className="flex items-center space-x-1.5 bg-[#0a0e14] p-1.5 rounded-full border border-[#BBBFBF]/15 text-xs">
            <button
              onClick={() => setFilter('ALL')}
              className={`px-3 py-1 rounded-full transition-all ${filter === 'ALL' ? 'bg-[#05AD98] text-[#FFFFFF] font-bold' : 'text-[#BBBFBF] hover:text-[#FFFFFF]'}`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('APPROVED')}
              className={`px-3 py-1 rounded-full transition-all ${filter === 'APPROVED' ? 'bg-[#05AD98] text-[#FFFFFF] font-bold' : 'text-[#BBBFBF] hover:text-[#FFFFFF]'}`}
            >
              Approved
            </button>
            <button
              onClick={() => setFilter('REJECTED')}
              className={`px-3 py-1 rounded-full transition-all ${filter === 'REJECTED' ? 'bg-[#05AD98] text-[#FFFFFF] font-bold' : 'text-[#BBBFBF] hover:text-[#FFFFFF]'}`}
            >
              Rejected
            </button>
          </div>
        </div>

        {displayedHistory.length === 0 ? (
          <div className="text-center py-8 text-[#878787] text-xs">
            No audit records matching filter.
          </div>
        ) : (
          <div className="divide-y divide-[#BBBFBF]/10 text-xs">
            {displayedHistory.map((act) => (
              <div key={act.action_id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-bold text-[#FFFFFF]">{act.action_id}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                      act.status === 'APPROVED' ? 'bg-[#05AD98]/10 text-[#05AD98] border border-[#05AD98]/30' : 'bg-rose-950/80 text-rose-300 border border-rose-800'
                    }`}>
                      {act.status}
                    </span>
                    <span className="text-[11px] text-[#878787]">Reviewer: <strong className="text-[#FFFFFF]">{act.reviewer_name || 'System Operator'}</strong></span>
                  </div>
                  <code className="text-[#05AD98] font-mono text-[11px] block">{act.command}</code>
                </div>

                <div className="text-[10px] text-[#878787] font-mono text-right flex-shrink-0">
                  {act.reviewed_at || act.timestamp}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
