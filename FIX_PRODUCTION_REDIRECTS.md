# ARCHIVED - Domain Configuration Fix

**Superseded by**: `lib/url.ts` (June 28, 2026)

This document is archived. Current implementation uses centralized URL configuration.

## Migration Notes

All references to:
- `app.ayurshalapanchakarma.com`
- `dev.ayurshalapanchakarma.com`
- `staging.ayurshalapanchakarma.com`

...have been removed from production code. These invalid subdomains are only referenced in legacy documentation.

## Current Configuration

- **Production Domain**: `https://ayurshalapanchakarma.com`
- **Environment Variable**: `NEXT_PUBLIC_SITE_URL`
- **Centralized Helper**: `lib/url.ts`

See `DOMAIN_FIX_ARCHIVE.md` for historical context.
