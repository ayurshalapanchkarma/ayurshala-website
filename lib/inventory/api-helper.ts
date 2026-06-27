/**
 * API Helper Functions
 * Standardized error handling and response formatting
 */

import { NextResponse } from 'next/server'
import { ValidationException } from './types'

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public details?: any,
  ) {
    super(message)
  }
}

/**
 * Handle API errors and return standardized responses
 */
export function handleApiError(error: unknown): NextResponse {
  console.error('API Error:', error)

  if (error instanceof ValidationException) {
    return NextResponse.json(
      {
        error: 'Validation failed',
        validationErrors: error.errors,
      },
      { status: 400 },
    )
  }

  if (error instanceof ApiError) {
    return NextResponse.json(
      {
        error: error.message,
        details: error.details,
      },
      { status: error.statusCode },
    )
  }

  if (error instanceof Error) {
    return NextResponse.json(
      {
        error: error.message || 'Internal server error',
      },
      { status: 500 },
    )
  }

  return NextResponse.json(
    {
      error: 'Internal server error',
    },
    { status: 500 },
  )
}

/**
 * Return success response
 */
export function successResponse<T>(data: T, status = 200): NextResponse {
  return NextResponse.json(data, { status })
}

/**
 * Return error response
 */
export function errorResponse(message: string, status = 500): NextResponse {
  return NextResponse.json({ error: message }, { status })
}

/**
 * Extract and validate JSON body
 */
export async function parseBody<T>(request: Request): Promise<T> {
  try {
    return await request.json()
  } catch (error) {
    throw new ApiError(400, 'Invalid JSON body')
  }
}

/**
 * Extract URL parameter
 */
export function getParam(params: Record<string, string | string[]>, key: string): string {
  const value = params[key]
  if (!value) throw new ApiError(400, `Missing required parameter: ${key}`)
  return Array.isArray(value) ? value[0] : value
}
