import type { Metadata } from 'next'
import { Suspense } from 'react'
import JournalHeader from './JournalHeader'
import JournalClient from './JournalClient'

export const metadata: Metadata = {
  title: 'Typography & Conversion — PagePerfect Journal',
  description:
    'Essays on typography, layout, and visual communication. Where Swiss precision meets conversion-driven design — grounded in Müller-Brockmann, Ogilvy, and empirical reader research.',
  openGraph: {
    title: 'Typography & Conversion — PagePerfect Journal',
    description:
      'Essays on typography, layout, and visual communication. Where Swiss precision meets conversion-driven design.',
    type: 'website',
  },
}

export default function JournalPage() {
  return (
    <main id="main">
      <JournalHeader />

      {/* Client-side filtered + paginated article list */}
      <Suspense>
        <JournalClient />
      </Suspense>
    </main>
  )
}
