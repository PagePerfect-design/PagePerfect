'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'
import { createClient, isPocketBaseConfigured } from '@/lib/supabase'

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    if (!isPocketBaseConfigured) {
      setError('Authentication is not configured.')
      return
    }

    setLoading(true)
    const pb = createClient()

    try {
      if (token) {
        await pb.collection('users').confirmPasswordReset(token, password, confirmPassword)
      } else if (pb.authStore.isValid && pb.authStore.record) {
        await pb.collection('users').update(pb.authStore.record.id, {
          password,
          passwordConfirm: password,
        })
      } else {
        setError('Missing reset token. Please request a new password reset link.')
        setLoading(false)
        return
      }

      setSuccess(true)
      setTimeout(() => router.push('/auth/login'), 2000)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Password reset failed'
      if (message.includes('expired') || message.includes('invalid')) {
        setError('This reset link has expired. Please request a new one.')
      } else {
        setError(message)
      }
    }
    setLoading(false)
  }

  if (success) {
    return (
      <div className="flex min-h-[calc(100dvh-4rem)] items-center justify-center px-6">
        <div className="w-full max-w-sm text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center border border-[#111111]/20">
            <svg className="h-6 w-6 text-[#16a34a]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1
            className="font-display font-bold tracking-tight text-[#111111]"
            style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)' }}
          >
            Password updated
          </h1>
          <p className="mt-2 font-body text-sm text-[#555555]">
            Your password has been reset. Redirecting you to sign in&hellip;
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
            Set a new password
          </h1>
          <p className="mt-2 font-body text-sm text-[#555555]">
            Enter your new password below.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="border border-[#dc2626]/20 bg-[#dc2626]/5 p-3 font-body text-sm text-[#dc2626]">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="password" className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.12em] text-[#111111]">
              New password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="min-h-[44px] w-full border border-[#111111]/20 bg-white px-3 py-2.5 font-body text-sm text-[#111111] transition-colors duration-75 placeholder:text-[#111111]/30 hover:border-[#111111]/40 focus:border-[#111111] focus:outline-none"
              placeholder="At least 8 characters"
              required
              minLength={8}
              autoComplete="new-password"
              autoFocus
            />
          </div>

          <div>
            <label htmlFor="confirm-password" className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.12em] text-[#111111]">
              Confirm new password
            </label>
            <input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="min-h-[44px] w-full border border-[#111111]/20 bg-white px-3 py-2.5 font-body text-sm text-[#111111] transition-colors duration-75 placeholder:text-[#111111]/30 hover:border-[#111111]/40 focus:border-[#111111] focus:outline-none"
              placeholder="Repeat your new password"
              required
              minLength={8}
              autoComplete="new-password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="min-h-[44px] w-full border border-[#FF3333] bg-[#FF3333] py-3 font-mono text-[11px] uppercase tracking-[0.1em] text-white transition-colors duration-75 hover:bg-[#E52222] disabled:opacity-50"
          >
            {loading ? 'Updating\u2026' : 'Update password'}
          </button>
        </form>

        <p className="mt-6 text-center font-body text-[12px] text-[#555555]">
          <Link href="/auth/login" className="underline transition-colors duration-75 hover:text-[#FF3333]">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-[calc(100dvh-4rem)] items-center justify-center">
        <div className="h-6 w-6 animate-spin border-2 border-[#FF3333] border-t-transparent" />
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  )
}
