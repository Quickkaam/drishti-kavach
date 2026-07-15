/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        'navy-base': '#0a0a2e',
        'gold-ai': '#f5b041',
        'saffron-alert': '#ff9933',
        'space-black': '#020408',
        'space-deep': '#040810',
        'space-card': '#060d18',
        'space-border': '#0a1628',
        'cyber-cyan': '#00d4ff',
        'cyber-cyan-dim': '#0088aa',
        'cyber-gold': '#f5b041',
        'cyber-gold-dim': '#c47d10',
        'cyber-red': '#ff3d3d',
        'cyber-green': '#00ff88',
        'cyber-orange': '#ff6b00',
        'text-primary': '#e8f4fd',
        'text-secondary': '#7ba3c0',
        'text-muted': '#2d4a6b',
      },
      fontFamily: {
        orbitron: ['Orbitron', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'cyan-glow': '0 0 15px rgba(0,212,255,0.3), 0 0 40px rgba(0,212,255,0.1)',
        'gold-glow': '0 0 15px rgba(245,176,65,0.3), 0 0 40px rgba(245,176,65,0.1)',
        'red-glow': '0 0 15px rgba(255,61,61,0.4)',
        'cyan-sm': '0 0 8px rgba(0,212,255,0.3)',
      },
      animation: {
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'spin-slow': 'spin 8s linear infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        }
      }
    },
  },
  plugins: [],
}
