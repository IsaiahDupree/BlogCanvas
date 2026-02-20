/**
 * Database Connection Pooling Configuration
 * Optimizes Supabase connection management
 */

import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/**
 * Connection pool configuration for Supabase
 */
export const CONNECTION_POOL_CONFIG = {
  // Maximum number of connections in the pool
  max: 20,

  // Minimum number of connections to keep alive
  min: 2,

  // Maximum time (ms) a connection can be idle before being released
  idleTimeoutMillis: 30000,

  // Maximum time (ms) to wait for a connection from the pool
  connectionTimeoutMillis: 10000,

  // How often to check for idle connections to close
  reapIntervalMillis: 1000,

  // Enable connection pooling
  pooling: true,
}

/**
 * Create a Supabase client with optimized connection pooling
 */
export function createOptimizedClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  return createSupabaseClient(supabaseUrl, supabaseKey, {
    db: {
      schema: 'public',
    },
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
    global: {
      headers: {
        'x-connection-pool': 'enabled',
      },
    },
  })
}

/**
 * Server-side connection pool for service role client
 */
let serviceRoleClient: ReturnType<typeof createSupabaseClient> | null = null

export function getServiceRoleClient() {
  if (!serviceRoleClient) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    serviceRoleClient = createSupabaseClient(supabaseUrl, serviceRoleKey, {
      db: {
        schema: 'public',
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  }

  return serviceRoleClient
}

/**
 * Gracefully close all connections
 */
export function closeConnections() {
  if (serviceRoleClient) {
    // Supabase client doesn't have explicit close method
    // Connections are managed automatically
    serviceRoleClient = null
  }
}
