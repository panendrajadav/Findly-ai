import React from 'react';

export default function FindlyLogo({ size = 32, className = "" }) {
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
        <linearGradient id="findlyTealGrad" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#05AD98" />
          <stop offset="100%" stopColor="#037466" />
        </linearGradient>
        <filter id="tealGlow" x="36" y="10" width="24" height="24" filterUnits="userSpaceOnUse">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Rounded Sleek Background */}
      <rect width="64" height="64" rx="16" fill="#0f141c" />
      <rect x="1.5" y="1.5" width="61" height="61" rx="14.5" stroke="#BBBFBF" strokeWidth="1.5" strokeOpacity="0.25" />

      {/* STAIR Stepped Geometry */}
      <path
        d="M14 48H22V40H30V32H38V24H46V16H50V50H14V48Z"
        fill="url(#findlyTealGrad)"
        fillOpacity="0.2"
      />
      <path
        d="M16 48H24V40H32V32H40V24H48"
        stroke="#05AD98"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Prefix Trie Nodes in Silver */}
      <circle cx="16" cy="48" r="3" fill="#BBBFBF" />
      <circle cx="24" cy="40" r="3" fill="#BBBFBF" />
      <circle cx="32" cy="32" r="3" fill="#BBBFBF" />
      <circle cx="40" cy="24" r="3" fill="#BBBFBF" />

      {/* Glowing Active Leaf Node in Pure White & Teal */}
      <g filter="url(#tealGlow)">
        <circle cx="48" cy="24" r="6" fill="#05AD98" />
        <circle cx="48" cy="24" r="3" fill="#FFFFFF" />
      </g>
    </svg>
  );
}
