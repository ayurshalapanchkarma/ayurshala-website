/**
 * Single source of truth for domain configuration
 * ONLY uses NEXT_PUBLIC_SITE_URL (required in production)
 */

export function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL!
}
