import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * OAuth callback handler.
 *
 * PocketBase's JS SDK handles OAuth2 via a popup flow — the SDK opens a
 * provider window, receives the code, and exchanges it client-side. This
 * route exists as a fallback redirect target. If someone lands here
 * directly, we send them to /app.
 */
export async function GET(request: Request) {
  const { origin } = new URL(request.url)
  return NextResponse.redirect(`${origin}/app`)
}
