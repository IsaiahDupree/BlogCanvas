'use client'

/**
 * Error Page for /portal (Client Portal) Routes
 */

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function PortalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[Portal Error]', error)

    if (process.env.NODE_ENV === 'production') {
      const errorReport = {
        message: error.message,
        digest: error.digest,
        stack: error.stack,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        section: 'client-portal'
      }
      console.error('[Portal Error Report]', JSON.stringify(errorReport))
    }
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
      <div className="max-w-xl w-full bg-white border border-red-200 rounded-lg shadow-md p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>

          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Error Loading Portal
            </h2>

            <p className="text-gray-600 mb-4">
              Something went wrong while loading the client portal. Please try refreshing the page.
            </p>

            {error.digest && (
              <p className="text-xs text-gray-500 mb-4">
                Error ID: {error.digest}
              </p>
            )}

            {process.env.NODE_ENV === 'development' && (
              <div className="p-3 bg-gray-50 rounded border border-gray-200 mb-4">
                <p className="text-xs font-mono text-red-600">{error.message}</p>
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={reset} size="sm" className="flex items-center gap-2">
                <RefreshCw className="w-3 h-3" />
                Try Again
              </Button>
              <Button
                onClick={() => window.location.href = '/portal/dashboard'}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Home className="w-3 h-3" />
                Portal Home
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
