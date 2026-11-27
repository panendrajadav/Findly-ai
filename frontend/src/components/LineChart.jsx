import React, { useEffect, useMemo, useRef, useState } from 'react';

// Validated categorical slots (dataviz reference palette, light mode).
export const SERIES_COLORS = ['#257de0', '#f47230'];

const PAD = { top: 16, right: 96, bottom: 32, left: 52 };

function niceMax(v) {
  if (v <= 0) return 1;
  const exp = 10 ** Math.floor(Math.log10(v));
  const n = v / exp;
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
  return step * exp;
}

/**
 * Minimal accessible SVG line chart.
 * series: [{ key, label, color, values: number[] }]  (same length as xLabels)
 * One y-axis only; crosshair + tooltip on hover/focus; legend for >= 2 series,
 * direct end labels (<= 4 series).
 */
export default function LineChart({ series, xLabels, xDetails = [], yFormat = (v) => v, yMax, height = 240, ariaLabel }) {
  const wrapRef = useRef(null);
  const [width, setWidth] = useState(640);
  const [active, setActive] = useState(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return undefined;
    const ro = new ResizeObserver(([entry]) => setWidth(Math.max(280, entry.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const n = xLabels.length;
  const top = useMemo(() => {
    if (yMax != null) return yMax;
    const max = Math.max(0, ...series.flatMap((s) => s.values.filter((v) => v != null)));
    return niceMax(max * 1.1);
  }, [series, yMax]);

  const innerW = width - PAD.left - PAD.right;
  const innerH = height - PAD.top - PAD.bottom;
  const x = (i) => PAD.left + (n <= 1 ? innerW / 2 : (i / (n - 1)) * innerW);
  const y = (v) => PAD.top + innerH - (v / top) * innerH;
  // Fixed scales (e.g. 0-100%) read best in quarters; auto scales in fifths (0, 10, 20 ... 50).
  const steps = yMax != null ? 4 : 5;
  const ticks = Array.from({ length: steps + 1 }, (_, k) => (k / steps) * top);
  const labelEvery = Math.max(1, Math.ceil(n / Math.max(2, Math.floor(innerW / 90))));

  const pathFor = (values) =>
    values.reduce((d, v, i) => (v == null ? d : `${d}${d ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`), '');

  const nearest = (clientX) => {
    const rect = wrapRef.current.getBoundingClientRect();
    const px = clientX - rect.left;
    if (n <= 1) return 0;
    const i = Math.round(((px - PAD.left) / innerW) * (n - 1));
    return Math.min(n - 1, Math.max(0, i));
  };

  const onKey = (e) => {
    if (e.key === 'ArrowRight') setActive((a) => Math.min(n - 1, (a ?? -1) + 1));
    else if (e.key === 'ArrowLeft') setActive((a) => Math.max(0, (a ?? n) - 1));
    else if (e.key === 'Escape') setActive(null);
    else return;
    e.preventDefault();
  };

  // Direct end labels, nudged apart only if they would overlap.
  const endLabels = series.map((s) => {
    const lastIdx = s.values.map((v, i) => (v == null ? -1 : i)).filter((i) => i >= 0).pop();
    return lastIdx == null ? null : { s, i: lastIdx, yy: y(s.values[lastIdx]) };
  }).filter(Boolean).sort((a, b) => a.yy - b.yy);
  for (let k = 1; k < endLabels.length; k += 1) {
    if (endLabels[k].yy - endLabels[k - 1].yy < 14) endLabels[k].yy = endLabels[k - 1].yy + 14;
  }

  // Keep the tooltip beside the crosshair, flipping to the left near the right edge.
  const TIP_W = 192;
  const tipLeft = active == null ? 0
    : x(active) + 12 + TIP_W > width ? Math.max(8, x(active) - 12 - TIP_W) : x(active) + 12;

  return (
    <div>
      {series.length >= 2 && (
        <div className="mb-2 flex flex-wrap gap-4 text-xs text-slate-600">
          {series.map((s) => (
            <span key={s.key} className="inline-flex items-center gap-1.5">
              <span className="inline-block h-0.5 w-4 rounded" style={{ background: s.color }} /> {s.label}
            </span>
          ))}
        </div>
      )}
      <div
        ref={wrapRef}
        className="relative outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 rounded"
        tabIndex={0}
        role="img"
        aria-label={ariaLabel}
        onPointerMove={(e) => setActive(nearest(e.clientX))}
        onPointerLeave={() => setActive(null)}
        onFocus={() => setActive((a) => a ?? n - 1)}
        onBlur={() => setActive(null)}
        onKeyDown={onKey}
      >
        <svg width={width} height={height} className="block select-none">
          {ticks.map((t) => (
            <g key={t}>
              <line x1={PAD.left} x2={width - PAD.right} y1={y(t)} y2={y(t)} stroke="#e5e7eb" strokeWidth="1" />
              <text x={PAD.left - 8} y={y(t)} dy="0.32em" textAnchor="end" className="fill-slate-500 text-[11px]">{yFormat(t)}</text>
            </g>
          ))}
          {xLabels.map((l, i) => (i % labelEvery === 0 || i === n - 1) && (
            <text key={i} x={x(i)} y={height - 10} textAnchor="middle" className="fill-slate-500 text-[11px]">{l}</text>
          ))}

          {active != null && <line x1={x(active)} x2={x(active)} y1={PAD.top} y2={PAD.top + innerH} stroke="#94a3b8" strokeWidth="1" />}

          {series.map((s) => (
            <g key={s.key}>
              <path d={pathFor(s.values)} fill="none" stroke={s.color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
              {n <= 40 && s.values.map((v, i) => v != null && (
                <circle key={i} cx={x(i)} cy={y(v)} r={active === i ? 5 : 4} fill={s.color} stroke="#fff" strokeWidth="2" />
              ))}
            </g>
          ))}

          {endLabels.map(({ s, i, yy }) => (
            <g key={s.key}>
              <line x1={x(i) + 6} x2={x(i) + 12} y1={yy} y2={yy} stroke={s.color} strokeWidth="2" strokeLinecap="round" />
              <text x={x(i) + 15} y={yy} dy="0.32em" className="fill-slate-700 text-[11px] font-medium">
                {series.length >= 2 ? `${s.label} ` : ''}{yFormat(s.values[i])}
              </text>
            </g>
          ))}
        </svg>

        {active != null && (
          <div className="pointer-events-none absolute top-2 z-10 w-48 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-pop" style={{ left: tipLeft }}>
            <p className="font-medium text-slate-900">{xLabels[active]}</p>
            {xDetails[active] && <p className="mb-1 truncate text-slate-500">{xDetails[active]}</p>}
            {series.map((s) => (
              <p key={s.key} className="flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-1.5 text-slate-500">
                  <span className="inline-block h-0.5 w-3 rounded" style={{ background: s.color }} />{s.label}
                </span>
                <span className="font-semibold text-slate-900">{s.values[active] == null ? '—' : yFormat(s.values[active])}</span>
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
