import React, { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  ArrowUp, BookOpen, ChevronDown, ChevronRight, Copy, Check, Loader2, ShieldAlert, Sparkles, FileText,
} from 'lucide-react';
import { api } from '../lib/api';
import { riskBadge } from '../lib/format';
import { SUGGESTED } from './Overview';

function Breadcrumb({ path }) {
  if (!path) return null;
  const parts = path.split(' > ');
  return (
    <div className="flex flex-wrap items-center gap-1 text-xs text-slate-500">
      <BookOpen className="h-3.5 w-3.5" />
      {parts.map((p, i) => (
        <React.Fragment key={i}>
          {i > 0 && <ChevronRight className="h-3 w-3 text-slate-300" />}
          <span className={i === parts.length - 1 ? 'font-medium text-slate-700' : ''}>{p}</span>
        </React.Fragment>
      ))}
    </div>
  );
}

function CommandRow({ cmd, onPropose }) {
  const [copied, setCopied] = useState(false);
  const [state, setState] = useState('idle');
  const highRisk = cmd.risk_level === 'HIGH' || cmd.risk_level === 'CRITICAL';
  return (
    <div className="rounded-lg border border-slate-200">
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 bg-slate-50 px-3 py-1.5">
        <span className={riskBadge(cmd.risk_level)}>{cmd.risk_level} risk</span>
        <div className="flex items-center gap-1">
          <button
            className="btn-ghost btn-sm"
            onClick={() => { navigator.clipboard.writeText(cmd.command); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />} {copied ? 'Copied' : 'Copy'}
          </button>
          {highRisk && (
            <button
              className="btn-secondary btn-sm"
              disabled={state !== 'idle'}
              onClick={() => { setState('sending'); onPropose(cmd).then(() => setState('sent')).catch(() => setState('idle')); }}
            >
              {state === 'sending' && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {state === 'sent' ? 'Sent for approval' : 'Request approval'}
            </button>
          )}
        </div>
      </div>
      <pre className="overflow-x-auto px-3 py-2.5 font-mono text-xs text-slate-800">{cmd.command}</pre>
    </div>
  );
}

function Evidence({ citations }) {
  const [open, setOpen] = useState(false);
  if (!citations?.length) return null;
  return (
    <div className="rounded-lg border border-slate-200">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center justify-between px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50">
        <span className="flex items-center gap-2"><FileText className="h-3.5 w-3.5" /> Evidence · {citations.length} log lines</span>
        <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="max-h-72 overflow-auto border-t border-slate-100">
          {citations.map((c, i) => (
            <div key={i} className="border-b border-slate-100 px-3 py-2 font-mono text-[11px] last:border-b-0">
              <div className="text-slate-400">{c.file}:{c.line} · {c.timestamp} · {c.level}</div>
              <div className="mt-0.5 break-words text-slate-700">{c.message}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AssistantMessage({ data, onPropose, onExplain, busy }) {
  // Small talk and plain-language follow-ups: a light, conversational bubble.
  if (data.intent === 'conversation' || data.intent === 'clarification') {
    return (
      <div className="max-w-[90%] rounded-2xl rounded-bl-sm border border-slate-200 bg-white px-4 py-3 shadow-card">
        <div className="md"><ReactMarkdown remarkPlugins={[remarkGfm]}>{data.detailed_explanation || ''}</ReactMarkdown></div>
      </div>
    );
  }
  return (
    <div className="card space-y-4 p-5">
      <Breadcrumb path={data.hierarchy_path} />
      <div className="md">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{data.detailed_explanation || data.summary || ''}</ReactMarkdown>
      </div>
      {data.proposed_commands?.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Suggested commands</p>
          {data.proposed_commands.map((c, i) => <CommandRow key={i} cmd={c} onPropose={(cmd) => onPropose(cmd, data)} />)}
        </div>
      )}
      {data.requires_approval && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-800">
          <ShieldAlert className="mt-0.5 h-4 w-4 flex-shrink-0" />
          High-risk commands are never run automatically. Send them for approval and an operator will review them.
        </div>
      )}
      <Evidence citations={data.evidence_citations} />
      {onExplain && (
        <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
          <span className="text-xs text-slate-500">Too technical?</span>
          <button className="btn-secondary btn-sm" disabled={busy} onClick={onExplain}>
            <Sparkles className="h-3.5 w-3.5" /> Explain this simply
          </button>
        </div>
      )}
    </div>
  );
}

export default function Assistant({ session, route }) {
  const [messages, setMessages] = useState([]);
  // Each conversation gets its own server-side session so follow-ups refer to the right answer.
  const [conversationId, setConversationId] = useState(session.sessionId);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState('');
  const endRef = useRef(null);
  const handledQuery = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, [messages, busy]);

  const send = async (text) => {
    const q = text.trim();
    if (!q || busy) return;
    setInput('');
    setMessages((m) => [...m, { role: 'user', text: q }]);
    setBusy(true);
    try {
      const data = await api.chat(q, conversationId);
      setMessages((m) => [...m, { role: 'assistant', data }]);
    } catch (e) {
      setMessages((m) => [...m, { role: 'error', text: e.message }]);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    const q = new URLSearchParams(route.split('?')[1] || '').get('q');
    if (q && handledQuery.current !== q) {
      handledQuery.current = q;
      window.history.replaceState(null, '', '#/app/assistant');
      send(q);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route]);

  const propose = (cmd, data) =>
    api.proposeAction({
      command: cmd.command,
      target_resource: cmd.target || 'compute-host',
      runbook_title: (data.hierarchy_path || '').split(' > ')[0] || 'Runbook',
      risk_level: cmd.risk_level,
      rationale: `Suggested by the assistant for: "${data.query}"`,
    }).then(() => { setToast('Sent for approval. Track it under Approvals.'); setTimeout(() => setToast(''), 4000); });

  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col">
      <div className="mb-4 flex items-end justify-between">
        <div>
          <h1 className="page-title">Assistant</h1>
          <p className="page-subtitle">Answers come from your runbooks and are backed by log evidence.</p>
        </div>
        {messages.length > 0 && <button className="btn-ghost btn-sm" onClick={() => { setMessages([]); setConversationId(`${session.sessionId}_${Date.now().toString(36)}`); }}>New conversation</button>}
      </div>

      <div className="flex-1 space-y-4 pb-4">
        {messages.length === 0 && (
          <div className="card px-6 py-12 text-center">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-brand-50 text-brand-600"><Sparkles className="h-5 w-5" /></div>
            <h2 className="mt-4 font-semibold text-slate-900">What would you like to investigate?</h2>
            <p className="mt-1 text-sm text-slate-500">Ask about a VM, an error, or how to fix something. If an answer is unclear, just say “I don&apos;t understand”.</p>
            <div className="mx-auto mt-6 grid max-w-2xl gap-2 sm:grid-cols-2">
              {SUGGESTED.map((q) => (
                <button key={q} onClick={() => send(q)} className="rounded-lg border border-slate-200 px-4 py-3 text-left text-sm text-slate-700 hover:border-brand-200 hover:bg-brand-50/50">
                  <span className="line-clamp-2 break-words">{q}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => {
          if (m.role === 'user') {
            return (
              <div key={i} className="flex justify-end">
                <div className="max-w-[85%] break-words rounded-2xl rounded-br-sm bg-brand-600 px-4 py-2.5 text-sm text-white">{m.text}</div>
              </div>
            );
          }
          if (m.role === 'error') {
            return <div key={i} className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">Something went wrong: {m.text}</div>;
          }
          // Only the latest detailed answer can be re-explained (the server remembers the last one).
          const isLastAnswer = i === messages.length - 1;
          return (
            <AssistantMessage
              key={i}
              data={m.data}
              onPropose={propose}
              busy={busy}
              onExplain={isLastAnswer ? () => send('Can you explain that in simple terms?') : undefined}
            />
          );
        })}

        {busy && (
          <div className="card flex items-center gap-2 px-5 py-4 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Searching runbooks and logs…
          </div>
        )}
        <div ref={endRef} />
      </div>

      {toast && <div className="mb-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-800">{toast}</div>}

      <form
        onSubmit={(e) => { e.preventDefault(); send(input); }}
        className="sticky bottom-4 flex items-end gap-2 rounded-xl border border-slate-300 bg-white p-2 shadow-pop focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/20"
      >
        <textarea
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input); } }}
          placeholder="Ask about an incident, a VM ID, or a fix…"
          className="max-h-40 flex-1 resize-none border-0 bg-transparent px-2 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
        />
        <button type="submit" className="btn-primary h-9 w-9 p-0" disabled={!input.trim() || busy} aria-label="Send">
          <ArrowUp className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
