import { NextRequest, NextResponse } from 'next/server'
import { createClient, requireAuth } from '@/lib/supabase/server'

/**
 * POST /api/auth/reauth - Re-authenticate user before sensitive action
 * Requires current password for verification
 */
export async function POST(request: NextRequest) {
    try {
        const { password } = await request.json()

        if (!password) {
            return NextResponse.json(
                { success: false, error: 'Password required' },
                { status: 400 }
            )
        }

        // Get current user
        const user = await requireAuth()
        const supabase = await createClient()

        // Get user email
        const { data: { user: authUser } } = await supabase.auth.getUser()
        
        if (!authUser?.email) {
            return NextResponse.json(
                { success: false, error: 'User email not found' },
                { status: 400 }
            )
        }

        // Verify password by attempting to sign in
        // This is the standard way to verify password in Supabase
        const { error: signInError } = await supabase.auth.signInWithPassword({
            email: authUser.email,
            password: password
        })

        if (signInError) {
            return NextResponse.json(
                { success: false, error: 'Invalid password' },
                { status: 401 }
            )
        }

        // Password verified - return success
        return NextResponse.json({
            success: true,
            message: 'Re-authentication successful',
            timestamp: new Date().toISOString()
        })

    } catch (error: any) {
        console.error('Reauth error:', error)
        
        // Handle authorization errors
        if (error.message?.includes('Authentication required')) {
            return NextResponse.json(
                { success: false, error: 'Authentication required' },
                { status: 401 }
            )
        }

        return NextResponse.json(
            { success: false, error: error.message || 'Re-authentication failed' },
            { status: 500 }
        )
    }
}

