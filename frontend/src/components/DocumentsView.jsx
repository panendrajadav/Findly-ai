import React, { useState, useEffect } from 'react';
import { 
  FileUp, FileText, BookOpen, Layers, Check, RefreshCw, 
  UploadCloud, Trash2, RotateCcw, AlertTriangle, CheckCircle 
} from 'lucide-react';

export default function KnowledgeBaseView() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [sections, setSections] = useState([]);
  const [secLoading, setSecLoading] = useState(false);
  const [actionNotice, setActionNotice] = useState('');

  const fetchDocuments = () => {
    setLoading(true);
    fetch('/api/documents')
      .then(r => {
        if (!r.ok) throw new Error('Failed to fetch documents');
        return r.json();
      })
      .then(d => {
        const list = Array.isArray(d) ? d : [];
        setDocuments(list);
        setLoading(false);
        if (!selectedDoc && list.length > 0) {
          handleSelectDoc(list[0].id);
        }
      })
      .catch(err => {
        console.error(err);
        setDocuments([]);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadMsg('');
    setUploadError('');
    const formData = new FormData();
    formData.append('file', file);

    fetch('/api/documents/upload', {
      method: 'POST',
      body: formData,
    })
      .then(async r => {
        if (!r.ok) {
          const errData = await r.json().catch(() => ({}));
          throw new Error(errData.detail || 'Upload failed');
        }
        return r.json();
      })
      .then(res => {
        setUploading(false);
        setUploadMsg(`Successfully ingested "${res.title}" into ${res.total_sections_ingested} structural sections!`);
        fetchDocuments();
        setTimeout(() => setUploadMsg(''), 7000);
      })
      .catch(err => {
        console.error(err);
        setUploading(false);
        setUploadError(`Upload failed: ${err.message}`);
        setTimeout(() => setUploadError(''), 7000);
      });
  };

  const handleSelectDoc = (docId) => {
    setSelectedDoc(docId);
    setSecLoading(true);
    fetch(`/api/documents/${docId}/sections`)
      .then(r => {
        if (!r.ok) throw new Error('Failed to fetch sections');
        return r.json();
      })
      .then(data => {
        setSections(Array.isArray(data) ? data : []);
        setSecLoading(false);
      })
      .catch(err => {
        console.error(err);
        setSections([]);
        setSecLoading(false);
      });
  };

  const handleDeleteDoc = (docId, title, e) => {
    e.stopPropagation();
    if (!window.confirm(`Delete document "${title}" and its structural sections from the vector store and Trie?`)) return;

    fetch(`/api/documents/${docId}`, { method: 'DELETE' })
      .then(r => r.json())
      .then(d => {
        setActionNotice(`Document deleted. Remaining sections in vector store: ${d.remaining_sections}.`);
        if (selectedDoc === docId) {
          setSelectedDoc(null);
          setSections([]);
        }
        fetchDocuments();
        setTimeout(() => setActionNotice(''), 6000);
      })
      .catch(err => console.error(err));
  };

  const handleReingestDoc = (docId, title, e) => {
    e.stopPropagation();
    fetch(`/api/documents/${docId}/reingest`, { method: 'POST' })
      .then(r => r.json())
      .then(d => {
        setActionNotice(`Document "${title}" re-ingested into ${d.sections_reingested} sections.`);
        fetchDocuments();
        handleSelectDoc(docId);
        setTimeout(() => setActionNotice(''), 6000);
      })
      .catch(err => console.error(err));
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-80 text-slate-400 space-y-3">
        <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin"></div>
        <span className="text-sm font-medium">Loading Knowledge Base documents and operational runbooks...</span>
      </div>
    );
  }

  const totalSections = documents.reduce((acc, d) => acc + (d.total_sections || 0), 0);

  return (
    <div className="space-y-8 max-w-7xl mx-auto py-2">
      {/* Upload Dropzone */}
      <div className="glass-card p-8 border-dashed border-2 border-white/10 hover:border-emerald-500/60 transition-all text-center rounded-3xl shadow-xl bg-[#0a0e16]/80">
        <UploadCloud className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
        <h4 className="text-base font-bold text-white">Ingest Operational Documents & Runbooks</h4>
        <p className="text-xs text-slate-400 mt-2 max-w-xl mx-auto leading-relaxed">
          Upload PDF, DOCX, Markdown, or TXT runbooks. STAIR parses complete structural headings and sections—strictly preserving procedural context without arbitrary fixed-size chunking.
        </p>

        <div className="mt-5 flex items-center justify-center space-x-3">
          <label className="bg-emerald-500 hover:bg-emerald-400 text-black px-6 py-2.5 rounded-full text-xs font-bold cursor-pointer transition-all shadow-lg shadow-emerald-500/25 inline-flex items-center">
            <span>Select File to Ingest</span>
            <input
              type="file"
              accept=".pdf,.docx,.md,.markdown,.txt"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>

        {uploading && (
          <div className="text-xs text-emerald-300 mt-4 flex items-center justify-center">
            <RefreshCw className="w-4 h-4 animate-spin mr-2 text-emerald-400" />
            Parsing document structural hierarchy and updating Prefix Trie...
          </div>
        )}
        {uploadMsg && (
          <div className="text-xs text-emerald-300 mt-4 font-medium bg-emerald-950/70 p-3 rounded-2xl border border-emerald-600/60 max-w-lg mx-auto">
            {uploadMsg}
          </div>
        )}
        {uploadError && (
          <div className="text-xs text-rose-300 mt-4 font-medium bg-rose-950/70 p-3 rounded-2xl border border-rose-700/60 max-w-lg mx-auto">
            {uploadError}
          </div>
        )}
      </div>

      {actionNotice && (
        <div className="p-4 bg-emerald-950/60 border border-emerald-600/70 text-emerald-200 text-xs rounded-2xl flex items-center shadow-lg">
          <CheckCircle className="w-4 h-4 mr-2.5 text-emerald-400 flex-shrink-0" />
          <span>{actionNotice}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Document List */}
        <div className="glass-card p-6 border border-white/10 shadow-2xl rounded-3xl flex flex-col bg-[#0a0e16]/80">
          <div className="flex justify-between items-center mb-4 pb-2 border-b border-white/5">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center">
                <BookOpen className="w-4 h-4 mr-2 text-emerald-400" />
                Knowledge Base ({documents.length})
              </h4>
              <div className="text-[11px] text-slate-400 mt-1">
                {totalSections} indexed complete sections
              </div>
            </div>
            <button onClick={fetchDocuments} className="text-slate-400 hover:text-white text-xs p-1">
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3 overflow-y-auto max-h-[550px] pr-1">
            {documents.map((doc) => (
              <div
                key={doc.id}
                onClick={() => handleSelectDoc(doc.id)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all text-xs group ${
                  selectedDoc === doc.id
                    ? 'bg-emerald-950/30 border-emerald-500/80 shadow-lg'
                    : 'bg-[#06080d] border-white/5 hover:border-white/20'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="font-semibold text-slate-200 truncate max-w-[180px]">{doc.title}</span>
                  <span className="bg-[#10141f] text-emerald-300 border border-emerald-800/40 px-2.5 py-0.5 rounded-full text-[10px] uppercase font-mono">
                    {doc.file_type}
                  </span>
                </div>
                <div className="text-slate-400 text-[11px] flex justify-between items-center">
                  <span>{doc.total_sections} structural sections</span>
                  <span>{(doc.file_size_bytes / 1024).toFixed(1)} KB</span>
                </div>

                {/* Document management buttons */}
                <div className="mt-3 pt-2.5 border-t border-white/5 flex justify-end space-x-2">
                  <button
                    onClick={(e) => handleReingestDoc(doc.id, doc.title, e)}
                    className="text-slate-400 hover:text-emerald-300 text-[10px] flex items-center px-2.5 py-1 rounded-full hover:bg-white/5 transition-colors"
                    title="Re-ingest document"
                  >
                    <RotateCcw className="w-3 h-3 mr-1" /> Re-index
                  </button>
                  <button
                    onClick={(e) => handleDeleteDoc(doc.id, doc.title, e)}
                    className="text-rose-400/80 hover:text-rose-300 text-[10px] flex items-center px-2.5 py-1 rounded-full hover:bg-rose-950/50 transition-colors"
                    title="Delete document"
                  >
                    <Trash2 className="w-3 h-3 mr-1" /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section Structure Viewer */}
        <div className="lg:col-span-2 glass-card p-6 border border-white/10 shadow-2xl rounded-3xl flex flex-col bg-[#0a0e16]/80">
          <h4 className="text-sm font-bold text-white mb-4 flex items-center pb-2 border-b border-white/5">
            <Layers className="w-4 h-4 mr-2 text-emerald-400" />
            STAIR Complete Structural Sections (No Arbitrary Chunking)
          </h4>

          {!selectedDoc ? (
            <div className="text-center py-24 text-slate-400 text-xs">
              Select an ingested runbook on the left to inspect its complete structural sections and hierarchy paths.
            </div>
          ) : secLoading ? (
            <div className="flex items-center justify-center py-24 text-slate-400">
              <RefreshCw className="animate-spin w-6 h-6 mr-2 text-emerald-400" /> Loading sections...
            </div>
          ) : (
            <div className="space-y-4 max-h-[550px] overflow-y-auto pr-1">
              {sections.map((sec) => (
                <div key={sec.id} className="p-4 bg-[#06080d] rounded-2xl border border-white/5 text-xs space-y-2.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-mono text-emerald-400 font-semibold truncate max-w-md">{sec.hierarchy_path}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      sec.is_leaf ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800' : 'bg-[#10141f] text-slate-400'
                    }`}>
                      {sec.is_leaf ? 'LEAF SECTION' : 'BRANCH'}
                    </span>
                  </div>
                  <div className="text-slate-300 whitespace-pre-line text-[11.5px] bg-[#0d121c] p-3.5 rounded-xl border border-white/5 font-mono leading-relaxed select-all">
                    {sec.content}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
