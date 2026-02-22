/**
 * Manuscript Store — IndexedDB-backed storage for manuscript text.
 *
 * localStorage has a hard 5MB limit across ALL keys. A 100k-word novel
 * is ~600KB, and with prefs, title, and other state, heavy users will
 * hit QuotaExceededError. IndexedDB allows gigabytes of storage.
 *
 * Preferences (template, page size, etc.) remain in localStorage because
 * they're tiny and benefit from synchronous reads on mount.
 *
 * Uses idb-keyval (600 bytes) for a simple get/set API over IndexedDB.
 */

import { get, set, del, createStore } from 'idb-keyval'

const store = createStore('pageperfect-db', 'manuscripts')

const MS_KEY = 'pp-manuscript-v1'
const TITLE_KEY = 'pp-title-v1'

// ── Migration: move data from localStorage to IndexedDB on first use ──

let migrated = false

async function migrateFromLocalStorage(): Promise<void> {
  if (migrated) return
  migrated = true

  try {
    const existingMs = await get<string>(MS_KEY, store)
    if (existingMs) return // already in IndexedDB — skip migration

    // Check localStorage for legacy data
    const legacyMs = localStorage.getItem(MS_KEY)
    const legacyTitle = localStorage.getItem(TITLE_KEY)

    if (legacyMs) {
      await set(MS_KEY, legacyMs, store)
      localStorage.removeItem(MS_KEY)
    }
    if (legacyTitle) {
      await set(TITLE_KEY, legacyTitle, store)
      localStorage.removeItem(TITLE_KEY)
    }
  } catch {
    // IndexedDB unavailable (private browsing, etc.) — fall back silently
  }
}

// ── Public API ──

export async function loadManuscript(): Promise<{ manuscript: string | null; title: string | null }> {
  try {
    await migrateFromLocalStorage()
    const [manuscript, title] = await Promise.all([
      get<string>(MS_KEY, store),
      get<string>(TITLE_KEY, store),
    ])
    return { manuscript: manuscript ?? null, title: title ?? null }
  } catch {
    // Fallback to localStorage if IndexedDB is unavailable
    return {
      manuscript: localStorage.getItem(MS_KEY),
      title: localStorage.getItem(TITLE_KEY),
    }
  }
}

export async function saveManuscript(manuscript: string, title: string): Promise<void> {
  try {
    await Promise.all([
      set(MS_KEY, manuscript, store),
      set(TITLE_KEY, title, store),
    ])
  } catch {
    // Last-resort fallback to localStorage
    try {
      localStorage.setItem(MS_KEY, manuscript)
      localStorage.setItem(TITLE_KEY, title)
    } catch {
      // QuotaExceededError — both storage backends full
    }
  }
}

export async function clearManuscript(): Promise<void> {
  try {
    await Promise.all([del(MS_KEY, store), del(TITLE_KEY, store)])
  } catch {
    // ignore
  }
}
