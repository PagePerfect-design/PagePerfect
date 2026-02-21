const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const archiver = require('archiver');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn, execSync } = require('child_process');
const GridSystem = require('./grid-system');
const publishing = require('./publishing');
const lulu = require('./lulu');

// ── Publishing Systems ──
const manuscriptStructure = require('./manuscript-structure');
const referencesSystem = require('./references-system');
const figuresSystem = require('./figures-system');
const bookEngineering = require('./book-engineering');
const platformCompliance = require('./platform-compliance');
const provenance = require('./provenance');
const templateExtensions = require('./template-extensions');
const typographyAssurance = require('./typography-assurance');
const multilingual = require('./multilingual');
const printQA = require('./print-qa');
const fontAvailability = require('./font-availability');
const headingVariants = require('./heading-variants');
const watermark = require('./watermark');

// ---- limits (env overridable) ----
const MAX_MD_BYTES = Number(process.env.MAX_MD_BYTES || 2_000_000); // ~2 MB
const COMPILE_TIMEOUT_MS = Number(process.env.COMPILE_TIMEOUT_MS || 45_000); // 45s

// ---- Pandoc version detection ----
// Pandoc 2.11+ has built-in --citeproc; older versions need --filter pandoc-citeproc
let PANDOC_HAS_CITEPROC = true; // Default true — pandoc-citeproc was removed in 2020; any modern install has --citeproc
let PANDOC_VERSION = 'unknown';
try {
  const versionOutput = execSync('pandoc --version', { encoding: 'utf8', timeout: 5000 });
  const match = versionOutput.match(/pandoc(?:\.exe)?\s+(\d+)\.(\d+)(?:\.(\d+))?/);
  if (match) {
    const major = parseInt(match[1], 10);
    const minor = parseInt(match[2], 10);
    PANDOC_VERSION = `${match[1]}.${match[2]}${match[3] ? '.' + match[3] : ''}`;
    PANDOC_HAS_CITEPROC = major > 2 || (major === 2 && minor >= 11);
    console.log(`[startup] Pandoc ${PANDOC_VERSION} detected — citeproc: ${PANDOC_HAS_CITEPROC ? 'built-in' : 'filter fallback'} — pdf-engine: lualatex`);
  }
} catch (e) {
  console.warn('[startup] Could not detect Pandoc version, assuming built-in --citeproc');
}

/** Returns the args needed to enable citation processing */
function citeprocArgs(bibPath) {
  if (PANDOC_HAS_CITEPROC) {
    return ['--citeproc', `--bibliography=${bibPath}`];
  }
  return ['--filter', 'pandoc-citeproc', `--bibliography=${bibPath}`];
}

// ---- Allowed origins ----
const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:4000',
  process.env.FRONTEND_URL, // e.g. https://pageperfect.studio
].filter(Boolean);

// Match Vercel preview/branch deployment URLs for the project
function isAllowedOrigin(origin) {
  if (!origin) return false;
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  // Vercel preview deployments: <project>-<hash>-<team>.vercel.app
  if (/^https:\/\/page-perfect[a-z0-9-]*\.vercel\.app$/.test(origin)) return true;
  return false;
}

// Filename helper functions
function slug(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'manuscript';
}
function sizeCode(size) {
  switch (size) {
    case 'a4': return 'a4';
    case 'a5': return 'a5';
    case 'sixByNine': return '6x9';
    case 'fiveFiveByEightFive': return '5.5x8.5';
    case 'sevenByTen': return '7x10';
    case 'amazonFiveByEight': return 'amazon-5x8';
    case 'amazonSixByNine': return 'amazon-6x9';
    case 'amazonSevenByTen': return 'amazon-7x10';
    case 'amazonEightByTen': return 'amazon-8x10';
    case 'amazonEightFiveByEleven': return 'amazon-8.5x11';
    case 'royal': return 'royal';
    case 'bFormat': return 'b-format';
    case 'massMarket': return 'mass-market';
    case 'aFormat': return 'a-format';
    case 'demy': return 'demy';
    case 'fiveTwentyFiveByEight': return '5.25x8';
    case 'crownQuarto': return 'crown-quarto';
    case 'b5': return 'b5';
    case 'letter':
    default: return 'letter';
  }
}
function templateCode(t) {
  switch (t) {
    case 'minimal': return 'minimal';
    case 'symphony': return 'symphony';
    case 'chronicle': return 'chronicle';
    case 'exhibit': return 'exhibit';
    case 'matrix': return 'matrix';
    case 'avantgarde': return 'avantgarde';
    case 'paperback': return 'paperback';
    case 'international': return 'international';
    case 'cinema': return 'cinema';
    case 'heirloom': return 'heirloom';
    case 'operator': return 'operator';
    case 'chicago':
    default: return 'chicago';
  }
}
function timestamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`;
}
function buildFilename(title, template, pageSize) {
  return `${slug(title)}_${templateCode(template)}_${sizeCode(pageSize)}_${timestamp()}.pdf`;
}

const app = express();
const PORT = process.env.PORT || 4000;

// Initialize Grid System
const gridSystem = new GridSystem();

// ================================================================
// Security & Middleware
// ================================================================

// Security headers
app.use(helmet({
  contentSecurityPolicy: false, // PDF responses need flexible CSP
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// Request logging
app.use(morgan('tiny'));

// Body parsing
app.use(express.json({ limit: '5mb' }));

// CORS — locked to known origins + Vercel preview domains (falls back to permissive in dev)
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? (origin, callback) => callback(null, isAllowedOrigin(origin))
    : true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['X-PP-Watermarked', 'X-PP-Credits-Remaining', 'X-PP-Filename', 'X-PP-Format'],
  credentials: true,
  optionsSuccessStatus: 200,
}));

// Rate limiting — per IP
const compileLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20,             // 20 compiles per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'rate_limited',
    message: 'Too many compile requests. Please wait a moment and try again.',
  },
});

const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply general limiter to all routes
app.use(generalLimiter);

// ================================================================
// Stripe Webhook (must be before json body parser for raw body)
// ================================================================
let stripe;
try {
  if (process.env.STRIPE_SECRET_KEY) {
    stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  }
} catch { /* stripe not configured */ }

// Track processed Stripe event IDs to prevent duplicate webhook handling
const processedStripeEvents = new Set();

// ── PocketBase Admin Client (server-side only) ──
const POCKETBASE_URL = (process.env.POCKETBASE_URL || '').replace(/\/+$/, '');
let pbAdminToken = null;
let pbTokenExpiry = 0;

async function getPbAdminToken() {
  if (pbAdminToken && Date.now() < pbTokenExpiry) return pbAdminToken;
  if (!POCKETBASE_URL || !process.env.POCKETBASE_ADMIN_EMAIL || !process.env.POCKETBASE_ADMIN_PASSWORD) {
    return null;
  }
  try {
    const resp = await fetch(`${POCKETBASE_URL}/api/collections/_superusers/auth-with-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identity: process.env.POCKETBASE_ADMIN_EMAIL,
        password: process.env.POCKETBASE_ADMIN_PASSWORD,
      }),
    });
    if (!resp.ok) {
      const body = await resp.text().catch(() => '');
      console.error('PocketBase admin auth failed:', resp.status, body);
      return null;
    }
    const data = await resp.json();
    pbAdminToken = data.token;
    // Refresh 5 minutes before expiry (PB tokens last ~2 hours)
    pbTokenExpiry = Date.now() + 115 * 60 * 1000;
    return pbAdminToken;
  } catch (err) {
    console.error('PocketBase admin auth error:', err.message);
    return null;
  }
}

