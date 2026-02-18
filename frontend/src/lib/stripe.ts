/**
 * Stripe integration helpers for PagePerfect
 *
 * Environment variables required:
 *   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY — pk_live_... or pk_test_...
 *   STRIPE_SECRET_KEY                  — sk_live_... or sk_test_... (server-side only)
 *   STRIPE_WEBHOOK_SECRET              — whsec_... (server-side only)
 *
 * Price IDs configured per tier (set in .env):
 *   STRIPE_PRICE_PUBLISHER_MONTHLY — price_... ($9.99/mo)
 *   STRIPE_PRICE_STUDIO_LIFETIME   — price_... ($199 one-time)
 */

export const STRIPE_TIERS = {
  drafter: {
    name: 'Drafter',
    price: 'Free',
    priceId: null, // No Stripe price — free tier
  },
  publisher: {
    name: 'Publisher',
    price: '$9.99/mo',
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PUBLISHER ?? null,
  },
  studio: {
    name: 'Studio',
    price: '$199',
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_STUDIO ?? null,
  },
} as const

/**
 * Redirect the user to Stripe Checkout.
 * Calls our API route which creates the session server-side.
 */
export async function redirectToCheckout(tier: 'publisher' | 'studio', userId: string) {
  const res = await fetch('/api/stripe/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tier, user_id: userId }),
  })

  const { url, error } = await res.json()

  if (error) {
    throw new Error(error)
  }

  // Redirect to Stripe-hosted checkout
  window.location.href = url
}
