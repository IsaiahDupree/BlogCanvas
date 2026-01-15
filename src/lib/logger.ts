/**
 * Structured Logging System for BlogCanvas
 *
 * Provides consistent, searchable, production-ready logging
 * with correlation ID tracking and log levels
 */

// Log levels (ordered by severity)
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  CRITICAL = 'critical'
}

// Log context for additional metadata
export interface LogContext {
  requestId?: string
  userId?: string
  clientId?: string
  path?: string
  method?: string
  duration?: number
  [key: string]: any
}

// Structured log entry
export interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  context?: LogContext
  error?: {
    message: string
    stack?: string
    code?: string
  }
}

/**
 * Logger class with structured output
 */
class Logger {
  private serviceName: string
  private minLevel: LogLevel

  constructor(serviceName: string = 'BlogCanvas') {
    this.serviceName = serviceName
    // Set minimum log level based on environment
    this.minLevel = process.env.NODE_ENV === 'production'
      ? LogLevel.INFO
      : LogLevel.DEBUG
  }

  /**
   * Check if log level should be output
   */
  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR, LogLevel.CRITICAL]
    const currentIndex = levels.indexOf(level)
    const minIndex = levels.indexOf(this.minLevel)
    return currentIndex >= minIndex
  }

  /**
   * Create structured log entry
   */
  private createLogEntry(
    level: LogLevel,
    message: string,
    context?: LogContext,
    error?: Error
  ): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: {
        service: this.serviceName,
        ...context
      }
    }

    if (error) {
      entry.error = {
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        code: (error as any).code
      }
    }

    return entry
  }

  /**
   * Output log entry
   */
  private output(entry: LogEntry): void {
    const isProduction = process.env.NODE_ENV === 'production'

    // Production: JSON for log aggregation services
    if (isProduction) {
      const jsonLog = JSON.stringify(entry)

      switch (entry.level) {
        case LogLevel.DEBUG:
        case LogLevel.INFO:
          console.log(jsonLog)
          break
        case LogLevel.WARN:
          console.warn(jsonLog)
          break
        case LogLevel.ERROR:
        case LogLevel.CRITICAL:
          console.error(jsonLog)
          break
      }
    } else {
      // Development: Pretty output
      const prefix = `[${entry.level.toUpperCase()}]`
      const timestamp = new Date(entry.timestamp).toLocaleTimeString()

      switch (entry.level) {
        case LogLevel.DEBUG:
          console.log(prefix, timestamp, entry.message, entry.context || '', entry.error || '')
          break
        case LogLevel.INFO:
          console.info(prefix, timestamp, entry.message, entry.context || '', entry.error || '')
          break
        case LogLevel.WARN:
          console.warn(prefix, timestamp, entry.message, entry.context || '', entry.error || '')
          break
        case LogLevel.ERROR:
        case LogLevel.CRITICAL:
          console.error(prefix, timestamp, entry.message, entry.context || '', entry.error || '')
          if (entry.error?.stack) {
            console.error(entry.error.stack)
          }
          break
      }
    }

    // TODO: Send critical logs to alerting service (PagerDuty, Slack, etc.)
    if (entry.level === LogLevel.CRITICAL) {
      // Placeholder for alerting integration
    }
  }

  /**
   * Debug level logging (development only)
   */
  debug(message: string, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return

    const entry = this.createLogEntry(LogLevel.DEBUG, message, context)
    this.output(entry)
  }

  /**
   * Info level logging
   */
  info(message: string, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.INFO)) return

    const entry = this.createLogEntry(LogLevel.INFO, message, context)
    this.output(entry)
  }

  /**
   * Warning level logging
   */
  warn(message: string, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.WARN)) return

    const entry = this.createLogEntry(LogLevel.WARN, message, context)
    this.output(entry)
  }

  /**
   * Error level logging
   */
  error(message: string, error?: Error, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.ERROR)) return

    const entry = this.createLogEntry(LogLevel.ERROR, message, context, error)
    this.output(entry)
  }

  /**
   * Critical level logging (triggers alerts)
   */
  critical(message: string, error?: Error, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.CRITICAL)) return

    const entry = this.createLogEntry(LogLevel.CRITICAL, message, context, error)
    this.output(entry)
  }

  /**
   * Log API request
   */
  request(
    method: string,
    path: string,
    statusCode: number,
    duration: number,
    context?: LogContext
  ): void {
    const message = `${method} ${path} ${statusCode} ${duration}ms`

    const requestContext: LogContext = {
      method,
      path,
      statusCode,
      duration,
      ...context
    }

    // Warn on slow requests
    if (duration > 2000) {
      this.warn(`Slow request: ${message}`, requestContext)
    } else if (statusCode >= 500) {
      this.error(`Server error: ${message}`, undefined, requestContext)
    } else if (statusCode >= 400) {
      this.warn(`Client error: ${message}`, requestContext)
    } else {
      this.info(message, requestContext)
    }
  }

  /**
   * Log database operation
   */
  database(operation: string, table: string, duration?: number, context?: LogContext): void {
    const message = `DB ${operation} on ${table}${duration ? ` (${duration}ms)` : ''}`

    const dbContext: LogContext = {
      operation,
      table,
      duration,
      ...context
    }

    if (duration && duration > 1000) {
      this.warn(`Slow database query: ${message}`, dbContext)
    } else {
      this.debug(message, dbContext)
    }
  }

  /**
   * Log external API call
   */
  externalApi(
    service: string,
    endpoint: string,
    statusCode?: number,
    duration?: number,
    context?: LogContext
  ): void {
    const message = `External API: ${service} ${endpoint}${statusCode ? ` ${statusCode}` : ''}${duration ? ` (${duration}ms)` : ''}`

    const apiContext: LogContext = {
      service,
      endpoint,
      statusCode,
      duration,
      ...context
    }

    if (statusCode && statusCode >= 500) {
      this.error(`External API error: ${message}`, undefined, apiContext)
    } else if (statusCode && statusCode >= 400) {
      this.warn(`External API client error: ${message}`, apiContext)
    } else {
      this.info(message, apiContext)
    }
  }

  /**
   * Log authentication event
   */
  auth(event: string, userId?: string, success: boolean = true, context?: LogContext): void {
    const message = `Auth: ${event} ${success ? 'succeeded' : 'failed'}${userId ? ` for user ${userId}` : ''}`

    const authContext: LogContext = {
      event,
      userId,
      success,
      ...context
    }

    if (!success) {
      this.warn(message, authContext)
    } else {
      this.info(message, authContext)
    }
  }

  /**
   * Create child logger with context
   */
  child(context: LogContext): ContextLogger {
    return new ContextLogger(this, context)
  }
}

