/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'oea-blue':       '#1574b6',
        'oea-blue-light': '#338fce',
        'oea-night':      '#0D1B2A',
        'oea-surface':    '#102030',
        'oea-border':     '#1a3a50',
        'oea-text':       '#c8dce8',
        'oea-text-muted': '#5a7a90',
        'oea-mono-bg':    '#1a3348',
        'status-go':      '#00c97a',
        'status-caution': '#f5a623',
        'status-nogo':    '#e8394a',
        'status-info':    '#4fc3f7',
        'status-purple':  '#9b7fe8',
      },
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Courier New', 'monospace'],
      },
      animation: {
        'skeleton': 'skeleton 1.5s ease-in-out infinite',
        'fade-in':  'fadeIn 0.2s ease-out',
        'slide-in': 'slideIn 0.2s ease-out',
        'ping-slow': 'ping 2s cubic-bezier(0,0,0.2,1) infinite',
      },
      keyframes: {
        skeleton: {
          '0%, 100%': { opacity: '0.4' },
          '50%':      { opacity: '0.8' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        slideIn: {
          from: { transform: 'translateX(8px)', opacity: '0' },
          to:   { transform: 'translateX(0)',   opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}

