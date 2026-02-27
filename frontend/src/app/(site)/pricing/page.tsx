'use client'

import { Fragment, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import { ArrowRight, Check, X, Loader2 } from 'lucide-react'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import type { StripeElementsOptions } from '@stripe/stripe-js'
import { useAuth } from '@/lib/auth-context'
import { stripePromise, createPayment } from '@/lib/stripe'

const ease = [0.25, 0.4, 0.25, 1] as const

// ── Tier data — editorial prose, not bullet lists ──

const TIERS = [
  {
    num: '01',
    key: 'drafter' as const,
    name: 'Drafter',
    price: 'Free',
    period: 'forever',
    body: 'Test your manuscript before you pay. All 15 templates, unlimited manuscripts, real-time preview. See exactly how your book will look on every page size.',
    aside: 'Watermarked output. No account required.',
    cta: 'Start Drafting',
    href: '/app',
  },
  {
    num: '02',
    key: 'publisher' as const,
    name: 'Publisher',
    price: '$19.99',
    period: 'per manuscript',
    recommended: true,
    body: 'One manuscript, print-ready tonight. Watermark-free PDF with correct bleed, margins, and trim for Amazon KDP and IngramSpark. All 19 page sizes, citations, and bibliography support. 14 days of unlimited re-exports to fix final typos.',
    aside: 'No subscription. Pay when your book is ready to ship.',
    cta: 'Typeset My Book',
    href: '/app',
  },
  {
    num: '03',
    key: 'studio' as const,
    name: 'Studio',
    price: '$199',
    period: 'once',
    body: 'Lifetime access for every book you write. Unlimited watermark-free exports, EPUB generation, custom font uploads, and batch exporting for multi-book series.',
    aside: 'Pay once. For authors with more than one book ahead of them.',
    cta: 'Get Studio',
    href: '/app',
  },
]

// ── Feature comparison — text values, not checkmarks ──

const COMPARISON: { feature: string; values: [string, string, string] }[] = [
  { feature: 'PDF output',              values: ['Watermarked',  '1 manuscript',    'Unlimited'] },
  { feature: 'Page sizes',              values: ['6 standard',   'All 19',          'All 19'] },
  { feature: 'Typesetting engine',       values: ['Typst',          'Typst',            'Typst'] },
  { feature: 'Amazon KDP formats',      values: ['\u2014',       'Included',        'Included'] },
  { feature: 'Citations & bibliography', values: ['\u2014',       'Included',        'Included'] },
  { feature: 'PDF/X-1a compliance',     values: ['\u2014',       'Included',        'Included'] },
  { feature: 'Re-export window',        values: ['\u2014',       '14 days',         'Unlimited'] },
  { feature: 'EPUB export',             values: ['\u2014',       '\u2014',          'Included'] },
  { feature: 'Custom font upload',      values: ['\u2014',       '\u2014',          'Included'] },
  { feature: 'Batch export',            values: ['\u2014',       '\u2014',          'Included'] },
]

const TIER_NAMES = ['Drafter', 'Publisher', 'Studio'] as const

const FAQ = [
  {
    q: 'Can I use the free tier for real books?',
    a: 'The free tier gives you unlimited manuscripts, all 15 templates, the same Typst engine as paid tiers, and real-time preview. Exported PDFs include a watermark and page sizes are limited to 6 standard options. Design your entire book for free, then pay once to export without the watermark.',
  },
  {
    q: 'What happens after I pay for one manuscript?',
    a: 'You get 14 days of unlimited re-exports for that manuscript. Fix typos, adjust margins, change templates \u2014 re-export as many times as you need. No subscription, no recurring charges.',
  },
  {
    q: 'Will my PDF pass KDP\u2019s automated review?',
    a: 'That\u2019s what we\u2019re built for. PagePerfect generates PDFs with correct bleed, margins, gutter, and trim for all standard KDP and IngramSpark sizes. Fonts are embedded, not referenced.',
  },
  {
    q: 'I\u2019m used to Vellum / Atticus \u2014 why switch?',
    a: 'PagePerfect runs in any browser (not Mac-only), uses a professional typesetting engine for higher-quality output, and lets you preview everything for free before paying. Try it side by side with your current tool.',
  },
  {
    q: 'Does Studio include EPUB export?',
    a: 'Yes. Studio includes automated EPUB3 generation, custom OpenType font uploads, and batch exporting to compile your entire series across all 19 page sizes in one click.',
  },
  {
    q: 'Is my manuscript data safe?',
    a: 'Your text is sent to our server only for compilation. All processing happens in isolated temporary directories that are automatically cleaned up within minutes of each compile. We do not store your manuscript text.',
  },
]

// ── Tier Row — editorial row with functional CTA ──

function TierRow({
  tier,
  index,
  cta,
  isLoading,
  onUpgrade,
}: {
  tier: typeof TIERS[number]
  index: number
  cta: { label: string; disabled: boolean }
  isLoading: boolean
  onUpgrade: (key: 'publisher' | 'studio') => void
}) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

  // Button styles per tier:
  // Drafter — black text, 1px solid black border (utility)
  // Publisher — solid red (primary conversion target)
  // Studio — solid black (heavy, authoritative)
  const buttonClass = cta.disabled
    ? 'cursor-default border border-[#111111]/[0.06] text-[#111111]/20'
    : tier.key === 'publisher'
      ? 'bg-[#FF3333] text-white hover:bg-[#E52222]'
      : tier.key === 'studio'
        ? 'bg-[#111111] text-white hover:bg-[#111111]/90'
        : 'border border-[#111111] text-[#111111] hover:bg-[#111111] hover:text-white'

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay: index * 0.08, ease }}
      className="group"
    >
      <div className="grid grid-cols-1 gap-4 py-12 md:grid-cols-[6rem_1fr_1fr] md:items-baseline md:gap-12 md:py-16">
        {/* Tier number — large, ghosted */}
        <span className="font-display text-[3rem] font-extrabold leading-none tracking-tighter text-[#111111]/[0.06] transition-colors duration-500 group-hover:text-[#FF3333]/20 sm:text-[4rem] md:text-[5rem]">
          {tier.num}
        </span>

        {/* Name + description — editorial */}
        <div>
          <div className="flex items-baseline gap-4">
            <h3 className="font-mono text-[13px] uppercase tracking-[0.15em] text-[#111111]">
              {tier.name}
            </h3>
            {'recommended' in tier && (
              <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#FF3333]">
                Recommended
              </span>
            )}
          </div>
          <p className="mt-4 font-body text-[15px] leading-relaxed text-[#111111]/60 md:text-base">
            {tier.body}
          </p>
        </div>

        {/* Price + aside + CTA */}
        <div className="border-l-0 md:border-l md:border-[#111111] md:pl-6">
          <div className="flex items-baseline gap-2">
            <span className="font-display text-[2rem] font-extrabold leading-none tracking-tighter text-[#111111] md:text-[2.5rem]">
              {tier.price}
            </span>
            <span className="font-mono text-[11px] text-[#111111]/50">{tier.period}</span>
          </div>
          <p className="mt-3 font-mono text-[12px] leading-relaxed text-[#111111]/50">
            {tier.aside}
          </p>

          {/* CTA */}
          <div className="mt-5">
            {tier.key === 'drafter' ? (
              <Link
                href={cta.disabled ? '#' : tier.href}
                aria-disabled={cta.disabled}
                className={`group/btn inline-flex h-11 items-center gap-2 px-6 font-mono text-[11px] uppercase tracking-[0.1em] transition-all duration-200 ${buttonClass}`}
              >
                {cta.label}
                {!cta.disabled && (
                  <ArrowRight className="h-3 w-3 transition-transform duration-200 group-hover/btn:translate-x-0.5" />
                )}
              </Link>
            ) : (
              <button
                disabled={cta.disabled || isLoading}
                onClick={() => onUpgrade(tier.key as 'publisher' | 'studio')}
                className={`group/btn inline-flex h-11 items-center gap-2 px-6 font-mono text-[11px] uppercase tracking-[0.1em] transition-all duration-200 ${buttonClass}`}
              >
                {isLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <>
                    {cta.label}
                    {!cta.disabled && (
                      <ArrowRight className="h-3 w-3 transition-transform duration-200 group-hover/btn:translate-x-0.5" />
                    )}
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ── Payment Form (inside <Elements>) ──

function PaymentForm({
  tier,
  onSuccess,
  onError,
}: {
  tier: 'publisher' | 'studio'
  onSuccess: () => void
  onError: (msg: string) => void
}) {
  const stripe = useStripe()
  const elements = useElements()
  const [processing, setProcessing] = useState(false)

  const buttonLabel = {
    publisher: 'Pay $19.99 \u2014 One Manuscript',
    studio: 'Pay $199 \u2014 Lifetime',
  }[tier]

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!stripe || !elements) return

    setProcessing(true)

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/pricing?success=${tier}`,
      },
      redirect: 'if_required',
    })

    if (error) {
      onError(error.message || 'Payment failed. Please try again.')
      setProcessing(false)
    } else {
      onSuccess()
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="px-6 py-5">
        <PaymentElement
          options={{
            layout: 'tabs',
          }}
        />
      </div>

      <div className="border-t border-neutral-200 px-6 py-5">
        <button
          type="submit"
          disabled={!stripe || processing}
          className="flex h-12 w-full items-center justify-center gap-2 bg-[#FF3333] font-mono text-[12px] uppercase tracking-[0.1em] text-white transition-all duration-200 hover:bg-[#E52222] disabled:opacity-50"
        >
          {processing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Processing&hellip;
            </>
          ) : (
            <>
              {buttonLabel}
              <ArrowRight className="h-3.5 w-3.5" />
            </>
          )}
        </button>
        <p className="mt-3 text-center font-mono text-[10px] text-neutral-400">
          Secure payment via Stripe. No subscription.
        </p>
      </div>
    </form>
  )
}

// ── Checkout Overlay ──

function CheckoutOverlay({
  tier,
  clientSecret,
  onClose,
  onSuccess,
  onError,
}: {
  tier: 'publisher' | 'studio'
  clientSecret: string
  onClose: () => void
  onSuccess: () => void
  onError: (msg: string) => void
}) {
  const elementsOptions: StripeElementsOptions = {
    clientSecret,
    appearance: {
      theme: 'stripe',
      variables: {
        colorPrimary: '#FF3333',
        borderRadius: '0px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      },
    },
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-50 flex items-center justify-center"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <motion.div
        initial={{ opacity: 0, y: 32, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 32, scale: 0.98 }}
        transition={{ duration: 0.4, ease }}
        className="relative z-10 mx-4 w-full max-w-md"
      >
        {/* Header — dark, editorial */}
        <div className="flex items-center justify-between border border-white/[0.06] border-b-0 bg-[#0a0a0f] px-6 py-5">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/40">
              Upgrade to
            </p>
            <p className="font-display text-xl font-extrabold tracking-tight text-white">
              {{ publisher: 'Publisher', studio: 'Studio' }[tier]}
            </p>
            <p className="mt-1 font-mono text-[11px] text-white/35">
              {{ publisher: '$19.99 \u00b7 one print-ready manuscript', studio: '$199 one-time \u00b7 lifetime access' }[tier]}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center text-white/40 transition-colors hover:text-white/70"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Payment form — white background for Stripe Elements readability */}
        <div className="border border-white/[0.06] border-t-0 bg-white">
          {stripePromise ? (
            <Elements stripe={stripePromise} options={elementsOptions}>
              <PaymentForm
                tier={tier}
                onSuccess={onSuccess}
                onError={onError}
              />
            </Elements>
          ) : (
            <div className="flex items-center justify-center py-16">
              <p className="font-mono text-[13px] text-neutral-500">
                Payment not configured.
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── Success Banner ──

function SuccessBanner({ tier }: { tier: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease }}
      className="mx-auto mb-8 max-w-6xl px-6 md:px-8"
    >
      <div className="flex items-center justify-between gap-4 border border-emerald-600/20 bg-emerald-600/[0.05] px-6 py-4">
        <div className="flex items-center gap-4">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center bg-emerald-600/15">
            <Check className="h-4 w-4 text-emerald-700" />
          </div>
          <div>
            <p className="font-display text-[15px] font-semibold text-[#111111]">
              {tier === 'publisher'
                ? 'Manuscript unlocked'
                : 'Welcome to Studio'}
            </p>
            <p className="font-body text-[13px] text-[#111111]/50">
              {tier === 'publisher'
                ? 'Your print-ready export is unlocked. You have 14 days of unlimited re-exports.'
                : 'Lifetime access activated. All features are now unlocked.'}
            </p>
          </div>
        </div>
        <Link
          href="/app"
          className="inline-flex h-10 shrink-0 items-center gap-2 bg-[#FF3333] px-6 font-mono text-[11px] uppercase tracking-[0.1em] text-white transition-all duration-75 hover:bg-[#E52222]"
        >
          Go to Editor
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </motion.div>
  )
}

// ── Page ──

export default function PricingPage() {
  const { user, tier: currentTier, hasActiveWindow, publisherWindowEnd } = useAuth()
  const [checkoutTier, setCheckoutTier] = useState<'publisher' | 'studio' | null>(null)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [successTier, setSuccessTier] = useState<string | null>(null)
  const [publisherDaysLeft, setPublisherDaysLeft] = useState<number | null>(null)

  // Hydration-safe: compute publisher window days left only on client
  useEffect(() => {
    if (!publisherWindowEnd || !hasActiveWindow) return
    setPublisherDaysLeft(Math.ceil((new Date(publisherWindowEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
  }, [publisherWindowEnd, hasActiveWindow])

  const headerRef = useRef(null)
  const compareRef = useRef(null)
  const faqRef = useRef(null)
  const ctaRef = useRef(null)
  const headerInView = useInView(headerRef, { once: true, margin: '-60px' })
  const compareInView = useInView(compareRef, { once: true, margin: '-60px' })
  const faqInView = useInView(faqRef, { once: true, margin: '-60px' })
  const ctaInView = useInView(ctaRef, { once: true, margin: '-60px' })

  // Check for return from redirect-based payment (3D Secure, etc.)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const success = params.get('success')
    if (success) {
      window.history.replaceState({}, '', '/pricing')
      setSuccessTier(success)
    }
  }, [])

  async function handleUpgrade(tierKey: 'publisher' | 'studio') {
    if (!user) {
      window.location.href = '/auth/login?redirect=/pricing'
      return
    }

    setError(null)
    setCheckoutLoading(tierKey)

    try {
      const { clientSecret: secret } = await createPayment(
        tierKey,
        user.id,
        user.email,
      )
      setClientSecret(secret)
      setCheckoutTier(tierKey)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.')
    } finally {
      setCheckoutLoading(null)
    }
  }

  function handleCloseCheckout() {
    setCheckoutTier(null)
    setClientSecret(null)
  }

  function handlePaymentSuccess() {
    setCheckoutTier(null)
    setClientSecret(null)
    setSuccessTier(checkoutTier || 'publisher')
  }

  function handlePaymentError(msg: string) {
    setError(msg)
  }

  function getCtaForTier(tier: typeof TIERS[number]) {
    if (tier.key === 'drafter') {
      if (currentTier === 'drafter' && user && !hasActiveWindow) return { label: 'Current Plan', disabled: true }
      return { label: tier.cta, disabled: false }
    }
    if (tier.key === 'publisher') {
      if (currentTier === 'studio') return { label: 'Included', disabled: true }
      if (hasActiveWindow && publisherWindowEnd) {
        const label = publisherDaysLeft !== null ? `Active — ${publisherDaysLeft}d left` : 'Active'
        return { label, disabled: true }
      }
      return { label: user ? tier.cta : 'Sign in to Buy', disabled: false }
    }
    if (currentTier === 'studio') return { label: 'Current Plan', disabled: true }
    return { label: user ? tier.cta : 'Sign in to Upgrade', disabled: false }
  }

  return (
    <main id="main" className="bg-[#FDFCF8]">
      {/* ── HEADER ── */}
      <section className="pt-32 pb-16 md:pt-44 md:pb-20">
        <div ref={headerRef} className="mx-auto max-w-6xl px-6 md:px-8">
          <motion.p
            initial={{ opacity: 0 }}
            animate={headerInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.5, ease }}
            className="mb-4 font-mono text-[11px] uppercase tracking-[0.15em] text-[#111111]"
          >
            Pricing
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={headerInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.1, ease }}
            className="max-w-3xl font-display text-display-lg font-extrabold leading-[0.9] tracking-tighter text-[#111111]"
          >
            Draft for free.
            <br />
            Pay for the print.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={headerInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.2, ease }}
            className="mt-6 max-w-xl font-body text-lg leading-relaxed text-[#111111]/60"
          >
            Design your entire book for free. Pay once when it&apos;s ready to upload to KDP.
          </motion.p>
        </div>
      </section>

      {successTier && <SuccessBanner tier={successTier} />}

      {error && (
        <div className="mx-auto mb-6 max-w-6xl px-6 md:px-8">
          <div className="flex items-center justify-between border border-red-600/20 bg-red-600/[0.05] px-5 py-3">
            <p className="font-mono text-[13px] text-red-700">{error}</p>
            <button onClick={() => setError(null)} className="text-red-700/60 hover:text-red-700">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ── TIER ROWS ── */}
      <section className="pb-24 md:pb-32">
        <div className="mx-auto max-w-6xl px-6 md:px-8">
          <div>
            {TIERS.map((tier, i) => (
              <Fragment key={tier.key}>
                <div className="h-px bg-[#111111]/10" />
                <TierRow
                  tier={tier}
                  index={i}
                  cta={getCtaForTier(tier)}
                  isLoading={checkoutLoading === tier.key}
                  onUpgrade={handleUpgrade}
                />
              </Fragment>
            ))}
            <div className="h-px bg-[#111111]/10" />
          </div>
        </div>
      </section>

      {/* ── COMPARISON TABLE — Swiss-style feature matrix ── */}
      <section ref={compareRef} className="pb-32 md:pb-44">
        <div className="mx-auto max-w-6xl px-6 md:px-8">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={compareInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, ease }}
            className="mb-16 max-w-2xl md:mb-20"
          >
            <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.15em] text-[#111111]">
              Compare
            </p>
            <h2 className="font-display text-4xl font-extrabold leading-[0.9] tracking-tighter text-[#111111] md:text-5xl">
              What&apos;s included
            </h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={compareInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.6, delay: 0.2, ease }}
          >
            {/* Desktop table — hidden on mobile */}
            <div className="hidden md:block">
              {/* Header row */}
              <div className="grid grid-cols-[1fr_repeat(3,_minmax(0,_8rem))] gap-x-6 pb-4">
                <div />
                {TIER_NAMES.map((name, i) => (
                  <div key={name} className="text-right">
                    <span className={`font-mono text-[11px] uppercase tracking-[0.15em] ${i === 1 ? 'text-[#FF3333]' : 'text-[#111111]'}`}>
                      {name}
                    </span>
                  </div>
                ))}
              </div>

              {COMPARISON.map((row) => (
                <Fragment key={row.feature}>
                  <div className="h-px bg-[#111111]/10" />
                  <div className="grid grid-cols-[1fr_repeat(3,_minmax(0,_8rem))] items-baseline gap-x-6 py-4">
                    <span className="font-body text-[15px] text-[#111111]/70">
                      {row.feature}
                    </span>
                    {row.values.map((val, i) => (
                      <span
                        key={i}
                        className={`text-right font-mono text-[12px] ${
                          val === '\u2014'
                            ? 'text-[#111111]/25'
                            : 'text-[#111111]/70'
                        }`}
                      >
                        {val}
                      </span>
                    ))}
                  </div>
                </Fragment>
              ))}
              <div className="h-px bg-[#111111]/10" />
            </div>

            {/* Mobile stacked cards — one tier per card */}
            <div className="space-y-8 md:hidden">
              {TIER_NAMES.map((name, ti) => (
                <div key={name} className="border-t border-[#111111]/10 pt-6">
                  <h3 className={`mb-5 font-mono text-[13px] uppercase tracking-[0.15em] ${ti === 1 ? 'text-[#FF3333]' : 'text-[#111111]'}`}>
                    {name}
                  </h3>
                  <div className="space-y-3">
                    {COMPARISON.map((row) => (
                      <div key={row.feature} className="flex items-baseline justify-between gap-4">
                        <span className="font-body text-[14px] text-[#111111]/70">{row.feature}</span>
                        <span className={`shrink-0 text-right font-mono text-[12px] ${
                          row.values[ti] === '\u2014'
                            ? 'text-[#111111]/25'
                            : 'text-[#111111]/70'
                        }`}>
                          {row.values[ti]}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Hairline */}
      <div className="mx-auto max-w-6xl px-6 md:px-8">
        <div className="h-px bg-[#111111]/10" />
      </div>

      {/* ── FAQ ── */}
      <section ref={faqRef} className="py-32 md:py-44">
        <div className="mx-auto max-w-6xl px-6 md:px-8">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={faqInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, ease }}
            className="mb-16 max-w-2xl md:mb-20"
          >
            <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.15em] text-[#111111]">
              FAQ
            </p>
            <h2 className="font-display text-4xl font-extrabold leading-[0.9] tracking-tighter text-[#111111] md:text-5xl">
              Common questions
            </h2>
          </motion.div>

          <div>
            {FAQ.map((item, i) => (
              <Fragment key={item.q}>
                <div className="h-px bg-[#111111]/10" />
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={faqInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.5, delay: 0.1 + i * 0.05, ease }}
                  className="grid grid-cols-1 gap-4 py-10 md:grid-cols-[1fr_1fr] md:gap-12 md:py-12"
                >
                  <h3 className="font-display text-[17px] font-bold leading-snug text-[#111111]">
                    {item.q}
                  </h3>
                  <p className="font-body text-[15px] leading-relaxed text-[#111111]/60">
                    {item.a}
                  </p>
                </motion.div>
              </Fragment>
            ))}
            <div className="h-px bg-[#111111]/10" />
          </div>
        </div>
      </section>

      {/* Hairline */}
      <div className="mx-auto max-w-6xl px-6 md:px-8">
        <div className="h-px bg-[#111111]/10" />
      </div>

      {/* ── FINAL CTA ── */}
      <section ref={ctaRef} className="py-32 md:py-44">
        <div className="mx-auto max-w-6xl px-6 md:px-8">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={ctaInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, ease }}
            className="max-w-2xl"
          >
            <h2 className="font-display text-4xl font-extrabold leading-[0.9] tracking-tighter text-[#111111] md:text-5xl">
              Try it now.
              <br />
              No signup required.
            </h2>
            <p className="mt-6 font-body text-lg leading-relaxed text-[#111111]/60">
              Paste your manuscript, pick your trim size, and see a print-ready preview in seconds.
            </p>
            <div className="mt-10 flex items-center gap-6">
              <Link
                href="/app"
                className="group inline-flex h-13 items-center gap-3 border border-[#111111] bg-[#111111] px-10 font-display text-[15px] font-semibold text-white transition-all duration-75 hover:bg-transparent hover:text-[#111111]"
              >
                Open the Editor
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
              <Link
                href="/docs"
                className="font-mono text-[11px] uppercase tracking-[0.15em] text-[#111111]/50 transition-colors hover:text-[#111111]"
              >
                Read the docs
              </Link>
            </div>
            <p className="mt-6 font-mono text-[11px] text-[#111111]/50">
              No account required &middot; Works in any browser
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── PAYMENT OVERLAY ── */}
      <AnimatePresence>
        {checkoutTier && clientSecret && (
          <CheckoutOverlay
            tier={checkoutTier}
            clientSecret={clientSecret}
            onClose={handleCloseCheckout}
            onSuccess={handlePaymentSuccess}
            onError={handlePaymentError}
          />
        )}
      </AnimatePresence>
    </main>
  )
}
