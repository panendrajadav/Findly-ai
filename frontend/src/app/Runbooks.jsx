import React, { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { BookOpen, Upload, Trash2, Loader2, FileText } from 'lucide-react';
import { api } from '../lib/api';
import { PageHeader, Loading, ErrorState, EmptyState, useAsync } from '../components/ui';

function Sections({ docId }) {
  const { data, error, loading } = useAsync(() => api.sections(docId), [docId]);
  const [active, setActive] = useState(null);
  useEffect(() => { setActive(null); }, [docId]);
  if (loading) return <Loading />;
  if (error) return <ErrorState error={error} />;
  const leaves = data.filter((s) => s.is_leaf);
  const current = leaves.find((s) => s.id === active) || leaves[0];
  return (
    <div className="grid min-h-[420px] md:grid-cols-[240px_1fr]">
      <nav className="border-b border-slate-200 p-2 md:border-b-0 md:border-r">
        {leaves.map((s) => (
          <button
            key={s.id}
            onClick={() => setActive(s.id)}
            className={`block w-full rounded-md px-3 py-2 text-left text-sm ${current?.id === s.id ? 'bg-slate-100 font-medium text-slate-900' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            {s.title}
          </button>
        ))}
      </nav>
      {current && (
        <article className="min-w-0 p-6">
          <p className="mb-3 text-xs text-slate-500">{current.hierarchy_path.split(' > ').join(' › ')}</p>
          <h2 className="mb-4 text-lg font-semibold text-slate-900">{current.title}</h2>
          <div className="md"><ReactMarkdown remarkPlugins={[remarkGfm]}>{current.content}</ReactMarkdown></div>
        </article>
      )}
    </div>
  );
}

export default function Runbooks() {
  const { data, error, loading, reload } = useAsync(() => api.documents());
  const [selected, setSelected] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState(null);
  const fileRef = useRef(null);

  useEffect(() => {
    if (data?.length && !data.find((d) => d.id === selected)) setSelected(data[0].id);
  }, [data, selected]);

  const onUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true); setMessage(null);
    try {
      const res = await api.uploadDocument(file);
      setMessage({ ok: true, text: `Added “${file.name}”${res.total_sections_ingested ? ` with ${res.total_sections_ingested} sections` : ''}.` });
      reload();
    } catch (err) {
      setMessage({ ok: false, text: err.message });
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const onDelete = async (doc) => {
    if (!window.confirm(`Remove “${doc.title}” from the knowledge base?`)) return;
    try { await api.deleteDocument(doc.id); setSelected(null); reload(); } catch (err) { setMessage({ ok: false, text: err.message }); }
  };

  const current = data?.find((d) => d.id === selected);

  return (
    <>
      <PageHeader
        title="Runbooks"
        subtitle="Documents are indexed section by section, keeping their original structure."
        actions={(
          <>
            <input ref={fileRef} type="file" accept=".md,.markdown,.txt,.pdf,.docx" className="hidden" onChange={onUpload} />
            <button className="btn-primary" onClick={() => fileRef.current?.click()} disabled={uploading}>
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Upload document
            </button>
          </>
        )}
      />
      {message && (
        <div className={`mb-4 rounded-lg border px-4 py-2.5 text-sm ${message.ok ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-red-200 bg-red-50 text-red-700'}`}>{message.text}</div>
      )}
      {loading && <Loading />}
      {error && <ErrorState error={error} onRetry={reload} />}
      {data && data.length === 0 && (
        <div className="card"><EmptyState icon={BookOpen} title="No runbooks yet" body="Upload a Markdown, PDF, DOCX or text file to get started." /></div>
      )}
      {data && data.length > 0 && (
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <div className="card h-fit">
            <div className="card-header"><h2 className="card-title">Documents</h2><span className="badge-gray">{data.length}</span></div>
            <ul className="p-2">
              {data.map((d) => (
                <li key={d.id}>
                  <button
                    onClick={() => setSelected(d.id)}
                    className={`flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left ${selected === d.id ? 'bg-brand-50' : 'hover:bg-slate-50'}`}
                  >
                    <FileText className={`mt-0.5 h-4 w-4 flex-shrink-0 ${selected === d.id ? 'text-brand-600' : 'text-slate-400'}`} />
                    <span className="min-w-0">
                      <span className={`block truncate text-sm font-medium ${selected === d.id ? 'text-brand-700' : 'text-slate-800'}`}>{d.title}</span>
                      <span className="text-xs text-slate-500">{d.file_type.toLowerCase()} · {d.total_sections} sections</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
          {current && (
            <div className="card min-w-0 overflow-hidden">
              <div className="card-header">
                <h2 className="card-title truncate">{current.title}</h2>
                <button className="btn-ghost btn-sm text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => onDelete(current)}>
                  <Trash2 className="h-3.5 w-3.5" /> Remove
                </button>
              </div>
              <Sections docId={current.id} />
            </div>
          )}
        </div>
      )}
    </>
  );
}
