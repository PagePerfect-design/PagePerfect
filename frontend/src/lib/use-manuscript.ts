'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createClient, isPocketBaseConfigured } from './pocketbase'
import type { ManuscriptRecord } from './database.types'

const MANUSCRIPT_KEY = 'pp-manuscript-v1'
const TITLE_KEY = 'pp-title-v1'
const MANUSCRIPT_ID_KEY = 'pp-manuscript-id-v1'
const MANUSCRIPT_USER_KEY = 'pp-manuscript-user-v1'

// Debounce interval for PocketBase saves (5s — less aggressive than localStorage)
const PB_SAVE_DEBOUNCE_MS = 5000

/**
 * Purge all manuscripts for a given user from PocketBase.
 *
 * Called on sign-out to honour the session-scoped storage contract:
 * manuscripts exist only for the duration of an active session. Once the
 * user signs out, server-side copies are deleted. The local IndexedDB
 * copy is intentionally kept so the user can resume after signing back in.
 */
export async function purgeUserManuscripts(userId: string): Promise<void> {
  if (!userId || !isPocketBaseConfigured) return
  try {
    const pb = createClient()
    const records = await pb.collection('manuscripts').getFullList({
      filter: `user = "${userId}"`,
      fields: 'id',
    })
    await Promise.allSettled(
      records.map((r) => pb.collection('manuscripts').delete(r.id))
    )
  } catch {
    // Best-effort — backend sweeper is the safety net
  }
  // Clear localStorage pointers (but NOT the IndexedDB manuscript content)
  try {
    localStorage.removeItem(MANUSCRIPT_ID_KEY)
    localStorage.removeItem(MANUSCRIPT_USER_KEY)
  } catch { /* ignore */ }
}

export type ManuscriptState = {
  id: string | null
  title: string
  content: string
  template: string
  pageSize: string
  marginPreset: string
  safeMode: boolean
}

export type ManuscriptListItem = {
  id: string
  title: string
  updated: string
}

export type LoadedManuscript = {
  id: string
  title: string
  content: string
  template: string
  pageSize: string
  marginPreset: string
  safeMode: boolean
}

type UseManuscriptReturn = {
  /** PocketBase record ID (null if not persisted yet) */
  manuscriptId: string | null
  /** Load a manuscript from PocketBase by ID — returns the record data */
  loadManuscript: (id: string) => Promise<LoadedManuscript | null>
  /** List user's manuscripts */
  listManuscripts: () => Promise<ManuscriptListItem[]>
  /** Save current state to PocketBase (debounced) */
  saveManuscript: (state: ManuscriptState) => void
  /** Force an immediate save (e.g., before navigation) */
  saveNow: (state: ManuscriptState) => Promise<void>
  /** Delete a manuscript */
  deleteManuscript: (id: string) => Promise<void>
  /** Start a new manuscript (clears manuscriptId) */
  newManuscript: () => void
  /** Whether a PocketBase save is in progress */
  saving: boolean
  /** Last save error, if any */
  saveError: string | null
}

/**
 * Hook for manuscript persistence.
 *
 * When the user is logged in and PocketBase is configured, manuscripts are
 * synced to the `manuscripts` collection. Anonymous users fall back to
 * localStorage (handled by CompileShell's existing logic).
 *
 * manuscriptId is persisted to localStorage so it survives page reloads.
 * This prevents duplicate records from being created on each session.
 *
 * @param userId — current user ID from useAuth(), or null for anonymous
 */
