import type { Config } from 'tailwindcss';

/**
 * Colours are declared as raw HSL channels in globals.css so that both Tailwind
 * and shadcn/ui primitives can consume them, and so a theme swap (gold -> emerald)
 * is a one-line change in CSS rather than a rebuild of every utility class.
 */
const config: Config = {
  darkMode: ['class'],
  content: ['./src/**/*.{ts,tsx,mdx}'],
  theme: {
    container: {
      center: true,
      padding: { DEFAULT: '1.25rem', lg: '2rem' },
      screens: { '2xl': '1280px' },
    },
    extend: {
      colors: {
        background: 'hsl(var(--background) / <alpha-value>)',
        surface: 'hsl(var(--surface) / <alpha-value>)',
        foreground: 'hsl(var(--foreground) / <alpha-value>)',
        muted: {
          DEFAULT: 'hsl(var(--muted) / <alpha-value>)',
          foreground: 'hsl(var(--muted-foreground) / <alpha-value>)',
        },
        border: 'hsl(var(--border) / <alpha-value>)',
        ring: 'hsl(var(--ring) / <alpha-value>)',
        gold: {
          DEFAULT: 'hsl(var(--gold) / <alpha-value>)',
          soft: 'hsl(var(--gold-soft) / <alpha-value>)',
          deep: 'hsl(var(--gold-deep) / <alpha-value>)',
        },
        emerald: {
          DEFAULT: 'hsl(var(--emerald) / <alpha-value>)',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent) / <alpha-value>)',
          foreground: 'hsl(var(--accent-foreground) / <alpha-value>)',
        },
        destructive: 'hsl(var(--destructive) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'ui-serif', 'Georgia', 'serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      borderRadius: {
        lg: '1rem',
        md: '0.75rem',
        sm: '0.5rem',
      },
      boxShadow: {
        gold: '0 0 0 1px hsl(var(--gold) / 0.22), 0 18px 60px -20px hsl(var(--gold) / 0.35)',
        lift: '0 30px 80px -30px rgb(0 0 0 / 0.85)',
        inset: 'inset 0 1px 0 0 rgb(255 255 255 / 0.06)',
      },
      backgroundImage: {
        'gold-sheen':
          'linear-gradient(110deg, hsl(var(--gold-deep)) 0%, hsl(var(--gold-soft)) 38%, hsl(var(--gold)) 55%, hsl(var(--gold-deep)) 100%)',
        'radial-fade':
          'radial-gradient(60% 60% at 50% 0%, hsl(var(--gold) / 0.16) 0%, transparent 70%)',
        grid: 'linear-gradient(to right, hsl(var(--border) / 0.5) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--border) / 0.5) 1px, transparent 1px)',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        aurora: {
          '0%, 100%': { transform: 'translate3d(0,0,0) scale(1)' },
          '50%': { transform: 'translate3d(4%, -6%, 0) scale(1.15)' },
        },
        marquee: {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(-50%)' },
        },
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(14px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        shimmer: 'shimmer 6s linear infinite',
        float: 'float 7s ease-in-out infinite',
        aurora: 'aurora 18s ease-in-out infinite',
        marquee: 'marquee 40s linear infinite',
        'fade-up': 'fade-up 0.6s cubic-bezier(0.22, 1, 0.36, 1) both',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
