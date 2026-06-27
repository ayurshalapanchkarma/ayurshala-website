import crypto from 'crypto'
import { createHash } from 'crypto'

/**
 * CSRF Token Generation & Validation
 */
export const csrf = {
  generate: () => crypto.randomBytes(32).toString('hex'),

  validate: (token: string, sessionToken: string): boolean => {
    if (!token || !sessionToken) return false
    return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(sessionToken))
  },
}

/**
 * Input Sanitization & Validation
 */
export const sanitize = {
  // Remove HTML tags and dangerous characters
  text: (input: string, maxLength = 1000): string => {
    if (typeof input !== 'string') return ''
    return input
      .substring(0, maxLength)
      .replace(/[<>]/g, '')
      .trim()
  },

  // Sanitize email
  email: (input: string): string => {
    if (typeof input !== 'string') return ''
    const email = input.toLowerCase().trim()
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email) ? email : ''
  },

  // Sanitize URL
  url: (input: string): string => {
    if (typeof input !== 'string') return ''
    try {
      const url = new URL(input)
      return url.toString()
    } catch {
      return ''
    }
  },

  // Sanitize filename
  filename: (input: string): string => {
    if (typeof input !== 'string') return ''
    return input
      .replace(/[^a-zA-Z0-9._-]/g, '')
      .substring(0, 255)
      .trim()
  },

  // Sanitize phone number (removes all but digits, +, -, space)
  phone: (input: string): string => {
    if (typeof input !== 'string') return ''
    return input.replace(/[^\d+\-\s]/g, '').trim()
  },

  // Sanitize UUID
  uuid: (input: string): string => {
    if (typeof input !== 'string') return ''
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    return uuidRegex.test(input) ? input.toLowerCase() : ''
  },
}

/**
 * Output Escaping (XSS Prevention)
 */
export const escape = {
  html: (input: string): string => {
    if (typeof input !== 'string') return ''
    const map: { [key: string]: string } = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
      '/': '&#x2F;',
    }
    return input.replace(/[&<>"'/]/g, (char) => map[char])
  },

  attribute: (input: string): string => {
    if (typeof input !== 'string') return ''
    return input.replace(/"/g, '&quot;').replace(/'/g, '&#39;')
  },

  json: (input: unknown): string => {
    try {
      return JSON.stringify(input).replace(/</g, '\\u003c').replace(/>/g, '\\u003e')
    } catch {
      return ''
    }
  },
}

/**
 * Secure Password Validation
 */
export const password = {
  validate: (pwd: string): { valid: boolean; errors: string[] } => {
    const errors: string[] = []

    if (pwd.length < 12) errors.push('Password must be at least 12 characters')
    if (!/[A-Z]/.test(pwd)) errors.push('Password must contain uppercase letter')
    if (!/[a-z]/.test(pwd)) errors.push('Password must contain lowercase letter')
    if (!/[0-9]/.test(pwd)) errors.push('Password must contain number')
    if (!/[!@#$%^&*]/.test(pwd)) errors.push('Password must contain special character (!@#$%^&*)')

    return {
      valid: errors.length === 0,
      errors,
    }
  },

  hash: async (pwd: string): Promise<string> => {
    const { scryptSync } = await import('crypto')
    const salt = crypto.randomBytes(16).toString('hex')
    const hashed = scryptSync(pwd, salt, 64).toString('hex')
    return `${salt}:${hashed}`
  },

  compare: async (pwd: string, hash: string): Promise<boolean> => {
    const { scryptSync, timingSafeEqual } = await import('crypto')
    const [salt, storedHash] = hash.split(':')
    const hashed = scryptSync(pwd, salt, 64).toString('hex')
    try {
      return timingSafeEqual(Buffer.from(hashed), Buffer.from(storedHash))
    } catch {
      return false
    }
  },
}

/**
 * Rate Limiting (in-memory, production should use Redis)
 */
export class RateLimiter {
  private attempts: Map<string, { count: number; resetTime: number }> = new Map()

  check(identifier: string, maxAttempts = 5, windowMs = 15 * 60 * 1000): boolean {
    const now = Date.now()
    const record = this.attempts.get(identifier)

    if (!record || now > record.resetTime) {
      this.attempts.set(identifier, { count: 1, resetTime: now + windowMs })
      return true
    }

    if (record.count >= maxAttempts) return false

    record.count++
    return true
  }

  reset(identifier: string): void {
    this.attempts.delete(identifier)
  }
}

/**
 * File Upload Validation
 */
export const fileValidation = {
  validateSize: (size: number, maxSizeMB = 10): boolean => {
    return size <= maxSizeMB * 1024 * 1024
  },

  validateMime: (mimeType: string, allowed: string[]): boolean => {
    return allowed.includes(mimeType)
  },

  validateExtension: (filename: string, allowed: string[]): boolean => {
    const ext = filename.split('.').pop()?.toLowerCase()
    return ext ? allowed.includes(ext) : false
  },

  validateImage: (mimeType: string, size: number): boolean => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
    return fileValidation.validateMime(mimeType, allowedMimes) && fileValidation.validateSize(size, 5)
  },
}

/**
 * Request Signing & Verification
 */
export const signing = {
  sign: (data: string, secret: string): string => {
    return createHash('sha256').update(data + secret).digest('hex')
  },

  verify: (data: string, signature: string, secret: string): boolean => {
    const expected = signing.sign(data, secret)
    try {
      return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
    } catch {
      return false
    }
  },
}

/**
 * Session Security
 */
export const session = {
  generateSessionId: () => crypto.randomBytes(32).toString('hex'),

  encryptData: (data: string, key: string): string => {
    const iv = crypto.randomBytes(16)
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key), iv)
    let encrypted = cipher.update(data)
    encrypted = Buffer.concat([encrypted, cipher.final()])
    return iv.toString('hex') + ':' + encrypted.toString('hex')
  },

  decryptData: (encrypted: string, key: string): string => {
    const parts = encrypted.split(':')
    const iv = Buffer.from(parts[0], 'hex')
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key), iv)
    let decrypted = decipher.update(Buffer.from(parts[1], 'hex'))
    decrypted = Buffer.concat([decrypted, decipher.final()])
    return decrypted.toString()
  },
}

export default {
  csrf,
  sanitize,
  escape,
  password,
  RateLimiter,
  fileValidation,
  signing,
  session,
}
