import type { Metadata } from 'next'
import './globals.css'
import { Inter_Tight, Source_Serif_4, IBM_Plex_Mono } from 'next/font/google'
import Link from 'next/link'
import Image from 'next/image'
import Providers from '@/components/Providers'
import NavAuth from '@/components/NavAuth'

const display = Inter_Tight({ subsets: ['latin'], variable: '--font-display', weight: ['400','500','600','700'] })
const body = Source_Serif_4({ subsets: ['latin'], variable: '--font-body' })
const mono = IBM_Plex_Mono({ subsets: ['latin'], variable: '--font-mono', weight: ['400','600'] })

export const metadata: Metadata = {
  title: 'PagePerfect — Professional Typesetting in Your Browser',
  description: 'Transform Markdown into beautifully typeset, print-ready PDFs. Powered by XeLaTeX with Muller-Brockmann grid systems, golden-ratio typography, and baseline grids.',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
  themeColor: '#030305',
}

function Nav() {
  return (
    <nav className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#050507]/80 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-6 md:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-3 transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2">
            <Image src="/PagePerfect_1_Icon.png" alt="PagePerfect" width={28} height={28} className="h-7 w-7" priority />
            <span className="font-display text-lg font-bold tracking-tighter text-white">PagePerfect</span>
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/pricing" className="text-sm text-white/50 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2">Pricing</Link>
            <Link href="/docs" className="text-sm text-white/50 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2">Docs</Link>
            <NavAuth />
            <Link href="/app" className="glass-pill px-5 py-2 text-sm font-semibold text-white">Open Editor</Link>
          </div>
        </div>
      </div>
    </nav>
  )
}

function Footer() {
  return (
    <footer className="border-t border-white/[0.06] bg-surface py-12">
      <div className="mx-auto max-w-7xl px-6 md:px-8">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex items-center gap-3">
            <Image src="/PagePerfect_1_Icon.png" alt="PagePerfect" width={20} height={20} className="h-5 w-5 opacity-60" />
            <span className="text-sm text-white/30">PagePerfect</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-white/30">
            <Link href="/pricing" className="transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-accent">Pricing</Link>
            <Link href="/docs" className="transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-accent">Docs</Link>
            <Link href="/status" className="transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-accent">Status</Link>
          </div>
          <p className="text-xs text-white/15">Built on XeLaTeX. Inspired by Muller-Brockmann.</p>
        </div>
      </div>
    </footer>
  )
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body className="flex min-h-dvh flex-col bg-surface text-white antialiased">
        <div className="bg-noise" />
        <Providers>
          <a href="#main" className="skip-link">Skip to content</a>
          <Nav />
          <div className="flex-1">{children}</div>
          <Footer />
        </Providers>
      </body>
    </html>
  )
}
