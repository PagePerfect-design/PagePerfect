'use client'

import Button from '@/components/Button'
import { useAuth } from '@/lib/auth-context'
import { redirectToCheckout } from '@/lib/stripe'
import { useState } from 'react'

const TIERS = [
  {
    key: 'drafter' as const,
    name: 'Drafter',
    price: 'Free',
    period: 'forever',
    desc: 'Everything you need to start typesetting. No account required.',
    cta: 'Start Free',
    href: '/app',
    highlight: false,
    features: [
      'Unlimited manuscripts',
      'All 8 design templates',
      '3 page sizes (Letter, A4, 6x9)',
      'Real-time PDF preview',
      'Fast compile mode',
      'Markdown auto-clean',
      'PagePerfect watermark on output',
    ],
  },
  {
    key: 'publisher' as const,
    name: 'Publisher',
    price: '$9.99',
    period: '/month',
    desc: 'Print-ready output for serious authors. Clean exports, all sizes.',
    cta: 'Start Publishing',
    href: '/app',
    highlight: true,
    features: [
      'Everything in Drafter',
      'No watermark on exports',
      'All 11 page sizes including Amazon KDP',
      'Full quality compile mode',
      'Print-ready PDF (PDF/X compliance)',
      'Citation & bibliography support',
      'Priority compile queue',
    ],
  },
  {
    key: 'studio' as const,
    name: 'Studio',
    price: '$199',
    period: 'one-time',
    desc: 'Lifetime access. For publishers and prolific authors.',
    cta: 'Buy Lifetime Access',
    href: '/app',
    highlight: false,
    features: [
      'Everything in Publisher, forever',
      'No monthly fees',
      'EPUB export (coming soon)',
      'Custom font upload (coming soon)',
      'Batch export for series',
      'Early access to new templates',
      'Direct support channel',
    ],
  },
]

const FAQ = [
  {
    q: 'Can I use the free tier for real books?',
    a: 'Yes. The free tier is fully functional — unlimited manuscripts, all templates, real-time preview. The only limitation is a small PagePerfect watermark on exported PDFs and fewer page size options.',
  },
  {
    q: 'How does this compare to Vellum ($500)?',
    a: 'Vellum is Mac-only with 26 curated styles and consumer-grade typography. PagePerfect runs in any browser, uses XeLaTeX for professional typesetting with baseline grids and golden-ratio scales, and starts free. Our paid tiers cost a fraction of Vellum.',
  },
  {
    q: 'How does this compare to Atticus ($147)?',
    a: 'Atticus is a good tool with known performance issues — typing lag on long documents, import corruption, no offline mode. PagePerfect is faster (server-side compilation), produces higher-quality typography (XeLaTeX vs. browser rendering), and has a free tier.',
  },
  {
    q: 'Do I need to know Markdown?',
    a: 'Basic Markdown is simple: # for headings, **bold**, *italic*. If you can write an email, you can write Markdown. We also auto-clean pasted text from Word, so you can copy-paste from your existing manuscript.',
  },
  {
    q: 'What about EPUB support?',
    a: 'EPUB export is in development and will be available to Studio tier members first. We want to get it right — our EPUB output will use the same typographic principles as our PDF engine.',
  },
  {
    q: 'Is my manuscript data safe?',
    a: 'Your text is sent to our server only for compilation and is immediately deleted after the PDF is generated. We do not store manuscripts. All processing happens in isolated temporary directories that are cleaned up after each compile.',
  },
]