/**
 * Context Logger - maintains context across multiple log calls
 */
class ContextLogger {
  constructor(
    private parent: Logger,
    private context: LogContext
  ) {}

  debug(message: string, additionalContext?: LogContext): void {
    this.parent.debug(message, { ...this.context, ...additionalContext })
  }

  info(message: string, additionalContext?: LogContext): void {
    this.parent.info(message, { ...this.context, ...additionalContext })
  }

  warn(message: string, additionalContext?: LogContext): void {
    this.parent.warn(message, { ...this.context, ...additionalContext })
  }

  error(message: string, error?: Error, additionalContext?: LogContext): void {
    this.parent.error(message, error, { ...this.context, ...additionalContext })
  }

  critical(message: string, error?: Error, additionalContext?: LogContext): void {
    this.parent.critical(message, error, { ...this.context, ...additionalContext })
  }
}

/**
 * Default logger instance
 */
export const logger = new Logger('BlogCanvas')

/**
 * Create logger with custom service name
 */
export function createLogger(serviceName: string): Logger {
  return new Logger(serviceName)
}

/**
 * Extract request ID from request headers
 */
export function getRequestId(request: Request): string | undefined {
  return request.headers.get('x-request-id') || request.headers.get('x-correlation-id') || undefined
}

/**
 * Create logger with request context
 */
export function createRequestLogger(request: Request): ContextLogger {
  return logger.child({
    requestId: getRequestId(request),
    path: new URL(request.url).pathname,
    method: request.method
  })
}
