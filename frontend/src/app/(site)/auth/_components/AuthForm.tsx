'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { useTurnstile } from '@/lib/turnstile'

type Mode = 'login' | 'signup'

export function AuthForm({ initialMode }: { initialMode: Mode }) {
  const { signIn, signUp, signInWithOAuth } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(
    searchParams.get('error') === 'auth_failed' ? 'Authentication failed. Please try again.' : null,
  )
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<Mode>(initialMode)
  const { token: turnstileToken, resetToken, TurnstileWidget, isConfigured: turnstileConfigured } = useTurnstile()

  const next = searchParams.get('next') ?? '/app'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (turnstileConfigured && !turnstileToken) {
      setError('Verifying — please try again in a moment.')
      return
    }

    setLoading(true)

    const fn = mode === 'login' ? signIn : signUp
    const { error: err } = await fn(email, password)

    if (err) {
      setError(err.message)
      setLoading(false)
    } else {
      if (mode === 'signup') {
        setError(null)
        setLoading(false)
        setMode('login')
        resetToken()
        setError('Check your email to confirm your account, then sign in.')
      } else {
        router.push(next)
      }
    }
  }

  return (
    <div className="flex min-h-[calc(100dvh-4rem)] items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1
            className="font-display font-bold tracking-tight text-[#111111]"
            style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)' }}
          >
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </h1>
          <p className="mt-2 font-body text-sm text-[#4a4a4a]">
            {mode === 'login'
              ? 'Sign in to save manuscripts and access premium features.'
              : 'Free to start. Upgrade anytime.'}
          </p>
        </div>

        {/* OAuth buttons */}
        <div className="mb-6 space-y-3">
          <button
            onClick={() => signInWithOAuth('google')}
            className="flex min-h-[44px] w-full items-center justify-center gap-2.5 border border-[#111111]/20 bg-white px-5 py-3 font-mono text-[11px] uppercase tracking-[0.1em] text-[#111111] transition-colors duration-200 ease-pp hover:border-[#111111] hover:bg-[#f5f5f0]"
            type="button"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </button>
          <button
            onClick={() => signInWithOAuth('github')}
            className="flex min-h-[44px] w-full items-center justify-center gap-2.5 border border-[#111111]/20 bg-white px-5 py-3 font-mono text-[11px] uppercase tracking-[0.1em] text-[#111111] transition-colors duration-200 ease-pp hover:border-[#111111] hover:bg-[#f5f5f0]"
            type="button"
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
            Continue with GitHub
          </button>
        </div>

        {/* Divider */}
        <div className="mb-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-[#e5e5e0]" />
          <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#111111]/40">or</span>
          <div className="h-px flex-1 bg-[#e5e5e0]" />
        </div>

        {/* Email/password form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div id="form-error" role="alert" className="border border-[#dc2626]/20 bg-[#dc2626]/5 p-3 font-body text-sm text-[#dc2626]">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.12em] text-[#111111]">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-describedby={error ? 'form-error' : undefined}
              className="min-h-[44px] w-full border border-[#111111]/20 bg-white px-3 py-2.5 font-body text-sm text-[#111111] transition-colors duration-200 ease-pp placeholder:text-[#111111]/30 hover:border-[#111111]/40 focus:border-[#111111] focus:outline-none"
              placeholder="you@example.com"
              required
              autoComplete="email"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.12em] text-[#111111]">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="min-h-[44px] w-full border border-[#111111]/20 bg-white px-3 py-2.5 font-body text-sm text-[#111111] transition-colors duration-200 ease-pp placeholder:text-[#111111]/30 hover:border-[#111111]/40 focus:border-[#111111] focus:outline-none"
              placeholder="At least 8 characters"
              required
              minLength={8}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
          </div>

          <TurnstileWidget />

          <button
            type="submit"
            disabled={loading}
            className="min-h-[44px] w-full border border-[#FF3333] bg-[#FF3333] py-3 font-mono text-[11px] uppercase tracking-[0.1em] text-white transition-colors duration-200 ease-pp hover:bg-[#E52222] disabled:opacity-50"
          >
            {loading ? 'Please wait…' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        {mode === 'login' && (
          <p className="mt-3 text-center">
            <Link href="/auth/forgot-password" className="font-body text-[12px] text-[#4a4a4a] transition-colors duration-200 ease-pp hover:text-[#FF3333]">
              Forgot your password?
            </Link>
          </p>
        )}

        <p className="mt-6 text-center font-body text-sm text-[#4a4a4a]">
          {mode === 'login' ? (
            <>
              Don&apos;t have an account?{' '}
              <Link
                href="/auth/signup"
                className="font-semibold text-[#FF3333] transition-colors duration-200 ease-pp hover:text-[#E52222]"
              >
                Sign up
              </Link>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <Link
                href="/auth/login"
                className="font-semibold text-[#FF3333] transition-colors duration-200 ease-pp hover:text-[#E52222]"
              >
                Sign in
              </Link>
            </>
          )}
        </p>

        <p className="mt-4 text-center font-body text-[12px] text-[#4a4a4a]">
          <Link href="/app" className="underline transition-colors duration-200 ease-pp hover:text-[#FF3333]">
            Continue without an account
          </Link>
          {' '}&mdash; you can always sign up later.
        </p>
      </div>
    </div>
  )
}
