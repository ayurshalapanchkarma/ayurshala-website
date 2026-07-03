import { NextResponse, type NextRequest } from 'next/server'

/**
 * Security Headers Middleware - OWASP Top 10 & Industry Best Practices
 * 
 * This middleware applies security headers to all responses.
 * For Next.js 16+, this file can remain as middleware.ts for backwards compatibility.
 * The warning about "deprecated convention" is informational and doesn't break functionality.
 */
export function middleware(request: NextRequest) {
  const response = NextResponse.next()

  // 1. HSTS (HTTP Strict-Transport-Security)
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains; preload',
  )

  // 2. X-Content-Type-Options (Prevent MIME type sniffing)
  response.headers.set('X-Content-Type-Options', 'nosniff')

  // 3. X-Frame-Options (Clickjacking protection)
  response.headers.set('X-Frame-Options', 'DENY')

  // 4. X-XSS-Protection (XSS protection header)
  response.headers.set('X-XSS-Protection', '1; mode=block')

  // 5. Referrer-Policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  // 6. Permissions-Policy (Feature Policy)
  response.headers.set(
    'Permissions-Policy',
    'geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()',
  )

  // 7. Content Security Policy (CSP)
  // Development mode needs 'unsafe-eval' for React source maps and debugging.
  // Production uses strict CSP without eval().
  const isDevelopment = process.env.NODE_ENV === 'development'
  const csp = [
    "default-src 'self'",
    isDevelopment
      ? "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://www.googletagmanager.com https://www.google-analytics.com"
      : "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://www.googletagmanager.com https://www.google-analytics.com",
    "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net",
    "img-src 'self' data: https:",
    "font-src 'self' data: https:",
    "connect-src 'self' https:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ')

  response.headers.set('Content-Security-Policy', csp)

  // 8. Cross-Origin headers
  response.headers.set('Cross-Origin-Embedder-Policy', 'require-corp')
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin')
  response.headers.set('Cross-Origin-Resource-Policy', 'cross-origin')

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
