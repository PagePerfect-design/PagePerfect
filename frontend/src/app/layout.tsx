import type { Metadata } from 'next'
import './globals.css'
import { Space_Grotesk, Source_Serif_4, IBM_Plex_Mono } from 'next/font/google'

const display = Space_Grotesk({ subsets: ['latin'], variable: '--font-display' })
const body = Source_Serif_4({ subsets: ['latin'], variable: '--font-body' })
const mono = IBM_Plex_Mono({ subsets: ['latin'], variable: '--font-mono', weight: ['400','600'] })

export const metadata: Metadata = {
  title: 'Page Perfect',
  description: 'Page Perfect — ENS-inspired UI starter for professional typesetting.',
  icons: {
    icon: '/PagePerfect_1_Icon.png',
    shortcut: '/PagePerfect_1_Icon.png',
    apple: '/PagePerfect_1_Icon.png',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body>
        <a href="#main" className="skip-link">Skip to content</a>
        {children}
      </body>
    </html>
  )
}