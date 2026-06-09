# Google OAuth Setup - Supabase

## Problem
When clicking "Sign in with Google", user sees "Choose an account to continue to edwzyrdikttdxmphpvvp.supabase.co" instead of redirecting back to the app.

## Solution

### Step 1: Get Google OAuth Credentials
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create/select your project
3. Enable Google+ API
4. Create OAuth 2.0 credentials (Web application)
5. Note your **Client ID** and **Client Secret**

### Step 2: Configure in Supabase
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project: `edwzyrdikttdxmphpvvp`
3. Go to **Authentication > Providers > Google**
4. Enable Google
5. Paste **Client ID** and **Client Secret** from Google Cloud
6. **IMPORTANT**: In the "Redirect URL" section, add:
   - `https://edwzyrdikttdxmphpvvp.supabase.co/auth/v1/callback`
   - `https://ayurshalapanchakarma.com/auth/callback`

### Step 3: Configure in Google Cloud
1. Go back to Google Cloud Console OAuth 2.0 credentials
2. Edit the Web application
3. Add **Authorized redirect URIs**:
   - `https://edwzyrdikttdxmphpvvp.supabase.co/auth/v1/callback`
   - `https://ayurshalapanchakarma.com/auth/callback`

### Step 4: Test
1. Clear browser cache/cookies
2. Go to `https://ayurshalapanchakarma.com/book`
3. Click "Sign in with Google"
4. Should now redirect properly without "Choose an account" screen

## Why This Happens
- Supabase needs to know which URLs are allowed for OAuth redirects
- Google Cloud also validates that redirects are from authorized origins
- Without these configured, the auth session gets lost during the redirect

## Local Testing (Optional)
For localhost testing during development:
1. Add `http://localhost:3000/auth/callback` to both Google Cloud and Supabase
2. Update `.env.local`: `NEXT_PUBLIC_APP_URL=http://localhost:3000`
3. Restart dev server
