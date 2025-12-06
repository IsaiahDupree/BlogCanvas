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
