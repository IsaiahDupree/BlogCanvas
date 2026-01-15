/**
 * Centralized Error Handling System for BlogCanvas
 *
 * Provides:
 * - Consistent error response formats
 * - Request correlation IDs
 * - Structured error logging
 * - User-friendly error messages
 */

import { NextResponse } from 'next/server'

// Standard error response format
export interface ErrorResponse {
  success: false
  error: {
    message: string
    code?: string
    statusCode: number
    requestId?: string
    details?: any
    timestamp: string
  }
}

// Standard success response format
export interface SuccessResponse<T = any> {
  success: true
  data: T
  requestId?: string
  timestamp: string
}

// Error severity levels
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// Error categories
export enum ErrorCategory {
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  VALIDATION = 'validation',
  DATABASE = 'database',
  EXTERNAL_API = 'external_api',
  INTERNAL = 'internal',
  RATE_LIMIT = 'rate_limit',
  NOT_FOUND = 'not_found'
}

// Structured error log entry
export interface ErrorLogEntry {
  requestId: string
  timestamp: string
  severity: ErrorSeverity
  category: ErrorCategory
  message: string
  stack?: string
  userId?: string
  path?: string
  method?: string
  statusCode: number
  metadata?: Record<string, any>
}

/**
 * Application Error class with enhanced context
 */
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string,
    public category: ErrorCategory = ErrorCategory.INTERNAL,
    public severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    public details?: any,
    public isOperational: boolean = true
  ) {
    super(message)
    this.name = 'AppError'
    Object.setPrototypeOf(this, AppError.prototype)
    Error.captureStackTrace(this, this.constructor)
  }
}

/**
 * Predefined error factories for common scenarios
 */
export const ErrorFactory = {
  // Authentication errors (401)
  unauthorized(message: string = 'Authentication required', details?: any): AppError {
    return new AppError(
      message,
      401,
      'UNAUTHORIZED',
      ErrorCategory.AUTHENTICATION,
      ErrorSeverity.LOW,
      details
    )
  },

  // Authorization errors (403)
  forbidden(message: string = 'Access denied', details?: any): AppError {
    return new AppError(
      message,
      403,
      'FORBIDDEN',
      ErrorCategory.AUTHORIZATION,
      ErrorSeverity.MEDIUM,
      details
    )
  },

  // Not found errors (404)
  notFound(resource: string = 'Resource', details?: any): AppError {
    return new AppError(
      `${resource} not found`,
      404,
      'NOT_FOUND',
      ErrorCategory.NOT_FOUND,
      ErrorSeverity.LOW,
      details
    )
  },

  // Validation errors (400)
  validation(message: string, details?: any): AppError {
    return new AppError(
      message,
      400,
      'VALIDATION_ERROR',
      ErrorCategory.VALIDATION,
      ErrorSeverity.LOW,
      details
    )
  },

  // Database errors (500)
  database(message: string = 'Database operation failed', details?: any): AppError {
    return new AppError(
      message,
      500,
      'DATABASE_ERROR',
      ErrorCategory.DATABASE,
      ErrorSeverity.HIGH,
      details
    )
  },

  // External API errors (502)
  externalApi(service: string, message?: string, details?: any): AppError {
    return new AppError(
      message || `${service} service unavailable`,
      502,
      'EXTERNAL_API_ERROR',
      ErrorCategory.EXTERNAL_API,
      ErrorSeverity.MEDIUM,
      details
    )
  },

  // Rate limit errors (429)
  rateLimit(message: string = 'Too many requests', details?: any): AppError {
    return new AppError(
      message,
      429,
      'RATE_LIMIT_EXCEEDED',
      ErrorCategory.RATE_LIMIT,
      ErrorSeverity.LOW,
      details
    )
  },

  // Internal server errors (500)
  internal(message: string = 'Internal server error', details?: any): AppError {
    return new AppError(
      message,
      500,
      'INTERNAL_ERROR',
      ErrorCategory.INTERNAL,
      ErrorSeverity.HIGH,
      details
    )
  }
}

