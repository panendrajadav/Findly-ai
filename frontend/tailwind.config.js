/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Core Palette Requested by User
        brand: {
          green: '#009B4D',
          'green-light': '#00b85b',
          'green-dark': '#007a3c',
          yellow: '#FFCC00',
          'yellow-light': '#ffd633',
          'yellow-dark': '#e6b800',
          ivory: '#FAF5E9',
          'ivory-muted': '#f0e8d5',
          'ivory-subtle': '#e6dcbf',
        },
        forest: {
          950: '#050d08',
          900: '#09160e',
          850: '#0d2015',
          800: '#12291c',
          750: '#163323',
          700: '#1c3e2c',
          600: '#255039',
        },
        // Fallback backward-compatible scales
        navy: {
          950: '#050d08',
          900: '#09160e',
          850: '#0d2015',
          800: '#12291c',
          750: '#163323',
          700: '#1c3e2c',
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
