/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // User Provided Palette: #BBBFBF, #878787, #05AD98, #FFFFFF
        brand: {
          teal: '#05AD98',
          'teal-light': '#08c9af',
          'teal-dark': '#048e7d',
          silver: '#BBBFBF',
          'silver-light': '#d4d8d8',
          'silver-dark': '#a3a8a8',
          slate: '#878787',
          'slate-light': '#9e9e9e',
          'slate-dark': '#6b6b6b',
          white: '#FFFFFF',
          // Backward-compat aliases
          green: '#05AD98',
          'green-light': '#08c9af',
          'green-dark': '#048e7d',
          yellow: '#05AD98',
          ivory: '#FFFFFF',
        },
        dark: {
          950: '#070a0e',
          900: '#0a0e14',
          850: '#0f141c',
          800: '#151c27',
          750: '#1b2432',
          700: '#232d3d',
        },
        // Fallback backward-compatible scales
        forest: {
          950: '#070a0e',
          900: '#0a0e14',
          850: '#0f141c',
          800: '#151c27',
          750: '#1b2432',
          700: '#232d3d',
        },
        navy: {
          950: '#070a0e',
          900: '#0a0e14',
          850: '#0f141c',
          800: '#151c27',
          750: '#1b2432',
          700: '#232d3d',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow-pulse': 'glowPulse 3s ease-in-out infinite',
        'scan-radar': 'scanRadar 2.5s ease-in-out infinite',
        'beam-flow': 'beamFlow 2s linear infinite',
      },
      keyframes: {
        glowPulse: {
          '0%, 100%': { opacity: '0.4', transform: 'scale(1)' },
          '50%': { opacity: '0.8', transform: 'scale(1.05)' },
        },
        scanRadar: {
          '0%': { transform: 'scale(0.8)', opacity: '0.9' },
          '100%': { transform: 'scale(2.2)', opacity: '0' },
        },
        beamFlow: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(200%)' },
        }
      }
    },
  },
  plugins: [],
}
