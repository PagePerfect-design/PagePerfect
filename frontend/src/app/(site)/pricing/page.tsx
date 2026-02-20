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
    body: 'Everything you need to start. All 12 typographic systems, 6 page sizes, real-time preview. Unlimited manuscripts, unlimited compiles.',
    aside: 'Watermarked output. Upgrade when your book is ready for print.',
    cta: 'Start Free',
    href: '/app',
  },
  {
    num: '02',
    key: 'single' as const,
    name: 'Single',
    price: '\u00a32.99',
    period: 'per PDF',
    body: 'One clean, watermark-free export. All 19 page sizes including Amazon KDP formats. Full quality compile, print-ready output.',
    aside: 'No subscription. Pay only when you need a clean export.',
    cta: 'Buy One PDF',
    href: '/app',
  },
  {
    num: '03',
    key: 'publisher' as const,
    name: 'Publisher',
    price: '$9.99',
    period: '/month',
    recommended: true,
    body: 'Unlimited watermark-free exports for serious authors. Citations and bibliography support, priority compile queue, PDF/X compliance.',
    aside: 'Cancel anytime. Most authors choose this.',
    cta: 'Start Publishing',
    href: '/app',
  },
  {
    num: '04',
    key: 'studio' as const,
    name: 'Studio',
    price: '$199',
    period: 'once',
    body: 'Lifetime Publisher access. No monthly fees, ever. EPUB export, custom font upload, batch export for series \u2014 all coming.',
    aside: 'Pay once, own it forever. For publishers and prolific authors.',
    cta: 'Get Studio',
    href: '/app',
  },
]

// ── Feature comparison — text values, not checkmarks ──

const COMPARISON: { feature: string; values: [string, string, string, string] }[] = [
  { feature: 'PDF output',              values: ['Watermarked',  '1 clean export', 'Unlimited clean', 'Unlimited clean'] },
  { feature: 'Page sizes',              values: ['6 standard',   'All 19',         'All 19',          'All 19'] },
  { feature: 'Compile quality',         values: ['Fast mode',    'Full quality',   'Full quality',    'Full quality'] },
  { feature: 'Amazon KDP formats',      values: ['\u2014',       'Included',       'Included',        'Included'] },
  { feature: 'Citations & bibliography', values: ['\u2014',       '\u2014',         'Included',        'Included'] },
  { feature: 'PDF/X compliance',        values: ['\u2014',       '\u2014',         'Included',        'Included'] },
  { feature: 'Priority compile',        values: ['\u2014',       '\u2014',         'Included',        'Included'] },
  { feature: 'EPUB export',             values: ['\u2014',       '\u2014',         '\u2014',          'Coming soon'] },
  { feature: 'Custom font upload',      values: ['\u2014',       '\u2014',         '\u2014',          'Coming soon'] },
  { feature: 'Batch export',            values: ['\u2014',       '\u2014',         '\u2014',          'Coming soon'] },
]

const TIER_NAMES = ['Drafter', 'Single', 'Publisher', 'Studio'] as const

