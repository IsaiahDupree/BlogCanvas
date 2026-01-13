import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
    try {
        const { email, password } = await request.json()

        if (!email || !password) {
            return NextResponse.json(
                { success: false, error: 'Email and password required' },
                { status: 400 }
            )
        }

        const supabase = await createClient()

        // Sign in with email and password
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        })

        if (error) {
            return NextResponse.json(
                { success: false, error: error.message },
                { status: 401 }
            )
        }

        // Check if user has 2FA enabled
        const { data: twoFASettings } = await supabase
            .from('user_2fa_settings')
            .select('enabled, enforced')
            .eq('user_id', data.user.id)
            .single()

        // If 2FA is enabled, require verification before completing login
        if (twoFASettings?.enabled) {
            return NextResponse.json({
                success: true,
                requires2FA: true,
                userId: data.user.id,
                email: data.user.email,
                enforced: twoFASettings.enforced,
            })
        }

        // Check if 2FA is enforced but not enabled (admin users)
        if (twoFASettings?.enforced && !twoFASettings?.enabled) {
            return NextResponse.json({
                success: true,
                requires2FASetup: true,
                userId: data.user.id,
                email: data.user.email,
                message: 'Two-factor authentication is required for your account. Please set it up to continue.',
            })
        }

        // Get user profile to determine redirect
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', data.user.id)
            .single()

        const redirectUrl = profile?.role === 'client'
            ? '/portal/dashboard'
            : '/app'

        return NextResponse.json({
            success: true,
            user: data.user,
            redirectUrl
        })

    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: error.message || 'Login failed' },
            { status: 500 }
        )
    }
}
