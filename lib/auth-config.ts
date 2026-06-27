/**
 * Authentication Configuration
 * Returns environment-specific URLs based on NODE_ENV and current origin
 * Never hardcodes production URLs in code
 */

export function getAppUrl(): string {
  // Server-side: use environment variable
  if (typeof window === 'undefined') {
    return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  }

  // Client-side: use window.location.origin
  const origin = window.location.origin

  // Never redirect localhost to production
  if (origin.includes('localhost')) {
    return 'http://localhost:3000'
  }

  // Development domains
  if (origin.includes('dev.ayurshalapanchakarma.com')) {
    return 'https://dev.ayurshalapanchakarma.com'
  }

  // Staging domains
  if (origin.includes('staging.ayurshalapanchakarma.com')) {
    return 'https://staging.ayurshalapanchakarma.com'
  }

  // Production domains
  if (origin.includes('app.ayurshalapanchakarma.com') || origin.includes('ayurshalapanchakarma.com')) {
    return 'https://app.ayurshalapanchakarma.com'
  }

  // Fallback to environment variable
  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
}

export function getSiteUrl(): string {
  // Server-side
  if (typeof window === 'undefined') {
    return process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  }

  // Client-side: use origin
  const origin = window.location.origin

  // Never redirect localhost to production
  if (origin.includes('localhost')) {
    return 'http://localhost:3000'
  }

  // Development domains
  if (origin.includes('dev.')) {
    return 'https://dev.ayurshalapanchakarma.com'
  }

  // Staging domains
  if (origin.includes('staging.')) {
    return 'https://staging.ayurshalapanchakarma.com'
  }

  // Production domains
  if (origin.includes('app.') || origin.includes('ayurshalapanchakarma.com')) {
    return 'https://app.ayurshalapanchakarma.com'
  }

  return origin
}

/**
 * Get redirect URL for auth callback
 * Always uses the current environment's domain
 */
export function getAuthCallbackUrl(path: string = '/auth/callback'): string {
  const appUrl = getAppUrl()
  return `${appUrl}${path}`
}

/**
 * Get OAuth redirect URL
 * For use in Supabase signInWithOAuth
 */
export function getOAuthRedirectUrl(nextPath: string = ''): string {
  const appUrl = getAppUrl()
  const callback = `${appUrl}/auth/callback`
  return nextPath ? `${callback}?next=${encodeURIComponent(nextPath)}` : callback
}
