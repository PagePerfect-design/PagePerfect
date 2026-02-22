const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const archiver = require('archiver');
const crypto = require('crypto');
const fs = require('fs');
const fsp = require('fs').promises;
const os = require('os');
const path = require('path');
const { spawn, execSync } = require('child_process');
const GridSystem = require('./grid-system');
const publishing = require('./publishing');
const lulu = require('./lulu');
const latexSanitizer = require('./latex-sanitizer');
const compileUtils = require('./compile-utils');
const log = require('./logger');

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

// ── Redis (optional — gracefully degrades if not configured) ──
// BullMQ requires isolated ioredis connections for Queue, Worker, and QueueEvents
// because Worker uses blocking Redis commands (BRPOPLPUSH) that would deadlock
// a shared connection. We create a fresh connection for each component.
let redis = null;
let redisHealthy = false;

// Helper to spawn fresh ioredis connections.
// BullMQ requires enableOfflineQueue: false and maxRetriesPerRequest: null.
// The master connection (rate limiting, Stripe) keeps enableOfflineQueue: true
// so commands can queue while Redis connects.
function createRedisConnection({ forBullMQ = false } = {}) {
  const Redis = require('ioredis');
  const opts = forBullMQ
    ? { maxRetriesPerRequest: null, enableOfflineQueue: false }
    : { maxRetriesPerRequest: null };
  return process.env.REDIS_URL
    ? new Redis(process.env.REDIS_URL, opts)
    : new Redis({ host: process.env.REDIS_HOST || 'localhost', port: Number(process.env.REDIS_PORT || 6379), ...opts });
}

try {
  if (process.env.REDIS_URL || process.env.REDIS_HOST) {
    // Master connection for rate limiting and Stripe idempotency
    redis = createRedisConnection();
    redis.on('connect', () => { redisHealthy = true; log.info({ module: 'redis' }, 'Connected'); });
    redis.on('error', (err) => { redisHealthy = false; log.error({ module: 'redis', err: err.message }, 'Connection error'); });
    redis.on('close', () => { redisHealthy = false; });
  }
} catch (err) {
  log.warn({ module: 'redis', err: err.message }, 'Not available');
}

// ── BullMQ Compile Queue (only when Redis is available) ──
const { processCompileJob } = require('./compile-worker');
let compileQueue = null;
let compileWorker = null;
let compileQueueEvents = null;

// In-memory map: jobId → result metadata (populated by worker completion callback).
// This avoids hammering Redis with Job.fromId() on every poll.
const jobResults = new Map();

// Sync fallback semaphore — caps concurrent compiles when Redis is down.
const MAX_SYNC_CONCURRENT = Number(process.env.MAX_SYNC_CONCURRENT || 2);
let activeSyncCompiles = 0;

// Result cleanup: remove delivered/expired results after 10 minutes
const RESULT_TTL_MS = 10 * 60 * 1000;
const resultCleanupInterval = setInterval(() => {
  const now = Date.now();
  for (const [id, res] of jobResults) {
    if (res._storedAt && now - res._storedAt > RESULT_TTL_MS) {
      if (res.tmpBase) { fsp.rm(res.tmpBase, { recursive: true, force: true }).catch(() => {}); }
      jobResults.delete(id);
    }
  }
}, 60_000);
resultCleanupInterval.unref();

if (redis) {
  try {
    const { Queue, Worker, QueueEvents } = require('bullmq');

    // Supply fresh, isolated connections to each BullMQ component
    compileQueue = new Queue('pp-compile', { connection: createRedisConnection({ forBullMQ: true }) });

    compileWorker = new Worker('pp-compile', async (job) => {
      // DESIGN_TEMPLATES is defined later in this file — worker references it at runtime
      return processCompileJob(job, DESIGN_TEMPLATES);
    }, {
      connection: createRedisConnection({ forBullMQ: true }),
      concurrency: Number(process.env.COMPILE_CONCURRENCY || 3),
      lockDuration: 60_000,
      stalledInterval: 30_000,
      maxStalledCount: 0,
      removeOnComplete: { count: 200 },
      removeOnFail: { count: 500 },
    });

    compileWorker.on('completed', (job, result) => {
      result._storedAt = Date.now();
      jobResults.set(job.id, result);
      log.info({ module: 'queue', jobId: job.id, elapsed: result.elapsed || '?' }, 'Job completed');
    });

    compileWorker.on('failed', (job, err) => {
      jobResults.set(job.id, {
        _storedAt: Date.now(),
        success: false,
        error: 'worker_error',
        message: err.message || 'Compilation failed unexpectedly.',
      });
      log.error({ module: 'queue', jobId: job?.id, err: err.message }, 'Job failed');
    });

    compileQueueEvents = new QueueEvents('pp-compile', { connection: createRedisConnection({ forBullMQ: true }) });

    log.info({ module: 'queue', concurrency: process.env.COMPILE_CONCURRENCY || 3 }, 'BullMQ initialized');
  } catch (err) {
    log.warn({ module: 'queue', err: err.message }, 'BullMQ setup failed, using sync fallback');
    compileQueue = null;
    compileWorker = null;
  }
}

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
    log.info({ module: 'startup', pandocVersion: PANDOC_VERSION, citeproc: PANDOC_HAS_CITEPROC ? 'built-in' : 'filter fallback', pdfEngine: 'lualatex' }, 'Pandoc detected');
  }
} catch (e) {
  log.warn({ module: 'startup' }, 'Could not detect Pandoc version, assuming built-in --citeproc');
}

