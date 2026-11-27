import React from 'react';

export default function FindlyLogo({ size = 28, withText = true, className = '' }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden="true">
        <rect width="64" height="64" rx="14" fill="#2563eb" />
        <path d="M16 46H25V37H34V28H43V19H48" stroke="#fff" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="48" cy="19" r="5" fill="#fff" />
      </svg>
      {withText && <span className="font-semibold tracking-tight text-slate-900">Findly AI</span>}
    </span>
  );
}
