'use client'

/**
 * Error Boundary Components for BlogCanvas
 *
 * Provides graceful error handling for React components
 * Prevents entire app crashes from localized errors
 */

import React, { Component, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
  resetKeys?: Array<string | number>
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
  eventId?: string
}

/**
 * Generic Error Boundary Component
 *
 * Usage:
 * <ErrorBoundary fallback={<CustomErrorUI />}>
 *   <YourComponent />
 * </ErrorBoundary>
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to console
    console.error('[ErrorBoundary] Caught error:', error, errorInfo)

    // Generate event ID for tracking
    const eventId = crypto.randomUUID()

    // Update state with error details
    this.setState({
      error,
      errorInfo,
      eventId
    })

    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    // In production, this would send to monitoring service (Sentry, etc.)
    if (process.env.NODE_ENV === 'production') {
      // TODO: Send to error monitoring service
      const errorReport = {
        eventId,
        error: {
          message: error.message,
          stack: error.stack,
          name: error.name
        },
        errorInfo: {
          componentStack: errorInfo.componentStack
        },
        timestamp: new Date().toISOString(),
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'unknown',
        url: typeof window !== 'undefined' ? window.location.href : 'unknown'
      }

      console.error('[ErrorBoundary] Error report:', JSON.stringify(errorReport))
    }
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    // Reset error state if resetKeys change
    if (this.state.hasError && this.props.resetKeys) {
      const hasResetKeyChanged = this.props.resetKeys.some(
        (key, index) => key !== prevProps.resetKeys?.[index]
      )

      if (hasResetKeyChanged) {
        this.reset()
      }
    }
  }

  reset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      eventId: undefined
    })
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default error UI
      return (
        <DefaultErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          eventId={this.state.eventId}
          onReset={this.reset}
        />
      )
    }

    return this.props.children
  }
}

/**
 * Default Error Fallback UI
 */
interface ErrorFallbackProps {
  error: Error | null
  errorInfo: React.ErrorInfo | null
  eventId?: string
  onReset: () => void
}

function DefaultErrorFallback({ error, errorInfo, eventId, onReset }: ErrorFallbackProps) {
  const isDevelopment = process.env.NODE_ENV === 'development'

  return (
    <div className="min-h-[400px] flex items-center justify-center p-6">
      <div className="max-w-2xl w-full bg-white border border-red-200 rounded-lg shadow-lg p-8">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </div>

          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Something went wrong
            </h2>

            <p className="text-gray-600 mb-4">
              We encountered an unexpected error. This issue has been logged and we'll look into it.
            </p>

            {eventId && (
              <p className="text-sm text-gray-500 mb-4">
                Error ID: <code className="bg-gray-100 px-2 py-1 rounded">{eventId}</code>
              </p>
            )}

            {isDevelopment && error && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm font-semibold text-gray-900 mb-2">
                  Development Error Details:
                </p>
                <p className="text-sm text-red-600 font-mono mb-2">
                  {error.message}
                </p>
                {error.stack && (
                  <pre className="text-xs text-gray-600 overflow-x-auto whitespace-pre-wrap">
                    {error.stack}
                  </pre>
                )}
                {errorInfo?.componentStack && (
                  <details className="mt-2">
                    <summary className="text-sm font-semibold text-gray-700 cursor-pointer">
                      Component Stack
                    </summary>
                    <pre className="mt-2 text-xs text-gray-600 overflow-x-auto whitespace-pre-wrap">
                      {errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <Button
                onClick={onReset}
                variant="default"
                className="flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </Button>

              <Button
                onClick={() => window.location.href = '/'}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Home className="w-4 h-4" />
                Go Home
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Minimal Error Fallback (for smaller components)
 */
export function MinimalErrorFallback({ onReset }: { onReset: () => void }) {
  return (
    <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
      <div className="flex items-center gap-3 mb-3">
        <AlertTriangle className="w-5 h-5 text-red-600" />
        <p className="font-semibold text-red-900">Failed to load component</p>
      </div>
      <Button
        onClick={onReset}
        variant="outline"
        size="sm"
        className="flex items-center gap-2"
      >
        <RefreshCw className="w-3 h-3" />
        Retry
      </Button>
    </div>
  )
}

/**
 * API Error Display Component
 */
interface ApiErrorProps {
  error: {
    message: string
    code?: string
    requestId?: string
  }
  onRetry?: () => void
}

export function ApiError({ error, onRetry }: ApiErrorProps) {
  return (
    <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
        <div className="flex-1">
          <p className="font-semibold text-red-900 mb-1">
            {error.message}
          </p>
          {error.code && (
            <p className="text-sm text-red-700">
              Error code: {error.code}
            </p>
          )}
          {error.requestId && (
            <p className="text-xs text-red-600 mt-2">
              Request ID: <code className="bg-red-100 px-1 py-0.5 rounded">{error.requestId}</code>
            </p>
          )}
          {onRetry && (
            <Button
              onClick={onRetry}
              variant="outline"
              size="sm"
              className="mt-3 flex items-center gap-2"
            >
              <RefreshCw className="w-3 h-3" />
              Retry
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
