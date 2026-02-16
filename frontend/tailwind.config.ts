import type { Config } from 'tailwindcss'

export default {
  content: [
    './src/app/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // ── Semantic tokens (resolve via CSS variables) ──────────────
        // Dark values in :root, light overrides in [data-theme="light"]

        // The Void — deepest surface
        void: 'rgb(var(--void-rgb) / <alpha-value>)',
        // Surfaces — elevated planes above the void
        surface: {
          DEFAULT: 'var(--surface)',
          raised: 'var(--surface-raised)',
          overlay: 'var(--surface-overlay)',
          subtle: 'var(--surface-subtle)',
          glass: 'var(--surface-glass)',
        },
        // Accent — electric blue spectrum (RGB for opacity support)
        accent: {
          DEFAULT: 'rgb(var(--accent-rgb) / <alpha-value>)',
          hover: 'rgb(var(--accent-hover-rgb) / <alpha-value>)',
          muted: 'var(--accent-muted)',
          glow: 'var(--accent-glow)',
          soft: 'var(--accent-soft)',
        },
        // Named accent shortcuts
        'accent-glare': 'rgb(var(--accent-rgb) / <alpha-value>)',
        'accent-glow': 'rgb(var(--accent-hover-rgb) / <alpha-value>)',
        // Text hierarchy
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          tertiary: 'var(--text-tertiary)',
          ghost: 'var(--text-ghost)',
        },
        // Status (RGB for opacity support)
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
        // Borders
        border: {
          DEFAULT: 'var(--border)',
          subtle: 'var(--border-subtle)',
          visible: 'var(--border-visible)',
          accent: 'var(--border-accent)',
        },
        // Foreground — the semantic white/black for opacity patterns
        // Use text-fg/40 instead of text-white/40
        fg: 'rgb(var(--fg) / <alpha-value>)',
      },
      borderRadius: {
        xl: '1.25rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
        pill: '9999px',
      },
      backgroundImage: {
        'gradient-text': 'linear-gradient(to bottom right, #ffffff 30%, rgba(255,255,255,0.5) 100%)',
        'gradient-accent': 'linear-gradient(135deg, #38bdf8, #3b82f6 40%, #a855f7 100%)',
        'gradient-hero': 'linear-gradient(135deg, #67e8f9, #60a5fa 35%, #c084fc 70%, #f472b6 100%)',
        'gradient-metallic': 'linear-gradient(to right, #ffffff, rgba(255,255,255,0.4))',
        'glow-radial': 'radial-gradient(circle at center, rgba(59,130,246,0.25) 0%, transparent 70%)',
        'glow-radial-violet': 'radial-gradient(circle at center, rgba(168,85,247,0.15) 0%, transparent 70%)',
        'glow-radial-hot': 'radial-gradient(ellipse at center, rgba(56,189,248,0.18) 0%, rgba(59,130,246,0.1) 40%, transparent 70%)',
        // Glass gradients — LAW 2
        'glass-subtle': 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
        'glass-accent': 'linear-gradient(135deg, rgba(59,130,246,0.08) 0%, rgba(59,130,246,0.02) 100%)',
        'glass-warm': 'linear-gradient(135deg, rgba(251,191,36,0.06) 0%, rgba(251,191,36,0.01) 100%)',
        'glass-cool': 'linear-gradient(135deg, rgba(56,189,248,0.06) 0%, rgba(56,189,248,0.01) 100%)',
        'glass-surface': 'linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0) 100%)',
      },
      boxShadow: {
        'card': 'var(--shadow-card)',
        'card-hover': 'var(--shadow-card-hover)',
        'elevated': 'var(--shadow-elevated)',
        'pill': '0 4px 16px rgba(59, 130, 246, 0.25)',
        'pill-hover': '0 6px 24px rgba(59, 130, 246, 0.35)',
        'paper': '0 2px 8px rgba(0,0,0,0.15), 0 20px 50px -12px rgba(0,0,0,0.35)',
        'paper-hover': '0 4px 12px rgba(0,0,0,0.2), 0 24px 60px -12px rgba(0,0,0,0.4)',
        'glow-accent': '0 0 20px rgba(59, 130, 246, 0.2)',
        'glow-success': '0 0 20px rgba(52, 211, 153, 0.2)',
        'inner-subtle': 'inset 0 1px 3px rgba(0,0,0,0.2)',
        'glow-hero': '0 0 120px 40px rgba(59, 130, 246, 0.12)',
        'glow-white': '0 0 40px -10px rgba(255, 255, 255, 0.3)',
        'glow-blue': '0 0 60px -10px rgba(59, 130, 246, 0.6)',
        'glow-blue-intense': '0 0 80px -5px rgba(59, 130, 246, 0.5), 0 0 30px -5px rgba(59, 130, 246, 0.3)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.3)',
        'cta': '0 0 60px -12px rgba(255, 255, 255, 0.25), 0 0 20px -4px rgba(255, 255, 255, 0.15)',
        'cta-hover': '0 0 80px -12px rgba(255, 255, 255, 0.4), 0 0 30px -4px rgba(255, 255, 255, 0.25), 0 0 100px -20px rgba(59, 130, 246, 0.3)',
        // LAW 1: Levitating card shadow — colored light bleed from accent
        'levitate': '0 20px 60px -15px rgba(59, 130, 246, 0.5)',
        'levitate-hover': '0 30px 80px -15px rgba(59, 130, 246, 0.6)',
        // 3D book shadows
        'book-blue': '0 20px 50px -12px rgba(59, 130, 246, 0.5)',
        'book-emerald': '0 20px 50px -12px rgba(16, 185, 129, 0.5)',
        'book-amber': '0 20px 50px -12px rgba(245, 158, 11, 0.5)',
        'book-violet': '0 20px 50px -12px rgba(139, 92, 246, 0.5)',
        'book-rose': '0 20px 50px -12px rgba(244, 63, 94, 0.5)',
        'book-cyan': '0 20px 50px -12px rgba(6, 182, 212, 0.5)',
        'spark': '0 0 20px 4px rgba(59, 130, 246, 0.6), 0 0 60px 8px rgba(59, 130, 246, 0.3)',
      },
      fontFamily: {
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
        body: ['var(--font-body)', 'system-ui', 'serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      letterSpacing: {
        tightest: '-0.05em',
        tighter: '-0.04em',
        tight: '-0.02em',
      },
      fontSize: {
        'hero': 'clamp(4rem, 10vw, 8rem)',
        'hero-sub': 'clamp(1.25rem, 2vw, 1.75rem)',
        'h1': 'clamp(2rem, 3.5vw, 3.5rem)',
        'h2': 'clamp(1.5rem, 2.5vw, 2.5rem)',
        'h3': 'clamp(1.25rem, 1.8vw, 1.5rem)',
        'display-lg': 'clamp(3rem, 7vw, 7rem)',
        'step': 'clamp(4rem, 10vw, 8rem)',
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '26': '6.5rem',
        '30': '7.5rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'fade-in-up': 'fadeInUp 0.8s ease-out forwards',
        'fade-in-down': 'fadeInDown 0.4s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
        'shimmer': 'shimmer 3s infinite linear',
        'pulse-soft': 'pulseSoft 2s infinite ease-in-out',
        'pulse-slow': 'pulseSlow 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-up': 'slideUp 0.5s ease-out',
        'aurora': 'aurora 8s ease-in-out infinite',
        'glow-breathe': 'glowBreathe 3s ease-in-out infinite',
        'reveal-up': 'revealUp 0.8s cubic-bezier(0.25, 0.4, 0.25, 1) forwards',
        'text-shimmer': 'textShimmer 4s linear infinite',
        'float': 'float 6s ease-in-out infinite',
        'rotate-slow': 'rotateSlow 20s linear infinite',
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
        fadeInDown: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        pulseSlow: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        aurora: {
          '0%, 100%': { opacity: '0.4', transform: 'translateX(-50%) scale(1)' },
          '33%': { opacity: '0.7', transform: 'translateX(-48%) scale(1.05)' },
          '66%': { opacity: '0.5', transform: 'translateX(-52%) scale(0.98)' },
        },
        glowBreathe: {
          '0%, 100%': { opacity: '0.6', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.05)' },
        },
        revealUp: {
          '0%': {
            opacity: '0',
            filter: 'blur(10px)',
            transform: 'translateY(40px)',
          },
          '100%': {
            opacity: '1',
            filter: 'blur(0px)',
            transform: 'translateY(0)',
          },
        },
        textShimmer: {
          '0%': { backgroundPosition: '-100% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        rotateSlow: {
          '0%': { transform: 'rotateY(0deg)' },
          '100%': { transform: 'rotateY(360deg)' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config
