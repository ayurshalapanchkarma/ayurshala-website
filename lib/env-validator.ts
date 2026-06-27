/**
 * Environment Variable Validation
 * Ensures all required env vars exist and validates security settings
 */

export interface EnvConfig {
  // Application
  NODE_ENV: 'development' | 'staging' | 'production'
  NEXT_PUBLIC_SITE_URL: string

  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: string
  SUPABASE_SERVICE_ROLE_KEY: string

  // Security
  JWT_SECRET: string
  CSRF_TOKEN_SECRET: string
  SESSION_ENCRYPTION_KEY: string

  // Optional: AI
  OPENAI_API_KEY?: string
  ANTHROPIC_API_KEY?: string

  // Optional: Integrations
  SMTP_HOST?: string
  SMTP_PORT?: string
  SMTP_USER?: string
  SMTP_PASSWORD?: string
  WHATSAPP_API_KEY?: string
  SMS_API_KEY?: string

  // Payment (if used)
  RAZORPAY_KEY_ID?: string
  RAZORPAY_KEY_SECRET?: string
}

export function validateEnv(): EnvConfig {
  const required = [
    'NODE_ENV',
    'NEXT_PUBLIC_SITE_URL',
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'JWT_SECRET',
    'CSRF_TOKEN_SECRET',
    'SESSION_ENCRYPTION_KEY',
  ]

  const missing = required.filter((key) => !process.env[key])

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
  }

  // Validate security keys length
  const securityKeys = {
    JWT_SECRET: process.env.JWT_SECRET!,
    CSRF_TOKEN_SECRET: process.env.CSRF_TOKEN_SECRET!,
    SESSION_ENCRYPTION_KEY: process.env.SESSION_ENCRYPTION_KEY!,
  }

  for (const [key, value] of Object.entries(securityKeys)) {
    if (value.length < 32) {
      throw new Error(`${key} must be at least 32 characters (got ${value.length})`)
    }
  }

  // Validate URLs
  try {
    new URL(process.env.NEXT_PUBLIC_SITE_URL!)
    new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!)
  } catch (e) {
    throw new Error(`Invalid URL in environment variables: ${(e as Error).message}`)
  }

  // Validate NODE_ENV
  if (!['development', 'staging', 'production'].includes(process.env.NODE_ENV!)) {
    throw new Error(`NODE_ENV must be one of: development, staging, production`)
  }

  // In production, enforce HTTPS
  if (process.env.NODE_ENV === 'production' && !process.env.NEXT_PUBLIC_SITE_URL!.startsWith('https://')) {
    throw new Error('NEXT_PUBLIC_SITE_URL must use HTTPS in production')
  }

  return {
    NODE_ENV: process.env.NODE_ENV as 'development' | 'staging' | 'production',
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL!,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY!,
    JWT_SECRET: process.env.JWT_SECRET!,
    CSRF_TOKEN_SECRET: process.env.CSRF_TOKEN_SECRET!,
    SESSION_ENCRYPTION_KEY: process.env.SESSION_ENCRYPTION_KEY!,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: process.env.SMTP_PORT,
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASSWORD: process.env.SMTP_PASSWORD,
    WHATSAPP_API_KEY: process.env.WHATSAPP_API_KEY,
    SMS_API_KEY: process.env.SMS_API_KEY,
    RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID,
    RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET,
  }
}

// Validate on module import
export const env = validateEnv()
