/**
 * Centralized URL helpers for all auth, redirects, and links
 * Single source of truth for domain configuration
 * 
 * Rules:
 * - Production: uses NEXT_PUBLIC_SITE_URL (must be https://ayurshalapanchakarma.com)
 * - Development: http://localhost:3000
 * - Never use app.ayurshalapanchakarma.com, dev.*, staging.*
 * - Throws error if NEXT_PUBLIC_SITE_URL missing in production
 */

export function getBaseUrl(): string {
  // Development
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3000'
  }

  // Production - must use environment variable
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL

  if (!siteUrl) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'NEXT_PUBLIC_SITE_URL environment variable is required in production'
      )
    }
    return 'http://localhost:3000'
  }

  // Validate production URL uses https
  if (process.env.NODE_ENV === 'production' && !siteUrl.startsWith('https://')) {
    throw new Error('NEXT_PUBLIC_SITE_URL must use HTTPS in production')
  }

  // Validate no invalid subdomains
  if (
    siteUrl.includes('app.ayurshalapanchakarma.com') ||
    siteUrl.includes('dev.ayurshalapanchakarma.com') ||
    siteUrl.includes('staging.ayurshalapanchakarma.com')
  ) {
    throw new Error(
      `Invalid domain in NEXT_PUBLIC_SITE_URL: ${siteUrl}. Use only ayurshalapanchakarma.com (with or without www)`
    )
  }

  return siteUrl
}

export function getAuthCallbackUrl(path: string = '/auth/callback'): string {
  const baseUrl = getBaseUrl()
  // Ensure no double slashes
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  return `${baseUrl}${cleanPath}`
}

export function getBookingUrl(bookingId?: string): string {
  const baseUrl = getBaseUrl()
  if (bookingId) {
    return `${baseUrl}/book/${bookingId}`
  }
  return `${baseUrl}/book`
}

export function getLoginUrl(role?: 'admin' | 'patient'): string {
  const baseUrl = getBaseUrl()
  if (role === 'admin') {
    return `${baseUrl}/admin/login`
  }
  if (role === 'patient') {
    return `${baseUrl}/login`
  }
  return `${baseUrl}/login`
}

export function getDashboardUrl(section?: string): string {
  const baseUrl = getBaseUrl()
  if (section) {
    return `${baseUrl}/dashboard/${section}`
  }
  return `${baseUrl}/dashboard`
}
