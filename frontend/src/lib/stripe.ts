/**
 * Stripe integration helpers for PagePerfect
 *
 * Environment variables required:
 *   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY — pk_live_... or pk_test_...
 */

import { loadStripe } from '@stripe/stripe-js'

// Singleton Stripe promise — loaded once, reused across the app
const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
export const stripePromise = stripePublishableKey
  ? loadStripe(stripePublishableKey)
  : null

/**
 * Create a PaymentIntent on the backend and return the client secret
 * for the Payment Element. Both tiers are one-time payments.
 */
export async function createPayment(
  tier: 'publisher' | 'studio',
  userId: string,
  email?: string,
  turnstileToken?: string | null,
): Promise<{ clientSecret: string }> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (turnstileToken) headers['x-turnstile-token'] = turnstileToken

  const res = await fetch('/api/stripe/create-payment', {
    method: 'POST',
    headers,
    body: JSON.stringify({ tier, user_id: userId, email }),
  })

  const data = await res.json()

  if (data.error) {
    throw new Error(data.error)
  }

  return {
    clientSecret: data.clientSecret,
  }
}
