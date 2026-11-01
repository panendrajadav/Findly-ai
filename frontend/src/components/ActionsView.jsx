import React, { useState, useEffect } from 'react';
import { ShieldCheck, AlertOctagon, CheckCircle2, XCircle, Clock, Terminal, RefreshCw } from 'lucide-react';

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
      <div className="flex flex-col items-center justify-center h-80 text-slate-400 space-y-3">
        <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin"></div>
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
    <div className="space-y-8 max-w-7xl mx-auto py-2">
      {/* Header Info */}
      <div className="glass-card p-8 border border-white/10 shadow-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-[#0a0e16]/80 rounded-3xl">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center">
            <ShieldCheck className="w-6 h-6 mr-3 text-emerald-400" />
            DevOps Human-in-the-Loop Action Approval Engine
          </h3>
          <p className="text-xs md:text-sm text-slate-400 mt-2 max-w-2xl leading-relaxed">
            Strict safety invariant: High and medium-risk remediation commands require human operator approval. Findly AI never executes destructive operations autonomously.
          </p>
        </div>
        <button
          onClick={fetchActions}
          className="text-xs text-slate-400 hover:text-white flex items-center bg-[#10141f] px-5 py-2.5 rounded-full border border-white/10 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5 mr-2" /> Refresh List
        </button>
      </div>

      {statusNotice && (
        <div className="p-4 bg-emerald-950/60 border border-emerald-600 text-emerald-200 text-xs rounded-2xl flex items-center shadow-lg">
          <CheckCircle2 className="w-4 h-4 mr-2.5 text-emerald-400" />
          <span>{statusNotice}</span>
        </div>
      )}

      {/* Pending Actions Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-white flex items-center">
            <AlertOctagon className="w-4 h-4 mr-2 text-emerald-400" />
            Pending Approval Requests ({pending.length})
          </h4>
        </div>

        {pending.length === 0 ? (
          <div className="glass-card p-10 text-center text-slate-400 text-xs bg-[#0a0e16]/60 border border-white/5 rounded-3xl">
            No pending action requests. When high-risk remediation commands are recommended in STAIR Chat, operators can submit them for formal review.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5">
            {pending.map((act) => (
              <div key={act.action_id} className="glass-card p-6 border border-white/10 rounded-3xl space-y-4 shadow-xl bg-[#0a0e16]/80">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                  <div className="flex items-center space-x-2 text-xs">
                    <span className="font-mono text-slate-400 bg-[#06080d] px-3 py-1 rounded-full border border-white/5">{act.action_id}</span>
                    <span className="text-slate-500">•</span>
                    <span className="font-semibold text-slate-200">{act.runbook_title}</span>
                  </div>
                  <span className={`px-3 py-0.5 rounded-full text-[10px] font-bold ${
                    act.risk_level === 'HIGH' ? 'bg-rose-950/80 text-rose-300 border border-rose-800' :
                    act.risk_level === 'MEDIUM' ? 'bg-amber-950/80 text-amber-300 border border-amber-800' :
                    'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                  }`}>
                    {act.risk_level} RISK
                  </span>
                </div>

                <div className="bg-[#06080d] p-4 rounded-2xl border border-white/5">
                  <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-2 flex items-center">
                    <Terminal className="w-3.5 h-3.5 mr-1 text-emerald-400" /> Command Requested
                  </div>
                  <code className="text-emerald-400 font-mono text-xs break-all">{act.command}</code>
                </div>

                <div className="text-xs text-slate-300 flex flex-wrap gap-5">
                  <div>
                    <span className="text-slate-500 font-semibold">Target: </span>
                    <span className="text-slate-300 font-mono">{act.target_resource}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-semibold">Rationale: </span>
                    <span className="text-slate-300">{act.rationale}</span>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-3 border-t border-white/5">
                  <button
                    onClick={() => handleReview(act.action_id, 'REJECT')}
                    disabled={reviewingId === act.action_id}
                    className="flex items-center bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/80 px-5 py-2 rounded-full text-xs font-medium transition-colors"
                  >
                    <XCircle className="w-3.5 h-3.5 mr-2" />
                    Reject Action
                  </button>
                  <button
                    onClick={() => handleReview(act.action_id, 'APPROVE')}
                    disabled={reviewingId === act.action_id}
                    className="flex items-center bg-emerald-500 hover:bg-emerald-400 text-black px-5 py-2 rounded-full text-xs font-bold transition-all shadow-lg shadow-emerald-500/25"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 mr-2" />
                    Approve & Run
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action Audit Trail History */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-white flex items-center">
            <Clock className="w-4 h-4 mr-2 text-emerald-400" />
            Operator Review Audit History ({history.length})
          </h4>
          <div className="flex items-center space-x-1 bg-[#06080d] p-1.5 rounded-full border border-white/10 text-xs">
            <button
              onClick={() => setFilter('ALL')}
              className={`px-3.5 py-1 rounded-full transition-all ${filter === 'ALL' ? 'bg-emerald-500 text-black font-semibold' : 'text-slate-400'}`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('APPROVED')}
              className={`px-3.5 py-1 rounded-full transition-all ${filter === 'APPROVED' ? 'bg-emerald-500 text-black font-semibold' : 'text-slate-400'}`}
            >
              Approved
            </button>
            <button
              onClick={() => setFilter('REJECTED')}
              className={`px-3.5 py-1 rounded-full transition-all ${filter === 'REJECTED' ? 'bg-emerald-500 text-black font-semibold' : 'text-slate-400'}`}
            >
              Rejected
            </button>
          </div>
        </div>

        <div className="glass-card overflow-hidden border border-white/10 bg-[#0a0e16]/80 rounded-3xl shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#06080d] text-slate-400 border-b border-white/10">
                <tr>
                  <th className="p-4">Action ID</th>
                  <th className="p-4">Command</th>
                  <th className="p-4">Target</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Reviewer</th>
                  <th className="p-4">Decision Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {displayedHistory.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">
                      No operator approval audit records recorded yet.
                    </td>
                  </tr>
                ) : (
                  displayedHistory.map((act) => (
                    <tr key={act.action_id} className="hover:bg-white/5">
                      <td className="p-4 font-mono text-slate-400">{act.action_id}</td>
                      <td className="p-4 font-mono text-emerald-400 max-w-xs truncate">{act.command}</td>
                      <td className="p-4 text-slate-300">{act.target_resource}</td>
                      <td className="p-4">
                        {act.status === 'APPROVED' ? (
                          <span className="bg-emerald-950/80 text-emerald-300 border border-emerald-800 px-3 py-0.5 rounded-full text-[10px] font-semibold">
                            APPROVED
                          </span>
                        ) : (
                          <span className="bg-rose-950/80 text-rose-300 border border-rose-800 px-3 py-0.5 rounded-full text-[10px] font-semibold">
                            REJECTED
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-slate-300">{act.reviewed_by || '-'}</td>
                      <td className="p-4 text-slate-400 font-mono text-[10px]">
                        {act.reviewed_at ? act.reviewed_at.replace('T', ' ').split('.')[0] : '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
