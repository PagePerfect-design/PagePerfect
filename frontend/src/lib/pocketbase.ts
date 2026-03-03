import PocketBase from 'pocketbase'

const pocketbaseUrl = (process.env.NEXT_PUBLIC_POCKETBASE_URL ?? '').trim()

function isValidHttpUrl(s: string): boolean {
  try {
    const url = new URL(s)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

export const isPocketBaseConfigured = !!(isValidHttpUrl(pocketbaseUrl))

let _pb: PocketBase | null = null

export function createClient(): PocketBase {
  if (!isPocketBaseConfigured) {
    throw new Error(
      'PocketBase is not configured. Set NEXT_PUBLIC_POCKETBASE_URL (must be a valid https:// URL).',
    )
  }
  // Reuse the singleton so authStore state persists across calls
  if (!_pb) {
    _pb = new PocketBase(pocketbaseUrl)
  }
  return _pb
}

// Legacy alias used by NavAuth and other components
export const isSupabaseConfigured = isPocketBaseConfigured