/** Returns the args needed to enable citation processing */
function citeprocArgs(bibPath) {
  if (PANDOC_HAS_CITEPROC) {
    return ['--citeproc', `--bibliography=${bibPath}`];
  }
  return ['--filter', 'pandoc-citeproc', `--bibliography=${bibPath}`];
}

// ---- Sanitize stderr before sending to clients ----
// Strips server paths from error output to prevent leaking container architecture
function sanitizeStderr(raw) {
  return String(raw)
    .replace(/\/tmp\/pp-[a-zA-Z0-9_-]+\//g, '[workspace]/')
    .replace(/\/home\/[a-zA-Z0-9_-]+\//g, '[home]/')
    .replace(/\/app\/[a-zA-Z0-9_/-]*templates\//g, '[templates]/')
    .replace(/\/usr\/local\/[a-zA-Z0-9_/-]+/g, '[system]');
}

// ---- Allowed origins ----
const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:4000',
  process.env.FRONTEND_URL, // e.g. https://pageperfect.studio
].filter(Boolean);

// Match Vercel preview/branch deployment URLs for the project.
// Pattern: page-perfect-<deployment-hash>-<team-slug>.vercel.app
// The hash is exactly 9 lowercase alphanumeric chars. The team slug
// follows Vercel's naming rules (lowercase alphanumeric + hyphens).
function isAllowedOrigin(origin) {
  if (!origin) return false;
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  // Strict pattern: page-perfect-<hash9>-<team>.vercel.app
  // Prevents attacker-controlled "page-perfect-evil.vercel.app" from matching.
  if (/^https:\/\/page-perfect-[a-z0-9]{9}-[a-z0-9-]+\.vercel\.app$/.test(origin)) return true;
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

// Trust the first proxy (Vercel edge / Coolify reverse proxy).
// Without this, req.ip returns the proxy's IP for ALL users, causing
// every Vercel-proxied request to share a single rate-limit bucket.
app.set('trust proxy', 1);

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

// Request logging — pino-based structured logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    log.info({ method: req.method, url: req.originalUrl, status: res.statusCode, ms: Date.now() - start }, 'request');
  });
  next();
});

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

// Rate limiting — per real client IP (trust proxy must be set for X-Forwarded-For).
// When Redis is available, use RedisStore so limits persist across restarts.
// Each limiter MUST have its own RedisStore instance (express-rate-limit v7+ requirement).
let RedisStoreClass;
if (redis) {
  try {
    RedisStoreClass = require('rate-limit-redis').RedisStore;
    log.info({ module: 'rate-limit' }, 'Using Redis store');
  } catch { /* rate-limit-redis not installed — fall back to in-memory */ }
}
function createRedisStore(prefix) {
  if (!RedisStoreClass) return {};
  return { store: new RedisStoreClass({ sendCommand: (...args) => redis.call(...args), prefix }) };
}

const compileLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20,             // 20 compiles per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  ...createRedisStore('rl:compile:'),
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
  ...createRedisStore('rl:general:'),
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

// Track processed Stripe event IDs to prevent duplicate webhook handling.
// Primary: Redis SETNX with 72h TTL (survives container rebuilds).
// Fallback: in-memory array (FIFO eviction when Redis is unavailable).
const processedStripeEventsSet = new Set();
const processedStripeEventsQueue = [];  // FIFO queue for eviction order
const MAX_STRIPE_EVENTS = 10000;
const STRIPE_IDEM_TTL = 72 * 60 * 60; // 72 hours in seconds

/**
 * Check if a Stripe event was already processed. Returns true if duplicate.
 * Uses Redis SETNX when available; falls back to in-memory FIFO queue.
 */
async function isStripeEventProcessed(eventId) {
  if (redis && redisHealthy) {
    try {
      // SETNX returns 1 if key was set (new event), 0 if already existed (duplicate)
      const wasSet = await redis.set(`pp:stripe:${eventId}`, '1', 'EX', STRIPE_IDEM_TTL, 'NX');
      return wasSet === null; // null means key already existed = duplicate
    } catch (err) {
      log.warn({ module: 'stripe:idem', err: err.message }, 'Redis SETNX failed, falling back to memory');
    }
  }
  // Fallback: in-memory with FIFO eviction (oldest events removed first)
  if (processedStripeEventsSet.has(eventId)) return true;
  processedStripeEventsSet.add(eventId);
  processedStripeEventsQueue.push(eventId);
  while (processedStripeEventsQueue.length > MAX_STRIPE_EVENTS) {
    const oldest = processedStripeEventsQueue.shift();
    processedStripeEventsSet.delete(oldest);
  }
  return false;
}

