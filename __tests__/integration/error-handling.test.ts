/**
 * Error Handling Integration Tests
 *
 * Tests the comprehensive error handling system including:
 * - Error response formatting
 * - Error factories
 * - Structured logging
 * - Correlation IDs
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals'
import {
  AppError,
  ErrorFactory,
  ErrorCategory,
  ErrorSeverity,
  createErrorResponse,
  createSuccessResponse,
  asyncHandler,
  getSafeErrorMessage,
  isOperationalError,
  logError
} from '@/lib/error-handler'
import { NextRequest, NextResponse } from 'next/server'
import { logger, createLogger, LogLevel } from '@/lib/logger'

describe('Error Handler Utilities', () => {
  describe('AppError Class', () => {
    it('should create AppError with all properties', () => {
      const error = new AppError(
        'Test error',
        400,
        'TEST_ERROR',
        ErrorCategory.VALIDATION,
        ErrorSeverity.LOW,
        { field: 'email' },
        true
      )

      expect(error.message).toBe('Test error')
      expect(error.statusCode).toBe(400)
      expect(error.code).toBe('TEST_ERROR')
      expect(error.category).toBe(ErrorCategory.VALIDATION)
      expect(error.severity).toBe(ErrorSeverity.LOW)
      expect(error.details).toEqual({ field: 'email' })
      expect(error.isOperational).toBe(true)
      expect(error.name).toBe('AppError')
      expect(error.stack).toBeDefined()
    })

    it('should use default values', () => {
      const error = new AppError('Simple error')

      expect(error.statusCode).toBe(500)
      expect(error.category).toBe(ErrorCategory.INTERNAL)
      expect(error.severity).toBe(ErrorSeverity.MEDIUM)
      expect(error.isOperational).toBe(true)
    })
  })

  describe('ErrorFactory', () => {
    it('should create unauthorized error (401)', () => {
      const error = ErrorFactory.unauthorized('Please log in')

      expect(error.statusCode).toBe(401)
      expect(error.code).toBe('UNAUTHORIZED')
      expect(error.category).toBe(ErrorCategory.AUTHENTICATION)
      expect(error.message).toBe('Please log in')
    })

    it('should create forbidden error (403)', () => {
      const error = ErrorFactory.forbidden('Access denied')

      expect(error.statusCode).toBe(403)
      expect(error.code).toBe('FORBIDDEN')
      expect(error.category).toBe(ErrorCategory.AUTHORIZATION)
    })

    it('should create not found error (404)', () => {
      const error = ErrorFactory.notFound('Blog post', { id: '123' })

      expect(error.statusCode).toBe(404)
      expect(error.code).toBe('NOT_FOUND')
      expect(error.message).toBe('Blog post not found')
      expect(error.details).toEqual({ id: '123' })
    })

    it('should create validation error (400)', () => {
      const error = ErrorFactory.validation('Email is required', {
        fields: ['email']
      })

      expect(error.statusCode).toBe(400)
      expect(error.code).toBe('VALIDATION_ERROR')
      expect(error.category).toBe(ErrorCategory.VALIDATION)
    })

    it('should create database error (500)', () => {
      const error = ErrorFactory.database('Query failed', { table: 'users' })

      expect(error.statusCode).toBe(500)
      expect(error.code).toBe('DATABASE_ERROR')
      expect(error.category).toBe(ErrorCategory.DATABASE)
      expect(error.severity).toBe(ErrorSeverity.HIGH)
    })

    it('should create external API error (502)', () => {
      const error = ErrorFactory.externalApi('Stripe', 'Payment failed')

      expect(error.statusCode).toBe(502)
      expect(error.code).toBe('EXTERNAL_API_ERROR')
      expect(error.category).toBe(ErrorCategory.EXTERNAL_API)
    })

    it('should create rate limit error (429)', () => {
      const error = ErrorFactory.rateLimit('Too many requests', {
        retryAfter: 60
      })

      expect(error.statusCode).toBe(429)
      expect(error.code).toBe('RATE_LIMIT_EXCEEDED')
      expect(error.category).toBe(ErrorCategory.RATE_LIMIT)
    })

    it('should create internal error (500)', () => {
      const error = ErrorFactory.internal('Something went wrong')

      expect(error.statusCode).toBe(500)
      expect(error.code).toBe('INTERNAL_ERROR')
      expect(error.category).toBe(ErrorCategory.INTERNAL)
    })
  })

  describe('Error Response Creation', () => {
    beforeEach(() => {
      jest.spyOn(console, 'error').mockImplementation(() => {})
    })

    afterEach(() => {
      jest.restoreAllMocks()
    })

    it('should create standardized error response', async () => {
      const error = ErrorFactory.validation('Invalid email')
      const requestId = 'test-request-id'

      const response = createErrorResponse(error, requestId)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error.message).toBe('Invalid email')
      expect(data.error.code).toBe('VALIDATION_ERROR')
      expect(data.error.statusCode).toBe(400)
      expect(data.error.requestId).toBe(requestId)
      expect(data.error.timestamp).toBeDefined()
    })

    it('should include details in error response', async () => {
      const error = ErrorFactory.notFound('User', { userId: '123' })
      const response = createErrorResponse(error, 'req-456')
      const data = await response.json()

      expect(data.error.details).toEqual({ userId: '123' })
    })

    it('should sanitize generic errors in production', async () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'

      const error = new Error('Internal database error')
      const response = createErrorResponse(error)
      const data = await response.json()

      expect(data.error.message).toBe('An unexpected error occurred. Please try again later.')
      expect(data.error.statusCode).toBe(500)

      process.env.NODE_ENV = originalEnv
    })

    it('should include stack trace in development', async () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'

      const error = new Error('Test error')
      const response = createErrorResponse(error, undefined, true)
      const data = await response.json()

      expect(data.error.stack).toBeDefined()

      process.env.NODE_ENV = originalEnv
    })
  })

  describe('Success Response Creation', () => {
    it('should create standardized success response', async () => {
      const data = { id: '123', title: 'Test Post' }
      const requestId = 'req-789'

      const response = createSuccessResponse(data, requestId)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.success).toBe(true)
      expect(responseData.data).toEqual(data)
      expect(responseData.requestId).toBe(requestId)
      expect(responseData.timestamp).toBeDefined()
    })

    it('should support custom status codes', async () => {
      const response = createSuccessResponse({ created: true }, 'req-123', 201)

      expect(response.status).toBe(201)
    })
  })

  describe('Async Handler Wrapper', () => {
    it('should handle successful requests', async () => {
      const handler = asyncHandler(async (req: Request) => {
        return NextResponse.json({ success: true })
      })

      const request = new NextRequest('http://localhost:3000/api/test')
      const response = await handler(request)

      expect(response.status).toBe(200)
    })

    it('should catch and format AppError', async () => {
      const handler = asyncHandler(async (req: Request) => {
        throw ErrorFactory.unauthorized('Login required')
      })

      const request = new NextRequest('http://localhost:3000/api/test')
      const response = await handler(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error.message).toBe('Login required')
    })

    it('should catch and format generic errors', async () => {
      const handler = asyncHandler(async (req: Request) => {
        throw new Error('Unexpected error')
      })

      const request = new NextRequest('http://localhost:3000/api/test')
      const response = await handler(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('INTERNAL_ERROR')
    })

    it('should extract correlation ID from headers', async () => {
      const handler = asyncHandler(async (req: Request) => {
        throw ErrorFactory.validation('Bad input')
      })

      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: { 'x-request-id': 'correlation-123' }
      })

      const response = await handler(request)
      const data = await response.json()

      expect(data.error.requestId).toBe('correlation-123')
    })
  })

  describe('Utility Functions', () => {
    it('should get safe error message from AppError', () => {
      const error = ErrorFactory.validation('Email invalid')
      const message = getSafeErrorMessage(error)

      expect(message).toBe('Email invalid')
    })

    it('should get safe error message from Error in development', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'

      const error = new Error('Internal error')
      const message = getSafeErrorMessage(error)

      expect(message).toBe('Internal error')

      process.env.NODE_ENV = originalEnv
    })

    it('should sanitize error message in production', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'

      const error = new Error('Database connection failed')
      const message = getSafeErrorMessage(error)

      expect(message).toBe('An unexpected error occurred')

      process.env.NODE_ENV = originalEnv
    })

    it('should identify operational errors', () => {
      const operational = ErrorFactory.validation('Bad input')
      const programming = new Error('Undefined variable')

      expect(isOperationalError(operational)).toBe(true)
      expect(isOperationalError(programming)).toBe(false)
    })
  })

  describe('Error Logging', () => {
    beforeEach(() => {
      jest.spyOn(console, 'error').mockImplementation(() => {})
    })

    afterEach(() => {
      jest.restoreAllMocks()
    })

    it('should log AppError with context', () => {
      const error = ErrorFactory.database('Query failed')
      logError(error, 'req-123', { userId: 'user-456' })

      expect(console.error).toHaveBeenCalled()
    })

    it('should log generic Error', () => {
      const error = new Error('Unexpected error')
      logError(error, 'req-789')

      expect(console.error).toHaveBeenCalled()
    })
  })
})

describe('Structured Logger', () => {
  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {})
    jest.spyOn(console, 'info').mockImplementation(() => {})
    jest.spyOn(console, 'warn').mockImplementation(() => {})
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('Log Levels', () => {
    it('should log debug messages in development', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'

      logger.debug('Debug message', { detail: 'value' })

      expect(console.log).toHaveBeenCalled()

      process.env.NODE_ENV = originalEnv
    })

    it('should log info messages', () => {
      logger.info('Info message', { userId: '123' })

      expect(console.info).toHaveBeenCalled()
    })

    it('should log warnings', () => {
      logger.warn('Warning message', { threshold: 90 })

      expect(console.warn).toHaveBeenCalled()
    })

    it('should log errors', () => {
      const error = new Error('Test error')
      logger.error('Error occurred', error, { context: 'test' })

      expect(console.error).toHaveBeenCalled()
    })

    it('should log critical errors', () => {
      const error = new Error('Critical failure')
      logger.critical('System down', error)

      expect(console.error).toHaveBeenCalled()
    })
  })

  describe('Specialized Logging', () => {
    it('should log request with performance tracking', () => {
      logger.request('GET', '/api/posts', 200, 150, { userId: '123' })

      expect(console.info).toHaveBeenCalled()
    })

    it('should warn on slow requests', () => {
      logger.request('POST', '/api/publish', 200, 2500)

      expect(console.warn).toHaveBeenCalled()
    })

    it('should error on server errors', () => {
      logger.request('GET', '/api/data', 500, 100)

      expect(console.error).toHaveBeenCalled()
    })

    it('should log database operations', () => {
      logger.database('SELECT', 'blog_posts', 250, { rows: 100 })

      // Debug level - depends on NODE_ENV
      expect(console.log).toHaveBeenCalled()
    })

    it('should warn on slow database queries', () => {
      logger.database('SELECT', 'users', 1500, { rows: 10000 })

      expect(console.warn).toHaveBeenCalled()
    })

    it('should log external API calls', () => {
      logger.externalApi('Stripe', '/v1/charges', 200, 450)

      expect(console.info).toHaveBeenCalled()
    })

    it('should log authentication events', () => {
      logger.auth('login', 'user-123', true, { method: 'email' })

      expect(console.info).toHaveBeenCalled()
    })

    it('should warn on failed authentication', () => {
      logger.auth('login', undefined, false, { reason: 'invalid_password' })

      expect(console.warn).toHaveBeenCalled()
    })
  })

  describe('Context Logger', () => {
    it('should maintain context across log calls', () => {
      const contextLogger = logger.child({
        requestId: 'req-123',
        userId: 'user-456'
      })

      contextLogger.info('Operation started')
      contextLogger.info('Operation completed')

      expect(console.info).toHaveBeenCalledTimes(2)
    })
  })

  describe('Custom Logger', () => {
    it('should create logger with custom service name', () => {
      const customLogger = createLogger('CustomService')

      customLogger.info('Custom log')

      expect(console.info).toHaveBeenCalled()
    })
  })
})

describe('Integration Test - Full Error Flow', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {})
    jest.spyOn(console, 'info').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('should handle complete request-response cycle with error', async () => {
    // Simulate API route handler
    const handler = asyncHandler(async (req: Request) => {
      const requestId = req.headers.get('x-request-id')

      // Log request start
      logger.info('Processing blog post creation', { requestId })

      // Simulate validation error
      throw ErrorFactory.validation('Title is required', {
        field: 'title',
        received: undefined
      })
    })

    // Create request with correlation ID
    const request = new NextRequest('http://localhost:3000/api/blog-posts', {
      method: 'POST',
      headers: { 'x-request-id': 'test-correlation-id' }
    })

    // Handle request
    const response = await handler(request)
    const data = await response.json()

    // Verify response
    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error.message).toBe('Title is required')
    expect(data.error.code).toBe('VALIDATION_ERROR')
    expect(data.error.requestId).toBe('test-correlation-id')
    expect(data.error.details).toEqual({ field: 'title', received: undefined })

    // Verify logging occurred
    expect(console.info).toHaveBeenCalled()
    expect(console.error).toHaveBeenCalled()
  })

  it('should handle successful request with logging', async () => {
    const handler = asyncHandler(async (req: Request) => {
      const requestId = req.headers.get('x-request-id')

      logger.info('Fetching blog posts', { requestId })

      const posts = [{ id: '1', title: 'Test Post' }]

      return createSuccessResponse(posts, requestId)
    })

    const request = new NextRequest('http://localhost:3000/api/blog-posts', {
      headers: { 'x-request-id': 'success-req-id' }
    })

    const response = await handler(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data).toHaveLength(1)
    expect(data.requestId).toBe('success-req-id')
    expect(console.info).toHaveBeenCalled()
  })
})
