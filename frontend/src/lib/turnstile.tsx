'use client'

import { useCallback, useRef, useState } from 'react'
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile'

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

/**
 * Shared Turnstile hook for invisible bot protection.
 *
 * Returns a token (null until verified), a reset function,
 * and a <TurnstileWidget> component to render inside forms.
 *
 * If NEXT_PUBLIC_TURNSTILE_SITE_KEY is not set, the widget
 * is not rendered and the token stays null — forms work normally.
 */
export function useTurnstile() {
  const [token, setToken] = useState<string | null>(null)
  const ref = useRef<TurnstileInstance | null>(null)

  const resetToken = useCallback(() => {
    setToken(null)
    ref.current?.reset()
  }, [])

  function TurnstileWidget() {
    if (!SITE_KEY) return null

    return (
      <Turnstile
        ref={ref}
        siteKey={SITE_KEY}
        onSuccess={(t) => setToken(t)}
        onExpire={() => {
          setToken(null)
          ref.current?.reset()
        }}
        onError={() => setToken(null)}
        options={{
          size: 'invisible',
        }}
      />
    )
  }

  return {
    /** The one-time Turnstile token, or null if not yet verified / not configured */
    token,
    /** Reset the widget to generate a fresh token (call after form submission) */
    resetToken,
    /** Render this inside your form — invisible, zero layout impact */
    TurnstileWidget,
    /** Whether Turnstile is configured (site key present) */
    isConfigured: !!SITE_KEY,
  }
}
