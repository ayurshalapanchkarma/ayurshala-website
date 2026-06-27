import { NextResponse } from 'next/server'
import { sanitize, escape } from './security'

export interface SecureApiResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: any
  }
  metadata?: {
    timestamp: string
    requestId: string
  }
}

/**
 * Secure API Response Helper
 * - Never leaks sensitive information in errors
 * - Escapes all output to prevent XSS
 * - Includes request tracking
 */
export class SecureApi {
  static success<T>(data: T, status = 200, requestId = ''): NextResponse<SecureApiResponse<T>> {
    const response: SecureApiResponse<T> = {
      success: true,
      data,
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: requestId || crypto.randomUUID(),
      },
    }
    return NextResponse.json(response, { status })
  }

  static error(
    code: string,
    message: string,
    status = 400,
    details: any = null,
    requestId = '',
  ): NextResponse<SecureApiResponse> {
    // Never expose stack traces or internal details in production
    const sanitizedDetails = process.env.NODE_ENV === 'production' ? undefined : details

    const response: SecureApiResponse = {
      success: false,
      error: {
        code: sanitize.text(code, 50),
        message: sanitize.text(message, 200),
        ...(sanitizedDetails && { details: sanitizedDetails }),
      },
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: requestId || crypto.randomUUID(),
      },
    }

    // Return appropriate HTTP status
    const httpStatus = this.mapErrorStatus(code, status)
    return NextResponse.json(response, { status: httpStatus })
  }

  private static mapErrorStatus(code: string, defaultStatus: number): number {
    const statusMap: { [key: string]: number } = {
      UNAUTHORIZED: 401,
      FORBIDDEN: 403,
      NOT_FOUND: 404,
      CONFLICT: 409,
      VALIDATION_ERROR: 400,
      RATE_LIMIT: 429,
      INTERNAL_ERROR: 500,
      SERVICE_UNAVAILABLE: 503,
    }
    return statusMap[code] || defaultStatus
  }

  static validation(errors: Record<string, string>, requestId = ''): NextResponse<SecureApiResponse> {
    const response: SecureApiResponse = {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: Object.entries(errors).reduce(
          (acc, [key, value]) => {
            acc[sanitize.text(key, 50)] = sanitize.text(value, 200)
            return acc
          },
          {} as Record<string, string>,
        ),
      },
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: requestId || crypto.randomUUID(),
      },
    }
    return NextResponse.json(response, { status: 400 })
  }

  static unauthorized(message = 'Unauthorized', requestId = ''): NextResponse<SecureApiResponse> {
    return this.error('UNAUTHORIZED', message, 401, null, requestId)
  }

  static forbidden(message = 'Forbidden', requestId = ''): NextResponse<SecureApiResponse> {
    return this.error('FORBIDDEN', message, 403, null, requestId)
  }

  static notFound(message = 'Not found', requestId = ''): NextResponse<SecureApiResponse> {
    return this.error('NOT_FOUND', message, 404, null, requestId)
  }

  static conflict(message = 'Conflict', requestId = ''): NextResponse<SecureApiResponse> {
    return this.error('CONFLICT', message, 409, null, requestId)
  }

  static rateLimit(message = 'Too many requests', requestId = ''): NextResponse<SecureApiResponse> {
    return this.error('RATE_LIMIT', message, 429, null, requestId)
  }

  static serverError(message = 'Internal server error', requestId = ''): NextResponse<SecureApiResponse> {
    return this.error('INTERNAL_ERROR', message, 500, null, requestId)
  }
}

/**
 * Request Validation Helper
 */
export class RequestValidator {
  static validateJson<T>(data: any, schema: Record<string, any>): { valid: boolean; errors: Record<string, string>; data?: T } {
    const errors: Record<string, string> = {}

    for (const [key, rules] of Object.entries(schema)) {
      const value = data?.[key]
      const fieldRules = rules as any

      if (fieldRules.required && !value) {
        errors[key] = `${key} is required`
      }

      if (value && fieldRules.type) {
        if (typeof value !== fieldRules.type) {
          errors[key] = `${key} must be ${fieldRules.type}`
        }
      }

      if (value && fieldRules.minLength && value.length < fieldRules.minLength) {
        errors[key] = `${key} must be at least ${fieldRules.minLength} characters`
      }

      if (value && fieldRules.maxLength && value.length > fieldRules.maxLength) {
        errors[key] = `${key} must not exceed ${fieldRules.maxLength} characters`
      }

      if (value && fieldRules.pattern && !fieldRules.pattern.test(value)) {
        errors[key] = fieldRules.patternMessage || `${key} format is invalid`
      }

      if (value && fieldRules.enum && !fieldRules.enum.includes(value)) {
        errors[key] = `${key} must be one of: ${fieldRules.enum.join(', ')}`
      }
    }

    return {
      valid: Object.keys(errors).length === 0,
      errors,
      data: Object.keys(errors).length === 0 ? data : undefined,
    }
  }

  static sanitizeInput<T extends Record<string, any>>(data: T): T {
    const sanitized: any = { ...data }

    for (const [key, value] of Object.entries(sanitized)) {
      if (typeof value === 'string') {
        sanitized[key] = sanitize.text(value)
      } else if (value && typeof value === 'object' && !Array.isArray(value)) {
        sanitized[key] = this.sanitizeInput(value)
      }
    }

    return sanitized as T
  }
}

export default {
  SecureApi,
  RequestValidator,
}
