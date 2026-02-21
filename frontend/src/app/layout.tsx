import type { Metadata } from 'next'
import './globals.css'
import { Inter_Tight, Source_Serif_4, IBM_Plex_Mono } from 'next/font/google'
import Providers from '@/components/Providers'

const display = Inter_Tight({ subsets: ['latin'], variable: '--font-display', weight: ['400','500','600','700','800'] })
const body = Source_Serif_4({ subsets: ['latin'], variable: '--font-body' })
const mono = IBM_Plex_Mono({ subsets: ['latin'], variable: '--font-mono', weight: ['400','600'] })

export const metadata: Metadata = {
  title: 'PagePerfect — Professional Typesetting in Your Browser',
  description: 'Transform Markdown into beautifully typeset, print-ready PDFs. Powered by XeLaTeX with Muller-Brockmann grid systems, golden-ratio typography, and baseline grids.',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    shortcut: '/favicon.svg',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
  themeColor: '#FDFCF8',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body className="flex min-h-dvh flex-col bg-[#FDFCF8] text-[#111111] antialiased">
        <div className="bg-noise" />
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