const FAQ = [
  {
    q: 'Can I use the free tier for real books?',
    a: 'Yes. The free tier is fully functional \u2014 unlimited manuscripts, all templates, real-time preview. The only limitation is a small PagePerfect watermark on exported PDFs and fewer page size options.',
  },
  {
    q: 'How does this compare to Vellum ($500)?',
    a: 'Vellum is Mac-only with 26 curated styles and consumer-grade typography. PagePerfect runs in any browser, uses XeLaTeX for professional typesetting with baseline grids and golden-ratio scales, and starts free.',
  },
  {
    q: 'How does this compare to Atticus ($147)?',
    a: 'Atticus has known performance issues \u2014 typing lag on long documents, import corruption, no offline mode. PagePerfect is faster (server-side compilation), produces higher-quality typography, and has a free tier.',
  },
  {
    q: 'Do I need to know Markdown?',
    a: 'Basic Markdown is simple: # for headings, **bold**, *italic*. If you can write an email, you can write Markdown. We also auto-clean pasted text from Word.',
  },
  {
    q: 'What about EPUB support?',
    a: 'EPUB export is in development and will be available to Studio tier members first. Our EPUB output will use the same typographic principles as our PDF engine.',
  },
  {
    q: 'Is my manuscript data safe?',
    a: 'Your text is sent to our server only for compilation and is immediately deleted after the PDF is generated. All processing happens in isolated temporary directories that are cleaned up after each compile.',
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
  onUpgrade: (key: 'single' | 'publisher' | 'studio') => void
}) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

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
        <span className="font-display text-[4rem] font-extrabold leading-none tracking-tighter text-white/[0.07] transition-colors duration-500 group-hover:text-[#0033ff]/[0.15] md:text-[5rem]">
          {tier.num}
        </span>

        {/* Name + description — editorial */}
        <div>
          <div className="flex items-baseline gap-4">
            <h3 className="font-mono text-[13px] uppercase tracking-[0.15em] text-white/70">
              {tier.name}
            </h3>
            {'recommended' in tier && (
              <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#0033ff]">
                Recommended
              </span>
            )}
          </div>
          <p className="mt-4 font-body text-[15px] leading-relaxed text-white/55 md:text-base">
            {tier.body}
          </p>
        </div>

        {/* Price + aside + CTA */}
        <div className="border-l border-white/[0.08] pl-6">
          <div className="flex items-baseline gap-2">
            <span className="font-display text-[2rem] font-extrabold leading-none tracking-tighter text-white md:text-[2.5rem]">
              {tier.price}
            </span>
            <span className="font-mono text-[11px] text-white/35">{tier.period}</span>
          </div>
          <p className="mt-3 font-body text-[14px] leading-relaxed text-white/40 italic md:text-[15px]">
            {tier.aside}
          </p>

          {/* CTA */}
          <div className="mt-5">
            {tier.key === 'drafter' ? (
              <Link
                href={cta.disabled ? '#' : tier.href}
                aria-disabled={cta.disabled}
                className={`group/btn inline-flex h-10 items-center gap-2 px-6 font-mono text-[11px] uppercase tracking-[0.1em] transition-all duration-200 ${
                  cta.disabled
                    ? 'cursor-default border border-white/[0.06] text-white/25'
                    : 'border border-white/[0.12] text-white/60 hover:border-white/[0.25] hover:text-white/80'
                }`}
              >
                {cta.label}
                {!cta.disabled && (
                  <ArrowRight className="h-3 w-3 transition-transform duration-200 group-hover/btn:translate-x-0.5" />
                )}
              </Link>
            ) : (
              <button
                disabled={cta.disabled || isLoading}
                onClick={() => onUpgrade(tier.key as 'single' | 'publisher' | 'studio')}
                className={`group/btn inline-flex h-10 items-center gap-2 px-6 font-mono text-[11px] uppercase tracking-[0.1em] transition-all duration-200 ${
                  cta.disabled
                    ? 'cursor-default border border-white/[0.06] text-white/25'
                    : tier.key === 'publisher'
                      ? 'bg-[#0033ff] text-white hover:bg-[#2255ff]'
                      : 'border border-white/[0.12] text-white/60 hover:border-white/[0.25] hover:text-white/80'
                }`}
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
  tier: 'single' | 'publisher' | 'studio'
  onSuccess: () => void
  onError: (msg: string) => void
}) {
  const stripe = useStripe()
  const elements = useElements()
  const [processing, setProcessing] = useState(false)

  const buttonLabel = {
    single: 'Pay \u00a32.99 \u2014 One PDF',
    publisher: 'Subscribe \u2014 $9.99/mo',
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
          className="flex h-12 w-full items-center justify-center gap-2 bg-[#0033ff] font-mono text-[12px] uppercase tracking-[0.1em] text-white transition-all duration-200 hover:bg-[#2255ff] disabled:opacity-50"
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
          Secure payment via Stripe. Cancel anytime.
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
  tier: 'single' | 'publisher' | 'studio'
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
        colorPrimary: '#0033ff',
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
              {{ single: 'Single PDF', publisher: 'Publisher', studio: 'Studio' }[tier]}
            </p>
            <p className="mt-1 font-mono text-[11px] text-white/35">
              {{ single: '\u00a32.99 \u00b7 one watermark-free PDF', publisher: '$9.99/month \u00b7 cancel anytime', studio: '$199 one-time \u00b7 lifetime access' }[tier]}
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
      <div className="flex items-center gap-4 border border-emerald-500/20 bg-emerald-500/[0.05] px-6 py-4">
        <div className="flex h-8 w-8 items-center justify-center bg-emerald-500/20">
          <Check className="h-4 w-4 text-emerald-400" />
        </div>
        <div>
          <p className="font-display text-[15px] font-semibold text-white">
            {tier === 'single'
              ? 'PDF purchased'
              : `Welcome to ${tier === 'publisher' ? 'Publisher' : 'Studio'}`}
          </p>
          <p className="font-body text-[13px] text-white/50">
            {tier === 'single'
              ? 'Your watermark-free PDF is ready to download.'
              : 'Your account has been upgraded. All features are now unlocked.'}
          </p>
        </div>
      </div>
    </motion.div>
  )
}

