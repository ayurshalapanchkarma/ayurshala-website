/**
 * DEPRECATED: Use lib/url.ts instead
 * Kept for backward compatibility only
 */

import { getBaseUrl } from './url'

export function getAppUrl(): string {
  return getBaseUrl()
}

export function getSiteUrl(): string {
  return getBaseUrl()
}

export function getAuthCallbackUrl(path: string = '/auth/callback'): string {
  const baseUrl = getBaseUrl()
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  return `${baseUrl}${cleanPath}`
}

export function getOAuthRedirectUrl(nextPath: string = ''): string {
  const baseUrl = getBaseUrl()
  const callback = `${baseUrl}/auth/callback`
  return nextPath ? `${callback}?next=${encodeURIComponent(nextPath)}` : callback
}
