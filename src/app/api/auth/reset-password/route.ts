import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/auth/reset-password - Request password reset
 * Sends reset email to user
 */
export async function POST(request: NextRequest) {
    try {
        const { email } = await request.json()

        if (!email) {
            return NextResponse.json(
                { success: false, error: 'Email required' },
                { status: 400 }
            )
        }

        const supabase = await createClient()

        // Send password reset email
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password?token=:token_hash`
        })

        if (error) {
            return NextResponse.json(
                { success: false, error: error.message },
                { status: 400 }
            )
        }

        // Always return success for security (don't reveal if email exists)
        return NextResponse.json({
            success: true,
            message: 'If an account exists with this email, a password reset link has been sent'
        })

    } catch (error: any) {
        console.error('Reset password error:', error)
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to send reset email' },
            { status: 500 }
        )
    }
}

/**
 * PUT /api/auth/reset-password - Update password with reset token
 */
export async function PUT(request: NextRequest) {
    try {
        const { password } = await request.json()

        if (!password) {
            return NextResponse.json(
                { success: false, error: 'Password required' },
                { status: 400 }
            )
        }

        if (password.length < 6) {
            return NextResponse.json(
                { success: false, error: 'Password must be at least 6 characters' },
                { status: 400 }
            )
        }

        const supabase = await createClient()

        // Update password (user must be authenticated via reset token)
        const { error } = await supabase.auth.updateUser({
            password: password
        })

        if (error) {
            return NextResponse.json(
                { success: false, error: error.message },
                { status: 400 }
            )
        }

        return NextResponse.json({
            success: true,
            message: 'Password updated successfully'
        })

    } catch (error: any) {
        console.error('Update password error:', error)
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to update password' },
            { status: 500 }
        )
    }
}