export default function PricingPage() {
  const { user, tier: currentTier } = useAuth()
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleUpgrade(tierKey: 'publisher' | 'studio') {
    if (!user) {
      window.location.href = '/auth/login?redirect=/pricing'
      return
    }

    setError(null)
    setCheckoutLoading(tierKey)
    try {
      await redirectToCheckout(tierKey, user.id)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.')
    } finally {
      setCheckoutLoading(null)
    }
  }

  function getCtaForTier(tier: typeof TIERS[number]) {
    // If user already has this tier or higher
    if (tier.key === 'drafter') {
      if (currentTier === 'drafter' && user) return { label: 'Current Plan', disabled: true }
      return { label: tier.cta, disabled: false }
    }
    if (tier.key === 'publisher') {
      if (currentTier === 'publisher') return { label: 'Current Plan', disabled: true }
      if (currentTier === 'studio') return { label: 'Included', disabled: true }
      return { label: user ? tier.cta : 'Sign in to Upgrade', disabled: false }
    }
    // studio
    if (currentTier === 'studio') return { label: 'Current Plan', disabled: true }
    return { label: user ? tier.cta : 'Sign in to Upgrade', disabled: false }
  }

  return (
    <main id="main">
      {/* Header */}
      <section className="pt-16 pb-8 md:pt-24 md:pb-12 text-center">
        <div className="mx-auto max-w-3xl px-6 md:px-8">
          <p className="font-mono text-sm tracking-widest text-accent uppercase mb-4">Pricing</p>
          <h1 className="font-display text-h1 font-bold tracking-tight text-text-primary">
            Free to start. Pro when you&apos;re ready.
          </h1>
          <p className="mt-4 text-lg text-text-secondary max-w-xl mx-auto">
            The free tier is genuinely useful — not a demo. Upgrade when you need
            print-ready exports and advanced features.
          </p>
        </div>
      </section>

      {error && (
        <div className="mx-auto max-w-6xl px-6 md:px-8 mb-4">
          <div className="rounded-xl border border-danger/20 bg-danger-muted px-4 py-3 text-sm text-danger">
            {error}
          </div>
        </div>
      )}

      {/* Tiers */}
      <section className="py-8 md:py-12">
        <div className="mx-auto max-w-6xl px-6 md:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            {TIERS.map(tier => {
              const cta = getCtaForTier(tier)
              const isLoading = checkoutLoading === tier.key

              return (
                <div
                  key={tier.name}
                  className={`card p-8 flex flex-col transition-all duration-200 ${
                    tier.highlight
                      ? 'border-accent/30 shadow-glow-accent ring-1 ring-accent/20 scale-[1.02] md:scale-105'
                      : 'hover:border-border-visible'
                  }`}
                >
                  {tier.highlight && (
                    <div className="font-mono text-xs text-accent tracking-widest uppercase mb-4">Most Popular</div>
                  )}
                  <h3 className="font-display text-2xl font-bold text-text-primary">{tier.name}</h3>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="font-display text-4xl font-black text-text-primary">{tier.price}</span>
                    <span className="text-sm text-text-tertiary">{tier.period}</span>
                  </div>
                  <p className="mt-3 text-sm text-text-secondary leading-relaxed">{tier.desc}</p>
                  <div className="mt-6">
                    {tier.key === 'drafter' ? (
                      <Button
                        variant={tier.highlight ? 'primary' : 'secondary'}
                        href={tier.href}
                        className="w-full"
                      >
                        {cta.label}
                      </Button>
                    ) : (
                      <button
                        className={`btn-pill w-full px-5 py-3 text-sm font-semibold ${
                          tier.highlight ? 'btn-primary' : 'btn-secondary'
                        }`}
                        disabled={cta.disabled || isLoading}
                        onClick={() => void handleUpgrade(tier.key as 'publisher' | 'studio')}
                      >
                        {isLoading ? (
                          <span className="flex items-center justify-center gap-2">
                            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            Redirecting…
                          </span>
                        ) : (
                          cta.label
                        )}
                      </button>
                    )}
                  </div>
                  <ul className="mt-8 space-y-3 flex-1">
                    {tier.features.map(f => (
                      <li key={f} className="flex items-start gap-3 text-sm">
                        <span className="text-accent mt-0.5 flex-shrink-0">
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M13.5 4.5L6.5 11.5L2.5 7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </span>
                        <span className="text-text-secondary">{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <div className="divider" />

      {/* FAQ */}
      <section className="py-20 md:py-28">
        <div className="mx-auto max-w-3xl px-6 md:px-8">
          <h2 className="font-display text-h2 font-bold tracking-tight text-text-primary text-center mb-12">
            Frequently asked questions
          </h2>
          <div className="space-y-8">
            {FAQ.map(item => (
              <div key={item.q}>
                <h3 className="font-display text-lg font-bold text-text-primary mb-2">{item.q}</h3>
                <p className="text-text-secondary leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="divider" />

      {/* CTA */}
      <section className="py-20 md:py-28 text-center">
        <div className="mx-auto max-w-3xl px-6 md:px-8">
          <h2 className="font-display text-h2 font-bold tracking-tight text-text-primary">
            Try it now — no signup required
          </h2>
          <p className="mt-4 text-text-secondary">
            Open the editor, paste your manuscript, and see professional typesetting in seconds.
          </p>
          <div className="mt-8">
            <Button size="lg" href="/app">Open the Editor</Button>
          </div>
        </div>
      </section>
    </main>
  )
}
