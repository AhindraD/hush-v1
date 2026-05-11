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
        'hush-violet': {
          DEFAULT: '#8b5cf6',
          50:  '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
          950: '#2e1065',
        },
        'hush-gold': {
          DEFAULT: '#f0b429',
          50:  '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f0b429',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        'hush-teal': {
          DEFAULT: '#14b8a6',
          50:  '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
        },
        'hush-bg': {
          DEFAULT: '#0a0a0f',
          surface: '#111118',
          elevated: '#16161f',
          border: '#1e1e2e',
          muted: '#2a2a3a',
        },
        'hush-surface': {
          DEFAULT: '#111118',
          elevated: '#16161f',
          border: '#1e1e2e',
        },
      },
      fontFamily: {
        display: ['var(--font-cabinet)', 'system-ui', 'sans-serif'],
        body:    ['var(--font-satoshi)',  'system-ui', 'sans-serif'],
        mono:    ['var(--font-jetbrains)', 'ui-monospace', 'monospace'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-violet-teal': 'linear-gradient(135deg, #8b5cf6, #14b8a6)',
        'gradient-violet-gold': 'linear-gradient(135deg, #8b5cf6, #f0b429)',
        'grid-pattern': `linear-gradient(rgba(139,92,246,0.04) 1px, transparent 1px),
                         linear-gradient(90deg, rgba(139,92,246,0.04) 1px, transparent 1px)`,
      },
      backgroundSize: {
        grid: '40px 40px',
      },
      animation: {
        'shimmer':      'shimmer 1.6s linear infinite',
        'pulse-violet': 'pulse-violet 2s ease-in-out infinite',
        'fade-in':      'fade-in 0.4s ease forwards',
        'slide-up':     'slide-up 0.4s ease forwards',
        'decrypt':      'decrypt 0.8s steps(1) infinite',
      },
      keyframes: {
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'pulse-violet': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(139,92,246,0)' },
          '50%':      { boxShadow: '0 0 0 8px rgba(139,92,246,0.15)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        decrypt: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.3' },
        },
      },
      boxShadow: {
        'glow-violet': '0 0 24px rgba(139,92,246,0.25)',
        'glow-gold':   '0 0 24px rgba(240,180,41,0.2)',
        'glow-teal':   '0 0 24px rgba(20,184,166,0.2)',
        'card':        '0 1px 3px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.3)',
        'card-hover':  '0 4px 12px rgba(0,0,0,0.5), 0 2px 4px rgba(0,0,0,0.4)',
      },
      // shadcn/ui HSL CSS variable mapping
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
