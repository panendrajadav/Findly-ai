import React, { useState, useEffect } from 'react';
import { 
  FileUp, FileText, BookOpen, Layers, Check, RefreshCw, 
  UploadCloud, Trash2, RotateCcw, AlertTriangle, CheckCircle,
  Database, ArrowRight
} from 'lucide-react';
import FindlyLogo from './FindlyLogo';

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
      <div className="flex flex-col items-center justify-center h-80 text-[#FAF5E9]/60 space-y-3">
        <div className="w-8 h-8 rounded-full border-2 border-[#009B4D] border-t-transparent animate-spin"></div>
        <span className="text-sm font-medium">Loading Knowledge Base documents and operational runbooks...</span>
      </div>
    );
  }

  const totalSections = documents.reduce((acc, d) => acc + (d.total_sections || 0), 0);

  return (
    <div className="space-y-8 max-w-6xl mx-auto px-4 sm:px-6 py-2">
      {/* Upload Dropzone in Green, Tangerine & Ivory */}
      <div className="p-8 border-dashed border-2 border-[#009B4D]/35 hover:border-[#009B4D] transition-all text-center rounded-3xl shadow-xl bg-[#09160e]/80">
        <UploadCloud className="w-12 h-12 text-[#009B4D] mx-auto mb-3" />
        <h4 className="text-base font-bold text-[#FAF5E9]">Ingest Operational Documents & Runbooks</h4>
        <p className="text-xs text-[#FAF5E9]/75 mt-2 max-w-xl mx-auto leading-relaxed">
          Upload PDF, DOCX, Markdown, or TXT runbooks. STAIR parses complete structural headings and sections—strictly preserving procedural context without arbitrary fixed-size chunking.
        </p>

        <div className="mt-5 flex items-center justify-center space-x-3">
          <label className="bg-gradient-to-r from-[#009B4D] to-[#008240] hover:from-[#00b85b] hover:to-[#009B4D] text-[#FAF5E9] px-6 py-2.5 rounded-full text-xs font-bold cursor-pointer transition-all shadow-lg shadow-[#009B4D]/25 inline-flex items-center">
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
          <div className="text-xs text-[#009B4D] mt-4 flex items-center justify-center">
            <RefreshCw className="w-4 h-4 animate-spin mr-2 text-[#009B4D]" />
            Parsing document structural hierarchy and updating Prefix Trie...
          </div>
        )}
        {uploadMsg && (
          <div className="text-xs text-[#FAF5E9] mt-4 font-medium bg-[#0d2015] p-3 rounded-2xl border border-[#009B4D]/50 max-w-lg mx-auto">
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
        <div className="p-4 bg-[#0d2015] border border-[#009B4D] text-[#FAF5E9] text-xs rounded-2xl flex items-center shadow-lg">
          <CheckCircle className="w-4 h-4 mr-2.5 text-[#009B4D] flex-shrink-0" />
          <span>{actionNotice}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Document List */}
        <div className="p-6 border border-[#009B4D]/30 shadow-2xl rounded-3xl flex flex-col bg-[#09160e]/85">
          <div className="flex justify-between items-center mb-4 pb-2 border-b border-[#009B4D]/25">
            <div>
              <h4 className="text-sm font-bold text-[#FAF5E9] flex items-center">
                <BookOpen className="w-4 h-4 mr-2 text-[#009B4D]" />
                Knowledge Base ({documents.length})
              </h4>
              <div className="text-[11px] text-[#FFCC00] mt-1 font-mono">
                {totalSections} indexed complete sections
              </div>
            </div>
            <button
              onClick={fetchDocuments}
              className="p-1.5 rounded-xl bg-[#050d08] hover:bg-[#0d2015] border border-[#009B4D]/30 text-[#FAF5E9]/60 hover:text-[#FAF5E9] transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#FFCC00]" />
            </button>
          </div>

          <div className="space-y-2.5 overflow-y-auto max-h-[500px]">
            {documents.map((doc) => (
              <div
                key={doc.id}
                onClick={() => handleSelectDoc(doc.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  selectedDoc === doc.id
                    ? 'bg-[#009B4D]/20 border-[#009B4D] shadow-md'
                    : 'bg-[#050d08]/80 border-[#009B4D]/20 hover:border-[#009B4D]/50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <div className="text-xs font-bold text-[#FAF5E9] flex items-center">
                      <FileText className="w-3.5 h-3.5 mr-1.5 text-[#009B4D] flex-shrink-0" />
                      <span className="truncate">{doc.title}</span>
                    </div>
                    <div className="text-[10.5px] text-[#FAF5E9]/60 font-mono truncate">
                      {doc.filename}
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-bold bg-[#0d2015] text-[#FFCC00] border border-[#FFCC00]/30 px-2 py-0.5 rounded-full ml-2 flex-shrink-0">
                    {doc.total_sections || 0} leaves
                  </span>
                </div>

                <div className="flex items-center justify-between mt-3 pt-2 border-t border-[#009B4D]/15 text-[10.5px]">
                  <span className="text-[#FAF5E9]/50 font-mono">{doc.file_type?.toUpperCase()}</span>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={(e) => handleReingestDoc(doc.id, doc.title, e)}
                      title="Re-parse structure & reindex into Trie"
                      className="text-[#FAF5E9]/60 hover:text-[#009B4D] p-1 transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => handleDeleteDoc(doc.id, doc.title, e)}
                      title="Delete document"
                      className="text-[#FAF5E9]/60 hover:text-rose-400 p-1 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section Structure Hierarchy Viewer */}
        <div className="lg:col-span-2 p-6 border border-[#009B4D]/30 shadow-2xl rounded-3xl flex flex-col bg-[#09160e]/85">
          <div className="flex justify-between items-center mb-4 pb-2 border-b border-[#009B4D]/25">
            <h4 className="text-sm font-bold text-[#FAF5E9] flex items-center">
              <Layers className="w-4 h-4 mr-2 text-[#009B4D]" />
              Extracted Table of Contents & Structural Sections
            </h4>
            <span className="text-[11px] font-mono text-[#FFCC00]">
              {sections.length} Registered Leaves
            </span>
          </div>

          {secLoading ? (
            <div className="flex flex-col items-center justify-center flex-1 py-12 text-[#FAF5E9]/60 space-y-2">
              <div className="w-6 h-6 rounded-full border-2 border-[#009B4D] border-t-transparent animate-spin"></div>
              <span className="text-xs">Loading hierarchical sections...</span>
            </div>
          ) : sections.length > 0 ? (
            <div className="space-y-3 overflow-y-auto max-h-[520px] pr-1">
              {sections.map((sec, sIdx) => (
                <div
                  key={sIdx}
                  className="p-4 rounded-2xl bg-[#050d08]/80 border border-[#009B4D]/20 hover:border-[#009B4D]/40 transition-all space-y-2 text-xs"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-[#FAF5E9] flex items-center">
                      <span className="w-2 h-2 rounded-full bg-[#009B4D] mr-2"></span>
                      {sec.title}
                    </span>
                    <span className="text-[10px] font-mono text-[#FFCC00] bg-[#0d2015] border border-[#FFCC00]/30 px-2 py-0.5 rounded-full">
                      Leaf Node
                    </span>
                  </div>

                  <div className="text-[10.5px] font-mono text-[#009B4D] bg-[#09160e] p-2 rounded-xl border border-[#009B4D]/15">
                    {sec.hierarchy_path}
                  </div>

                  <div className="text-[11px] text-[#FAF5E9]/80 leading-relaxed font-sans line-clamp-3">
                    {sec.content}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-[#FAF5E9]/60 text-xs">
              Select a document from the left list to inspect its extracted structural sections.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
