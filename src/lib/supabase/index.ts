/**
 * Supabase Admin Client
 * Re-exports for convenience
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

// Supabase admin client with service role key
export const supabaseAdmin = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
);

// Re-export for test imports
export { supabaseAdmin as default };