// Helper: fetch from PocketBase with admin auth
async function pbFetch(path, options = {}) {
  const token = await getPbAdminToken();
  if (!token) return null;
  const resp = await fetch(`${POCKETBASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: token,
      ...options.headers,
    },
  });
  return resp;
}

const isPocketBaseConfigured = !!(POCKETBASE_URL && process.env.POCKETBASE_ADMIN_EMAIL);

// ── Tier Verification Helper ─────────────────────────────────
// Verifies a PocketBase auth token and returns user tier info.
// Returns { userId, tier, credits } or { userId: null, tier: 'anonymous', credits: 0 }
async function verifyUserTier(req) {
  if (!isPocketBaseConfigured) return { userId: null, tier: 'anonymous', credits: 0 };
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { userId: null, tier: 'anonymous', credits: 0 };
  }
  const token = authHeader.slice(7);
  try {
    const authResp = await fetch(`${POCKETBASE_URL}/api/collections/users/auth-refresh`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    });
    if (authResp && authResp.ok) {
      const authData = await authResp.json();
      const record = authData.record;
      if (record) {
        return {
          userId: record.id,
          tier: record.tier || 'drafter',
          credits: Number(record.pdf_credits) || 0,
        };
      }
    }
  } catch (err) {
    console.error('[auth] Tier verification failed:', err.message);
  }
  return { userId: null, tier: 'anonymous', credits: 0 };
}

// Tier hierarchy for feature gating
const TIER_LEVEL = { anonymous: 0, drafter: 1, single: 2, publisher: 3, studio: 4 };
function hasTier(userTier, requiredTier) {
  return (TIER_LEVEL[userTier] || 0) >= (TIER_LEVEL[requiredTier] || 0);
}

// NOTE: PocketBase emails are sent via Resend HTTP API hooks in the custom
// Go binary (pageperfect-pb-custom/main.go), bypassing SMTP entirely.
// DO's outbound SMTP ports are blocked, so SMTP relay won't work.

// Stripe webhook endpoint — needs raw body
app.post('/api/stripe/webhook',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) {
      return res.status(501).json({ error: 'Stripe not configured' });
    }

    let event;
    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        req.headers['stripe-signature'],
        process.env.STRIPE_WEBHOOK_SECRET,
      );
    } catch (err) {
      console.error('Stripe webhook signature verification failed:', err.message);
      return res.status(400).json({ error: 'Invalid signature' });
    }

    // Idempotency — skip already-processed events (Stripe may retry webhooks)
    if (processedStripeEvents.has(event.id)) {
      console.log(`Stripe webhook already processed: ${event.id}, skipping`);
      return res.json({ received: true, duplicate: true });
    }
    processedStripeEvents.add(event.id);
    // Cap set size to prevent unbounded memory growth
    if (processedStripeEvents.size > 10000) {
      const first = processedStripeEvents.values().next().value;
      processedStripeEvents.delete(first);
    }

    // Helper: upgrade a user's tier in PocketBase
    async function upgradeTier(userId, tier, customerId, subscriptionId) {
      if (!isPocketBaseConfigured) {
        console.error('PocketBase not configured — cannot update user tier');
        return;
      }
      const update = { tier, stripe_customer_id: customerId };
      if (subscriptionId) update.stripe_subscription_id = subscriptionId;

      try {
        const resp = await pbFetch(`/api/collections/users/records/${userId}`, {
          method: 'PATCH',
          body: JSON.stringify(update),
        });
        if (!resp || !resp.ok) {
          console.error('Failed to update user tier:', resp?.status);
        } else {
          console.log(`User ${userId} upgraded to ${tier}`);
        }
      } catch (err) {
        console.error('Failed to update user tier:', err.message);
      }
    }

    // Helper: increment pdf_credits for a user (Single tier purchase)
    async function incrementCredits(userId, customerId) {
      if (!isPocketBaseConfigured) {
        console.error('PocketBase not configured — cannot increment credits');
        return;
      }
      try {
        // Fetch current credits
        const resp = await pbFetch(`/api/collections/users/records/${userId}`);
        if (!resp || !resp.ok) {
          console.error('Failed to fetch user for credit increment:', resp?.status);
          return;
        }
        const user = await resp.json();
        const currentCredits = Number(user.pdf_credits) || 0;
        const update = {
          pdf_credits: currentCredits + 1,
          stripe_customer_id: customerId,
        };
        const patchResp = await pbFetch(`/api/collections/users/records/${userId}`, {
          method: 'PATCH',
          body: JSON.stringify(update),
        });
        if (patchResp && patchResp.ok) {
          console.log(`User ${userId} credited +1 PDF (total: ${currentCredits + 1})`);
        } else {
          console.error('Failed to increment credits:', patchResp?.status);
        }
      } catch (err) {
        console.error('Failed to increment credits:', err.message);
      }
    }

    // Handle relevant events
    switch (event.type) {
      // Payment Element flow: one-time payment succeeded (Studio $199 or Single £2.99)
      case 'payment_intent.succeeded': {
        const pi = event.data.object;
        const tier = pi.metadata?.tier;
        const userId = pi.metadata?.user_id;
        console.log(`PaymentIntent succeeded: customer=${pi.customer}, tier=${tier}, user=${userId}`);

        if (userId && tier === 'single') {
          // Single PDF purchase — increment pdf_credits by 1 (don't change tier)
          await incrementCredits(userId, pi.customer);
        } else if (userId && tier) {
          await upgradeTier(userId, tier, pi.customer, null);
        }
        break;
      }
      // Payment Element flow: subscription invoice paid (Publisher $9.99/mo)
      case 'invoice.paid': {
        const invoice = event.data.object;
        // Only process the first invoice (subscription activation), not renewals
        if (invoice.billing_reason === 'subscription_create') {
          const sub = invoice.subscription;
          const customerId = invoice.customer;
          // Retrieve the subscription to get metadata
          const subscription = await stripe.subscriptions.retrieve(sub);
          const tier = subscription.metadata?.tier;
          const userId = subscription.metadata?.user_id;
          console.log(`Subscription activated: customer=${customerId}, tier=${tier}, user=${userId}`);

          if (userId && tier) {
            await upgradeTier(userId, tier, customerId, sub);
          }
        }
        break;
      }
      // Legacy: checkout session flow (kept for backward compatibility)
      case 'checkout.session.completed': {
        const session = event.data.object;
        const tier = session.metadata?.tier;
        const userId = session.metadata?.user_id;
        console.log(`Checkout completed: customer=${session.customer}, tier=${tier}, user=${userId}`);

        if (userId && tier) {
          await upgradeTier(userId, tier, session.customer, session.subscription || null);
        }
        break;
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        console.log(`Subscription cancelled for customer ${sub.customer}`);

        if (!isPocketBaseConfigured) {
          console.error('PocketBase not configured — cannot downgrade user');
          break;
        }

        try {
          // Find the user by stripe_customer_id
          const filter = encodeURIComponent(`stripe_customer_id='${sub.customer}'`);
          const listResp = await pbFetch(`/api/collections/users/records?filter=${filter}`);
          if (!listResp || !listResp.ok) {
            console.error('Failed to find user for downgrade');
            break;
          }
          const { items } = await listResp.json();
          if (items && items.length > 0) {
            const userId = items[0].id;
            const patchResp = await pbFetch(`/api/collections/users/records/${userId}`, {
              method: 'PATCH',
              body: JSON.stringify({ tier: 'drafter', stripe_subscription_id: '' }),
            });
            if (patchResp && patchResp.ok) {
              console.log(`Customer ${sub.customer} downgraded to drafter`);
            } else {
              console.error('Failed to downgrade user:', patchResp?.status);
            }
          }
        } catch (err) {
          console.error('Failed to downgrade user:', err.message);
        }
        break;
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        console.log(`Payment failed: customer=${invoice.customer}, attempt=${invoice.attempt_count}`);
        break;
      }
      default:
        break;
    }

    res.json({ received: true });
  },
);

// Stripe Payment Intent / Subscription creation (Payment Element flow)
app.post('/api/stripe/create-payment', async (req, res) => {
  if (!stripe) {
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
    // Find or create a Stripe customer for this user
    let customerId;
    if (isPocketBaseConfigured) {
      try {
        const resp = await pbFetch(`/api/collections/users/records/${user_id}`);
        if (resp && resp.ok) {
          const user = await resp.json();
          customerId = user.stripe_customer_id;
        }
      } catch { /* user not found */ }
    }

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: email || undefined,
        metadata: { user_id, tier },
      });
      customerId = customer.id;

      // Store the customer ID in PocketBase
      if (isPocketBaseConfigured) {
        try {
          await pbFetch(`/api/collections/users/records/${user_id}`, {
            method: 'PATCH',
            body: JSON.stringify({ stripe_customer_id: customerId }),
          });
        } catch { /* non-critical */ }
      }
    }

    if (tier === 'single') {
      // Single PDF — $2.99 one-time PaymentIntent
      const amount = 299; // $2.99 in cents
      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency: 'usd',
        customer: customerId,
        metadata: { tier, user_id },
        automatic_payment_methods: { enabled: true },
      });

      res.json({
        clientSecret: paymentIntent.client_secret,
        customerId,
      });
    } else if (tier === 'publisher') {
      // Subscription — create with payment_behavior: 'default_incomplete'
      // so the client can confirm via Payment Element
      const priceId = process.env.STRIPE_PRICE_PUBLISHER;
      if (!priceId) {
        return res.status(500).json({ error: 'Publisher price not configured' });
      }

      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        metadata: { tier, user_id },
        expand: ['latest_invoice.payment_intent'],
      });

      const invoice = subscription.latest_invoice;
      const paymentIntent = invoice?.payment_intent;

      res.json({
        clientSecret: paymentIntent?.client_secret,
        subscriptionId: subscription.id,
        customerId,
      });
    } else {
      // Studio — one-time PaymentIntent
      const amount = 19900; // $199.00 in cents
      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency: 'usd',
        customer: customerId,
        metadata: { tier, user_id },
        automatic_payment_methods: { enabled: true },
      });

      res.json({
        clientSecret: paymentIntent.client_secret,
        customerId,
      });
    }
  } catch (err) {
    console.error('Stripe payment creation error:', err.message);
    res.status(500).json({ error: 'Failed to create payment' });
  }
});

// ================================================================
// Health & Info Endpoints
// ================================================================

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'pageperfect-backend', timestamp: new Date().toISOString(), version: '3.1', pdfEngine: 'lualatex' });
});

app.get('/api/health/details', (_req, res) => {
  const templates = Object.keys(DESIGN_TEMPLATES);
  const pageSizes = ['letter','a4','sixByNine','fiveFiveByEightFive','a5','sevenByTen','royal','bFormat','massMarket','aFormat','demy','fiveTwentyFiveByEight','crownQuarto','b5','amazonFiveByEight','amazonSixByNine','amazonSevenByTen','amazonEightByTen','amazonEightFiveByEleven'];
  const marginPresets = ['normal','narrow','wide','minimal','academic','generous','compact'];
  const compileModes = ['fast','full'];
  const fontCheck = fontAvailability.quickCheck();
  res.json({
    ok: true,
    service: 'pageperfect-backend',
    templates,
    pageSizes,
    marginPresets,
    compileModes,
    pdfEngine: 'lualatex',
    safeModeAvailable: true,
    auth: isPocketBaseConfigured,
    payments: !!stripe,
    fonts: fontCheck,
    systems: {
      manuscriptStructure: true,
      references: true,
      figuresAndAssets: true,
      bookEngineering: true,
      platformCompliance: true,
      provenance: true,
      templateExtensions: true,
      typographyAssurance: true,
      multilingual: true,
      printQA: true,
      fontAvailability: true,
    },
    platforms: Object.keys(platformCompliance.PLATFORMS),
  });
});

app.get('/api/templates', (_req, res) => {
  const templates = Object.entries(DESIGN_TEMPLATES).map(([key, template]) => ({
    key,
    name: template.name,
    description: template.description,
    category: template.category,
    characteristics: template.characteristics,
    gridType: template.gridType,
  }));
  res.json({
    templates,
    headingVariants: headingVariants.HEADING_VARIANTS,
    variantLabels: headingVariants.VARIANT_LABELS,
    variantDescriptions: headingVariants.VARIANT_DESCRIPTIONS,
  });
});

// ================================================================
// Font Availability Diagnostics
// ================================================================

app.get('/api/fonts/status', (_req, res) => {
  const audit = fontAvailability.auditFonts();
  res.json(audit);
});

// ================================================================
// KDP Publishing Utilities
// ================================================================

/**
 * Amazon KDP dynamic gutter — minimum inside margin based on page count.
 * Source: KDP Print Submission Guidelines
 */
function kdpGutter(pageCount) {
  if (pageCount <= 150) return 0.375;
  if (pageCount <= 300) return 0.5;
  if (pageCount <= 500) return 0.625;
  return 0.75;
}

/**
 * Spine width calculator.
 * White paper: pageCount × 0.002252 inches
 * Cream paper: pageCount × 0.0025 inches
 */
function spineWidth(pageCount, paperStock = 'white') {
  const factor = paperStock === 'cream' ? 0.0025 : 0.002252;
  return +(pageCount * factor).toFixed(4);
}

app.get('/api/kdp/spine', (req, res) => {
  const pageCount = parseInt(req.query.pages, 10);
  if (!pageCount || pageCount < 24 || pageCount > 828) {
    return res.status(400).json({
      error: 'invalid_pages',
      message: 'Page count must be between 24 and 828 (KDP limits).',
    });
  }
  res.json({
    pageCount,
    white: { spineInches: spineWidth(pageCount, 'white'), spineMm: +(spineWidth(pageCount, 'white') * 25.4).toFixed(2) },
    cream: { spineInches: spineWidth(pageCount, 'cream'), spineMm: +(spineWidth(pageCount, 'cream') * 25.4).toFixed(2) },
    gutterInches: kdpGutter(pageCount),
  });
});

app.get('/api/kdp/gutter', (req, res) => {
  const pageCount = parseInt(req.query.pages, 10);
  if (!pageCount || pageCount < 1) {
    return res.status(400).json({ error: 'invalid_pages', message: 'Page count is required.' });
  }
  res.json({ pageCount, gutterInches: kdpGutter(pageCount) });
});

// ================================================================
// Pre-flight Validation
// ================================================================

app.post('/api/preflight', (req, res) => {
  const { pageSize, marginPreset, template, wordCount, pageCount, platform, paperStock } = req.body || {};
  if (!wordCount && !pageCount) {
    return res.status(400).json({ error: 'invalid_request', message: 'wordCount or pageCount is required.' });
  }
  const templateType = (DESIGN_TEMPLATES[template] || {}).gridType || 'academic';
  const result = publishing.preflight({
    pageSize: pageSize || 'sixByNine',
    marginPreset: marginPreset || 'normal',
    template: templateType,
    wordCount: wordCount || 0,
    pageCount,
    platform: platform || 'generic',
    paperStock: paperStock || 'white',
  }, gridSystem);
  res.json(result);
});

// ================================================================
// Cover Dimensions Calculator
// ================================================================

app.get('/api/cover-dimensions', (req, res) => {
  const trimWidth = parseFloat(req.query.width);
  const trimHeight = parseFloat(req.query.height);
  const pageCount = parseInt(req.query.pages, 10);
  if (!trimWidth || !trimHeight || !pageCount) {
    return res.status(400).json({
      error: 'invalid_request',
      message: 'width, height (inches), and pages are required query parameters.',
    });
  }
  const result = publishing.coverDimensions({
    trimWidth,
    trimHeight,
    pageCount,
    paperStock: req.query.paper || 'white',
    binding: req.query.binding || 'paperback',
    platform: req.query.platform || 'generic',
  });
  res.json(result);
});

// ================================================================
// Lulu Print API Integration
// ================================================================

app.get('/api/lulu/status', (_req, res) => {
  res.json({
    configured: lulu.isConfigured(),
    baseUrl: lulu.getBaseUrl(),
    sandbox: process.env.LULU_SANDBOX === 'true',
  });
});

app.post('/api/lulu/cost-estimate', async (req, res) => {
  if (!lulu.isConfigured()) {
    return res.status(501).json({ error: 'Lulu API not configured. Set LULU_CLIENT_KEY and LULU_CLIENT_SECRET.' });
  }
  try {
    const { trimSize, color, binding, paper, finish, pageCount, quantity, shippingAddress, shippingLevel } = req.body;
    const podPackageId = lulu.buildPodPackageId({ trimSize, color, binding, paper, finish });
    const result = await lulu.calculateCost({
      podPackageId,
      pageCount,
      quantity: quantity || 1,
      shippingAddress,
      shippingLevel: shippingLevel || 'MAIL',
    });
    res.json({ podPackageId, ...result });
  } catch (err) {
    console.error('[lulu/cost-estimate]', err.message);
    res.status(err.status || 500).json({ error: 'lulu_error', message: err.message, detail: err.body });
  }
});

app.post('/api/lulu/print-job', async (req, res) => {
  if (!lulu.isConfigured()) {
    return res.status(501).json({ error: 'Lulu API not configured.' });
  }
  try {
    const result = await lulu.createPrintJob(req.body);
    res.json(result);
  } catch (err) {
    console.error('[lulu/print-job]', err.message);
    res.status(err.status || 500).json({ error: 'lulu_error', message: err.message, detail: err.body });
  }
});

app.get('/api/lulu/print-job/:id', async (req, res) => {
  if (!lulu.isConfigured()) {
    return res.status(501).json({ error: 'Lulu API not configured.' });
  }
  try {
    const result = await lulu.getPrintJob(req.params.id);
    res.json(result);
  } catch (err) {
    console.error('[lulu/print-job]', err.message);
    res.status(err.status || 500).json({ error: 'lulu_error', message: err.message, detail: err.body });
  }
});

app.post('/api/lulu/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  const signature = req.headers['lulu-hmac-sha256'];
  if (!lulu.verifyWebhook(req.body, signature)) {
    return res.status(401).json({ error: 'Invalid webhook signature' });
  }
  const event = JSON.parse(req.body.toString());
  console.log(`[lulu/webhook] Print job ${event.id} status: ${event.status?.name || 'unknown'}`);
  // TODO: Update order status in database
  res.json({ received: true });
});

// ================================================================
// Design Template Registry
// ================================================================

const DESIGN_TEMPLATES = {
  symphony: {
    name: 'Symphony',
    description: 'Van de Graaf Canon, EB Garamond, ornamental openings — the academic monograph perfected.',
    category: 'Academic',
    templatePath: path.resolve(__dirname, 'templates/symphony.latex'),
    mainfont: 'EB Garamond',
    sansfont: 'Libertinus Sans',
    monofont: 'DejaVu Sans Mono',
    gridType: 'academic',
    characteristics: ['EB Garamond + Libertinus Sans', 'Van de Graaf Canon', 'Ornamental headings', 'Hanging footnotes'],
  },
  chicago: {
    name: 'Chicago',
    description: 'University press monograph — ETbb (Bembo), true footnotes, CMOS running heads.',
    category: 'Academic',
    templatePath: path.resolve(__dirname, 'templates/chicago.latex'),
    mainfont: 'ETbb',
    sansfont: 'Latin Modern Sans',
    monofont: 'Latin Modern Mono',
    gridType: 'academic',
    characteristics: ['ETbb (Bembo)', '2em paragraph indent', 'True footnotes', 'Centered running heads'],
  },
  paperback: {
    name: 'Paperback',
    description: 'Cinematic page-turner — Alegreya Sans, scene breaks, filmic chapter openings.',
    category: 'Fiction',
    templatePath: path.resolve(__dirname, 'templates/paperback.latex'),
    mainfont: 'Alegreya Sans',
    sansfont: 'TeX Gyre Heros',
    monofont: 'DejaVu Sans Mono',
    gridType: 'trade',
    characteristics: ['Alegreya Sans', 'Cinematic chapter numbers', 'Scene break ornaments', '1.5em fiction indent'],
  },
  chronicle: {
    name: 'Chronicle',
    description: 'Swiss journalism — TeX Gyre Heros, heavy rules, pull-quote blocks, flush-left ragged-right.',
    category: 'Editorial',
    templatePath: path.resolve(__dirname, 'templates/chronicle.latex'),
    mainfont: 'TeX Gyre Heros',
    sansfont: null,
    monofont: 'Fira Mono',
    gridType: 'editorial',
    characteristics: ['TeX Gyre Heros', 'Flush left / ragged right', '3pt section rules', 'Pull-quote blockquotes'],
  },
  exhibit: {
    name: 'Exhibit',
    description: 'White Cube gallery — Fira Sans, extreme whitespace, ghost-number chapter openings.',
    category: 'Trade',
    templatePath: path.resolve(__dirname, 'templates/exhibit.latex'),
    mainfont: 'Fira Sans',
    sansfont: 'TeX Gyre Adventor',
    monofont: 'Fira Mono',
    gridType: 'trade',
    characteristics: ['Fira Sans + TeX Gyre Adventor', '80pt ghost chapter numbers', 'Ragged right', 'Generous whitespace'],
  },
  matrix: {
    name: 'Matrix',
    description: 'Swiss corporate annual report — Fira Sans with lining figures, MidnightBlue accents, booktabs.',
    category: 'Business',
    templatePath: path.resolve(__dirname, 'templates/matrix.latex'),
    mainfont: 'Fira Sans',
    sansfont: null,
    monofont: 'Fira Mono',
    gridType: 'corporate',
    characteristics: ['Fira Sans (lining figures)', 'Corporate blue palette', 'Executive summary blocks', 'booktabs tables'],
  },
  avantgarde: {
    name: 'Avant-Garde',
    description: 'Deconstructed manifesto — Source Sans 3, 120pt ghost numbers, brutalist blockquotes.',
    category: 'Creative',
    templatePath: path.resolve(__dirname, 'templates/avantgarde.latex'),
    mainfont: 'Source Sans 3',
    sansfont: 'DejaVu Sans',
    monofont: 'TeX Gyre Cursor',
    gridType: 'creative',
    characteristics: ['Source Sans 3', '120pt ghost chapter numbers', 'Brutalist blockquotes', 'Ragged right'],
  },
  minimal: {
    name: 'Minimal',
    description: 'Radical compatibility — compiles anywhere, zero extra dependencies. Latin Modern on pdflatex.',
    category: 'Basic',
    templatePath: path.resolve(__dirname, 'templates/minimal.latex'),
    mainfont: 'Latin Modern Roman',
    sansfont: null,
    monofont: null,
    gridType: 'basic',
    characteristics: ['Zero dependencies', 'pdflatex compatible', 'Latin Modern', 'Maximum portability'],
  },
  international: {
    name: 'International',
    description: 'Müller-Brockmann Swiss Standard — one font, no italics, visible structure, modular grid.',
    category: 'Design',
    templatePath: path.resolve(__dirname, 'templates/international.latex'),
    mainfont: 'TeX Gyre Heros',
    sansfont: 'TeX Gyre Heros',
    monofont: 'TeX Gyre Cursor',
    gridType: 'editorial',
    characteristics: ['TeX Gyre Heros only', 'No italics', 'Flush left / ragged right', 'Rule-separated sections'],
  },
  cinema: {
    name: 'Cinema',
    description: 'Hollywood Standard screenplay — Courier 12pt, strict margins, 1 page = 1 minute rule.',
    category: 'Screenplay',
    templatePath: path.resolve(__dirname, 'templates/cinema.latex'),
    mainfont: 'TeX Gyre Cursor',
    sansfont: null,
    monofont: 'TeX Gyre Cursor',
    gridType: 'basic',
    characteristics: ['TeX Gyre Cursor (Courier)', 'Industry-standard margins', 'Single-spaced', 'Dialogue blocks'],
  },
  heirloom: {
    name: 'Heirloom',
    description: 'Modern gastronomy cookbook — recipe cards, ingredient blocks, warm saddlebrown palette.',
    category: 'Cookbook',
    templatePath: path.resolve(__dirname, 'templates/heirloom.latex'),
    mainfont: 'Fira Sans',
    sansfont: 'DejaVu Serif',
    monofont: 'Fira Mono',
    gridType: 'trade',
    characteristics: ['Fira Sans + DejaVu Serif headers', 'Ingredient colorboxes', 'Bold numbered steps', 'Warm earth tones'],
  },
  operator: {
    name: 'Operator',
    description: 'Engineering manual — Fira Sans/Mono, admonition boxes (warning/info/code), structured hierarchy.',
    category: 'Technical',
    templatePath: path.resolve(__dirname, 'templates/operator.latex'),
    mainfont: 'Fira Sans',
    sansfont: null,
    monofont: 'Fira Mono',
    gridType: 'editorial',
    characteristics: ['Fira Sans + Fira Mono', 'Warning/Info/Code admonition boxes', 'Navy blue headings', 'Technical hierarchy'],
  },
  verse: {
    name: 'Verse',
    description: 'Poetry collection — EB Garamond, centered titles, generous leading, line-based layout.',
    category: 'Poetry',
    templatePath: path.resolve(__dirname, 'templates/verse.latex'),
    mainfont: 'EB Garamond',
    sansfont: 'Libertinus Sans',
    monofont: 'DejaVu Sans Mono',
    gridType: 'creative',
    characteristics: ['EB Garamond', 'Centered italic titles', 'Generous leading', 'No paragraph indent'],
  },
  thesis: {
    name: 'Thesis',
    description: 'University dissertation — Latin Modern, double-spaced, numbered sections, submission-ready.',
    category: 'Academic',
    templatePath: path.resolve(__dirname, 'templates/thesis.latex'),
    mainfont: 'Latin Modern Roman',
    sansfont: 'Latin Modern Sans',
    monofont: 'Latin Modern Mono',
    gridType: 'academic',
    characteristics: ['Latin Modern Roman', 'Double-spaced', 'Numbered sections', 'University standard'],
  },
  memoir: {
    name: 'Memoir',
    description: 'Personal narrative — Libre Baskerville, warm amber accents, decorative scene breaks.',
    category: 'Fiction',
    templatePath: path.resolve(__dirname, 'templates/memoir.latex'),
    mainfont: 'Libre Baskerville',
    sansfont: 'TeX Gyre Heros',
    monofont: 'DejaVu Sans Mono',
    gridType: 'trade',
    characteristics: ['Libre Baskerville', 'Warm amber accents', 'Decorative scene breaks', 'Intimate headings'],
  },
};

const BIB_PATH = path.resolve(__dirname, 'references/references.bib');

function geometryFor(size, preset, template = 'academic') {
  return gridSystem.calculateMargins(size, preset, template);
}

function styleWarnings(md) {
  const warnings = [];
  if (/[.!?]\s{2,}[A-Z(]/g.test(md)) {
    warnings.push('Detected double spaces after punctuation. Consider using a single space.');
  }
  return warnings;
}

function stripCitations(md) {
  let out = md.replace(/\[[^[\]]*@[^[\]]*\]/g, '(citation)');
  out = out.replace(/@([A-Za-z0-9:_\-]+)/g, '$1');
  return out;
}

function parseMissingCitations(stderr) {
  const keys = new Set();
  const patterns = [
    /Undefined citation\s*[: ]\s*'([^']+)'/gi,
    /citation ['"]?([A-Za-z0-9:_\-]+)['"]?\s+undefined/gi,
    /reference\s+([A-Za-z0-9:_\-]+)\s+not found/gi,
    /could not find citation\s+['"]?([A-Za-z0-9:_\-]+)['"]?/gi,
  ];
  for (const re of patterns) {
    let m;
    while ((m = re.exec(stderr)) !== null) keys.add(m[1]);
  }
  return [...keys];
}

function parseMissingPackages(stderr) {
  const pkgs = new Set();
  const re = /LaTeX Error:\s*File\s+[`']([^`']+)\.sty['`]\s+not found/gi;
  let m;
  while ((m = re.exec(stderr)) !== null) pkgs.add(m[1]);
  return [...pkgs];
}