/**
 * Log structured error with correlation ID
 */
export function logError(error: Error | AppError, requestId?: string, metadata?: Record<string, any>): void {
  const isAppError = error instanceof AppError

  const logEntry: ErrorLogEntry = {
    requestId: requestId || 'unknown',
    timestamp: new Date().toISOString(),
    severity: isAppError ? error.severity : ErrorSeverity.HIGH,
    category: isAppError ? error.category : ErrorCategory.INTERNAL,
    message: error.message,
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    statusCode: isAppError ? error.statusCode : 500,
    metadata
  }

  // In production, this would send to monitoring service (Sentry, Datadog, etc.)
  if (process.env.NODE_ENV === 'production') {
    // TODO: Send to monitoring service
    console.error('[ERROR]', JSON.stringify(logEntry))
  } else {
    console.error('[ERROR]', {
      ...logEntry,
      stack: error.stack
    })
  }

  // Log critical errors with additional alerting
  if (logEntry.severity === ErrorSeverity.CRITICAL) {
    console.error('[CRITICAL ERROR] Immediate attention required:', logEntry)
    // TODO: Send alert (PagerDuty, Slack, etc.)
  }
}

/**
 * Create standardized error response
 */
export function createErrorResponse(
  error: Error | AppError,
  requestId?: string,
  includeStack: boolean = false
): NextResponse<ErrorResponse> {
  const isAppError = error instanceof AppError
  const statusCode = isAppError ? error.statusCode : 500

  // Sanitize error message for production
  const userMessage = process.env.NODE_ENV === 'production' && !isAppError
    ? 'An unexpected error occurred. Please try again later.'
    : error.message

  const errorResponse: ErrorResponse = {
    success: false,
    error: {
      message: userMessage,
      code: isAppError ? error.code : 'INTERNAL_ERROR',
      statusCode,
      requestId,
      timestamp: new Date().toISOString(),
      ...(isAppError && error.details && { details: error.details }),
      ...(includeStack && process.env.NODE_ENV === 'development' && { stack: error.stack })
    }
  }

  // Log the error
  logError(error, requestId)

  return NextResponse.json(errorResponse, { status: statusCode })
}

/**
 * Create standardized success response
 */
export function createSuccessResponse<T>(
  data: T,
  requestId?: string,
  statusCode: number = 200
): NextResponse<SuccessResponse<T>> {
  const response: SuccessResponse<T> = {
    success: true,
    data,
    requestId,
    timestamp: new Date().toISOString()
  }

  return NextResponse.json(response, { status: statusCode })
}

/**
 * Async error handler wrapper for API routes
 */
export function asyncHandler<T = any>(
  handler: (req: Request, context?: any) => Promise<NextResponse<T>>
) {
  return async (req: Request, context?: any): Promise<NextResponse> => {
    try {
      return await handler(req, context)
    } catch (error) {
      const requestId = req.headers.get('x-request-id') || undefined

      if (error instanceof AppError) {
        return createErrorResponse(error, requestId)
      }

      // Unknown error - treat as internal server error
      const internalError = ErrorFactory.internal(
        error instanceof Error ? error.message : 'Unknown error occurred'
      )
      return createErrorResponse(internalError, requestId)
    }
  }
}

/**
 * Safe error message extraction (prevent information leakage)
 */
export function getSafeErrorMessage(error: unknown): string {
  if (error instanceof AppError) {
    return error.message
  }

  if (error instanceof Error) {
    // In production, don't expose internal error messages
    if (process.env.NODE_ENV === 'production') {
      return 'An unexpected error occurred'
    }
    return error.message
  }

  return 'An unknown error occurred'
}

/**
 * Check if error is operational (expected) vs programming error
 */
export function isOperationalError(error: Error): boolean {
  if (error instanceof AppError) {
    return error.isOperational
  }
  return false
}
