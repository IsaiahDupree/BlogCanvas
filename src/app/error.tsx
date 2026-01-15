'use client'

/**
 * Root Error Page for Next.js App Directory
 *
 * This handles errors in the root layout and all pages
 */

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log error to console
    console.error('[Root Error Page]', error)

    // In production, send to monitoring service
    if (process.env.NODE_ENV === 'production') {
      const errorReport = {
        message: error.message,
        digest: error.digest,
        stack: error.stack,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: window.navigator.userAgent
      }
      console.error('[Root Error Report]', JSON.stringify(errorReport))
    }
  }, [error])

  const isDevelopment = process.env.NODE_ENV === 'development'

  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
          <div className="max-w-2xl w-full bg-white border border-red-200 rounded-lg shadow-lg p-8">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
              </div>

              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  Something went wrong
                </h1>

                <p className="text-gray-600 mb-4">
                  We encountered an unexpected error. This issue has been logged and we'll look into it.
                </p>

                {error.digest && (
                  <p className="text-sm text-gray-500 mb-4">
                    Error ID: <code className="bg-gray-100 px-2 py-1 rounded">{error.digest}</code>
                  </p>
                )}

                {isDevelopment && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-sm font-semibold text-gray-900 mb-2">
                      Development Error Details:
                    </p>
                    <p className="text-sm text-red-600 font-mono mb-2">
                      {error.message}
                    </p>
                    {error.stack && (
                      <pre className="text-xs text-gray-600 overflow-x-auto whitespace-pre-wrap max-h-64">
                        {error.stack}
                      </pre>
                    )}
                  </div>
                )}

                <div className="flex gap-3 mt-6">
                  <Button
                    onClick={reset}
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
      </body>
    </html>
  )
}
