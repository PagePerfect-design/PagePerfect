const log = require('../logger');

const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

/**
 * Express middleware that verifies a Cloudflare Turnstile token.
 *
 * Extracts the token from the `x-turnstile-token` header or `turnstileToken`
 * body field, then validates it against Cloudflare's siteverify endpoint.
 *
 * Graceful degradation:
 * - If TURNSTILE_SECRET_KEY is not set, passes through (dev mode).
 * - If Cloudflare's API is unreachable, passes through with a warning log.
 */
async function verifyTurnstile(req, res, next) {
  const secret = process.env.TURNSTILE_SECRET_KEY;

  // Dev mode: no secret configured → skip verification
  if (!secret) return next();

  const token = req.headers['x-turnstile-token'] || req.body?.turnstileToken;

  if (!token || typeof token !== 'string') {
    return res.status(403).json({
      error: 'turnstile_required',
      message: 'Verification required. Please refresh the page and try again.',
    });
  }

  try {
    const resp = await fetch(VERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret,
        response: token,
        remoteip: req.ip,
      }),
    });

    if (!resp.ok) {
      // Cloudflare API error — don't block legitimate users
      log.warn({ module: 'turnstile', status: resp.status }, 'Turnstile API returned non-OK status — passing through');
      return next();
    }

    const result = await resp.json();

    if (!result.success) {
      log.warn(
        { module: 'turnstile', ip: req.ip, errors: result['error-codes'] },
        'Turnstile verification failed',
      );
      return res.status(403).json({
        error: 'turnstile_failed',
        message: 'Verification failed. Please refresh the page and try again.',
      });
    }

    // Token verified — continue to route handler
    next();
  } catch (err) {
    // Network error reaching Cloudflare — don't block legitimate users
    log.warn({ module: 'turnstile', err: err.message }, 'Turnstile API unreachable — passing through');
    next();
  }
}

module.exports = { verifyTurnstile };
