import React from 'react';

export default function FindlyLogo({ size = 36, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`flex-shrink-0 transition-transform duration-300 ${className}`}
    >
      <defs>
        <linearGradient id="findlyGrad" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#009B4D" />
          <stop offset="100%" stopColor="#006833" />
        </linearGradient>
        <filter id="yellowGlow" x="38" y="12" width="20" height="20" filterUnits="userSpaceOnUse">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Background Rounded Shield */}
      <rect width="64" height="64" rx="18" fill="#0b1710" />
      <rect x="2" y="2" width="60" height="60" rx="16" stroke="#009B4D" stroke-width="2" strokeOpacity="0.4" />

      {/* STAIR Hierarchical Stepped Geometry */}
      <path
        d="M14 48H22V40H30V32H38V24H46V16H50V50H14V48Z"
        fill="url(#findlyGrad)"
        fillOpacity="0.25"
      />
      <path
        d="M16 48H24V40H32V32H40V24H48"
        stroke="#009B4D"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Prefix Trie Nodes in Ivory */}
      <circle cx="16" cy="48" r="3" fill="#FAF5E9" />
      <circle cx="24" cy="40" r="3" fill="#FAF5E9" />
      <circle cx="32" cy="32" r="3" fill="#FAF5E9" />
      <circle cx="40" cy="24" r="3" fill="#FAF5E9" />

      {/* Glowing Tangerine Active Leaf Node */}
      <g filter="url(#yellowGlow)">
        <circle cx="48" cy="24" r="6.5" fill="#FFCC00" />
        <circle cx="48" cy="24" r="3" fill="#FAF5E9" />
      </g>
    </svg>
  );
}

