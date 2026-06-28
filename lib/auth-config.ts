/**
 * Authentication Configuration
 * DEPRECATED: Use lib/url.ts instead for centralized URL configuration
 * This file kept for backward compatibility during migration
 */

import { getBaseUrl, getAuthCallbackUrl as getAuthCallbackUrlFromUrl } from './url'

export function getAppUrl(): string {
  return getBaseUrl()
}

export function getSiteUrl(): string {
  return getBaseUrl()
}

export function getAuthCallbackUrl(path: string = '/auth/callback'): string {
  return getAuthCallbackUrlFromUrl(path)
}

export function getOAuthRedirectUrl(nextPath: string = ''): string {
  const baseUrl = getBaseUrl()
  const callback = `${baseUrl}/auth/callback`
  return nextPath ? `${callback}?next=${encodeURIComponent(nextPath)}` : callback
}
