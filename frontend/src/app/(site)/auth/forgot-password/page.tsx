'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Suspense } from 'react'
import { useAuth } from '@/lib/auth-context'

function ForgotPasswordForm() {
  const { resetPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error: err } = await resetPassword(email)

    if (err) {
      setError(err.message)
    } else {
      setSent(true)
    }
    setLoading(false)
  }

  if (sent) {
    return (
      <div className="flex min-h-[calc(100dvh-4rem)] items-center justify-center px-6">
        <div className="w-full max-w-sm text-center">
          <div className="mb-6">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center border border-[#111111]/20">
              <svg className="h-6 w-6 text-[#111111]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
            </div>
            <h1
              className="font-display font-bold tracking-tight text-[#111111]"
              style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)' }}
            >
              Check your email
            </h1>
            <p className="mt-2 font-body text-sm text-[#555555]">
              We sent a password reset link to <strong className="text-[#111111]">{email}</strong>.
              Click the link in the email to reset your password.
            </p>
          </div>

          <p className="mb-4 font-body text-[12px] text-[#555555]">
            Didn&apos;t receive the email? Check your spam folder or try again.
          </p>

          <button
            onClick={() => { setSent(false); setEmail('') }}
            className="font-mono text-[11px] text-[#FF3333] transition-colors duration-200 ease-pp hover:text-[#E52222]"
          >
            Try a different email
          </button>

          <p className="mt-6 font-body text-[12px] text-[#555555]">
            <Link href="/auth/login" className="underline transition-colors duration-200 ease-pp hover:text-[#FF3333]">
              Back to sign in
            </Link>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-[calc(100dvh-4rem)] items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1
            className="font-display font-bold tracking-tight text-[#111111]"
            style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)' }}
          >
            Reset your password
          </h1>
          <p className="mt-2 font-body text-sm text-[#555555]">
            Enter your email address and we&apos;ll send you a link to reset your password.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="border border-[#dc2626]/20 bg-[#dc2626]/5 p-3 font-body text-sm text-[#dc2626]">
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
              className="min-h-[44px] w-full border border-[#111111]/20 bg-white px-3 py-2.5 font-body text-sm text-[#111111] transition-colors duration-200 ease-pp placeholder:text-[#111111]/30 hover:border-[#111111]/40 focus:border-[#111111] focus:outline-none"
              placeholder="you@example.com"
              required
              autoComplete="email"
              autoFocus
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="min-h-[44px] w-full border border-[#FF3333] bg-[#FF3333] py-3 font-mono text-[11px] uppercase tracking-[0.1em] text-white transition-colors duration-200 ease-pp hover:bg-[#E52222] disabled:opacity-50"
          >
            {loading ? 'Sending\u2026' : 'Send reset link'}
          </button>
        </form>

        <p className="mt-6 text-center font-body text-sm text-[#555555]">
          Remember your password?{' '}
          <Link href="/auth/login" className="font-semibold text-[#FF3333] transition-colors duration-200 ease-pp hover:text-[#E52222]">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-[calc(100dvh-4rem)] items-center justify-center">
        <div className="h-6 w-6 animate-spin border-2 border-[#FF3333] border-t-transparent" />
      </div>
    }>
      <ForgotPasswordForm />
    </Suspense>
  )
}