// ── PocketBase Admin Client (server-side only) ──
const POCKETBASE_URL = (process.env.POCKETBASE_URL || '').replace(/\/+$/, '');
const PB_TIMEOUT_MS = Number(process.env.PB_TIMEOUT_MS || 5000);
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
      signal: AbortSignal.timeout(PB_TIMEOUT_MS),
      body: JSON.stringify({
        identity: process.env.POCKETBASE_ADMIN_EMAIL,
        password: process.env.POCKETBASE_ADMIN_PASSWORD,
      }),
    });
    if (!resp.ok) {
      const body = await resp.text().catch(() => '');
      log.error({ module: 'pocketbase', status: resp.status, body }, 'Admin auth failed');
      return null;
    }
    const data = await resp.json();
    pbAdminToken = data.token;
    // Refresh 5 minutes before expiry (PB tokens last ~2 hours)
    pbTokenExpiry = Date.now() + 115 * 60 * 1000;
    return pbAdminToken;
  } catch (err) {
    log.error({ module: 'pocketbase', err: err.message }, 'Admin auth error');
    return null;
  }
}

// Helper: fetch from PocketBase with admin auth + timeout
async function pbFetch(pbPath, options = {}) {
  const token = await getPbAdminToken();
  if (!token) return null;
  const resp = await fetch(`${POCKETBASE_URL}${pbPath}`, {
    ...options,
    signal: AbortSignal.timeout(PB_TIMEOUT_MS),
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
  if (!isPocketBaseConfigured) return { userId: null, tier: 'anonymous', credits: 0, publisherWindowEnd: null };
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { userId: null, tier: 'anonymous', credits: 0, publisherWindowEnd: null };
  }
  const token = authHeader.slice(7);
  try {
    const authResp = await fetch(`${POCKETBASE_URL}/api/collections/users/auth-refresh`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(PB_TIMEOUT_MS),
    });
    if (authResp && authResp.ok) {
      const authData = await authResp.json();
      const record = authData.record;
      if (record) {
        let effectiveTier = record.tier || 'drafter';
        const publisherWindowEnd = record.publisher_window_end || null;

        // Active publisher window elevates drafter to publisher-level access
        if (effectiveTier === 'drafter' && publisherWindowEnd) {
          const windowEnd = new Date(publisherWindowEnd);
          if (windowEnd > new Date()) {
            effectiveTier = 'publisher';
          }
        }

        return {
          userId: record.id,
          tier: effectiveTier,
          credits: Number(record.pdf_credits) || 0,
          publisherWindowEnd,
        };
      }
    }
  } catch (err) {
    log.error({ module: 'auth', err: err.message }, 'Tier verification failed');
  }
  return { userId: null, tier: 'anonymous', credits: 0, publisherWindowEnd: null };
}

