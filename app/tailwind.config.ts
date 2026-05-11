import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'hush-gold': {
          DEFAULT: '#CBB067',
          deep: '#8E6E2E',
          bright: '#EED993',
          dim: 'rgba(203, 176, 103, 0.12)',
        },
        'hush-bg': {
          DEFAULT: '#020202',
          surface: '#050505',
          elevated: '#0a0a0c',
          border: 'rgba(255, 255, 255, 0.03)',
          muted: '#121214',
        },
        'solana': {
          purple: '#9945FF',
          green: '#14F195',
        }
      },
      fontFamily: {
        serif: ['var(--font-serif)', 'serif'],
        sans:  ['var(--font-sans)',  'system-ui', 'sans-serif'],
        mono:  ['var(--font-jetbrains)', 'ui-monospace', 'monospace'],
      },
      backgroundImage: {
        'royal-radial': 'radial-gradient(circle at top right, #0a0a0c 0%, #020202 100%)',
        'gold-metallic': 'linear-gradient(135deg, #8E6E2E 0%, #CBB067 25%, #EED993 50%, #CBB067 75%, #8E6E2E 100%)',
        'solana-subtle': 'linear-gradient(90deg, rgba(153,69,255,0.08) 0%, rgba(20,241,149,0.08) 100%)',
      },
      animation: {
        'fade-in':      'fade-in 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'slide-up':     'slide-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'gold-shine':   'gold-shine 10s ease infinite',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'gold-shine': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
      },
      boxShadow: {
        'glow-gold':   '0 0 40px rgba(203, 176, 103, 0.15)',
        'card':        '0 4px 20px -2px rgba(0,0,0,0.5)',
        'card-hover':  '0 20px 40px -10px rgba(0,0,0,0.8)',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [],
};

export default config;

