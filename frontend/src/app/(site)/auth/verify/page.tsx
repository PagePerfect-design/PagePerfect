'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'
import { createClient, isPocketBaseConfigured } from '@/lib/supabase'

type Status = 'loading' | 'success' | 'error'

function VerifyForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<Status>('loading')
  const [errorMsg, setErrorMsg] = useState('')

  const token = searchParams.get('token')
  const type = searchParams.get('type')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setErrorMsg('No verification token found. Please check your email link.')
      return
    }

    if (!isPocketBaseConfigured) {
      setStatus('error')
      setErrorMsg('Authentication is not configured.')
      return
    }

    const pb = createClient()

    async function verify() {
      try {
        if (type === 'email-change') {
          await pb.collection('users').confirmEmailChange(token!, '')
        } else {
          await pb.collection('users').confirmVerification(token!)
        }
        setStatus('success')
        setTimeout(() => router.push('/auth/login'), 3000)
      } catch (err: unknown) {
        setStatus('error')
        const message = err instanceof Error ? err.message : 'Verification failed'
        if (message.includes('expired') || message.includes('invalid')) {
          setErrorMsg('This link has expired or is invalid. Please request a new one.')
        } else {
          setErrorMsg(message)
        }
      }
    }

    verify()
  }, [token, type, router])

  if (status === 'loading') {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-6">
        <div className="w-full max-w-sm text-center">
          <div className="mx-auto w-12 h-12 flex items-center justify-center mb-4">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          </div>
          <h1 className="font-display text-2xl font-bold text-text-primary mb-2">
            {type === 'email-change' ? 'Confirming email change...' : 'Verifying your email...'}
          </h1>
          <p className="text-sm text-text-secondary">This will only take a moment.</p>
        </div>
      </div>
    )
  }

  if (status === 'success') {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-6">
        <div className="w-full max-w-sm text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-accent" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="font-display text-2xl font-bold text-text-primary mb-2">
            {type === 'email-change' ? 'Email updated' : 'Email verified'}
          </h1>
          <p className="text-sm text-text-secondary">
            {type === 'email-change'
              ? 'Your email address has been changed successfully.'
              : 'Your account is now active. Redirecting you to sign in...'}
          </p>

          <p className="mt-6 text-xs text-text-ghost">
            <Link href="/auth/login" className="underline hover:text-text-tertiary transition-colors">
              Go to sign in
            </Link>
          </p>
        </div>
      </div>
    )
  }

  // Error state
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-6">
      <div className="w-full max-w-sm text-center">
        <div className="mx-auto w-12 h-12 rounded-full bg-danger/10 flex items-center justify-center mb-4">
          <svg className="w-6 h-6 text-danger" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
        </div>
        <h1 className="font-display text-2xl font-bold text-text-primary mb-2">Verification failed</h1>
        <p className="text-sm text-text-secondary mb-6">{errorMsg}</p>

        <Link href="/auth/login" className="btn-pill btn-primary text-sm px-6 py-3">
          Back to sign in
        </Link>
      </div>
    </div>
  )
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    }>
      <VerifyForm />
    </Suspense>
  )
}
