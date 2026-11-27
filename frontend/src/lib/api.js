async function request(path, options = {}) {
  const res = await fetch(path, {
    headers: options.body ? { 'Content-Type': 'application/json' } : undefined,
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  if (!res.ok) {
    let detail = `${res.status} ${res.statusText}`;
    try { detail = (await res.json()).detail || detail; } catch { /* ignore */ }
    throw new Error(detail);
  }
  return res.json();
}

export const api = {
  health: () => request('/api/health'),
  metrics: () => request('/api/metrics'),
  evals: (limit = 20) => request(`/api/metrics/evals?limit=${limit}`),
  evalHistory: (refresh = false) => request(`/api/metrics/eval-history${refresh ? '?refresh=true' : ''}`),
  incidents: () => request('/api/incidents'),
  incident: (id) => request(`/api/incidents/${id}`),
  documents: () => request('/api/documents'),
  sections: (id) => request(`/api/documents/${id}/sections`),
  deleteDocument: (id) => request(`/api/documents/${id}`, { method: 'DELETE' }),
  uploadDocument: async (file) => {
    const form = new FormData();
    form.append('file', file);
    const res = await fetch('/api/documents/upload', { method: 'POST', body: form });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail || 'Upload failed');
    return res.json();
  },
  chat: (query, sessionId) => request('/api/chat', { method: 'POST', body: { query, session_id: sessionId } }),
  actions: () => request('/api/actions'),
  proposeAction: (body) => request('/api/actions/propose', { method: 'POST', body }),
  reviewAction: (id, decision, reviewer) =>
    request(`/api/actions/${id}/review`, { method: 'POST', body: { decision, reviewer_name: reviewer } }),
};
