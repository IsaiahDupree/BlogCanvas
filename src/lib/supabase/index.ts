/**
 * Supabase Clients
 * Re-exports for convenience
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

function createLazyClient(keyName: 'NEXT_PUBLIC_SUPABASE_ANON_KEY' | 'SUPABASE_SERVICE_ROLE_KEY'): SupabaseClient<Database> {
    let client: SupabaseClient<Database> | undefined;

    const getClient = () => {
        if (client) return client;

        const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const key = process.env[keyName];
        if (!url || !key) {
            throw new Error(`Supabase is not configured: NEXT_PUBLIC_SUPABASE_URL and ${keyName} are required`);
        }

        client = createClient<Database>(url, key, {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        });
        return client;
    };

    return new Proxy({} as SupabaseClient<Database>, {
        get(_target, property) {
            const actual = getClient();
            const value = Reflect.get(actual, property, actual);
            return typeof value === 'function' ? value.bind(actual) : value;
        },
        set(_target, property, value) {
            return Reflect.set(getClient(), property, value, getClient());
        },
    });
}

// Client creation is deferred until use so module imports do not require
// runtime credentials in deployment build environments.
export const supabase = createLazyClient('NEXT_PUBLIC_SUPABASE_ANON_KEY');
export const supabaseAdmin = createLazyClient('SUPABASE_SERVICE_ROLE_KEY');

// Re-export for test imports
export { supabaseAdmin as default };