// ================================================================
// Convert Endpoint — .docx → Markdown via Pandoc
// Accepts raw binary .docx, returns extracted Markdown text.
// ================================================================

const convertLimiter = rateLimit({ windowMs: 60 * 1000, max: 20, message: { error: 'rate_limit', message: 'Too many conversion requests. Try again in a minute.' } });
const MAX_DOCX_BYTES = Number(process.env.MAX_DOCX_BYTES || 10_000_000); // 10 MB

app.post('/api/convert', convertLimiter, express.raw({ type: '*/*', limit: '10mb' }), (req, res) => {
  const buf = req.body;
  if (!Buffer.isBuffer(buf) || buf.length < 100) {
    return res.status(400).json({ error: 'invalid_request', message: 'No file received. Send the .docx as the raw request body.' });
  }
  if (buf.length > MAX_DOCX_BYTES) {
    return res.status(413).json({ error: 'payload_too_large', message: `File exceeds ${MAX_DOCX_BYTES} byte limit.` });
  }

  const tmpBase = fs.mkdtempSync(path.join(os.tmpdir(), 'pp-conv-'));
  const docxPath = path.join(tmpBase, 'input.docx');
  fs.writeFileSync(docxPath, buf);

  const pandoc = spawn('pandoc', [docxPath, '-t', 'markdown', '--wrap=none'], { cwd: tmpBase });

  let stdout = '';
  let stderr = '';
  pandoc.stdout.on('data', (d) => { stdout += d.toString(); });
  pandoc.stderr.on('data', (d) => { stderr += d.toString(); });

  const killer = setTimeout(() => {
    try { pandoc.kill('SIGKILL'); } catch {}
  }, 30_000);

  pandoc.on('close', (code) => {
    clearTimeout(killer);
    try { fs.rmSync(tmpBase, { recursive: true, force: true }); } catch {}

    if (code === 0 && stdout.length > 0) {
      return res.json({ markdown: stdout });
    }
    console.error(`[convert] pandoc exit ${code}: ${stderr.slice(0, 500)}`);
    return res.status(500).json({ error: 'conversion_failed', message: 'Failed to convert .docx to Markdown.', detail: stderr.slice(0, 300) });
  });
});

