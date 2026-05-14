import type { Metadata } from 'next'
// CSS cascade order (load globals.css first so :root tokens are defined,
// then component layers, then context layers, then motion last so the
// reduced-motion universal cap can override component transitions).
import './globals.css'
import './globals-buttons.css'
import './globals-docs.css'
import './globals-journal.css'
import './globals-motion.css'
import { headers } from 'next/headers'
import { Inter_Tight, Source_Serif_4, IBM_Plex_Mono } from 'next/font/google'
import { ViewTransitions } from 'next-view-transitions'
import Providers from '@/components/Providers'

const display = Inter_Tight({ subsets: ['latin'], variable: '--font-display', weight: ['400','500','600','700','800'] })
const body = Source_Serif_4({ subsets: ['latin'], variable: '--font-body' })
const mono = IBM_Plex_Mono({ subsets: ['latin'], variable: '--font-mono', weight: ['400','600'] })

export const metadata: Metadata = {
  title: 'PagePerfect — Professional Typesetting in Your Browser',
  description: 'Transform Markdown into beautifully typeset, print-ready PDFs. Powered by Typst with Muller-Brockmann grid systems, golden-ratio typography, and baseline grids.',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
  themeColor: '#FDFCF8',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Read the nonce from middleware so Next.js applies it to its hydration scripts.
  // Without this read, inline <script> tags lack the nonce and CSP blocks them.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const nonce = (await headers()).get('x-nonce') ?? ''

  return (
    <ViewTransitions>
      <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}>
        <body className="flex min-h-dvh flex-col bg-[#FDFCF8] text-[#111111] antialiased">
          <div className="bg-noise" />
          <Providers>
            {children}
          </Providers>
        </body>
      </html>
    </ViewTransitions>
  )
}