// ── Page ──

export default function PricingPage() {
  const { user, tier: currentTier } = useAuth()
  const [checkoutTier, setCheckoutTier] = useState<'single' | 'publisher' | 'studio' | null>(null)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [successTier, setSuccessTier] = useState<string | null>(null)

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

  async function handleUpgrade(tierKey: 'single' | 'publisher' | 'studio') {
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
      if (currentTier === 'drafter' && user) return { label: 'Current Plan', disabled: true }
      return { label: tier.cta, disabled: false }
    }
    if (tier.key === 'single') {
      return { label: user ? tier.cta : 'Sign in to Buy', disabled: false }
    }
    if (tier.key === 'publisher') {
      if (currentTier === 'publisher') return { label: 'Current Plan', disabled: true }
      if (currentTier === 'studio') return { label: 'Included', disabled: true }
      return { label: user ? tier.cta : 'Sign in to Upgrade', disabled: false }
    }
    if (currentTier === 'studio') return { label: 'Current Plan', disabled: true }
    return { label: user ? tier.cta : 'Sign in to Upgrade', disabled: false }
  }

  return (
    <main id="main">
      {/* ── HEADER ── */}
      <section className="pt-32 pb-16 md:pt-44 md:pb-20">
        <div ref={headerRef} className="mx-auto max-w-6xl px-6 md:px-8">
          <motion.p
            initial={{ opacity: 0 }}
            animate={headerInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.5, ease }}
            className="mb-4 font-mono text-[11px] uppercase tracking-[0.15em] text-white/40"
          >
            Pricing
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={headerInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.1, ease }}
            className="max-w-3xl font-display text-display-lg font-extrabold leading-[0.9] tracking-tighter text-white"
          >
            Simple pricing.
            <br />
            No surprises.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={headerInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.2, ease }}
            className="mt-6 max-w-xl font-body text-lg leading-relaxed text-white/50"
          >
            The free tier is genuinely useful &mdash; not a demo. Upgrade when your book is ready for print.
          </motion.p>
        </div>
      </section>

      {successTier && <SuccessBanner tier={successTier} />}

      {error && (
        <div className="mx-auto mb-6 max-w-6xl px-6 md:px-8">
          <div className="flex items-center justify-between border border-red-500/20 bg-red-500/[0.05] px-5 py-3">
            <p className="font-mono text-[13px] text-red-400">{error}</p>
            <button onClick={() => setError(null)} className="text-red-400/60 hover:text-red-400">
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
                <div className="h-px bg-white/[0.06]" />
                <TierRow
                  tier={tier}
                  index={i}
                  cta={getCtaForTier(tier)}
                  isLoading={checkoutLoading === tier.key}
                  onUpgrade={handleUpgrade}
                />
              </Fragment>
            ))}
            <div className="h-px bg-white/[0.06]" />
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
            <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.15em] text-white/40">
              Compare
            </p>
            <h2 className="font-display text-4xl font-extrabold leading-[0.9] tracking-tighter text-white md:text-5xl">
              What&apos;s included
            </h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={compareInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.6, delay: 0.2, ease }}
            className="-mx-6 overflow-x-auto px-6 md:mx-0 md:px-0"
          >
            <div className="min-w-[640px]">
              {/* Header row */}
              <div className="grid grid-cols-[1fr_repeat(4,_minmax(0,_8rem))] gap-x-4 pb-4 md:gap-x-6">
                <div />
                {TIER_NAMES.map((name, i) => (
                  <div key={name} className="text-right">
                    <span className={`font-mono text-[11px] uppercase tracking-[0.15em] ${i === 2 ? 'text-[#0033ff]' : 'text-white/50'}`}>
                      {name}
                    </span>
                  </div>
                ))}
              </div>

              {/* Feature rows */}
              {COMPARISON.map((row) => (
                <Fragment key={row.feature}>
                  <div className="h-px bg-white/[0.06]" />
                  <div className="grid grid-cols-[1fr_repeat(4,_minmax(0,_8rem))] items-baseline gap-x-4 py-4 md:gap-x-6">
                    <span className="font-body text-[14px] text-white/60 md:text-[15px]">
                      {row.feature}
                    </span>
                    {row.values.map((val, i) => (
                      <span
                        key={i}
                        className={`text-right font-mono text-[12px] ${
                          val === '\u2014'
                            ? 'text-white/20'
                            : val === 'Coming soon'
                              ? 'text-white/30 italic'
                              : 'text-white/55'
                        }`}
                      >
                        {val}
                      </span>
                    ))}
                  </div>
                </Fragment>
              ))}
              <div className="h-px bg-white/[0.06]" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Hairline */}
      <div className="mx-auto max-w-6xl px-6 md:px-8">
        <div className="h-px bg-white/[0.06]" />
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
            <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.15em] text-white/40">
              FAQ
            </p>
            <h2 className="font-display text-4xl font-extrabold leading-[0.9] tracking-tighter text-white md:text-5xl">
              Common questions
            </h2>
          </motion.div>

          <div>
            {FAQ.map((item, i) => (
              <Fragment key={item.q}>
                <div className="h-px bg-white/[0.06]" />
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={faqInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.5, delay: 0.1 + i * 0.05, ease }}
                  className="grid grid-cols-1 gap-4 py-10 md:grid-cols-[1fr_1fr] md:gap-12 md:py-12"
                >
                  <h3 className="font-display text-[17px] font-bold leading-snug text-white/90">
                    {item.q}
                  </h3>
                  <p className="font-body text-[15px] leading-relaxed text-white/45">
                    {item.a}
                  </p>
                </motion.div>
              </Fragment>
            ))}
            <div className="h-px bg-white/[0.06]" />
          </div>
        </div>
      </section>

      {/* Hairline */}
      <div className="mx-auto max-w-6xl px-6 md:px-8">
        <div className="h-px bg-white/[0.06]" />
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
            <h2 className="font-display text-4xl font-extrabold leading-[0.9] tracking-tighter text-white md:text-5xl">
              Try it now.
              <br />
              No signup required.
            </h2>
            <p className="mt-6 font-body text-lg leading-relaxed text-white/50">
              Open the editor, paste your manuscript, and see professional typesetting in seconds.
            </p>
            <div className="mt-10 flex items-center gap-6">
              <Link
                href="/app"
                className="group inline-flex h-13 items-center gap-3 bg-[#0033ff] px-10 font-display text-[15px] font-semibold text-white transition-all duration-200 hover:bg-[#2255ff]"
              >
                Open the Editor
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
              <Link
                href="/docs"
                className="font-mono text-[11px] uppercase tracking-[0.15em] text-white/45 transition-colors hover:text-white/70"
              >
                Read the docs
              </Link>
            </div>
            <p className="mt-6 font-mono text-[11px] text-white/30">
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
