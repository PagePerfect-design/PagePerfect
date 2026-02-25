/**
 * Entitlements — Per-manuscript export enforcement for Publisher tier.
 *
 * The Publisher tier ($19.99) grants watermark-free exports for ONE manuscript
 * during a 14-day window. This module enforces that constraint:
 *
 *   1. On first export, the manuscript fingerprint (title + content hash) is stamped.
 *   2. Subsequent exports during the same window must match the fingerprint.
 *   3. A new purchase extends the window and may bind a new manuscript.
 *
 * Storage: Redis (primary) with in-memory fallback.
 * PocketBase is NOT modified — entitlements are tracked by userId + window timestamp.
 *
 * Fingerprint is intentionally coarse-grained (title + truncated content hash)
 * to allow minor edits while preventing completely different manuscripts.
 */

const crypto = require('crypto');
const log = require('./logger');

const ENTITLEMENT_PREFIX = 'pp:entitlement:';
const WINDOW_SECONDS = 14 * 24 * 60 * 60; // 14 days

// In-memory fallback when Redis is unavailable
const memoryStore = new Map();

/**
 * Compute a fingerprint for a manuscript.
 * Uses title + first 2000 chars of content to allow minor edits.
 */
function manuscriptFingerprint(title, content) {
  const normalizedTitle = String(title || '').trim().toLowerCase().slice(0, 200);
  const contentPrefix = String(content || '').slice(0, 2000);
  return crypto
    .createHash('sha256')
    .update(`${normalizedTitle}::${contentPrefix}`)
    .digest('hex')
    .slice(0, 16);
}

/**
 * Build the Redis key for an entitlement.
 * Scoped to userId + window end timestamp (each purchase gets its own key).
 */
function entitlementKey(userId, windowEnd) {
  // Normalize window end to hour precision to avoid key proliferation
  const windowHour = new Date(windowEnd).toISOString().slice(0, 13);
  return `${ENTITLEMENT_PREFIX}${userId}:${windowHour}`;
}

/**
 * Check if a user can export this manuscript under their current Publisher window.
 *
 * @param {object} opts
 * @param {string} opts.userId — PocketBase user ID
 * @param {string} opts.publisherWindowEnd — ISO timestamp from verifyUserTier
 * @param {string} opts.title — Manuscript title
 * @param {string} opts.content — Manuscript content (first 2000 chars used)
 * @param {object|null} opts.redis — Redis client (null = memory fallback)
 * @param {boolean} opts.redisHealthy — Whether Redis is connected
 * @returns {{ allowed: boolean, reason?: string, fingerprint: string }}
 */
async function checkExportEntitlement({ userId, publisherWindowEnd, title, content, redis, redisHealthy }) {
  if (!userId || !publisherWindowEnd) {
    return { allowed: false, reason: 'No active Publisher window.', fingerprint: '' };
  }

  const windowEnd = new Date(publisherWindowEnd);
  if (windowEnd <= new Date()) {
    return { allowed: false, reason: 'Publisher window has expired.', fingerprint: '' };
  }

  const fingerprint = manuscriptFingerprint(title, content);
  const key = entitlementKey(userId, publisherWindowEnd);

  // Try Redis first
  if (redis && redisHealthy) {
    try {
      const stored = await redis.get(key);
      if (!stored) {
        // First export in this window — stamp the fingerprint
        const ttl = Math.max(1, Math.ceil((windowEnd.getTime() - Date.now()) / 1000));
        await redis.setex(key, ttl, fingerprint);
        log.info({ module: 'entitlements', userId, fingerprint, action: 'stamp' }, 'Entitlement stamped');
        return { allowed: true, fingerprint };
      }
      if (stored === fingerprint) {
        return { allowed: true, fingerprint };
      }
      // Different manuscript — blocked
      return {
        allowed: false,
        reason: 'This Publisher purchase is bound to a different manuscript. Purchase a new export to use a different manuscript.',
        fingerprint,
      };
    } catch (err) {
      log.warn({ module: 'entitlements', err: err.message }, 'Redis check failed, using memory fallback');
    }
  }

  // Memory fallback
  const memEntry = memoryStore.get(key);
  if (!memEntry) {
    memoryStore.set(key, { fingerprint, expiresAt: windowEnd.getTime() });
    log.info({ module: 'entitlements', userId, fingerprint, action: 'stamp-mem' }, 'Entitlement stamped (memory)');
    return { allowed: true, fingerprint };
  }
  if (memEntry.fingerprint === fingerprint) {
    return { allowed: true, fingerprint };
  }
  return {
    allowed: false,
    reason: 'This Publisher purchase is bound to a different manuscript. Purchase a new export to use a different manuscript.',
    fingerprint,
  };
}

/**
 * Periodic cleanup for in-memory fallback entries.
 */
function sweepMemoryEntitlements() {
  const now = Date.now();
  for (const [key, entry] of memoryStore) {
    if (entry.expiresAt && entry.expiresAt < now) {
      memoryStore.delete(key);
    }
  }
}

// Sweep every 30 minutes
const sweepInterval = setInterval(sweepMemoryEntitlements, 30 * 60 * 1000);
sweepInterval.unref();

module.exports = {
  manuscriptFingerprint,
  checkExportEntitlement,
  sweepMemoryEntitlements,
};
