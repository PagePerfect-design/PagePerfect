/**
 * Lightweight debug logger for compile diagnostics.
 * In development, logs are buffered and POSTed to /api/debug/ingest in
 * batches for server-side correlation. In production, the backend
 * returns 404 on that endpoint by design — so we skip the network call
 * entirely and the logger reduces to a console.log shim.
 * Each page load gets a unique sessionId.
 */

const IS_DEV = process.env.NODE_ENV !== 'production'

const SESSION_ID =
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36)

const buffer: Array<{ tag: string; msg: string; data?: Record<string, unknown> }> = []
let flushTimer: ReturnType<typeof setTimeout> | null = null

function scheduleFlush() {
  if (!IS_DEV) return
  if (flushTimer) return
  flushTimer = setTimeout(flush, 2000)
}

async function flush() {
  flushTimer = null
  if (!IS_DEV) {
    buffer.length = 0
    return
  }
  if (buffer.length === 0) return
  const entries = buffer.splice(0, 50)
  try {
    await fetch('/api/debug/ingest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: SESSION_ID, entries }),
    })
  } catch {
    if (buffer.length < 150) buffer.unshift(...entries)
  }
}

/**
 * Log a debug entry. Also writes to console for DevTools visibility.
 */
export function debugLog(tag: string, msg: string, data?: Record<string, unknown>) {
  const entry = { tag, msg, data }
  if (IS_DEV) {
    console.log(`[pp:${tag}]`, msg, data ?? '')
    buffer.push(entry)
    scheduleFlush()
  }
}

/**
 * Force-flush any buffered entries (e.g., before navigation).
 */
export function debugFlush() {
  if (flushTimer) {
    clearTimeout(flushTimer)
    flushTimer = null
  }
  void flush()
}

export { SESSION_ID as debugSessionId }
