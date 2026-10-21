import { createClient, type SupabaseClient } from '@supabase/supabase-js';

function createLazyClient(keyName: 'NEXT_PUBLIC_SUPABASE_ANON_KEY' | 'SUPABASE_SERVICE_ROLE_KEY'): SupabaseClient {
    let client: SupabaseClient | undefined;

    const getClient = () => {
        if (client) return client;

        const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const key = process.env[keyName];
        if (!url || !key) {
            throw new Error(`Supabase is not configured: NEXT_PUBLIC_SUPABASE_URL and ${keyName} are required`);
        }

        client = createClient(url, key, {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        });
        return client;
    };

    // Keep route modules importable during builds that do not have runtime
    // credentials. The real client is created only when a request uses it.
    return new Proxy({} as SupabaseClient, {
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

// Clients are initialized on first use so public pages and route builds do not
// require database credentials just to import server modules.
export const supabase = createLazyClient('NEXT_PUBLIC_SUPABASE_ANON_KEY');
export const supabaseAdmin = createLazyClient('SUPABASE_SERVICE_ROLE_KEY');

// Helper to get user from session
export async function getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
}

// Helper to get user profile with role
export async function getUserProfile(userId: string) {
    const { data, error } = await supabase
        .from('profiles')
        .select('*, clients(*)')
        .eq('id', userId)
        .single();

    if (error) throw error;
    return data;
}
