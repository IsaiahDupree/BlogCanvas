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
    const userType = requestUrl.searchParams.get('userType') // Get selected userType from OAuth redirect
    const error = requestUrl.searchParams.get('error')
    const errorDescription = requestUrl.searchParams.get('error_description')

    console.log('[Auth Callback] Processing callback')
    console.log('[Auth Callback] userType from query:', userType)
    console.log('[Auth Callback] code present:', !!code)

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
            console.log('[Auth Callback] User authenticated:', data.user.email)

            // Get user profile to determine redirect
            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', data.user.id)
                .single()

            console.log('[Auth Callback] User profile role:', profile?.role)
            console.log('[Auth Callback] User selected type:', userType)

            // Determine redirect based on userType selection if provided, otherwise use profile role
            let redirectUrl: string
            
            if (userType) {
                // Use the user's selection from the login page
                redirectUrl = userType === 'client' ? '/portal/dashboard' : '/app'
                console.log('[Auth Callback] Using userType selection for redirect:', redirectUrl)
                
                // Log warning if selection doesn't match actual role
                const isClientRole = profile?.role === 'client' || 
                                    profile?.role === 'client_admin' || 
                                    profile?.role === 'client_reviewer'
                
                if (userType === 'client' && !isClientRole) {
                    console.log('[Auth Callback] WARNING: User selected client but has vendor role')
                } else if (userType === 'vendor' && isClientRole) {
                    console.log('[Auth Callback] WARNING: User selected vendor but has client role')
                }
            } else {
                // Fall back to profile role if no userType provided
                redirectUrl = profile?.role === 'client' ? '/portal/dashboard' : '/app'
                console.log('[Auth Callback] Using profile role for redirect:', redirectUrl)
            }

            console.log('[Auth Callback] Final redirect URL:', redirectUrl)

            // Redirect to appropriate dashboard
            return NextResponse.redirect(new URL(redirectUrl, request.url))
        }
    }

    // No code provided, redirect to login
    return NextResponse.redirect(new URL('/portal/login', request.url))
}

