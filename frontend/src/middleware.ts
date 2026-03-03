import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64')

  // Nonce-based CSP: eliminates 'unsafe-inline' from script-src.
  // 'strict-dynamic' allows nonced scripts to load child scripts (covers Stripe.js, Next.js chunks).
  // 'unsafe-inline' in style-src is required by Tailwind and React inline styles.
  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://js.stripe.com`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' https://fonts.gstatic.com",
    "connect-src 'self' https://pb.pageperfect.studio https://api.stripe.com",
    "frame-src 'self' blob: https://js.stripe.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'self'",
    "upgrade-insecure-requests",
  ].join('; ')

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-nonce', nonce)

  const response = NextResponse.next({ request: { headers: requestHeaders } })
  response.headers.set('Content-Security-Policy', csp)

  return response
}

export const config = {
  matcher: [
    // Match all routes except static files and API proxy
    { source: '/((?!api|_next/static|_next/image|favicon\\.ico|favicon\\.svg|favicon-.*\\.png|apple-touch-icon\\.png|android-chrome-.*\\.png|manifest\\.webmanifest).*)', },
  ],
}