// Tier hierarchy for feature gating
const TIER_LEVEL = { anonymous: 0, drafter: 1, publisher: 2, studio: 3 };
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
      log.error({ module: 'stripe', err: err.message }, 'Webhook signature verification failed');
      return res.status(400).json({ error: 'Invalid signature' });
    }

    // Idempotency — skip already-processed events (Redis SETNX + in-memory fallback)
    if (await isStripeEventProcessed(event.id)) {
      log.info({ module: 'stripe', eventId: event.id }, 'Webhook already processed, skipping');
      return res.json({ received: true, duplicate: true });
    }

    // Helper: upgrade a user's tier in PocketBase
    async function upgradeTier(userId, tier, customerId, subscriptionId) {
      if (!isPocketBaseConfigured) {
        log.error({ module: 'stripe' }, 'PocketBase not configured — cannot update user tier');
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
          log.error({ module: 'stripe', status: resp?.status }, 'Failed to update user tier');
        } else {
          log.info({ module: 'stripe', userId, tier }, 'User upgraded');
        }
      } catch (err) {
        log.error({ module: 'stripe', err: err.message }, 'Failed to update user tier');
      }
    }

    // Helper: increment pdf_credits for a user (Single tier purchase)
    // Uses PocketBase's built-in `pdf_credits+` syntax for atomic increment,
    // avoiding the read-then-write race condition.
    async function incrementCredits(userId, customerId) {
      if (!isPocketBaseConfigured) {
        log.error({ module: 'stripe' }, 'PocketBase not configured — cannot increment credits');
        return;
      }
      try {
        const patchResp = await pbFetch(`/api/collections/users/records/${userId}`, {
          method: 'PATCH',
          body: JSON.stringify({
            'pdf_credits+': 1,
            stripe_customer_id: customerId,
          }),
        });
        if (patchResp && patchResp.ok) {
          const updated = await patchResp.json();
          log.info({ module: 'stripe', userId, totalCredits: updated.pdf_credits }, 'User credited +1 PDF');
        } else {
          log.error({ module: 'stripe', status: patchResp?.status }, 'Failed to increment credits');
        }
      } catch (err) {
        log.error({ module: 'stripe', err: err.message }, 'Failed to increment credits');
      }
    }

    // Helper: activate 14-day Publisher export window for a user
    // If the user already has an active window, extends from the current end date.
    async function activatePublisherWindow(userId, customerId) {
      if (!isPocketBaseConfigured) {
        log.error({ module: 'stripe' }, 'PocketBase not configured — cannot activate publisher window');
        return;
      }
      try {
        const resp = await pbFetch(`/api/collections/users/records/${userId}`);
        if (!resp || !resp.ok) {
          log.error({ module: 'stripe', status: resp?.status }, 'Failed to fetch user for window activation');
          return;
        }
        const user = await resp.json();

        // Start new 14-day window from max(current_end, now)
        const now = new Date();
        const currentEnd = user.publisher_window_end ? new Date(user.publisher_window_end) : null;
        const windowStart = (currentEnd && currentEnd > now) ? currentEnd : now;
        const windowEnd = new Date(windowStart.getTime() + 14 * 24 * 60 * 60 * 1000);

        const patchResp = await pbFetch(`/api/collections/users/records/${userId}`, {
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
      // Payment Element flow: one-time payment succeeded (Publisher $19.99 or Studio $199)
      case 'payment_intent.succeeded': {
        const pi = event.data.object;
        const tier = pi.metadata?.tier;
        const userId = pi.metadata?.user_id;
        log.info({ module: 'stripe', customer: pi.customer, tier, userId }, 'PaymentIntent succeeded');

        if (userId && tier === 'single') {
          // Single PDF — $2.99 one-time: increment pdf_credits by 1
          await incrementCredits(userId, pi.customer);
        } else if (userId && tier === 'publisher') {
          // Publisher — $19.99 per-manuscript: activate 14-day export window
          await activatePublisherWindow(userId, pi.customer);
        } else if (userId && tier) {
          // Studio — lifetime upgrade
          await upgradeTier(userId, tier, pi.customer, null);
        }
        break;
      }
      // Legacy: checkout session flow (kept for backward compatibility)
      case 'checkout.session.completed': {
        const session = event.data.object;
        const tier = session.metadata?.tier;
        const userId = session.metadata?.user_id;
        log.info({ module: 'stripe', customer: session.customer, tier, userId }, 'Checkout completed');

        if (userId && tier) {
          await upgradeTier(userId, tier, session.customer, session.subscription || null);
        }
        break;
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        log.info({ module: 'stripe', customer: sub.customer }, 'Subscription cancelled');

        if (!isPocketBaseConfigured) {
          log.error({ module: 'stripe' }, 'PocketBase not configured — cannot downgrade user');
          break;
        }

        try {
          // Find the user by stripe_customer_id.
          // Sanitize the customer ID to prevent filter injection (only allow Stripe customer IDs: cus_*)
          const custId = String(sub.customer).replace(/[^a-zA-Z0-9_]/g, '');
          const filter = encodeURIComponent(`stripe_customer_id='${custId}'`);
          const listResp = await pbFetch(`/api/collections/users/records?filter=${filter}`);
          if (!listResp || !listResp.ok) {
            log.error({ module: 'stripe' }, 'Failed to find user for downgrade');
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
      // Single PDF — $2.99 one-time PaymentIntent (one clean export credit)
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
      // Publisher — $19.99 one-time PaymentIntent per manuscript (14-day window)
      const amount = 1999; // $19.99 in cents
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
    } else {
      // Studio — $199 one-time PaymentIntent (lifetime)
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
    log.error({ module: 'stripe', err: err.message }, 'Payment creation error');
    res.status(500).json({ error: 'Failed to create payment' });
  }
});

// ================================================================
// Health & Info Endpoints
// ================================================================

app.get('/api/health', async (_req, res) => {
  let redisOk = false;
  if (redis) {
    try { await redis.ping(); redisOk = true; } catch { /* redis down */ }
  }
  res.json({
    ok: true,
    service: 'pageperfect-backend',
    timestamp: new Date().toISOString(),
    version: '3.1',
    pdfEngine: 'lualatex',
    redis: redis ? (redisOk ? 'connected' : 'down') : 'not_configured',
  });
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
    log.error({ module: 'lulu/cost-estimate', err: err.message }, 'Cost estimate failed');
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
    log.error({ module: 'lulu/print-job', err: err.message }, 'Create print job failed');
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
    log.error({ module: 'lulu/print-job', err: err.message }, 'Get print job failed');
    res.status(err.status || 500).json({ error: 'lulu_error', message: err.message, detail: err.body });
  }
});

app.post('/api/lulu/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  const signature = req.headers['lulu-hmac-sha256'];
  if (!lulu.verifyWebhook(req.body, signature)) {
    return res.status(401).json({ error: 'Invalid webhook signature' });
  }
  const event = JSON.parse(req.body.toString());
  log.info({ module: 'lulu/webhook', jobId: event.id, status: event.status?.name || 'unknown' }, 'Print job status update');
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

app.post('/api/convert', convertLimiter, express.raw({ type: '*/*', limit: '10mb' }), async (req, res) => {
  const buf = req.body;
  if (!Buffer.isBuffer(buf) || buf.length < 100) {
    return res.status(400).json({ error: 'invalid_request', message: 'No file received. Send the .docx as the raw request body.' });
  }
  if (buf.length > MAX_DOCX_BYTES) {
    return res.status(413).json({ error: 'payload_too_large', message: `File exceeds ${MAX_DOCX_BYTES} byte limit.` });
  }

  const tmpBase = await fsp.mkdtemp(path.join(os.tmpdir(), 'pp-conv-'));
  const docxPath = path.join(tmpBase, 'input.docx');
  await fsp.writeFile(docxPath, buf);

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
    log.error({ module: 'convert', exitCode: code, stderr: stderr.slice(0, 500) }, 'Pandoc conversion failed');
    return res.status(500).json({ error: 'conversion_failed', message: 'Failed to convert .docx to Markdown.', detail: sanitizeStderr(stderr.slice(0, 300)) });
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

app.post('/api/analyze/references', async (req, res) => {
  const { manuscriptText, bibliography } = req.body || {};
  if (!manuscriptText || typeof manuscriptText !== 'string') {
    return res.status(400).json({ error: 'invalid_request', message: 'manuscriptText is required.' });
  }

  const citations = referencesSystem.extractCitations(manuscriptText);
  const bibContent = bibliography || await fsp.readFile(BIB_PATH, 'utf8');
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
// Compile Endpoint — Async (202 + polling) with sync fallback
// ================================================================
//
// When Redis/BullMQ is available:
//   POST /api/compile → 202 { jobId, status: 'queued' }
//   GET  /api/compile/status/:id → { status: 'queued'|'active'|'completed'|'failed', ... }
//   GET  /api/compile/result/:id → PDF stream (with auth re-check + credit deduction)
//
// When Redis is DOWN:
//   POST /api/compile → synchronous PDF stream (semaphore-capped, same as v1)

const MAX_QUEUE_DEPTH = Number(process.env.MAX_QUEUE_DEPTH || 50);

app.post('/api/compile', compileLimiter, async (req, res) => {
  let { manuscriptText, template, title, pageSize, marginPreset, safeMode, compileMode, outputFormat, customFonts, headingVariant, download } = req.body || {};
  safeMode = Boolean(safeMode);
  compileMode = (compileMode === 'full') ? 'full' : 'fast';
  headingVariant = headingVariants.HEADING_VARIANTS.includes(headingVariant) ? headingVariant : 'classic';
  const isDownload = Boolean(download);

  // ── Early validation (before enqueue — fail fast) ──
  if (!manuscriptText || typeof manuscriptText !== 'string') {
    return res.status(400).json({ error: 'invalid_request', message: 'manuscriptText is required' });
  }
  const mdBytes = Buffer.byteLength(manuscriptText, 'utf8');
  if (mdBytes > MAX_MD_BYTES) {
    return res.status(413).json({
      error: 'payload_too_large',
      message: `Manuscript exceeds limit (${mdBytes} > ${MAX_MD_BYTES} bytes).`,
    });
  }

  // ── Auth & Tier (initial check — re-verified in worker) ──
  const user = await verifyUserTier(req);
  const userTier = user.tier;

  // Feature gates checked early to avoid needless enqueue
  const wantPdfX = outputFormat === 'pdfx1a';
  const wantEpub = outputFormat === 'epub';
  if (wantEpub && !hasTier(userTier, 'studio'))
    return res.status(403).json({ error: 'tier_required', message: 'EPUB export requires Studio.', requiredTier: 'studio' });
  if (wantPdfX && !hasTier(userTier, 'publisher'))
    return res.status(403).json({ error: 'tier_required', message: 'PDF/X-1a requires Publisher or Studio.', requiredTier: 'publisher' });
  if (customFonts && typeof customFonts === 'object' && Object.keys(customFonts).length > 0)
    if (!hasTier(userTier, 'studio'))
      return res.status(403).json({ error: 'tier_required', message: 'Custom fonts require Studio.', requiredTier: 'studio' });
  if (isDownload && userTier === 'drafter' && user.credits <= 0 && pageSize && !FREE_TIER_SIZES.has(pageSize))
    return res.status(403).json({ error: 'tier_required', message: `Page size "${pageSize}" requires a paid plan.`, requiredTier: 'publisher' });
  if (!safeMode && !hasTier(userTier, 'publisher')) safeMode = true;

  // Sanitize inputs — LaTeX-safe title for compile pipeline
  if (typeof title !== 'string' || !title.trim()) title = 'Manuscript';
  title = title.replace(/[\r\n]/g, ' ').slice(0, 200);
  // NOTE: The compile worker applies latexSanitizer.sanitizeTitle() before
  // passing to Pandoc. The raw title is preserved here for filename generation.
  if (!ALL_SIZES.has(pageSize)) pageSize = 'letter';
  if (!ALL_MARGINS.has(marginPreset)) marginPreset = 'normal';

  // SECURITY: Pass userId (not auth token) to worker for re-verification.
  // The worker uses the admin token to look up the user's tier directly,
  // avoiding storage of user auth tokens in Redis.

  // ── Async path: enqueue to BullMQ ──────────────────────────
  if (compileQueue && redisHealthy) {
    try {
      // Queue depth limit — reject if too many jobs waiting (D4)
      const waiting = await compileQueue.getWaitingCount();
      if (waiting >= MAX_QUEUE_DEPTH) {
        return res.status(503).json({
          error: 'queue_full',
          message: 'Server is at capacity. Please try again in a moment.',
        });
      }

      // A4: Queue Replacement — deterministic jobId for previews prevents
      // rapid-typers from flooding the queue with abandoned compiles.
      // Downloads get random UUIDs (each is intentional).
      const queueKey = isDownload ? `dl-${crypto.randomUUID()}` : `preview-${user.userId || req.ip}`;

      if (!isDownload) {
        const existingJob = await compileQueue.getJob(queueKey);
        if (existingJob) {
          const state = await existingJob.getState();
          // If the old preview hasn't started processing yet, rip it out
          if (state === 'waiting' || state === 'delayed') {
            await existingJob.remove();
          }
        }
      }

      // Write manuscript to temp file BEFORE enqueue — keep payload out of Redis
      const manuscriptDir = await fsp.mkdtemp(path.join(os.tmpdir(), 'pp-enqueue-'));
      const manuscriptPath = path.join(manuscriptDir, 'manuscript.md');
      await fsp.writeFile(manuscriptPath, manuscriptText, 'utf8');

      await compileQueue.add('compile', {
        manuscriptPath,
        template, title, pageSize, marginPreset,
        safeMode, compileMode, outputFormat,
        customFonts: customFonts || null,
        headingVariant,
        isDownload,
        userId: user.userId,  // Pass userId, NOT auth token
        extensions: req.body.extensions || null,
      }, {
        jobId: queueKey,
        // Publisher/Studio get higher priority (lower number = higher priority)
        priority: hasTier(userTier, 'publisher') ? 1 : 5,
      });

      // Generate a one-time access secret for anonymous jobs.
      // This prevents job ID enumeration attacks.
      const resultSecret = !user.userId ? crypto.randomBytes(16).toString('hex') : null;
      if (resultSecret) {
        jobResults.set(`${queueKey}:secret`, resultSecret);
      }

      log.info({ module: 'compile', jobId: queueKey, tier: userTier, download: isDownload }, 'Enqueued job');
      return res.status(202).json({
        jobId: queueKey,
        status: 'queued',
        message: 'Compilation queued.',
        statusUrl: `/api/compile/status/${queueKey}`,
        resultUrl: `/api/compile/result/${queueKey}`,
        ...(resultSecret ? { resultSecret } : {}),
      });
    } catch (err) {
      log.error({ module: 'compile', err: err.message }, 'Enqueue failed, falling through to sync');
      // Fall through to sync path
    }
  }

  // ── Sync fallback (Redis down or enqueue failed) ──────────
  if (activeSyncCompiles >= MAX_SYNC_CONCURRENT) {
    return res.status(503).json({
      error: 'server_busy',
      message: 'Server is at capacity. Please try again in a moment.',
    });
  }
  activeSyncCompiles++;

  try {
    const tmpDir = await fsp.mkdtemp(path.join(os.tmpdir(), 'pp-sync-'));
    const manuscriptPath = path.join(tmpDir, 'manuscript.md');
    await fsp.writeFile(manuscriptPath, manuscriptText, 'utf8');

    const fakeJob = {
      data: {
        manuscriptPath, template, title, pageSize, marginPreset,
        safeMode, compileMode, outputFormat,
        customFonts: customFonts || null,
        headingVariant, isDownload, userId: user.userId,
        extensions: req.body.extensions || null,
      },
    };

    const result = await processCompileJob(fakeJob, DESIGN_TEMPLATES);

    if (!result.success) {
      fsp.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
      return res.status(400).json(result);
    }

    // Stream PDF directly (sync fallback = same as v1)
    const isEpub = result.outputFormat === 'EPUB3';
    const contentType = isEpub ? 'application/epub+zip' : 'application/pdf';
    const filename = isEpub
      ? `${slug(title) || 'manuscript'}.epub`
      : buildFilename(title, template, pageSize);

    if (result.buildId) res.setHeader('X-PP-Build-Id', result.buildId);
    if (result.contentHash) res.setHeader('X-PP-Content-Hash', result.contentHash);
    if (result.elapsed) res.setHeader('X-PP-Compile-Time', String(result.elapsed));
    if (result.fontFallback) res.setHeader('X-PP-Font-Fallback', result.fontFallback);
    res.setHeader('X-PP-Watermarked', result.needsWatermark ? 'true' : 'false');
    res.setHeader('X-PP-Template', result.template || template);
    res.setHeader('X-PP-Format', result.outputFormat || 'PDF');
    res.setHeader('X-PP-Filename', filename);
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    res.setHeader('Cache-Control', 'no-store');

    // Credit deduction for sync path — atomic decrement to prevent race conditions
    if (result.isDownload && result.userId && result.userCredits > 0
      && !hasTier(result.userTier, 'publisher') && isPocketBaseConfigured) {
      try {
        const patchResp = await pbFetch(`/api/collections/users/records/${result.userId}`, {
          method: 'PATCH',
          body: JSON.stringify({ 'pdf_credits-': 1 }),
        });
        if (patchResp && patchResp.ok) {
          const updated = await patchResp.json();
          res.setHeader('X-PP-Credits-Remaining', String(updated.pdf_credits));
        }
      } catch (e) { log.error({ module: 'compile:sync', err: e.message }, 'Credit deduction failed'); }
    }

    const stream = fs.createReadStream(result.pdfPath);
    stream.on('close', () => {
      fsp.rm(result.tmpBase, { recursive: true, force: true }).catch(() => {});
      fsp.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
    });
    stream.pipe(res);
  } catch (err) {
    log.error({ module: 'compile:sync', err: err.message }, 'Compilation error');
    if (!res.headersSent) {
      res.status(500).json({ error: 'compile_failed', message: err.message });
    }
  } finally {
    activeSyncCompiles--;
  }
});

// ================================================================
// Compile Status Polling — GET /api/compile/status/:id
// ================================================================

app.get('/api/compile/status/:id', async (req, res) => {
  const { id } = req.params;

  // Check in-memory result map first (populated by worker completion callback)
  const cached = jobResults.get(id);
  if (cached) {
    if (cached.success) {
      return res.json({
        jobId: id,
        status: 'completed',
        elapsed: cached.elapsed,
        outputFormat: cached.outputFormat,
        needsWatermark: cached.needsWatermark,
        warnings: cached.warnings,
        resultUrl: `/api/compile/result/${id}`,
      });
    } else {
      return res.json({
        jobId: id,
        status: 'failed',
        error: cached.error,
        message: cached.message,
        warnings: cached.warnings,
        detail: cached.detail,
      });
    }
  }

  // Check BullMQ for active/waiting jobs
  if (compileQueue) {
    try {
      const job = await compileQueue.getJob(id);
      if (job) {
        const state = await job.getState();
        return res.json({ jobId: id, status: state, progress: job.progress || 0 });
      }
    } catch (err) {
      log.error({ module: 'status', err: err.message }, 'Error fetching job');
    }
  }

  return res.status(404).json({ error: 'not_found', message: 'Job not found or expired.' });
});

// ================================================================
// Compile Result Delivery — GET /api/compile/result/:id
// ================================================================
// Auth re-check (F1): requester must be job owner.
// Credit deduction happens here at delivery time (A3).

app.get('/api/compile/result/:id', async (req, res) => {
  const { id } = req.params;
  const result = jobResults.get(id);

  if (!result) {
    return res.status(404).json({ error: 'not_found', message: 'Result not found or expired.' });
  }
  if (!result.success) {
    return res.status(400).json(result);
  }

  // ── Auth check: verify requester matches job owner (F1) ──
  if (result.userId) {
    const requester = await verifyUserTier(req);
    if (requester.userId !== result.userId) {
      return res.status(403).json({ error: 'forbidden', message: 'Not authorized to access this result.' });
    }
  } else {
    // Anonymous job — require the result secret from the 202 response.
    // Prevents job ID enumeration attacks.
    const storedSecret = jobResults.get(`${id}:secret`);
    if (storedSecret) {
      const providedSecret = req.query.secret || req.headers['x-pp-result-secret'];
      if (providedSecret !== storedSecret) {
        return res.status(403).json({ error: 'forbidden', message: 'Invalid result secret.' });
      }
      jobResults.delete(`${id}:secret`); // One-time use
    }
  }

  // Verify PDF still exists on disk
  if (!result.pdfPath || !fs.existsSync(result.pdfPath)) {
    jobResults.delete(id);
    return res.status(410).json({ error: 'expired', message: 'Result has expired. Please recompile.' });
  }

  // ── Credit deduction at delivery (A3) — only once, atomic ──
  if (result.isDownload && result.userId && !result._creditDeducted
    && result.userCredits > 0 && !hasTier(result.userTier, 'publisher')
    && isPocketBaseConfigured) {
    try {
      const freshUser = await verifyUserTier(req);
      if (freshUser.credits > 0) {
        const patchResp = await pbFetch(`/api/collections/users/records/${result.userId}`, {
          method: 'PATCH',
          body: JSON.stringify({ 'pdf_credits-': 1 }),
        });
        result._creditDeducted = true;
        if (patchResp && patchResp.ok) {
          const updated = await patchResp.json();
          res.setHeader('X-PP-Credits-Remaining', String(updated.pdf_credits));
        }
        log.info({ module: 'result', userId: result.userId }, 'Deducted 1 credit');
      }
    } catch (e) { log.error({ module: 'result', err: e.message }, 'Credit deduction failed'); }
  }

  // ── Stream PDF ──
  const isEpub = result.outputFormat === 'EPUB3';
  const contentType = isEpub ? 'application/epub+zip' : 'application/pdf';
  const filename = isEpub
    ? `${slug(result.title || 'manuscript')}.epub`
    : buildFilename(result.title || 'Manuscript', result.template || 'symphony', result.pageSize || 'letter');

  if (result.buildId) res.setHeader('X-PP-Build-Id', result.buildId);
  if (result.contentHash) res.setHeader('X-PP-Content-Hash', result.contentHash);
  if (result.elapsed) res.setHeader('X-PP-Compile-Time', String(result.elapsed));
  if (result.fontFallback) res.setHeader('X-PP-Font-Fallback', result.fontFallback);
  res.setHeader('X-PP-Watermarked', result.needsWatermark ? 'true' : 'false');
  res.setHeader('X-PP-Format', result.outputFormat || 'PDF');
  res.setHeader('X-PP-Filename', filename);
  res.setHeader('Content-Type', contentType);
  res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
  res.setHeader('Cache-Control', 'no-store');

  const stream = fs.createReadStream(result.pdfPath);
  stream.on('close', () => {
    if (result.tmpBase) fsp.rm(result.tmpBase, { recursive: true, force: true }).catch(() => {});
    jobResults.delete(id);
  });
  stream.on('error', () => {
    if (!res.headersSent) res.status(500).json({ error: 'stream_error', message: 'Failed to read PDF.' });
    jobResults.delete(id);
  });
  stream.pipe(res);
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
    return res.status(403).json({ error: 'tier_required', message: 'Custom font upload requires Studio.', requiredTier: 'studio' });
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

  log.info({ module: 'fonts', originalName: req.file.originalname, size: req.file.size, fontId }, 'Uploaded custom font');

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
    return res.status(403).json({ error: 'tier_required', message: 'Batch export requires Studio.', requiredTier: 'studio' });
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

  let templateContent = await fsp.readFile(tpl.templatePath, 'utf8');
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
      headingVariant, customFonts: customFonts || null,
    });
    preambleParts.push(provenance.generateMetadataPreamble(buildMeta));
  } catch (err) {
    return res.status(500).json({ error: 'preamble_error', message: 'Failed to assemble compile preamble.' });
  }

  // Heading variant for batch
  const batchVarPreamble = headingVariants.getVariantPreamble(tplKey, batchVariant);
  if (batchVarPreamble) preambleParts.push(batchVarPreamble);

  const preambleStr = preambleParts.join('\n\n');

  log.info({ module: 'batch', sizeCount: validSizes.length, template: tplKey, variant: batchVariant }, 'Starting batch compile');

  // ── Compile each page size sequentially ──
  const pdfs = []; // { name, path, tmpBase }
  const errors = [];

  for (const size of validSizes) {
    if (!ALL_MARGINS.has(marginPreset)) marginPreset = 'normal';
    const geo = geometryFor(size, marginPreset, templateType);
    const tmpBase = await fsp.mkdtemp(path.join(os.tmpdir(), 'pp-batch-'));

    try {
      const mdPath = path.join(tmpBase, 'input.md');
      const pdfPath = path.join(tmpBase, 'output.pdf');
      await fsp.writeFile(mdPath, effectiveMd, 'utf8');

      const tplPath = path.join(tmpBase, 'template.latex');
      await fsp.writeFile(tplPath, templateContent, 'utf8');

      // Inject per-size geometry into header.tex (templates don't use Pandoc's $geometry$ variable)
      const headerPath = path.join(tmpBase, 'header.tex');
      await fsp.writeFile(headerPath, `\\geometry{${geo}}\n\n${preambleStr}`, 'utf8');

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

      // Strip raw_tex and raw_attribute to prevent LFI attacks
      const batchFromFormat = safeMode ? '--from=markdown-raw_tex-raw_attribute'
        : PANDOC_HAS_CITEPROC ? '--from=markdown+citations-raw_tex-raw_attribute' : '--from=markdown-raw_tex-raw_attribute';
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
            resolve({ success: false, error: sanitizeStderr(stderr.split('\n').slice(-5).join('\n')) });
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
    log.info({ module: 'batch', completed: pdfs.length, total: validSizes.length, errors: errors.length }, 'Batch compile completed');
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
    log.warn({ module: 'contact' }, 'RESEND_API_KEY not configured — cannot send email');
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

    log.info({ module: 'contact', email }, 'Format request sent successfully');
    res.json({ ok: true });
  } catch (err) {
    log.error({ module: 'contact', err: err.message || err }, 'Resend error');
    res.status(500).json({ error: 'send_failed', message: 'Failed to send message. Please try again.' });
  }
});

// ================================================================
// Start Server
// ================================================================

// Root health check for Coolify container deployment validation
app.get('/', (req, res) => res.status(200).send('PagePerfect Engine Active'));

const server = app.listen(PORT, () => {
  log.info({
    module: 'startup',
    port: PORT,
    cors: process.env.NODE_ENV === 'production' ? ALLOWED_ORIGINS.join(', ') : 'permissive (dev)',
    stripe: stripe ? 'configured' : 'not configured',
    lulu: lulu.isConfigured() ? `configured (${lulu.getBaseUrl()})` : 'not configured',
    resend: process.env.RESEND_API_KEY ? 'configured' : 'not configured',
    templates: Object.keys(DESIGN_TEMPLATES).length,
    rateLimit: '20 compiles/min, 120 requests/min',
    queue: compileQueue ? 'BullMQ (concurrency ' + (process.env.COMPILE_CONCURRENCY || 3) + ')' : 'sync fallback',
  }, `Backend listening on http://localhost:${PORT}`);
});

// ================================================================
// Graceful Shutdown (SIGTERM / SIGINT)
// ================================================================
// On SIGTERM (Docker stop, Coolify redeploy):
// 1. Stop accepting new HTTP connections
// 2. Close BullMQ worker (let active jobs finish, up to 30s)
// 3. Close BullMQ queue and events
// 4. Disconnect Redis
// 5. Exit

async function gracefulShutdown(signal) {
  log.info({ module: 'shutdown', signal }, 'Received signal, shutting down gracefully');

  // 1. Stop accepting new connections
  server.close(() => { log.info({ module: 'shutdown' }, 'HTTP server closed'); });

  // 2. Close worker — waits for active jobs to finish (up to lockDuration)
  if (compileWorker) {
    try {
      await compileWorker.close();
      log.info({ module: 'shutdown' }, 'BullMQ worker closed');
    } catch (err) { log.error({ module: 'shutdown', err: err.message }, 'Worker close error'); }
  }

  // 3. Close queue and events
  if (compileQueueEvents) {
    try { await compileQueueEvents.close(); } catch {}
  }
  if (compileQueue) {
    try { await compileQueue.close(); } catch {}
  }

  // 4. Disconnect Redis
  if (redis) {
    try { await redis.quit(); log.info({ module: 'shutdown' }, 'Redis disconnected'); }
    catch { try { redis.disconnect(); } catch {} }
  }

  // 5. Clear cleanup interval
  clearInterval(resultCleanupInterval);

  // 6. Clean up any remaining temp files from in-memory results
  for (const [id, res] of jobResults) {
    if (res.tmpBase) {
      try { fs.rmSync(res.tmpBase, { recursive: true, force: true }); } catch {}
    }
  }
  jobResults.clear();

  log.info({ module: 'shutdown' }, 'Cleanup complete, exiting');
  process.exit(0);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
