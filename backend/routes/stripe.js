const express = require('express');
const log = require('../logger');
const { verifyTurnstile } = require('../middleware/turnstile');

/**
 * Stripe routes — webhook + payment creation.
 * @param {object} ctx — shared context from index.js
 */
module.exports = function stripeRoutes(ctx) {
  const router = express.Router();

  // ── Stripe Webhook (needs raw body) ──
  router.post('/api/stripe/webhook',
    express.raw({ type: 'application/json' }),
    async (req, res) => {
      if (!ctx.stripe || !process.env.STRIPE_WEBHOOK_SECRET) {
        return res.status(501).json({ error: 'Stripe not configured' });
      }

      let event;
      try {
        event = ctx.stripe.webhooks.constructEvent(
          req.body,
          req.headers['stripe-signature'],
          process.env.STRIPE_WEBHOOK_SECRET,
        );
      } catch (err) {
        log.error({ module: 'stripe', err: err.message }, 'Webhook signature verification failed');
        return res.status(400).json({ error: 'Invalid signature' });
      }

      // Idempotency — skip already-processed events
      if (await ctx.isStripeEventProcessed(event.id)) {
        log.info({ module: 'stripe', eventId: event.id }, 'Webhook already processed, skipping');
        return res.json({ received: true, duplicate: true });
      }

      // Helper: upgrade a user's tier in PocketBase
      async function upgradeTier(userId, tier, customerId, subscriptionId) {
        if (!ctx.isPocketBaseConfigured) {
          log.error({ module: 'stripe' }, 'PocketBase not configured — cannot update user tier');
          return;
        }
        const update = { tier, stripe_customer_id: customerId };
        if (subscriptionId) update.stripe_subscription_id = subscriptionId;

        try {
          const resp = await ctx.pbFetch(`/api/collections/users/records/${userId}`, {
            method: 'PATCH',
            body: JSON.stringify(update),
          });
          if (!resp || !resp.ok) {
            log.error({ module: 'stripe', status: resp?.status }, 'Failed to update user tier');
          } else {
            log.info({ module: 'stripe', userId, tier }, 'User upgraded');
          }
        } catch (err) {
          log.error({ module: 'stripe', err: err.message }, 'Failed to update user tier');
        }
      }

      // Helper: activate 14-day Publisher export window
      async function activatePublisherWindow(userId, customerId) {
        if (!ctx.isPocketBaseConfigured) {
          log.error({ module: 'stripe' }, 'PocketBase not configured — cannot activate publisher window');
          return;
        }
        try {
          const resp = await ctx.pbFetch(`/api/collections/users/records/${userId}`);
          if (!resp || !resp.ok) {
            log.error({ module: 'stripe', status: resp?.status }, 'Failed to fetch user for window activation');
            return;
          }
          const user = await resp.json();

          const now = new Date();
          const currentEnd = user.publisher_window_end ? new Date(user.publisher_window_end) : null;
          const windowStart = (currentEnd && currentEnd > now) ? currentEnd : now;
          const windowEnd = new Date(windowStart.getTime() + 14 * 24 * 60 * 60 * 1000);

          const patchResp = await ctx.pbFetch(`/api/collections/users/records/${userId}`, {
            method: 'PATCH',
            body: JSON.stringify({
              publisher_window_end: windowEnd.toISOString(),
              stripe_customer_id: customerId,
            }),
          });
          if (patchResp && patchResp.ok) {
            log.info({ module: 'stripe', userId, windowEnd: windowEnd.toISOString() }, 'Publisher window activated');
          } else {
            log.error({ module: 'stripe', status: patchResp?.status }, 'Failed to activate Publisher window');
          }
        } catch (err) {
          log.error({ module: 'stripe', err: err.message }, 'Failed to activate Publisher window');
        }
      }

      // Handle relevant events
      switch (event.type) {
        case 'payment_intent.succeeded': {
          const pi = event.data.object;
          const tier = pi.metadata?.tier;
          const userId = pi.metadata?.user_id;
          log.info({ module: 'stripe', customer: pi.customer, tier, userId }, 'PaymentIntent succeeded');

          // SECURITY: Validate metadata values — only allow known tiers and
          // alphanumeric user IDs to prevent privilege escalation via metadata.
          const validTiers = new Set(['publisher', 'studio']);
          if (userId && typeof userId === 'string' && /^[a-zA-Z0-9]+$/.test(userId) && validTiers.has(tier)) {
            if (tier === 'publisher') {
              await activatePublisherWindow(userId, pi.customer);
            } else {
              await upgradeTier(userId, tier, pi.customer, null);
            }
          } else if (userId && tier) {
            log.warn({ module: 'stripe', tier, userId: String(userId).slice(0, 30) }, 'Rejected webhook with invalid tier or userId format');
          }
          break;
        }
        case 'checkout.session.completed': {
          const session = event.data.object;
          const tier = session.metadata?.tier;
          const userId = session.metadata?.user_id;
          log.info({ module: 'stripe', customer: session.customer, tier, userId }, 'Checkout completed');

          // SECURITY: Same metadata validation as payment_intent.succeeded
          const validCheckoutTiers = new Set(['publisher', 'studio']);
          if (userId && typeof userId === 'string' && /^[a-zA-Z0-9]+$/.test(userId) && validCheckoutTiers.has(tier)) {
            await upgradeTier(userId, tier, session.customer, session.subscription || null);
          } else if (userId && tier) {
            log.warn({ module: 'stripe', tier, userId: String(userId).slice(0, 30) }, 'Rejected checkout webhook with invalid tier or userId format');
          }
          break;
        }
        case 'customer.subscription.deleted': {
          const sub = event.data.object;
          log.info({ module: 'stripe', customer: sub.customer }, 'Subscription cancelled');

          if (!ctx.isPocketBaseConfigured) {
            log.error({ module: 'stripe' }, 'PocketBase not configured — cannot downgrade user');
            break;
          }

          try {
            // SECURITY: Strict Stripe customer ID validation — must match cus_XXXX format.
            // Prevents PocketBase filter injection via crafted customer IDs.
            const custId = String(sub.customer).replace(/[^a-zA-Z0-9_]/g, '');
            if (!/^cus_[a-zA-Z0-9]+$/.test(custId)) {
              log.warn({ module: 'stripe', rawCustomer: String(sub.customer).slice(0, 50) }, 'Invalid Stripe customer ID format — aborting downgrade');
              break;
            }
            const filter = encodeURIComponent(`stripe_customer_id='${custId}'`);
            const listResp = await ctx.pbFetch(`/api/collections/users/records?filter=${filter}`);
            if (!listResp || !listResp.ok) {
              log.error({ module: 'stripe' }, 'Failed to find user for downgrade');
              break;
            }
            const { items } = await listResp.json();
            if (items && items.length > 0) {
              const userId = items[0].id;
              const patchResp = await ctx.pbFetch(`/api/collections/users/records/${userId}`, {
                method: 'PATCH',
                body: JSON.stringify({ tier: 'drafter', stripe_subscription_id: '' }),
              });
              if (patchResp && patchResp.ok) {
                log.info({ module: 'stripe', customer: sub.customer }, 'Customer downgraded to drafter');
              } else {
                log.error({ module: 'stripe', status: patchResp?.status }, 'Failed to downgrade user');
              }
            }
          } catch (err) {
            log.error({ module: 'stripe', err: err.message }, 'Failed to downgrade user');
          }
          break;
        }
        case 'invoice.payment_failed': {
          const invoice = event.data.object;
          log.info({ module: 'stripe', customer: invoice.customer, attempt: invoice.attempt_count }, 'Payment failed');
          break;
        }
        default:
          break;
      }

      res.json({ received: true });
    },
  );

  // ── Stripe Payment Creation ──
  router.post('/api/stripe/create-payment', verifyTurnstile, async (req, res) => {
    if (!ctx.stripe) {
      return res.status(501).json({ error: 'Stripe not configured' });
    }

    const { tier, user_id, email } = req.body;
    if (!['single', 'publisher', 'studio'].includes(tier)) {
      return res.status(400).json({ error: 'Invalid tier' });
    }
    if (!user_id) {
      return res.status(400).json({ error: 'user_id is required' });
    }

    try {
      let customerId;
      if (ctx.isPocketBaseConfigured) {
        try {
          const resp = await ctx.pbFetch(`/api/collections/users/records/${user_id}`);
          if (resp && resp.ok) {
            const user = await resp.json();
            customerId = user.stripe_customer_id;
          }
        } catch { /* user not found */ }
      }

      if (!customerId) {
        const customer = await ctx.stripe.customers.create({
          email: email || undefined,
          metadata: { user_id, tier },
        });
        customerId = customer.id;

        if (ctx.isPocketBaseConfigured) {
          try {
            await ctx.pbFetch(`/api/collections/users/records/${user_id}`, {
              method: 'PATCH',
              body: JSON.stringify({ stripe_customer_id: customerId }),
            });
          } catch { /* non-critical */ }
        }
      }

      if (tier === 'publisher') {
        const paymentIntent = await ctx.stripe.paymentIntents.create({
          amount: 1999,
          currency: 'usd',
          customer: customerId,
          metadata: { tier, user_id },
          automatic_payment_methods: { enabled: true },
        });
        res.json({ clientSecret: paymentIntent.client_secret, customerId });
      } else {
        const paymentIntent = await ctx.stripe.paymentIntents.create({
          amount: 19900,
          currency: 'usd',
          customer: customerId,
          metadata: { tier, user_id },
          automatic_payment_methods: { enabled: true },
        });
        res.json({ clientSecret: paymentIntent.client_secret, customerId });
      }
    } catch (err) {
      log.error({ module: 'stripe', err: err.message }, 'Payment creation error');
      res.status(500).json({ error: 'Failed to create payment' });
    }
  });

  return router;
};
