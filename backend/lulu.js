/**
 * Lulu xPress API client — print-on-demand integration.
 *
 * Authentication: OAuth 2.0 client_credentials grant (OpenID Connect)
 * Docs: https://api.lulu.com/docs/
 *
 * Required env vars:
 *   LULU_CLIENT_KEY     — API key from developers.lulu.com
 *   LULU_CLIENT_SECRET  — API secret
 *   LULU_SANDBOX        — set to 'true' for sandbox mode
 */

// ================================================================
// Configuration
// ================================================================

const LULU_PROD_BASE = 'https://api.lulu.com';
const LULU_SANDBOX_BASE = 'https://api.sandbox.lulu.com';

function getBaseUrl() {
  return process.env.LULU_SANDBOX === 'true' ? LULU_SANDBOX_BASE : LULU_PROD_BASE;
}

function isConfigured() {
  return !!(process.env.LULU_CLIENT_KEY && process.env.LULU_CLIENT_SECRET);
}

// ================================================================
// OAuth 2.0 Token Management
// ================================================================

let cachedToken = null;
let tokenExpiresAt = 0;

/**
 * Get a valid Bearer token, refreshing if expired.
 * Uses client_credentials grant with HTTP Basic auth.
 */
async function getToken() {
  if (cachedToken && Date.now() < tokenExpiresAt - 30000) {
    return cachedToken;
  }

  const base = getBaseUrl();
  const credentials = Buffer.from(
    `${process.env.LULU_CLIENT_KEY}:${process.env.LULU_CLIENT_SECRET}`
  ).toString('base64');

  const res = await fetch(
    `${base}/auth/realms/glasstree/protocol/openid-connect/token`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Lulu auth failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  cachedToken = data.access_token;
  tokenExpiresAt = Date.now() + (data.expires_in * 1000);
  return cachedToken;
}

/**
 * Make an authenticated API request to Lulu.
 */
async function luluFetch(path, options = {}) {
  const token = await getToken();
  const base = getBaseUrl();

  const res = await fetch(`${base}${path}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const contentType = res.headers.get('content-type') || '';
  const body = contentType.includes('json') ? await res.json() : await res.text();

  if (!res.ok) {
    const err = new Error(`Lulu API error (${res.status})`);
    err.status = res.status;
    err.body = body;
    throw err;
  }

  return body;
}

// ================================================================
// Pod Package ID Builder
// ================================================================

/**
 * Common pod_package_id configurations.
 * Format: {TrimSize}{Color}{Quality}{Binding}{Paper}{PPI}{Finish}{Linen}{Foil}
 *
 * Trim codes:
 *   0500X0800 = 5×8, 0550X0850 = 5.5×8.5, 0600X0900 = 6×9,
 *   0700X1000 = 7×10, 0850X1100 = 8.5×11
 */
const TRIM_CODES = {
  '5x8':     '0500X0800',
  '5.5x8.5': '0550X0850',
  '6x9':     '0600X0900',
  '7x10':    '0700X1000',
  '8.5x11':  '0850X1100',
};

/**
 * Build a Lulu pod_package_id from options.
 *
 * @param {object} opts
 * @param {string} opts.trimSize    — e.g. '6x9'
 * @param {string} [opts.color]     — 'bw' | 'color' (default: 'bw')
 * @param {string} [opts.binding]   — 'paperback' | 'hardcover' (default: 'paperback')
 * @param {string} [opts.paper]     — 'white' | 'cream' (default: 'white')
 * @param {string} [opts.finish]    — 'matte' | 'gloss' (default: 'matte')
 * @returns {string} 27-character pod_package_id
 */
function buildPodPackageId(opts) {
  const {
    trimSize = '6x9',
    color = 'bw',
    binding = 'paperback',
    paper = 'white',
    finish = 'matte',
  } = opts;

  const trim = TRIM_CODES[trimSize] || TRIM_CODES['6x9'];
  const colorCode = color === 'color' ? 'FC' : 'BW';
  const quality = 'STD';
  const bindCode = binding === 'hardcover' ? 'CW' : 'PB';
  const paperCode = paper === 'cream' ? '060UC444' : '060UW444';
  const finishCode = finish === 'gloss' ? 'G' : 'M';
  const linen = 'X'; // no linen
  const foil = 'X';  // no foil

  return `${trim}${colorCode}${quality}${bindCode}${paperCode}${finishCode}${linen}${foil}`;
}

// ================================================================
// API Methods
// ================================================================

/**
 * Calculate printing cost without creating an order.
 *
 * @param {object} opts
 * @param {string} opts.podPackageId  — 27-char product SKU
 * @param {number} opts.pageCount     — total pages
 * @param {number} opts.quantity      — number of copies
 * @param {object} opts.shippingAddress — { street1, city, state_code, country_code, postcode }
 * @param {string} [opts.shippingLevel] — 'MAIL' | 'PRIORITY_MAIL' | 'GROUND' | 'EXPEDITED' | 'EXPRESS'
 * @returns {Promise<object>} Cost breakdown
 */
async function calculateCost(opts) {
  const {
    podPackageId,
    pageCount,
    quantity = 1,
    shippingAddress,
    shippingLevel = 'MAIL',
  } = opts;

  return luluFetch('/print-job-cost-calculations/', {
    method: 'POST',
    body: JSON.stringify({
      line_items: [{
        pod_package_id: podPackageId,
        page_count: pageCount,
        quantity,
      }],
      shipping_address: shippingAddress,
      shipping_level: shippingLevel,
    }),
  });
}

/**
 * Create a print job (actual order).
 *
 * @param {object} opts
 * @param {string} opts.title           — book title
 * @param {string} opts.interiorUrl     — publicly accessible URL for interior PDF
 * @param {string} opts.coverUrl        — publicly accessible URL for cover PDF
 * @param {string} opts.podPackageId    — 27-char product SKU
 * @param {number} opts.quantity        — number of copies
 * @param {object} opts.shippingAddress — full address object
 * @param {string} opts.contactEmail    — order contact email
 * @param {string} [opts.shippingLevel] — shipping speed
 * @param {string} [opts.externalId]    — your internal order ID
 * @returns {Promise<object>} Created print job
 */
async function createPrintJob(opts) {
  const {
    title,
    interiorUrl,
    coverUrl,
    podPackageId,
    quantity = 1,
    shippingAddress,
    contactEmail,
    shippingLevel = 'MAIL',
    externalId,
  } = opts;

  const body = {
    line_items: [{
      title,
      cover: { source_url: coverUrl },
      interior: { source_url: interiorUrl },
      pod_package_id: podPackageId,
      quantity,
    }],
    shipping_address: shippingAddress,
    contact_email: contactEmail,
    shipping_level: shippingLevel,
    production_delay: 120, // 2 hours to cancel
  };

  if (externalId) body.external_id = externalId;

  return luluFetch('/print-jobs/', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

/**
 * Get a print job by ID.
 */
async function getPrintJob(id) {
  return luluFetch(`/print-jobs/${id}/`);
}

/**
 * Get print job status.
 */
async function getPrintJobStatus(id) {
  return luluFetch(`/print-jobs/${id}/status/`);
}

/**
 * Cancel a print job (only before production starts).
 */
async function cancelPrintJob(id) {
  return luluFetch(`/print-jobs/${id}/status/`, {
    method: 'POST',
  });
}

/**
 * Get cost breakdown for an existing print job.
 */
async function getPrintJobCosts(id) {
  return luluFetch(`/print-jobs/${id}/costs/`);
}

/**
 * List print jobs with optional filters.
 */
async function listPrintJobs(params = {}) {
  const query = new URLSearchParams(params).toString();
  return luluFetch(`/print-jobs/${query ? '?' + query : ''}`);
}

/**
 * Verify a Lulu webhook signature (HMAC-SHA256).
 *
 * @param {string|Buffer} rawBody — raw request body
 * @param {string} signature      — value of Lulu-HMAC-SHA256 header
 * @returns {boolean}
 */
function verifyWebhook(rawBody, signature) {
  const crypto = require('crypto');
  const secret = process.env.LULU_CLIENT_SECRET;
  if (!secret || !signature) return false;

  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(typeof rawBody === 'string' ? rawBody : rawBody);
  const expected = hmac.digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(expected, 'hex'),
    Buffer.from(signature, 'hex')
  );
}

// ================================================================
// Exports
// ================================================================

module.exports = {
  isConfigured,
  getBaseUrl,
  buildPodPackageId,
  calculateCost,
  createPrintJob,
  getPrintJob,
  getPrintJobStatus,
  cancelPrintJob,
  getPrintJobCosts,
  listPrintJobs,
  verifyWebhook,
  TRIM_CODES,
};