// ================================================================
// Manuscript Structure System
// ================================================================

app.post('/api/analyze/structure', (req, res) => {
  const { manuscriptText } = req.body || {};
  if (!manuscriptText || typeof manuscriptText !== 'string') {
    return res.status(400).json({ error: 'invalid_request', message: 'manuscriptText is required.' });
  }
  const result = manuscriptStructure.analyzeStructure(manuscriptText);
  res.json(result);
});

// ================================================================
// References and Citations System
// ================================================================

app.post('/api/analyze/references', (req, res) => {
  const { manuscriptText, bibliography } = req.body || {};
  if (!manuscriptText || typeof manuscriptText !== 'string') {
    return res.status(400).json({ error: 'invalid_request', message: 'manuscriptText is required.' });
  }

  const citations = referencesSystem.extractCitations(manuscriptText);
  const bibContent = bibliography || fs.readFileSync(BIB_PATH, 'utf8');
  const validation = referencesSystem.validateBibliography(bibContent);
  const crossRef = referencesSystem.crossReference(manuscriptText, bibContent);

  res.json({
    citations,
    validation,
    crossReference: crossRef,
  });
});

app.post('/api/validate/bibliography', (req, res) => {
  const { bibliography } = req.body || {};
  if (!bibliography || typeof bibliography !== 'string') {
    return res.status(400).json({ error: 'invalid_request', message: 'bibliography (BibTeX content) is required.' });
  }
  const result = referencesSystem.validateBibliography(bibliography);
  res.json(result);
});

// ================================================================
// Figures, Tables, and Assets System
// ================================================================

app.post('/api/analyze/assets', (req, res) => {
  const { manuscriptText, trimSize, bleedType, context } = req.body || {};
  if (!manuscriptText || typeof manuscriptText !== 'string') {
    return res.status(400).json({ error: 'invalid_request', message: 'manuscriptText is required.' });
  }
  const result = figuresSystem.validateAssets(manuscriptText, { trimSize, bleedType, context });
  res.json(result);
});

// ================================================================
// Book Engineering System
// ================================================================

app.post('/api/analyze/lint', (req, res) => {
  const { manuscriptText, template } = req.body || {};
  if (!manuscriptText || typeof manuscriptText !== 'string') {
    return res.status(400).json({ error: 'invalid_request', message: 'manuscriptText is required.' });
  }
  const templateType = (DESIGN_TEMPLATES[template] || {}).gridType || 'academic';
  const result = bookEngineering.lintManuscript(manuscriptText, templateType);
  res.json(result);
});

// ================================================================
// Platform Compliance System
// ================================================================

app.post('/api/analyze/platform', (req, res) => {
  const { platform, pageSize, pageCount, wordCount, marginPreset, template, hasImages, hasCitations, colorMode } = req.body || {};
  if (!platform) {
    return res.status(400).json({ error: 'invalid_request', message: 'platform is required.' });
  }
  const templateType = (DESIGN_TEMPLATES[template] || {}).gridType || 'academic';
  const result = platformCompliance.validatePlatform({
    platform,
    pageSize: pageSize || 'sixByNine',
    pageCount,
    wordCount: wordCount || 0,
    marginPreset: marginPreset || 'normal',
    template: templateType,
    hasImages: hasImages || false,
    hasCitations: hasCitations || false,
    colorMode: colorMode || 'bw',
  }, gridSystem);
  res.json(result);
});

app.get('/api/platforms', (_req, res) => {
  const platforms = Object.entries(platformCompliance.PLATFORMS).map(([key, spec]) => ({
    key,
    name: spec.name,
    type: spec.type,
    trimSizes: spec.trimSizes,
    pageRange: spec.pageRange,
    notes: spec.notes,
  }));
  res.json({ platforms });
});

app.get('/api/platforms/:key/pipeline', (req, res) => {
  const pipeline = platformCompliance.getExportPipeline(req.params.key);
  res.json(pipeline);
});

// ================================================================
// Template Extension System
// ================================================================

app.get('/api/template-tokens/:template', (req, res) => {
  const templateType = (DESIGN_TEMPLATES[req.params.template] || {}).gridType || 'academic';
  const schema = templateExtensions.getTokenSchemaForTemplate(templateType);
  res.json({ template: req.params.template, gridType: templateType, tokens: schema });
});

app.post('/api/validate/extensions', (req, res) => {
  const { template, extensions } = req.body || {};
  if (!extensions || typeof extensions !== 'object') {
    return res.status(400).json({ error: 'invalid_request', message: 'extensions object is required.' });
  }
  const templateType = (DESIGN_TEMPLATES[template] || {}).gridType || 'academic';
  const result = templateExtensions.validateExtensions(extensions, templateType);
  res.json(result);
});

// ================================================================
// Typography Assurance System
// ================================================================

app.post('/api/analyze/typography', (req, res) => {
  const { template, pageSize, marginPreset, extensions } = req.body || {};
  const templateType = (DESIGN_TEMPLATES[template] || {}).gridType || 'academic';
  const result = typographyAssurance.analyzeTypography({
    template: templateType,
    pageSize: pageSize || 'sixByNine',
    marginPreset: marginPreset || 'normal',
    extensions: extensions || {},
  });
  res.json(result);
});

// ================================================================
// Multilingual System
// ================================================================

app.post('/api/analyze/multilingual', (req, res) => {
  const { manuscriptText } = req.body || {};
  if (!manuscriptText || typeof manuscriptText !== 'string') {
    return res.status(400).json({ error: 'invalid_request', message: 'manuscriptText is required.' });
  }
  const result = multilingual.analyzeMultilingual(manuscriptText);
  res.json(result);
});

// ================================================================
// Print QA System
// ================================================================

app.post('/api/analyze/print-qa', (req, res) => {
  const { template, wordCount, figureCount, hasFootnotes, hasTables, hasImages, colorMode, paperStock, extensions } = req.body || {};
  const templateType = (DESIGN_TEMPLATES[template] || {}).gridType || 'academic';
  const result = printQA.runPrintQA({
    templateType,
    wordCount: wordCount || 0,
    figureCount: figureCount || 0,
    hasFootnotes: hasFootnotes || false,
    hasTables: hasTables || false,
    hasImages: hasImages || false,
    colorMode: colorMode || 'bw',
    paperStock: paperStock || 'white',
    extensions: extensions || {},
  });
  res.json(result);
});

// ================================================================
// Comprehensive Manuscript Analysis (all systems)
// ================================================================