export function useManuscript(userId: string | null): UseManuscriptReturn {
  const [manuscriptId, setManuscriptIdRaw] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastSavedRef = useRef<string>('')

  // Wrap setManuscriptId to also persist to localStorage
  const setManuscriptId = useCallback((id: string | null) => {
    setManuscriptIdRaw(id)
    try {
      if (id) {
        localStorage.setItem(MANUSCRIPT_ID_KEY, id)
        if (userId) localStorage.setItem(MANUSCRIPT_USER_KEY, userId)
      } else {
        localStorage.removeItem(MANUSCRIPT_ID_KEY)
        localStorage.removeItem(MANUSCRIPT_USER_KEY)
      }
    } catch { /* ignore */ }
  }, [userId])

  // Restore manuscriptId from localStorage on mount (only if same user)
  useEffect(() => {
    if (!userId) return
    try {
      const storedUser = localStorage.getItem(MANUSCRIPT_USER_KEY)
      const storedId = localStorage.getItem(MANUSCRIPT_ID_KEY)
      if (storedId && storedUser === userId) {
        setManuscriptIdRaw(storedId)
      }
    } catch { /* ignore */ }
  }, [userId])

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [])

  const listManuscripts = useCallback(async (): Promise<ManuscriptListItem[]> => {
    if (!userId || !isPocketBaseConfigured) return []
    try {
      const pb = createClient()
      const result = await pb.collection('manuscripts').getList(1, 50, {
        filter: `user = "${userId}"`,
        sort: '-updated',
        fields: 'id,title,updated',
      })
      return result.items.map((r) => ({
        id: r.id,
        title: r.title || 'Untitled',
        updated: r.updated,
      }))
    } catch {
      return []
    }
  }, [userId])

  const loadManuscript = useCallback(async (id: string): Promise<LoadedManuscript | null> => {
    if (!isPocketBaseConfigured) return null
    try {
      const pb = createClient()
      const record = await pb.collection('manuscripts').getOne(id) as unknown as ManuscriptRecord
      setManuscriptId(record.id)
      // Also update localStorage as fallback
      try {
        localStorage.setItem(MANUSCRIPT_KEY, record.content)
        localStorage.setItem(TITLE_KEY, record.title)
      } catch { /* ignore */ }
      return {
        id: record.id,
        title: record.title,
        content: record.content,
        template: record.template,
        pageSize: record.page_size,
        marginPreset: record.margin_preset,
        safeMode: record.safe_mode,
      }
    } catch {
      setSaveError('Failed to load manuscript')
      return null
    }
  }, [setManuscriptId])

  const saveNow = useCallback(async (state: ManuscriptState) => {
    if (!userId || !isPocketBaseConfigured) return
    if (!state.content?.trim()) return

    // Avoid duplicate saves for identical content
    const fingerprint = `${state.title}:${state.content.length}:${state.template}:${state.pageSize}`
    if (fingerprint === lastSavedRef.current) return

    setSaving(true)
    setSaveError(null)
    try {
      const pb = createClient()
      const data = {
        user: userId,
        title: state.title || 'Untitled',
        content: state.content,
        template: state.template,
        page_size: state.pageSize,
        margin_preset: state.marginPreset,
        safe_mode: state.safeMode,
      }

      if (manuscriptId) {
        // Update existing
        await pb.collection('manuscripts').update(manuscriptId, data)
      } else {
        // Create new
        const record = await pb.collection('manuscripts').create(data)
        setManuscriptId(record.id)
      }
      lastSavedRef.current = fingerprint
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }, [userId, manuscriptId, setManuscriptId])

  const saveManuscript = useCallback((state: ManuscriptState) => {
    if (!userId || !isPocketBaseConfigured) return
    // Debounce PocketBase saves
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      saveNow(state)
    }, PB_SAVE_DEBOUNCE_MS)
  }, [userId, saveNow])

  const deleteManuscript = useCallback(async (id: string) => {
    if (!isPocketBaseConfigured) return
    try {
      const pb = createClient()
      await pb.collection('manuscripts').delete(id)
      if (manuscriptId === id) setManuscriptId(null)
    } catch {
      setSaveError('Failed to delete manuscript')
    }
  }, [manuscriptId, setManuscriptId])

  const newManuscript = useCallback(() => {
    setManuscriptId(null)
    lastSavedRef.current = ''
  }, [setManuscriptId])

  return {
    manuscriptId,
    loadManuscript,
    listManuscripts,
    saveManuscript,
    saveNow,
    deleteManuscript,
    newManuscript,
    saving,
    saveError,
  }
}
