# Domain Configuration Fix - Archive

**Status**: DEPRECATED - See latest implementation in `lib/url.ts`

This file documents the domain configuration overhaul that removed invalid subdomains:
- ~~app.ayurshalapanchakarma.com~~
- ~~dev.ayurshalapanchakarma.com~~
- ~~staging.ayurshalapanchakarma.com~~

## Current Configuration (June 28, 2026)

**Production Domain**: `https://ayurshalapanchakarma.com` (only valid domain)
**Development**: `http://localhost:3000`
**Environment Variable**: `NEXT_PUBLIC_SITE_URL`

All authentication, redirects, and metadata now use centralized `lib/url.ts` helper.

See `lib/url.ts` for implementation details.
