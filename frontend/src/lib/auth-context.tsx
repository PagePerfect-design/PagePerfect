'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import type { RecordModel } from 'pocketbase'
import { createClient, isPocketBaseConfigured } from './pocketbase'
import type { Tier } from './database.types'
import { purgeUserManuscripts } from './use-manuscript'

type Profile = {
  id: string
  email: string
  display_name: string | null
  tier: Tier
  publisher_window_end: string | null
}

type AuthState = {
  user: RecordModel | null
  session: { token: string } | null
  profile: Profile | null
  loading: boolean
  tier: Tier
  publisherWindowEnd: string | null
  hasActiveWindow: boolean
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>
  signInWithOAuth: (provider: 'google' | 'github') => Promise<void>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: Error | null }>
  updatePassword: (newPassword: string) => Promise<{ error: Error | null }>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthState | undefined>(undefined)

function userToProfile(user: RecordModel): Profile {
  return {
    id: user.id,
    email: user.email,
    display_name: user.display_name ?? user.name ?? null,
    tier: (user.tier as Tier) || 'drafter',
    publisher_window_end: (user.publisher_window_end as string) ?? null,
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<RecordModel | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const syncUser = useCallback(() => {
    if (!isPocketBaseConfigured) return
    const pb = createClient()
    if (pb.authStore.isValid && pb.authStore.record) {
      const record = pb.authStore.record
      setUser(record)
      setProfile(userToProfile(record))
    } else {
      setUser(null)
      setProfile(null)
    }
  }, [])

  // Re-fetch the user record from PocketBase to get fresh data (credits, tier)
  const refreshUser = useCallback(async () => {
    if (!isPocketBaseConfigured) return
    const pb = createClient()
    if (!pb.authStore.isValid || !pb.authStore.record) return
    try {
      const fresh = await pb.collection('users').authRefresh()
      setUser(fresh.record)
      setProfile(userToProfile(fresh.record))
    } catch {
      // Token expired or invalid — clear auth
      pb.authStore.clear()
      setUser(null)
      setProfile(null)
    }
  }, [])

  useEffect(() => {
    if (!isPocketBaseConfigured) {
      setLoading(false)
      return
    }

    const pb = createClient()

    // Hydrate from stored auth
    syncUser()
    setLoading(false)

    // Listen for auth store changes
    const unsubscribe = pb.authStore.onChange(() => {
      syncUser()
    })

    return () => unsubscribe()
  }, [syncUser])

  async function signIn(email: string, password: string) {
    if (!isPocketBaseConfigured) return { error: new Error('Auth not configured') }
    const pb = createClient()
    try {
      await pb.collection('users').authWithPassword(email, password)
      syncUser()
      return { error: null }
    } catch (err) {
      return { error: err as Error }
    }
  }

  async function signUp(email: string, password: string) {
    if (!isPocketBaseConfigured) return { error: new Error('Auth not configured') }
    const pb = createClient()
    try {
      await pb.collection('users').create({
        email,
        password,
        passwordConfirm: password,
        tier: 'drafter',
      })
      return { error: null }
    } catch (err) {
      return { error: err as Error }
    }
  }

  async function signInWithOAuth(provider: 'google' | 'github') {
    if (!isPocketBaseConfigured) return
    const pb = createClient()
    await pb.collection('users').authWithOAuth2({ provider })
    syncUser()
  }

  async function signOut() {
    if (!isPocketBaseConfigured) return
    // Purge server-side manuscripts before clearing auth (needs valid token)
    const userId = user?.id
    if (userId) {
      await purgeUserManuscripts(userId)
    }
    const pb = createClient()
    pb.authStore.clear()
    setUser(null)
    setProfile(null)
  }

  async function resetPassword(email: string) {
    if (!isPocketBaseConfigured) return { error: new Error('Auth not configured') }
    const pb = createClient()
    try {
      await pb.collection('users').requestPasswordReset(email)
      return { error: null }
    } catch (err) {
      return { error: err as Error }
    }
  }

  async function updatePassword(newPassword: string) {
    if (!isPocketBaseConfigured) return { error: new Error('Auth not configured') }
    const pb = createClient()
    if (!pb.authStore.record) return { error: new Error('Not authenticated') }
    try {
      await pb.collection('users').update(pb.authStore.record.id, {
        password: newPassword,
        passwordConfirm: newPassword,
      })
      return { error: null }
    } catch (err) {
      return { error: err as Error }
    }
  }

  const session = user ? { token: createClient().authStore.token } : null
  const baseTier: Tier = profile?.tier ?? 'drafter'
  const publisherWindowEnd = profile?.publisher_window_end ?? null
  const hasActiveWindow = publisherWindowEnd ? new Date(publisherWindowEnd) > new Date() : false
  // Active publisher window elevates drafter to publisher-level access
  const tier: Tier = (baseTier === 'drafter' && hasActiveWindow) ? 'publisher' : baseTier

  return (
    <AuthContext.Provider
      value={{ user, session, profile, loading, tier, publisherWindowEnd, hasActiveWindow, signIn, signUp, signInWithOAuth, signOut, resetPassword, updatePassword, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
