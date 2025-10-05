import type { Config } from 'tailwindcss'

export default {
  content: [
    './src/app/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        ens: {
          blue: '#0080BC',
          light: '#CEE1E8',
          dark: '#011A25',
          white: '#F6F6F6',
          midnight: '#093C52',
          gray: { 700: '#4A5C63', 300: '#C4C7C8', 200: '#E5E5E5' },
          green: '#007C23',
          magenta: '#F53293',
          yellow: '#FFF72F'
        }
      },
      borderRadius: {
        xl: '1.25rem',
        '2xl': '1.5rem',
        pill: '9999px'
      },
      boxShadow: {
        card: '0 4px 14px rgba(17,26,37,.06)',
        pill: '0 8px 24px rgba(0,128,188,.28)'
      },
      fontFamily: {
        display: ['var(--font-display)'],
        body: ['var(--font-body)'],
        mono: ['var(--font-mono)']
      },
      fontSize: {
        hero: 'clamp(2.5rem, 4vw, 4rem)',
        h1: 'clamp(2rem, 3vw, 3rem)',
        h2: 'clamp(1.5rem, 2.2vw, 2.25rem)'
      }
    }
  },
  plugins: []
} satisfies Config