app.post('/api/analyze/full', (req, res) => {
  const { manuscriptText, template, pageSize, marginPreset, platform, paperStock, colorMode, extensions } = req.body || {};
  if (!manuscriptText || typeof manuscriptText !== 'string') {
    return res.status(400).json({ error: 'invalid_request', message: 'manuscriptText is required.' });
  }

  const tplKey = DESIGN_TEMPLATES[String(template)] ? String(template) : 'symphony';
  const templateType = DESIGN_TEMPLATES[tplKey].gridType || 'academic';
  const wordCount = manuscriptText.split(/\s+/).filter(w => w.length > 0).length;
  const hasFootnotes = /\[\^[^\]]+\]/.test(manuscriptText);
  const hasCitations = /\[@[^\]]+\]/.test(manuscriptText);

  const structure = manuscriptStructure.analyzeStructure(manuscriptText);
  const assets = figuresSystem.validateAssets(manuscriptText, { trimSize: pageSize });
  const lint = bookEngineering.lintManuscript(manuscriptText, templateType);
  const typography = typographyAssurance.analyzeTypography({
    template: templateType,
    pageSize: pageSize || 'sixByNine',
    marginPreset: marginPreset || 'normal',
    extensions: extensions || {},
  });
  const multilingualAnalysis = multilingual.analyzeMultilingual(manuscriptText);
  const qa = printQA.runPrintQA({
    templateType,
    wordCount,
    figureCount: assets.stats.figureCount,
    hasFootnotes,
    hasTables: assets.stats.tableCount > 0,
    hasImages: assets.stats.figureCount > 0,
    colorMode: colorMode || 'bw',
    paperStock: paperStock || 'white',
    extensions: extensions || {},
  });

  // Platform validation if specified
  let platformResult = null;
  if (platform) {
    platformResult = platformCompliance.validatePlatform({
      platform,
      pageSize: pageSize || 'sixByNine',
      wordCount,
      marginPreset: marginPreset || 'normal',
      template: templateType,
      hasImages: assets.stats.figureCount > 0,
      hasCitations,
      colorMode: colorMode || 'bw',
    }, gridSystem);
  }

  // Build metadata
  const buildMeta = provenance.generateBuildMetadata({
    manuscriptText,
    template: tplKey,
    pageSize: pageSize || 'sixByNine',
    marginPreset: marginPreset || 'normal',
    safeMode: false,
    compileMode: 'full',
    title: structure.structure.metadata.title || 'Untitled',
  });

  res.json({
    buildId: buildMeta.buildId,
    structure,
    assets,
    lint,
    typography,
    multilingual: multilingualAnalysis,
    printQA: qa,
    platform: platformResult,
    provenance: buildMeta,
    summary: {
      wordCount,
      chapterCount: structure.structure.chapterCount,
      figureCount: assets.stats.figureCount,
      tableCount: assets.stats.tableCount,
      lintIssues: lint.stats.totalIssues,
      typographyScore: typography.score,
      typographyGrade: typography.grade,
      printQAScore: qa.score,
      printQAGrade: qa.grade,
      hasRTL: multilingualAnalysis.scriptAnalysis.hasRTL,
      isMultiscript: multilingualAnalysis.scriptAnalysis.isMultiscript,
      platformPassed: platformResult?.passed ?? null,
    },
  });
});

// ================================================================
// Free tier page size restrictions
// ================================================================
// 6 default page sizes for free tier (matches pricing page and editor default section)
const FREE_TIER_SIZES = new Set(['letter', 'a4', 'sixByNine', 'fiveFiveByEightFive', 'a5', 'royal']);
const ALL_SIZES = new Set(['letter','a4','sixByNine','fiveFiveByEightFive','a5','sevenByTen','royal','bFormat','massMarket','aFormat','demy','fiveTwentyFiveByEight','crownQuarto','b5','amazonFiveByEight','amazonSixByNine','amazonSevenByTen','amazonEightByTen','amazonEightFiveByEleven']);
const ALL_MARGINS = new Set(['normal','narrow','wide','minimal','academic','generous','compact']);

// ================================================================
// Compile Endpoint
// ================================================================

