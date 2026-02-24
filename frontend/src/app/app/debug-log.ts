/**
 * Lightweight debug logger for compile diagnostics.
 * Logs are buffered and flushed to /api/debug/ingest in batches.
 * Each page load gets a unique sessionId.
 */

const SESSION_ID =
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36)

const buffer: Array<{ tag: string; msg: string; data?: Record<string, unknown> }> = []
let flushTimer: ReturnType<typeof setTimeout> | null = null

function scheduleFlush() {
  if (flushTimer) return
  flushTimer = setTimeout(flush, 2000)
}

async function flush() {
  flushTimer = null
  if (buffer.length === 0) return
  const entries = buffer.splice(0, 50)
  try {
    await fetch('/api/debug/ingest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: SESSION_ID, entries }),
    })
  } catch {
    // Network failure — re-queue entries (drop if too many)
    if (buffer.length < 150) buffer.unshift(...entries)
  }
}

/**
 * Log a debug entry. Also writes to console for DevTools visibility.
 */
export function debugLog(tag: string, msg: string, data?: Record<string, unknown>) {
  const entry = { tag, msg, data }
  console.log(`[pp:${tag}]`, msg, data ?? '')
  buffer.push(entry)
  scheduleFlush()
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
