'use client'

import { useState, useRef, FormEvent } from 'react'

type FormState = 'idle' | 'sending' | 'sent' | 'error'

export function RequestFormatCard() {
  const [state, setState] = useState<FormState>('idle')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const honeypotRef = useRef<HTMLInputElement>(null)
  const timestampRef = useRef(Date.now())

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()

    // Honeypot: if the hidden field has a value, silently reject
    if (honeypotRef.current?.value) {
      setState('sent')
      return
    }

    // Time-based check: reject if submitted in under 2 seconds
    if (Date.now() - timestampRef.current < 2000) {
      setState('sent')
      return
    }

    // Basic client-side validation
    const trimmedEmail = email.trim()
    const trimmedMessage = message.trim()
    if (!trimmedEmail || !trimmedMessage) return

    // Simple email format check
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) return

    setState('sending')

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: trimmedEmail,
          message: trimmedMessage,
          _t: timestampRef.current,
        }),
      })

      if (res.ok) {
        setState('sent')
        setEmail('')
        setMessage('')
      } else {
        setState('error')
      }
    } catch {
      // If no backend route exists yet, fall back to mailto
      window.location.href = `mailto:support@pageperfect.studio?subject=${encodeURIComponent('Format Request')}&body=${encodeURIComponent(trimmedMessage)}`
      setState('sent')
    }
  }

  return (
    <div className="flex flex-col bg-white">
      {/* Header — matches template card structure */}
      <div className="flex items-baseline justify-between px-5 pt-5">
        <span className="font-mono text-[8px] uppercase tracking-[0.15em] text-[#111111]/25">
          Request
        </span>
        <span className="font-mono text-[8px] text-[#111111]/20">16</span>
      </div>

      <h3 className="px-5 pt-2 font-display text-lg font-bold tracking-tight text-[#111111] md:text-xl">
        Need a custom system?
      </h3>

      {/* Form area — replaces the specimen */}
      <div className="flex flex-1 flex-col px-5 pb-5 pt-3">
        {state === 'sent' ? (
          <div className="flex flex-1 flex-col items-start justify-center">
            <p className="font-display text-sm font-semibold text-[#111111]">
              Request received.
            </p>
            <p className="mt-1 font-body text-xs leading-relaxed text-[#111111]/50">
              We&rsquo;ll review your requirements and respond to your email.
            </p>
            <button
              type="button"
              onClick={() => {
                setState('idle')
                timestampRef.current = Date.now()
              }}
              className="mt-4 font-mono text-[8px] uppercase tracking-[0.1em] text-[#111111]/40 transition-colors hover:text-[#111111]"
            >
              Send another
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-2.5">
            {/* Honeypot — invisible to real users, irresistible to bots */}
            <div className="absolute left-[-9999px]" aria-hidden="true">
              <label htmlFor="rf-website">Website</label>
              <input
                ref={honeypotRef}
                type="text"
                id="rf-website"
                name="website"
                tabIndex={-1}
                autoComplete="off"
              />
            </div>

            <div>
              <label
                htmlFor="rf-email"
                className="font-mono text-[8px] uppercase tracking-[0.1em] text-[#111111]/30"
              >
                Email
              </label>
              <input
                id="rf-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="mt-0.5 block w-full border border-[#111111]/10 bg-transparent px-2.5 py-1.5 font-mono text-[11px] text-[#111111] placeholder:text-[#111111]/20 focus:border-[#111111] focus:outline-none"
              />
            </div>

            <div className="flex-1">
              <label
                htmlFor="rf-message"
                className="font-mono text-[8px] uppercase tracking-[0.1em] text-[#111111]/30"
              >
                Describe the format
              </label>
              <textarea
                id="rf-message"
                required
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="e.g. A5 poetry chapbook with French flaps..."
                className="mt-0.5 block w-full resize-none border border-[#111111]/10 bg-transparent px-2.5 py-1.5 font-mono text-[11px] leading-relaxed text-[#111111] placeholder:text-[#111111]/20 focus:border-[#111111] focus:outline-none"
              />
            </div>

            {state === 'error' && (
              <p className="font-mono text-[8px] text-[#FF3333]">
                Failed to send. Try{' '}
                <a
                  href="mailto:support@pageperfect.studio"
                  className="underline"
                >
                  support@pageperfect.studio
                </a>
              </p>
            )}

            <button
              type="submit"
              disabled={state === 'sending'}
              className="mt-auto w-full border border-[#111111] bg-transparent py-2 font-mono text-[10px] uppercase tracking-[0.1em] text-[#111111] transition-all duration-200 ease-pp hover:bg-[#111111] hover:text-white disabled:opacity-40"
            >
              {state === 'sending' ? 'Sending\u2026' : 'Request Format'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
