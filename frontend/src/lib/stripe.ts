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
 * Create a PaymentIntent (Studio) or Subscription (Publisher)
 * on the backend and return the client secret for the Payment Element.
 */
export async function createPayment(
  tier: 'single' | 'publisher' | 'studio',
  userId: string,
  email?: string,
): Promise<{ clientSecret: string; subscriptionId?: string }> {
  const res = await fetch('/api/stripe/create-payment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tier, user_id: userId, email }),
  })

  const data = await res.json()

  if (data.error) {
    throw new Error(data.error)
  }

  return {
    clientSecret: data.clientSecret,
    subscriptionId: data.subscriptionId,
  }
}