app.post('/api/compile', compileLimiter, async (req, res) => {
  let { manuscriptText, template, title, pageSize, marginPreset, safeMode, compileMode, outputFormat, customFonts, headingVariant, download } = req.body || {};
  safeMode = Boolean(safeMode);
  compileMode = (compileMode === 'full') ? 'full' : 'fast';
  headingVariant = headingVariants.HEADING_VARIANTS.includes(headingVariant) ? headingVariant : 'classic';
  const isDownload = Boolean(download);
  const wantPdfX = outputFormat === 'pdfx1a';
  const wantEpub = outputFormat === 'epub';

  // ── Auth & Tier Verification ─────────────────────────────────
  const user = await verifyUserTier(req);
  const userTier = user.tier;
  const userId = user.userId;
  const userCredits = user.credits;

  // ── Feature Gates (download paths only) ──────────────────────
  // EPUB export — Studio only
  if (wantEpub && !hasTier(userTier, 'studio')) {
    return res.status(403).json({
      error: 'tier_required',
      message: 'EPUB export requires a Studio subscription.',
      requiredTier: 'studio',
    });
  }

  // PDF/X-1a export — Publisher+ only
  if (wantPdfX && !hasTier(userTier, 'publisher')) {
    return res.status(403).json({
      error: 'tier_required',
      message: 'PDF/X-1a export requires a Publisher or Studio subscription.',
      requiredTier: 'publisher',
    });
  }

  // Custom fonts — Studio only
  if (customFonts && typeof customFonts === 'object' && Object.keys(customFonts).length > 0) {
    if (!hasTier(userTier, 'studio')) {
      return res.status(403).json({
        error: 'tier_required',
        message: 'Custom font upload requires a Studio subscription.',
        requiredTier: 'studio',
      });
    }
  }

  // Page size restriction — Drafter limited to 6 default sizes on download (unless they have credits)
  if (isDownload && userTier === 'drafter' && userCredits <= 0 && pageSize && !FREE_TIER_SIZES.has(pageSize)) {
    return res.status(403).json({
      error: 'tier_required',
      message: `Page size "${pageSize}" requires a paid plan. Free tier includes 6 standard sizes.`,
      requiredTier: 'single',
    });
  }

  // Citations — Publisher+ only; force safe mode for lower tiers
  if (!safeMode && !hasTier(userTier, 'publisher')) {
    safeMode = true;
  }

  // ── Watermark Decision ──────────────────────────────────────
  // Clean preview always (no watermark). On download, check tier/credits.
  let needsWatermark = false;
  let creditsRemaining = null;

  if (isDownload && isPocketBaseConfigured) {
    if (hasTier(userTier, 'publisher')) {
      needsWatermark = false;
    } else if (userCredits > 0 && userId) {
      // Deduct one credit
      try {
        await pbFetch(`/api/collections/users/records/${userId}`, {
          method: 'PATCH',
          body: JSON.stringify({ pdf_credits: userCredits - 1 }),
        });
        creditsRemaining = userCredits - 1;
        needsWatermark = false;
        console.log(`[compile] Deducted 1 credit for user ${userId}, remaining: ${creditsRemaining}`);
      } catch (creditErr) {
        console.error('[compile] Credit deduction failed:', creditErr.message);
        needsWatermark = true;
      }
    } else {
      needsWatermark = true;
    }
  } else if (isDownload && !isPocketBaseConfigured) {
    // PocketBase not configured — watermark all downloads as a safe default
    needsWatermark = true;
  }

  if (!manuscriptText || typeof manuscriptText !== 'string') {
    return res.status(400).json({ error: 'invalid_request', message: 'manuscriptText is required' });
  }

  // Enforce payload size before spawning Pandoc
  const mdBytes = Buffer.byteLength(manuscriptText, 'utf8');
  if (mdBytes > MAX_MD_BYTES) {
    return res.status(413).json({
      error: 'payload_too_large',
      message: `Manuscript exceeds limit (${mdBytes} > ${MAX_MD_BYTES} bytes). Try splitting chapters or removing images.`,
    });
  }

  const tplKey = DESIGN_TEMPLATES[String(template)] ? String(template) : 'symphony';
  const tpl = DESIGN_TEMPLATES[tplKey];

  // Sanitize title
  if (typeof title !== 'string' || !title.trim()) title = 'Manuscript';
  title = title.replace(/[\r\n]/g, ' ').slice(0, 200);

  // Sanitize pageSize
  if (!ALL_SIZES.has(pageSize)) pageSize = 'letter';

  // Sanitize marginPreset
  if (!ALL_MARGINS.has(marginPreset)) marginPreset = 'normal';

  const tmpBase = fs.mkdtempSync(path.join(os.tmpdir(), 'pp-'));
  const mdPath  = path.join(tmpBase, 'input.md');
  const pdfPath = path.join(tmpBase, 'output.pdf');

  const effectiveMd = safeMode ? stripCitations(manuscriptText) : manuscriptText;
  fs.writeFileSync(mdPath, effectiveMd, 'utf8');

  // ── EPUB Export Path ────────────────────────────────────────
  // EPUB uses Pandoc's HTML/CSS pipeline, not XeLaTeX. Skip all
  // LaTeX-specific processing (fonts, preamble, grid geometry).
  if (wantEpub) {
    const epubPath = path.join(tmpBase, 'output.epub');
    const epubCssPath = path.join(__dirname, 'templates', 'epub-style.css');

    const epubArgs = [
      mdPath,
      '--to=epub3',
      '-M', `title=${title}`,
      '--epub-title-page=true',
      ...(fs.existsSync(epubCssPath) ? ['--css', epubCssPath] : []),
      '-o', epubPath,
    ];

    if (!safeMode) {
      epubArgs.push(...citeprocArgs(BIB_PATH));
    }

    const startTs = Date.now();
    let epubProc;
    try {
      epubProc = spawn('pandoc', epubArgs, { cwd: tmpBase });
    } catch (err) {
      try { fs.rmSync(tmpBase, { recursive: true, force: true }); } catch {}
      return res.status(500).json({ error: 'spawn_failed', message: 'Failed to start EPUB engine.', detail: String(err) });
    }

    let stderr = '';
    epubProc.stderr.on('data', (d) => { stderr += d.toString(); });
    epubProc.on('error', (err) => {
      try { fs.rmSync(tmpBase, { recursive: true, force: true }); } catch {}
      if (!res.headersSent) {
        res.status(500).json({ error: 'spawn_failed', message: 'Failed to start EPUB engine.', detail: String(err) });
      }
    });

    let timedOut = false;
    const killer = setTimeout(() => { timedOut = true; try { epubProc.kill('SIGKILL'); } catch {} }, COMPILE_TIMEOUT_MS);

    epubProc.on('close', (code) => {
      if (res.headersSent) return;
      clearTimeout(killer);
      const elapsed = Date.now() - startTs;
      res.setHeader('X-PP-Compile-Time', String(elapsed));

      if (timedOut) {
        try { fs.rmSync(tmpBase, { recursive: true, force: true }); } catch {}
        return res.status(504).json({ error: 'compile_timeout', message: `EPUB compilation exceeded ${COMPILE_TIMEOUT_MS}ms.` });
      }

      if (code === 0 && fs.existsSync(epubPath)) {
        const filename = `${slug(title) || 'manuscript'}.epub`;
        res.setHeader('Content-Type', 'application/epub+zip');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('X-PP-Filename', filename);
        res.setHeader('X-PP-Format', 'EPUB3');
        const stream = fs.createReadStream(epubPath);
        stream.on('close', () => { try { fs.rmSync(tmpBase, { recursive: true, force: true }); } catch {} });
        stream.pipe(res);
      } else {
        try { fs.rmSync(tmpBase, { recursive: true, force: true }); } catch {}
        res.status(400).json({
          error: 'epub_failed',
          message: 'EPUB compilation failed.',
          detail: stderr.split('\n').slice(-15).join('\n'),
        });
      }
    });
    return; // Don't continue to PDF path
  }

  const templateType = tpl.gridType || 'academic';
  const geo = geometryFor(pageSize, marginPreset, templateType);

  const isFast = compileMode === 'fast';
  const enableMicrotype = !isFast;
  const enableCsquotes  = !isFast;

  // Style warnings (must be declared before font resolution uses it)
  const warnings = styleWarnings(manuscriptText);

  // ── Font Resolution ────────────────────────────────────────
  // Resolve all three font slots (main, sans, mono) against installed fonts.
  // Templates hardcode font names in \setmainfont{}, \setsansfont{}, \setmonofont{},
  // so we must patch the template content with resolved (fallback) names.
  const fontResolution = fontAvailability.resolveFont(tpl.mainfont);
  const effectiveMainfont = fontResolution.resolved;
  if (fontResolution.warning) warnings.push(fontResolution.warning);

  const sansResolution = tpl.sansfont ? fontAvailability.resolveFont(tpl.sansfont) : null;
  const monoResolution = tpl.monofont ? fontAvailability.resolveFont(tpl.monofont) : null;
  if (sansResolution?.warning) warnings.push(sansResolution.warning);
  if (monoResolution?.warning) warnings.push(monoResolution.warning);

  // Patch the template file: replace hardcoded font names with resolved ones.
  // This handles \setmainfont{FontName}, \setsansfont{FontName}, \setmonofont{FontName}
  // regardless of whether options follow on the same or next line.
  let templateContent = fs.readFileSync(tpl.templatePath, 'utf8');
  const fontReplacements = [
    { original: tpl.mainfont, resolved: effectiveMainfont },
    ...(sansResolution ? [{ original: tpl.sansfont, resolved: sansResolution.resolved }] : []),
    ...(monoResolution ? [{ original: tpl.monofont, resolved: monoResolution.resolved }] : []),
  ];
  for (const { original, resolved } of fontReplacements) {
    if (original !== resolved) {
      // Escape regex special chars in font name, replace in \set*font{Name} commands
      const escaped = original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      templateContent = templateContent.replace(
        new RegExp(`(\\\\set(?:main|sans|mono)font\\{)${escaped}(\\})`, 'g'),
        `$1${resolved}$2`
      );
    }
  }
  // ── Custom Font Override ──────────────────────────────────
  // If user uploaded a custom font, copy it to temp dir and patch
  // the template to use fontspec's Path= directive.
  const CUSTOM_FONTS_DIR = path.join(os.tmpdir(), 'pp-custom-fonts');
  if (customFonts && typeof customFonts === 'object') {
    for (const slot of ['main', 'sans', 'mono']) {
      const fontId = customFonts[slot];
      if (!fontId || typeof fontId !== 'string') continue;
      const srcDir = path.join(CUSTOM_FONTS_DIR, fontId);
      if (!fs.existsSync(srcDir)) continue;
      const files = fs.readdirSync(srcDir).filter(f => /\.(ttf|otf|woff2?)$/i.test(f));
      if (files.length === 0) continue;
      // Copy font file to temp dir
      const fontFile = files[0];
      fs.copyFileSync(path.join(srcDir, fontFile), path.join(tmpBase, fontFile));
      // Patch template: replace \set{main|sans|mono}font{...} with Path=./ version
      const cmdName = slot === 'main' ? 'setmainfont' : slot === 'sans' ? 'setsansfont' : 'setmonofont';
      templateContent = templateContent.replace(
        new RegExp(`(\\\\${cmdName})(\\[.*?\\])?\\{[^}]+\\}`),
        `$1[Path=./]{${fontFile}}`
      );
      warnings.push(`Custom ${slot} font applied: ${fontFile}`);
    }
  }

  const patchedTemplatePath = path.join(tmpBase, 'template.latex');
  fs.writeFileSync(patchedTemplatePath, templateContent, 'utf8');

  // ── Preamble Assembly ──────────────────────────────────────
  // Collect LaTeX preamble from all analysis modules → header.tex → Pandoc -H
  const preambleParts = [];

  // 0. Geometry — must be injected via \geometry{} in header.tex because
  //    custom templates \usepackage{geometry} without options and don't
  //    reference Pandoc's $geometry$ variable.
  preambleParts.push(`\\geometry{${geo}}`);
  let buildMeta;

  try {
    // 1. Book engineering (widow/orphan control, hyphenation, line breaking, floats)
    preambleParts.push(bookEngineering.generateEngineeringPreamble(templateType));

    // 2. Multilingual support (polyglossia, bidi, script-specific fonts)
    const scriptAnalysis = multilingual.detectScripts(effectiveMd);
    if (scriptAnalysis.isMultiscript || scriptAnalysis.hasRTL) {
      preambleParts.push(multilingual.generateMultilingualPreamble(scriptAnalysis));
      if (scriptAnalysis.hasRTL) {
        warnings.push('RTL content detected — bidi and polyglossia packages activated.');
      }
    }

    // 3. Provenance metadata (embedded in PDF properties via hypersetup)
    buildMeta = provenance.generateBuildMetadata({
      manuscriptText, template: tplKey, pageSize, marginPreset, safeMode, compileMode, title,
    });
    preambleParts.push(provenance.generateMetadataPreamble(buildMeta));

    // 4. Template extensions (if provided by user)
    const extensions = req.body.extensions;
    if (extensions && typeof extensions === 'object' && Object.keys(extensions).length > 0) {
      const extResult = templateExtensions.validateExtensions(extensions, templateType);
      if (extResult.valid) {
        preambleParts.push(templateExtensions.generateExtensionPreamble(extResult.resolvedTokens));
      } else {
        warnings.push(`Template extension errors: ${extResult.errors.map(e => e.error).join('; ')}`);
      }
    }

    // 5. Heading variant (modern/bold override — classic is a no-op)
    const variantPreamble = headingVariants.getVariantPreamble(tplKey, headingVariant);
    if (variantPreamble) {
      preambleParts.push(variantPreamble);
    }

    // 6. Watermark (free-tier downloads only)
    if (needsWatermark) {
      preambleParts.push(watermark.generateWatermarkPreamble());
    }
  } catch (preambleErr) {
    console.error('[compile] Preamble assembly error:', preambleErr);
    try { fs.rmSync(tmpBase, { recursive: true, force: true }); } catch {}
    return res.status(500).json({
      error: 'preamble_error',
      message: 'Failed to assemble compile preamble. Please try again or switch templates.',
      detail: String(preambleErr),
    });
  }

  // Write assembled preamble to header.tex for Pandoc -H injection
  const headerPath = path.join(tmpBase, 'header.tex');
  fs.writeFileSync(headerPath, preambleParts.join('\n\n'), 'utf8');

  const fontLog = [
    `font=${effectiveMainfont}${fontResolution.isFallback ? ` (fallback from ${tpl.mainfont})` : ''}`,
    sansResolution?.isFallback ? `sans=${sansResolution.resolved} (fallback from ${tpl.sansfont})` : '',
    monoResolution?.isFallback ? `mono=${monoResolution.resolved} (fallback from ${tpl.monofont})` : '',
  ].filter(Boolean).join(' ');
  console.log(`[compile] engine=lualatex pandoc=${PANDOC_VERSION} template=${tplKey} variant=${headingVariant} size=${pageSize} margins=${marginPreset} safe=${safeMode} mode=${compileMode} ${fontLog}`);

  const fromFormat = safeMode ? '--from=markdown'
    : PANDOC_HAS_CITEPROC ? '--from=markdown+citations' : '--from=markdown';
  const baseArgs = [
    mdPath,
    fromFormat,
    '--pdf-engine=lualatex',
    '-M', `title=${title}`,
    `--template=${patchedTemplatePath}`,
    '-H', headerPath,
    '-V', `mainfont=${effectiveMainfont}`,
    ...(enableMicrotype ? ['-V','microtype=true'] : []),
    ...(enableCsquotes  ? ['-V','csquotes=true']  : []),
    '-o', pdfPath,
  ];

  const args = safeMode
    ? baseArgs
    : baseArgs.concat(citeprocArgs(BIB_PATH));

  const startTs = Date.now();
  let pandoc;
  try {
    pandoc = spawn('pandoc', args, { cwd: tmpBase });
  } catch (spawnErr) {
    try { fs.rmSync(tmpBase, { recursive: true, force: true }); } catch {}
    return res.status(500).json({
      error: 'spawn_failed',
      message: 'Failed to start the typesetting engine. Please try again.',
      detail: String(spawnErr),
    });
  }

  let stderr = '';
  pandoc.stderr.on('data', (d) => { stderr += d.toString(); });

  // Handle spawn errors (e.g. pandoc binary not found, permission denied)
  pandoc.on('error', (err) => {
    try { fs.rmSync(tmpBase, { recursive: true, force: true }); } catch {}
    if (!res.headersSent) {
      res.status(500).json({
        error: 'spawn_failed',
        message: 'Failed to start the typesetting engine. Please try again.',
        detail: String(err),
      });
    }
  });

  let timedOut = false;
  const killer = setTimeout(() => {
    timedOut = true;
    try { pandoc.kill('SIGKILL'); } catch {}
  }, COMPILE_TIMEOUT_MS);

  pandoc.on('close', async (code) => {
    if (res.headersSent) return; // Already responded via error handler
    clearTimeout(killer);
    const elapsed = Date.now() - startTs;
    res.setHeader('X-PP-Compile-Time', String(elapsed));

    if (timedOut) {
      try { fs.rmSync(tmpBase, { recursive: true, force: true }); } catch {}
      return res.status(504).json({
        error: 'compile_timeout',
        message: `Compilation exceeded ${COMPILE_TIMEOUT_MS}ms and was stopped.`,
        detail: stderr.split('\n').slice(-15).join('\n'),
      });
    }

    if (code === 0 && fs.existsSync(pdfPath)) {
      // Provenance headers (buildMeta generated before compile for PDF embedding)
      res.setHeader('X-PP-Build-Id', buildMeta.buildId);
      res.setHeader('X-PP-Content-Hash', buildMeta.contentHash);
      if (fontResolution.isFallback) {
        res.setHeader('X-PP-Font-Fallback', `${fontResolution.original} -> ${fontResolution.resolved}`);
      }

      // Compile log analysis — surface typography warnings
      const compileLog = bookEngineering.analyzeCompileLog(stderr);
      const overfullCount = compileLog.overfullBoxes.length;
      const underfullCount = compileLog.underfullBoxes.length;
      if (overfullCount > 0) {
        res.setHeader('X-PP-Overfull-Boxes', String(overfullCount));
      }
      if (underfullCount > 0) {
        res.setHeader('X-PP-Underfull-Boxes', String(underfullCount));
      }

      // Optional PDF/X-1a conversion for IngramSpark compliance
      if (wantPdfX) {
        const pdfxPath = path.join(tmpBase, 'output-pdfx1a.pdf');
        const conv = await publishing.convertToPdfX1a(pdfPath, pdfxPath, title);
        if (!conv.success) {
          try { fs.rmSync(tmpBase, { recursive: true, force: true }); } catch {}
          return res.status(500).json({
            error: 'pdfx_conversion_failed',
            message: conv.error,
          });
        }
        const filename = buildFilename(title, tplKey, pageSize).replace('.pdf', '-pdfx1a.pdf');
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
        res.setHeader('X-PP-Filename', filename);
        res.setHeader('X-PP-Format', 'PDF/X-1a:2001');
        res.setHeader('X-PP-Watermarked', needsWatermark ? 'true' : 'false');
        if (creditsRemaining !== null) {
          res.setHeader('X-PP-Credits-Remaining', String(creditsRemaining));
        }
        const stream = fs.createReadStream(pdfxPath);
        stream.on('close', () => {
          try { fs.rmSync(tmpBase, { recursive: true, force: true }); } catch {}
        });
        return stream.pipe(res);
      }

      const filename = buildFilename(title, tplKey, pageSize);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
      res.setHeader('X-PP-Filename', filename);
      res.setHeader('X-PP-Watermarked', needsWatermark ? 'true' : 'false');
      if (creditsRemaining !== null) {
        res.setHeader('X-PP-Credits-Remaining', String(creditsRemaining));
      }
      const stream = fs.createReadStream(pdfPath);
      stream.on('close', () => {
        try { fs.rmSync(tmpBase, { recursive: true, force: true }); } catch {}
      });
      stream.pipe(res);
    } else {
      const missingCitations = safeMode ? [] : parseMissingCitations(stderr);
      const missingPackages  = parseMissingPackages(stderr);

      // Detect font-related failures in LuaLaTeX/XeLaTeX output
      // fontspec reports: The font "FontName" cannot be found.
      const fontCannotFind = stderr.match(/The font "([^"]+)" cannot be found/i);
      // luaotfload reports: font "FontName" not found
      const luaFontNotFound = !fontCannotFind && stderr.match(/font "([^"]+)" not found/i);
      const missingFont = fontCannotFind ? fontCannotFind[1] : (luaFontNotFound ? luaFontNotFound[1] : null);

      // Detect common LaTeX errors from stderr
      const latexError = stderr.match(/^!\s+(.+?)\.?\s*$/m);
      const undefinedCS = stderr.match(/Undefined control sequence[\s\S]*?l\.\d+\s+(.*)/);

      // Detect PDF driver failure (Error 256 / driver return code)
      const driverError = /Error\s+\d+\s+\(driver return code\)/i.test(stderr);
      // Detect LuaTeX-specific font loading failure
      const luaFontError = /luaotfload.*?cannot\s+(?:open|load|find)/i.test(stderr);

      // Compile log analysis for detailed diagnostics
      const compileLog = bookEngineering.analyzeCompileLog(stderr);

      const messages = [];
      if (missingFont) {
        messages.push(`Font "${missingFont}" not found. Install it or try a different template.`);
      }
      if (driverError && !missingFont) {
        messages.push('The PDF driver encountered an error generating output. Try a different template or simplify your manuscript.');
      }
      if (luaFontError && !missingFont) {
        messages.push('A font could not be loaded by the typesetting engine. Try a different template.');
      }
      if (!safeMode) {
        if (missingCitations.length) messages.push(`Undefined citations: ${missingCitations.join(', ')}.`);
      }
      if (missingPackages.length) messages.push(`Missing LaTeX packages: ${missingPackages.join(', ')}.`);
      if (undefinedCS) {
        messages.push(`LaTeX error: Undefined control sequence near "${undefinedCS[1].trim().slice(0, 80)}".`);
      } else if (latexError && !missingFont && !missingPackages.length && !driverError) {
        messages.push(`LaTeX error: ${latexError[1].slice(0, 120)}.`);
      }
      if (messages.length === 0) messages.push('Typesetting failed. Please review your Markdown.');
      if (safeMode) messages.push('Safe mode was enabled — citations were not processed.');

      const tail = stderr.split('\n').slice(-15).join('\n');

      res.status(400).json({
        error: 'compile_failed',
        message: messages.join(' '),
        missingCitations,
        missingPackages,
        warnings,
        compileLog: {
          overfullBoxes: compileLog.overfullBoxes.length,
          underfullBoxes: compileLog.underfullBoxes.length,
          floatIssues: compileLog.floatIssues.length,
          footnoteIssues: compileLog.footnoteIssues.length,
        },
        detail: tail,
      });

      try { fs.rmSync(tmpBase, { recursive: true, force: true }); } catch {}
    }
  });
});

