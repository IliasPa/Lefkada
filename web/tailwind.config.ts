import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './context/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0D5EAF',
          50: '#E8F1FA',
          100: '#C4D9F1',
          200: '#9DC0E8',
          300: '#70A5DC',
          400: '#3D88D0',
          500: '#0D5EAF',
          600: '#0A4D93',
          700: '#083C75',
          800: '#052B57',
          900: '#031B38',
        },
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif',
        ],
      },
      animation: {
        'veto-stamp': 'vetoStamp 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
        'fade-in': 'fadeIn 0.25s ease-out forwards',
        'slide-up': 'slideUp 0.25s ease-out forwards',
        'pulse-veto': 'pulseVeto 1.2s ease-in-out infinite',
      },
      keyframes: {
        vetoStamp: {
          '0%': { transform: 'scale(4) rotate(-20deg)', opacity: '0' },
          '60%': { transform: 'scale(0.9) rotate(4deg)', opacity: '1' },
          '80%': { transform: 'scale(1.05) rotate(-2deg)', opacity: '1' },
          '100%': { transform: 'scale(1) rotate(0deg)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(12px)', opacity: '0' },
          // End at `none` (not translateY(0)): the animation runs with
          // `forwards` fill on <main>, and a retained transform would make it
          // the containing block for position:fixed children (the news photo
          // backdrop, the floating search button) — breaking them as soon as
          // <main> is taller than the viewport (browser flow mode).
          '100%': { transform: 'none', opacity: '1' },
        },
        pulseVeto: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
