'use client'

import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/database'

/**
 * Create a Supabase client for Client Components
 * This client uses browser cookies to maintain the user session
 */
export function createClient() {
    return createBrowserClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
}

