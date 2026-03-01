import type { Config } from 'tailwindcss'

export default {
  content: [
    './src/app/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // ── Editorial palette ─────────────────────────────────────────
        // "Printed Page in Darkroom" — not void black, but rich cardstock

        // Ink Black — the stock
        ink: {
          DEFAULT: '#050505',
          raised: '#0a0a0a',
          overlay: '#111111',
          subtle: '#1a1a1a',
        },

        // Paper White — warm off-white, like quality book stock
        paper: {
          DEFAULT: '#f5f5f0',
          warm: '#eae8e1',
          cool: '#e0dfd8',
        },

        // Registration Blue — the ONLY accent. Like a printer's registration mark.
        // Solid, sharp, never glowing. Used sparingly: links, one CTA, one rule.
        reg: {
          DEFAULT: '#0033ff',
          light: '#2255ff',
        },

        // ── Semantic tokens (resolve via CSS variables) ──────────────
        void: 'rgb(var(--void-rgb) / <alpha-value>)',
        surface: {
          DEFAULT: 'var(--surface)',
          raised: 'var(--surface-raised)',
          overlay: 'var(--surface-overlay)',
          subtle: 'var(--surface-subtle)',
          glass: 'var(--surface-glass)',
        },
        accent: {
          DEFAULT: 'rgb(var(--accent-rgb) / <alpha-value>)',
          hover: 'rgb(var(--accent-hover-rgb) / <alpha-value>)',
          muted: 'var(--accent-muted)',
          glow: 'var(--accent-glow)',
          soft: 'var(--accent-soft)',
        },
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          tertiary: 'var(--text-tertiary)',
          ghost: 'var(--text-ghost)',
        },
        success: {
          DEFAULT: 'rgb(var(--success-rgb) / <alpha-value>)',
          muted: 'var(--success-muted)',
        },
        warning: {
          DEFAULT: 'rgb(var(--warning-rgb) / <alpha-value>)',
          muted: 'var(--warning-muted)',
        },
        danger: {
          DEFAULT: 'rgb(var(--danger-rgb) / <alpha-value>)',
          muted: 'var(--danger-muted)',
        },
        border: {
          DEFAULT: 'var(--border)',
          subtle: 'var(--border-subtle)',
          visible: 'var(--border-visible)',
          accent: 'var(--border-accent)',
        },
        fg: 'rgb(var(--fg) / <alpha-value>)',
      },
      borderRadius: {
        xl: '1.25rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
        pill: '9999px',
      },
      backgroundImage: {
        // Keep only functional gradients — no glass, no glow orbs
        'gradient-text': 'linear-gradient(to bottom right, #ffffff 30%, rgba(255,255,255,0.5) 100%)',
      },
      boxShadow: {
        // Functional shadows only — no glow, no neon, no colored bleed
        'card': 'var(--shadow-card)',
        'card-hover': 'var(--shadow-card-hover)',
        'elevated': 'var(--shadow-elevated)',
        'paper': '0 2px 8px rgba(0,0,0,0.15), 0 20px 50px -12px rgba(0,0,0,0.35)',
        'paper-hover': '0 4px 12px rgba(0,0,0,0.2), 0 24px 60px -12px rgba(0,0,0,0.4)',
        'inner-subtle': 'inset 0 1px 3px rgba(0,0,0,0.2)',
        // Editorial — clean drop shadow, no color
        'editorial': '0 4px 24px rgba(0,0,0,0.4)',
        'editorial-hover': '0 8px 40px rgba(0,0,0,0.5)',
      },
      fontFamily: {
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
        body: ['var(--font-body)', 'Georgia', 'serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      letterSpacing: {
        tightest: '-0.05em',
        tighter: '-0.04em',
        tight: '-0.02em',
      },
      fontSize: {
        'hero': 'clamp(3.5rem, 9vw, 7.5rem)',
        'hero-sub': 'clamp(1.125rem, 1.8vw, 1.5rem)',
        'h1': 'clamp(2rem, 3.5vw, 3.5rem)',
        'h2': 'clamp(1.5rem, 2.5vw, 2.5rem)',
        'h3': 'clamp(1.25rem, 1.8vw, 1.5rem)',
        'display-lg': 'clamp(2.5rem, 6vw, 5.5rem)',
        'editorial-body': '1.125rem',
        'editorial-caption': '0.6875rem',
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '26': '6.5rem',
        '30': '7.5rem',
      },
      transitionTimingFunction: {
        'pp': 'cubic-bezier(0.25, 0.4, 0.25, 1)',
        'pp-dramatic': 'cubic-bezier(0.22, 0.61, 0.36, 1)',
      },
      transitionDuration: {
        '350': '350ms',
      },
      animation: {
        'fade-in': 'fadeIn 0.6s cubic-bezier(0.25, 0.4, 0.25, 1)',
        'fade-in-up': 'fadeInUp 0.8s cubic-bezier(0.25, 0.4, 0.25, 1) forwards',
        'reveal-up': 'revealUp 0.8s cubic-bezier(0.25, 0.4, 0.25, 1) forwards',
        'skeleton': 'skeletonPulse 1.5s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        revealUp: {
          '0%': {
            opacity: '0',
            filter: 'blur(8px)',
            transform: 'translateY(30px)',
          },
          '100%': {
            opacity: '1',
            filter: 'blur(0px)',
            transform: 'translateY(0)',
          },
        },
        skeletonPulse: {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '0.7' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config
