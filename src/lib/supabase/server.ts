import { cookies } from 'next/headers'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

/**
 * Create Supabase client for server components
 */
export async function createClient() {
    const cookieStore = await cookies()

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value
                },
                set(name: string, value: string, options: CookieOptions) {
                    try {
                        cookieStore.set({ name, value, ...options })
                    } catch (error) {
                        // Handle edge case where cookies can't be set
                    }
                },
                remove(name: string, options: CookieOptions) {
                    try {
                        cookieStore.set({ name, value: '', ...options })
                    } catch (error) {
                        // Handle edge case where cookies can't be removed
                    }
                },
            },
        }
    )
}

/**
 * Get current server user
 */
export async function getServerUser() {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
        return null
    }

    return user
}

/**
 * Get current server user profile with role
 */
export async function getServerUserProfile() {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
        return null
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    return profile ? { user, profile } : { user, profile: null }
}

/**
 * Check if current user is a client
 */
export async function isClientUser(): Promise<boolean> {
    const profile = await getServerUserProfile()
    return profile?.profile?.role === 'client'
}

/**
 * Check if current user is staff (CSM, editor, admin)
 */
export async function isStaffUser(): Promise<boolean> {
    const profile = await getServerUserProfile()
    const role = profile?.profile?.role
    return role === 'staff' || role === 'admin' || role === 'owner'
}

/**
 * Require authentication - throws if not authenticated
 */
export async function requireAuth() {
    const user = await getServerUser()
    if (!user) {
        throw new Error('Authentication required')
    }
    return user
}

/**
 * Require client role - throws if not a client
 */
export async function requireClient() {
    const isClient = await isClientUser()
    if (!isClient) {
        throw new Error('Client access required')
    }
    const profile = await getServerUserProfile()
    return profile!
}

/**
 * Require staff role - throws if not staff
 */
export async function requireStaff() {
    const isStaff = await isStaffUser()
    if (!isStaff) {
        throw new Error('Staff access required')
    }
    const profile = await getServerUserProfile()
    return profile!
}