// ================================================================
// Custom Font Upload
// ================================================================

const CUSTOM_FONTS_DIR_GLOBAL = path.join(os.tmpdir(), 'pp-custom-fonts');
if (!fs.existsSync(CUSTOM_FONTS_DIR_GLOBAL)) {
  fs.mkdirSync(CUSTOM_FONTS_DIR_GLOBAL, { recursive: true });
}

const fontStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const fontDir = path.join(CUSTOM_FONTS_DIR_GLOBAL, crypto.randomUUID());
    fs.mkdirSync(fontDir, { recursive: true });
    cb(null, fontDir);
  },
  filename: (_req, file, cb) => {
    // Sanitize filename — keep only alphanumeric, dots, hyphens, underscores
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, safe);
  },
});

const fontUpload = multer({
  storage: fontStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    // Only .ttf and .otf work with LuaLaTeX/fontspec — .woff/.woff2 are web-only formats
    if (['.ttf', '.otf'].includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only .ttf and .otf font files are supported. Web fonts (.woff/.woff2) cannot be used for PDF typesetting.'));
    }
  },
});

app.post('/api/fonts/upload', fontUpload.single('font'), async (req, res) => {
  // ── Tier gate: Custom font upload requires Studio ──
  const user = await verifyUserTier(req);
  if (!hasTier(user.tier, 'studio')) {
    // Clean up uploaded file if tier check fails
    if (req.file) {
      try { fs.rmSync(path.dirname(req.file.path), { recursive: true, force: true }); } catch {}
    }
    return res.status(403).json({ error: 'tier_required', message: 'Custom font upload requires a Studio subscription.', requiredTier: 'studio' });
  }

  if (!req.file) {
    return res.status(400).json({ error: 'no_file', message: 'No font file provided.' });
  }

  const fontId = path.basename(path.dirname(req.file.path));
  const fontName = path.parse(req.file.originalname).name;

  // Schedule cleanup after 1 hour
  setTimeout(() => {
    try { fs.rmSync(path.dirname(req.file.path), { recursive: true, force: true }); } catch {}
  }, 60 * 60 * 1000);

  console.log(`[fonts] Uploaded custom font: ${req.file.originalname} (${req.file.size} bytes) → ${fontId}`);

  res.json({
    fontId,
    fontName,
    originalName: req.file.originalname,
    size: req.file.size,
  });
});

// ================================================================
// Batch Compile — Multiple page sizes → ZIP
// ================================================================

app.post('/api/batch-compile', compileLimiter, async (req, res) => {
  // ── Tier gate: Batch export requires Studio ──
  const user = await verifyUserTier(req);
  if (!hasTier(user.tier, 'studio')) {
    return res.status(403).json({ error: 'tier_required', message: 'Batch export requires a Studio subscription.', requiredTier: 'studio' });
  }

  let { manuscriptText, template, title, marginPreset, safeMode, compileMode, pageSizes, customFonts, headingVariant: batchVariant } = req.body || {};
  safeMode = Boolean(safeMode);
  compileMode = (compileMode === 'full') ? 'full' : 'fast';
  batchVariant = headingVariants.HEADING_VARIANTS.includes(batchVariant) ? batchVariant : 'classic';

  if (!manuscriptText || typeof manuscriptText !== 'string') {
    return res.status(400).json({ error: 'invalid_request', message: 'manuscriptText is required.' });
  }
  if (!Array.isArray(pageSizes) || pageSizes.length === 0) {
    return res.status(400).json({ error: 'invalid_request', message: 'pageSizes array is required.' });
  }
  if (pageSizes.length > 20) {
    return res.status(400).json({ error: 'too_many', message: 'Maximum 20 page sizes per batch.' });
  }

  const mdBytes = Buffer.byteLength(manuscriptText, 'utf8');
  if (mdBytes > MAX_MD_BYTES) {
    return res.status(413).json({ error: 'payload_too_large', message: `Manuscript exceeds limit.` });
  }

  const tplKey = DESIGN_TEMPLATES[String(template)] ? String(template) : 'symphony';
  const tpl = DESIGN_TEMPLATES[tplKey];
  if (typeof title !== 'string' || !title.trim()) title = 'Manuscript';
  title = title.replace(/[\r\n]/g, ' ').slice(0, 200);

  const validSizes = pageSizes.filter(s => ALL_SIZES.has(s));
  if (validSizes.length === 0) {
    return res.status(400).json({ error: 'invalid_sizes', message: 'No valid page sizes provided.' });
  }

  // ── Shared preparation (fonts, preamble) — done once ──
  const templateType = tpl.gridType || 'academic';
  const effectiveMd = safeMode ? stripCitations(manuscriptText) : manuscriptText;
  const warnings = styleWarnings(manuscriptText);
  const isFast = compileMode === 'fast';

  const fontResolution = fontAvailability.resolveFont(tpl.mainfont);
  const effectiveMainfont = fontResolution.resolved;
  const sansResolution = tpl.sansfont ? fontAvailability.resolveFont(tpl.sansfont) : null;
  const monoResolution = tpl.monofont ? fontAvailability.resolveFont(tpl.monofont) : null;

  let templateContent = fs.readFileSync(tpl.templatePath, 'utf8');
  const fontReplacements = [
    { original: tpl.mainfont, resolved: effectiveMainfont },
    ...(sansResolution ? [{ original: tpl.sansfont, resolved: sansResolution.resolved }] : []),
    ...(monoResolution ? [{ original: tpl.monofont, resolved: monoResolution.resolved }] : []),
  ];
  for (const { original, resolved } of fontReplacements) {
    if (original !== resolved) {
      const escaped = original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      templateContent = templateContent.replace(
        new RegExp(`(\\\\set(?:main|sans|mono)font\\{)${escaped}(\\})`, 'g'),
        `$1${resolved}$2`
      );
    }
  }

  const preambleParts = [];
  try {
    preambleParts.push(bookEngineering.generateEngineeringPreamble(templateType));
    const scriptAnalysis = multilingual.detectScripts(effectiveMd);
    if (scriptAnalysis.isMultiscript || scriptAnalysis.hasRTL) {
      preambleParts.push(multilingual.generateMultilingualPreamble(scriptAnalysis));
    }
    const buildMeta = provenance.generateBuildMetadata({
      manuscriptText, template: tplKey, pageSize: validSizes[0], marginPreset, safeMode, compileMode, title,
    });
    preambleParts.push(provenance.generateMetadataPreamble(buildMeta));
  } catch (err) {
    return res.status(500).json({ error: 'preamble_error', message: 'Failed to assemble compile preamble.' });
  }

  // Heading variant for batch
  const batchVarPreamble = headingVariants.getVariantPreamble(tplKey, batchVariant);
  if (batchVarPreamble) preambleParts.push(batchVarPreamble);

  const preambleStr = preambleParts.join('\n\n');

  console.log(`[batch] Starting batch compile: ${validSizes.length} sizes for template=${tplKey} variant=${batchVariant}`);

  // ── Compile each page size sequentially ──
  const pdfs = []; // { name, path, tmpBase }
  const errors = [];

  for (const size of validSizes) {
    if (!ALL_MARGINS.has(marginPreset)) marginPreset = 'normal';
    const geo = geometryFor(size, marginPreset, templateType);
    const tmpBase = fs.mkdtempSync(path.join(os.tmpdir(), 'pp-batch-'));

    try {
      const mdPath = path.join(tmpBase, 'input.md');
      const pdfPath = path.join(tmpBase, 'output.pdf');
      fs.writeFileSync(mdPath, effectiveMd, 'utf8');

      const tplPath = path.join(tmpBase, 'template.latex');
      fs.writeFileSync(tplPath, templateContent, 'utf8');

      // Inject per-size geometry into header.tex (templates don't use Pandoc's $geometry$ variable)
      const headerPath = path.join(tmpBase, 'header.tex');
      fs.writeFileSync(headerPath, `\\geometry{${geo}}\n\n${preambleStr}`, 'utf8');

      // Handle custom fonts for batch
      if (customFonts && typeof customFonts === 'object') {
        const CUSTOM_FONTS_DIR = path.join(os.tmpdir(), 'pp-custom-fonts');
        for (const slot of ['main', 'sans', 'mono']) {
          const fontId = customFonts[slot];
          if (!fontId || typeof fontId !== 'string') continue;
          const srcDir = path.join(CUSTOM_FONTS_DIR, fontId);
          if (!fs.existsSync(srcDir)) continue;
          const files = fs.readdirSync(srcDir).filter(f => /\.(ttf|otf|woff2?)$/i.test(f));
          if (files.length > 0) {
            fs.copyFileSync(path.join(srcDir, files[0]), path.join(tmpBase, files[0]));
          }
        }
      }

      const batchFromFormat = safeMode ? '--from=markdown'
        : PANDOC_HAS_CITEPROC ? '--from=markdown+citations' : '--from=markdown';
      const args = [
        mdPath,
        batchFromFormat,
        '--pdf-engine=lualatex',
        '-M', `title=${title}`,
        `--template=${tplPath}`,
        '-H', headerPath,
        '-V', `mainfont=${effectiveMainfont}`,
        ...(isFast ? [] : ['-V', 'microtype=true', '-V', 'csquotes=true']),
        '-o', pdfPath,
      ];
      if (!safeMode) args.push(...citeprocArgs(BIB_PATH));

      // Promisified compile
      const result = await new Promise((resolve) => {
        const proc = spawn('pandoc', args, { cwd: tmpBase });
        let stderr = '';
        proc.stderr.on('data', (d) => { stderr += d.toString(); });
        proc.on('error', () => resolve({ success: false, error: 'Pandoc spawn failed' }));

        const kill = setTimeout(() => { try { proc.kill('SIGKILL'); } catch {} resolve({ success: false, error: 'Timeout' }); }, COMPILE_TIMEOUT_MS);
        proc.on('close', (code) => {
          clearTimeout(kill);
          if (code === 0 && fs.existsSync(pdfPath)) {
            resolve({ success: true });
          } else {
            resolve({ success: false, error: stderr.split('\n').slice(-5).join('\n') });
          }
        });
      });

      if (result.success) {
        const sizeSlug = size.replace(/([A-Z])/g, '-$1').toLowerCase();
        pdfs.push({ name: `${slug(title) || 'manuscript'}-${sizeSlug}.pdf`, path: pdfPath, tmpBase });
      } else {
        errors.push({ pageSize: size, error: result.error });
        try { fs.rmSync(tmpBase, { recursive: true, force: true }); } catch {}
      }
    } catch (err) {
      errors.push({ pageSize: size, error: String(err) });
      try { fs.rmSync(tmpBase, { recursive: true, force: true }); } catch {}
    }
  }

  if (pdfs.length === 0) {
    return res.status(400).json({ error: 'batch_failed', message: 'All compilations failed.', errors });
  }

  // ── ZIP and stream ──
  const zipFilename = `${slug(title) || 'manuscript'}-batch.zip`;
  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', `attachment; filename="${zipFilename}"`);
  res.setHeader('X-PP-Format', 'batch-zip');
  res.setHeader('X-PP-Batch-Count', String(pdfs.length));

  const archive = archiver('zip', { zlib: { level: 1 } });
  archive.pipe(res);

  for (const pdf of pdfs) {
    archive.file(pdf.path, { name: pdf.name });
  }

  archive.on('end', () => {
    for (const pdf of pdfs) {
      try { fs.rmSync(pdf.tmpBase, { recursive: true, force: true }); } catch {}
    }
    console.log(`[batch] Completed: ${pdfs.length}/${validSizes.length} sizes, ${errors.length} errors`);
  });

  archive.on('error', (err) => {
    for (const pdf of pdfs) {
      try { fs.rmSync(pdf.tmpBase, { recursive: true, force: true }); } catch {}
    }
    if (!res.headersSent) {
      res.status(500).json({ error: 'zip_failed', message: 'Failed to create ZIP archive.' });
    }
  });

  archive.finalize();
});

