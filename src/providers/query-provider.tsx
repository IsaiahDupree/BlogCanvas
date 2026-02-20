'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, type ReactNode } from 'react'

/**
 * React Query Provider Configuration
 * feat-047: React Query/SWR configuration
 *
 * Provides client-side data fetching, caching, and synchronization.
 * Configured with sensible defaults for stale time, cache time, and retries.
 */

export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // How long data stays fresh (5 minutes)
            staleTime: 5 * 60 * 1000,

            // How long inactive data stays in cache (10 minutes)
            gcTime: 10 * 60 * 1000,

            // Retry failed requests 3 times with exponential backoff
            retry: 3,
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

            // Don't refetch on window focus by default (can be enabled per query)
            refetchOnWindowFocus: false,

            // Refetch on mount if data is stale
            refetchOnMount: true,

            // Don't refetch on network reconnect by default
            refetchOnReconnect: false,
          },
          mutations: {
            // Retry failed mutations once
            retry: 1,
            retryDelay: 1000,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
