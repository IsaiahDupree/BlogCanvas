import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Auth callback route for Supabase authentication flows
 * Handles:
 * - Email confirmation
 * - Magic link sign-in
 * - Password reset
 * - Email change verification
 * - Invite acceptance
 */
export async function GET(request: NextRequest) {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')
    const next = requestUrl.searchParams.get('next') || '/portal/dashboard'
    const error = requestUrl.searchParams.get('error')
    const errorDescription = requestUrl.searchParams.get('error_description')

    // Handle errors
    if (error) {
        console.error('Auth callback error:', error, errorDescription)
        const errorUrl = new URL('/portal/login', request.url)
        errorUrl.searchParams.set('error', error)
        if (errorDescription) {
            errorUrl.searchParams.set('error_description', errorDescription)
        }
        return NextResponse.redirect(errorUrl)
    }

    // Handle code exchange
    if (code) {
        const supabase = await createClient()
        
        // Exchange code for session
        const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

        if (exchangeError) {
            console.error('Code exchange error:', exchangeError)
            const errorUrl = new URL('/portal/login', request.url)
            errorUrl.searchParams.set('error', 'code_exchange_failed')
            errorUrl.searchParams.set('error_description', exchangeError.message)
            return NextResponse.redirect(errorUrl)
        }

        if (data.user) {
            // Get user profile to determine redirect
            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', data.user.id)
                .single()

            // Determine redirect based on role
            const redirectUrl = profile?.role === 'client'
                ? '/portal/dashboard'
                : '/app'

            // Redirect to appropriate dashboard
            return NextResponse.redirect(new URL(redirectUrl, request.url))
        }
    }

    // No code provided, redirect to login
    return NextResponse.redirect(new URL('/portal/login', request.url))
}

