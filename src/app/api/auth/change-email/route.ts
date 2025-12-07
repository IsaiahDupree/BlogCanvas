import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/auth/change-email - Request email change
 * Sends verification email to new address
 */
export async function POST(request: NextRequest) {
    try {
        const { newEmail } = await request.json()

        if (!newEmail) {
            return NextResponse.json(
                { success: false, error: 'New email required' },
                { status: 400 }
            )
        }

        const supabase = await createClient()

        // Check if user is authenticated
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError || !user) {
            return NextResponse.json(
                { success: false, error: 'Authentication required' },
                { status: 401 }
            )
        }

        // Update email (will send verification email)
        const { error } = await supabase.auth.updateUser({
            email: newEmail
        }, {
            emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?type=email_change`
        })

        if (error) {
            return NextResponse.json(
                { success: false, error: error.message },
                { status: 400 }
            )
        }

        return NextResponse.json({
            success: true,
            message: 'Verification email sent to new address. Please check your email to confirm the change.'
        })

    } catch (error: any) {
        console.error('Change email error:', error)
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to change email' },
            { status: 500 }
        )
    }
}

