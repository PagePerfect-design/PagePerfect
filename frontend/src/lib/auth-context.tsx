'use client'

import { createContext, useContext, useEffect, useState, useMemo } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { createClient, isSupabaseConfigured } from './supabase'
import type { Tier } from './database.types'

type Profile = {
  id: string
  email: string
  display_name: string | null
  tier: Tier
}

type AuthState = {
  user: User | null
  session: Session | null
  profile: Profile | null
  loading: boolean
  tier: Tier
  configured: boolean
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>
  signInWithOAuth: (provider: 'google' | 'github') => Promise<void>
  signOut: () => Promise<void>
}

const noop = async () => ({ error: null })
const noopVoid = async () => {}

const defaultState: AuthState = {
  user: null,
  session: null,
  profile: null,
  loading: false,
  tier: 'drafter',
  configured: false,
  signIn: noop,
  signUp: noop,
  signInWithOAuth: noopVoid,
  signOut: noopVoid,
}

const AuthContext = createContext<AuthState>(defaultState)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(isSupabaseConfigured)

  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    if (!supabase) return

    // Get initial session
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s)
      setUser(s?.user ?? null)
      if (s?.user) {
        void fetchProfile(s.user.id)
      }
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, s) => {
        setSession(s)
        setUser(s?.user ?? null)
        if (s?.user) {
          void fetchProfile(s.user.id)
        } else {
          setProfile(null)
        }
      },
    )

    return () => subscription.unsubscribe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase])

  async function fetchProfile(userId: string) {
    if (!supabase) return
    const { data } = await supabase
      .from('profiles')
      .select('id, email, display_name, tier')
      .eq('id', userId)
      .single()

    if (data) {
      setProfile(data as Profile)
    }
  }

  async function signIn(email: string, password: string) {
    if (!supabase) return { error: new Error('Auth not configured') }
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error as Error | null }
  }

  async function signUp(email: string, password: string) {
    if (!supabase) return { error: new Error('Auth not configured') }
    const { error } = await supabase.auth.signUp({ email, password })
    return { error: error as Error | null }
  }

  async function signInWithOAuth(provider: 'google' | 'github') {
    if (!supabase) return
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  async function signOut() {
    if (!supabase) return
    await supabase.auth.signOut()
    setProfile(null)
  }

  const tier: Tier = profile?.tier ?? 'drafter'

  return (
    <AuthContext.Provider
      value={{
        user, session, profile, loading, tier,
        configured: isSupabaseConfigured,
        signIn, signUp, signInWithOAuth, signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