// ================================================================
// Contact / Request Format (Resend)
// ================================================================

const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,                    // 5 messages per 15 min per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'rate_limited', message: 'Too many contact requests. Please try again later.' },
});

app.post('/api/contact', contactLimiter, async (req, res) => {
  // ── Honeypot check ──
  if (req.body.website) {
    // Bot filled the hidden field — return 200 to avoid tipping it off
    return res.json({ ok: true });
  }

  // ── Timestamp check — reject submissions faster than 2 seconds ──
  const ts = Number(req.body._t);
  if (!ts || Date.now() - ts < 2000) {
    return res.json({ ok: true });
  }

  // ── Input validation ──
  const email = String(req.body.email || '').trim().slice(0, 320);
  const message = String(req.body.message || '').trim().slice(0, 5000);

  if (!email || !message) {
    return res.status(400).json({ error: 'missing_fields', message: 'Email and message are required.' });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'invalid_email', message: 'Invalid email address.' });
  }

  // ── Send via Resend ──
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    console.warn('[contact] RESEND_API_KEY not configured — cannot send email');
    return res.status(503).json({ error: 'not_configured', message: 'Contact service is not configured.' });
  }

  try {
    const { Resend } = require('resend');
    const resend = new Resend(resendKey);

    // Escape HTML entities in user-provided content
    const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const escapedEmail = esc(email);
    const escapedMessage = esc(message);
    const nl2br = (s) => s.replace(/\n/g, '<br>');

    // Send notification to support
    await resend.emails.send({
      from: 'PagePerfect <noreply@pageperfect.studio>',
      to: ['support@pageperfect.studio'],
      replyTo: email,
      subject: `Format Request from ${email}`,
      text: [
        'NEW FORMAT REQUEST',
        '----------------------------------------',
        '',
        `From: ${email}`,
        `Time: ${new Date().toISOString()}`,
        `IP:   ${req.ip}`,
        '',
        'Message:',
        message,
        '',
        '----------------------------------------',
        'Sent via PagePerfect /api/contact',
      ].join('\n'),
      html: [
        '<!DOCTYPE html><html><head><meta charset="utf-8"></head>',
        '<body style="margin:0;padding:40px 20px;background:#FDFCF8;font-family:\'Helvetica Neue\',Helvetica,Arial,sans-serif;color:#111111;">',
        '<div style="max-width:560px;margin:0 auto;">',
        '  <div style="border-bottom:2px solid #111111;padding-bottom:16px;margin-bottom:24px;">',
        '    <span style="font-size:10px;text-transform:uppercase;letter-spacing:0.15em;color:rgba(17,17,17,0.4);">Format Request</span>',
        '    <h1 style="margin:8px 0 0;font-size:22px;font-weight:700;letter-spacing:-0.02em;">New submission</h1>',
        '  </div>',
        '  <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:24px;">',
        `    <tr><td style="padding:6px 0;color:rgba(17,17,17,0.5);width:60px;vertical-align:top;">From</td><td style="padding:6px 0;font-weight:600;">${escapedEmail}</td></tr>`,
        `    <tr><td style="padding:6px 0;color:rgba(17,17,17,0.5);vertical-align:top;">Time</td><td style="padding:6px 0;">${new Date().toISOString()}</td></tr>`,
        `    <tr><td style="padding:6px 0;color:rgba(17,17,17,0.5);vertical-align:top;">IP</td><td style="padding:6px 0;font-family:monospace;font-size:12px;">${esc(req.ip || 'unknown')}</td></tr>`,
        '  </table>',
        '  <div style="border-top:1px solid rgba(17,17,17,0.1);padding-top:20px;">',
        '    <span style="font-size:10px;text-transform:uppercase;letter-spacing:0.12em;color:rgba(17,17,17,0.4);">Message</span>',
        `    <p style="margin:8px 0 0;font-size:14px;line-height:1.7;color:#333333;">${nl2br(escapedMessage)}</p>`,
        '  </div>',
        '  <div style="margin-top:32px;padding-top:16px;border-top:1px solid rgba(17,17,17,0.1);">',
        '    <span style="font-size:10px;color:rgba(17,17,17,0.3);">Sent via PagePerfect /api/contact</span>',
        '  </div>',
        '</div>',
        '</body></html>',
      ].join('\n'),
    });

    // Send confirmation to the user
    await resend.emails.send({
      from: 'PagePerfect <noreply@pageperfect.studio>',
      to: [email],
      subject: 'We received your format request — PagePerfect',
      text: [
        'Thank you for your format request.',
        '',
        'We have received the following message:',
        '',
        '---',
        message,
        '---',
        '',
        'Our team will review your requirements and follow up at this email address.',
        '',
        'PagePerfect',
        'https://pageperfect.studio',
      ].join('\n'),
      html: [
        '<!DOCTYPE html><html><head><meta charset="utf-8"></head>',
        '<body style="margin:0;padding:40px 20px;background:#FDFCF8;font-family:\'Helvetica Neue\',Helvetica,Arial,sans-serif;color:#111111;">',
        '<div style="max-width:560px;margin:0 auto;">',
        '  <div style="border-bottom:2px solid #111111;padding-bottom:16px;margin-bottom:24px;">',
        '    <span style="font-size:10px;text-transform:uppercase;letter-spacing:0.15em;color:rgba(17,17,17,0.4);">PagePerfect</span>',
        '    <h1 style="margin:8px 0 0;font-size:22px;font-weight:700;letter-spacing:-0.02em;">Request received</h1>',
        '  </div>',
        '  <p style="font-size:14px;line-height:1.7;color:#333333;margin:0 0 20px;">Thank you for reaching out. We have received your format request and will review it shortly.</p>',
        '  <div style="background:#f5f5f0;border-left:3px solid #111111;padding:16px 20px;margin-bottom:24px;">',
        '    <span style="font-size:10px;text-transform:uppercase;letter-spacing:0.12em;color:rgba(17,17,17,0.4);display:block;margin-bottom:8px;">Your message</span>',
        `    <p style="margin:0;font-size:14px;line-height:1.7;color:#333333;">${nl2br(escapedMessage)}</p>`,
        '  </div>',
        '  <p style="font-size:14px;line-height:1.7;color:#333333;margin:0 0 32px;">Our team will follow up at this email address. If you have additional details, reply directly to this email.</p>',
        '  <div style="border-top:2px solid #111111;padding-top:16px;">',
        '    <span style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;">PagePerfect</span>',
        '    <p style="margin:4px 0 0;font-size:11px;color:rgba(17,17,17,0.4);">Professional typesetting in your browser</p>',
        '    <a href="https://pageperfect.studio" style="font-size:11px;color:#FF3333;text-decoration:none;display:inline-block;margin-top:4px;">pageperfect.studio</a>',
        '  </div>',
        '</div>',
        '</body></html>',
      ].join('\n'),
    });

    console.log(`[contact] Format request from ${email} sent successfully`);
    res.json({ ok: true });
  } catch (err) {
    console.error('[contact] Resend error:', err.message || err);
    res.status(500).json({ error: 'send_failed', message: 'Failed to send message. Please try again.' });
  }
});

// ================================================================
// Start Server
// ================================================================

app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
  console.log(`  CORS: ${process.env.NODE_ENV === 'production' ? ALLOWED_ORIGINS.join(', ') : 'permissive (dev)'}`);
  console.log(`  Stripe: ${stripe ? 'configured' : 'not configured'}`);
  console.log(`  Lulu: ${lulu.isConfigured() ? `configured (${lulu.getBaseUrl()})` : 'not configured'}`);
  console.log(`  Resend: ${process.env.RESEND_API_KEY ? 'configured' : 'not configured'}`);
  console.log(`  Templates: ${Object.keys(DESIGN_TEMPLATES).length}`);
  console.log(`  Rate limit: 20 compiles/min, 120 requests/min`);

  // PocketBase emails handled by Go hooks (Resend HTTP API), no SMTP needed
});
