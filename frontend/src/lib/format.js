export const shortId = (id = '') => (id.length > 12 ? `${id.slice(0, 8)}…` : id);
export const seconds = (v) => (v == null ? '—' : `${Number(v).toFixed(2)}s`);
export const pct = (v) => (v == null ? '—' : `${(v * 100).toFixed(1)}%`);
export const timeAgo = (iso) => {
  if (!iso) return '—';
  const diff = (Date.now() - new Date(iso.endsWith('Z') || iso.includes('+') ? iso : `${iso}Z`).getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};
export const riskBadge = (risk) =>
  ({ HIGH: 'badge-red', CRITICAL: 'badge-red', MEDIUM: 'badge-amber', LOW: 'badge-green' }[risk] || 'badge-gray');
