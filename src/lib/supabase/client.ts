'use client'

import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

let browserClient: ReturnType<typeof createBrowserClient<Database>> | undefined

function getBrowserClient() {
    if (browserClient) return browserClient

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) {
        throw new Error('Supabase browser client is not configured: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required')
    }

    browserClient = createBrowserClient<Database>(url, key)
    return browserClient
}

/**
 * Create a Supabase client for Client Components
 * This client uses browser cookies to maintain the user session
 */
export function createClient(): ReturnType<typeof createBrowserClient<Database>> {
    return new Proxy({} as ReturnType<typeof createBrowserClient<Database>>, {
        get(_target, property) {
            const client = getBrowserClient()
            const value = Reflect.get(client, property, client)
            return typeof value === 'function' ? value.bind(client) : value
        },
        set(_target, property, value) {
            const client = getBrowserClient()
            return Reflect.set(client, property, value, client)
        },
    })
}

