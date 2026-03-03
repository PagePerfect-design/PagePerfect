'use client'

import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { isPocketBaseConfigured } from '@/lib/supabase'

export default function NavAuth() {
  const { user, profile, loading, signOut } = useAuth()

  // Don't show auth UI when PocketBase isn't configured
  if (!isPocketBaseConfigured) return null

  if (loading) {
    return <div className="h-8 w-20 animate-pulse rounded-full bg-surface-subtle" />
  }

  if (!user) {
    return (
      <Link
        href="/auth/login"
        className="text-sm text-text-secondary transition-colors hover:text-text-primary focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
      >
        Sign in
      </Link>
    )
  }

  const displayName = profile?.display_name || user.email?.split('@')[0] || 'Account'
  const tierLabel = profile?.tier === 'studio' ? 'Studio' : profile?.tier === 'publisher' ? 'Pro' : ''

  return (
    <div className="flex items-center gap-3">
      {tierLabel && (
        <span className="rounded-full bg-accent/10 px-2.5 py-0.5 font-mono text-[11px] font-semibold tracking-wide text-accent uppercase">
          {tierLabel}
        </span>
      )}
      <div className="group relative">
        <button
          className="flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-sm text-text-secondary transition-colors hover:border-border-visible hover:text-text-primary focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent/15 font-display text-xs font-bold text-accent">
            {displayName.charAt(0).toUpperCase()}
          </span>
          <span className="max-w-[100px] truncate">{displayName}</span>
        </button>
        <div className="invisible absolute right-0 top-full z-50 mt-2 w-48 rounded-xl border border-border bg-surface-raised p-1 opacity-0 shadow-elevated transition-all group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
          <div className="border-b border-border px-3 py-2">
            <p className="truncate text-xs text-text-tertiary">{user.email}</p>
          </div>
          <button
            onClick={() => void signOut()}
            className="mt-1 w-full rounded-lg px-3 py-2 text-left text-sm text-text-secondary transition-colors hover:bg-surface-subtle hover:text-text-primary"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  )
}
