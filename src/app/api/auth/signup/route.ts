import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/auth/signup - Create new user account
 * Requires email confirmation if enabled in Supabase
 * Set ALLOW_REGISTRATION=true to enable public signup
 */
export async function POST(request: NextRequest) {
    try {
        // Check if registration is enabled
        const allowRegistration = process.env.ALLOW_REGISTRATION === 'true'
        if (!allowRegistration) {
            return NextResponse.json(
                { success: false, error: 'Registration is currently disabled. Contact your administrator.' },
                { status: 403 }
            )
        }

        const { email, password, fullName, role: requestedRole = 'client' } = await request.json()
        
        // Map userType to actual role - vendors get 'owner' role for full access
        const role = requestedRole === 'vendor' ? 'owner' : requestedRole

        if (!email || !password) {
            return NextResponse.json(
                { success: false, error: 'Email and password required' },
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

        // Sign up user
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
                data: {
                    full_name: fullName,
                    role: role
                }
            }
        })

        if (error) {
            // Handle "User already registered" error - suggest login instead
            if (error.message.toLowerCase().includes('already registered') || 
                error.message.toLowerCase().includes('already exists') ||
                error.message.toLowerCase().includes('user already')) {
                return NextResponse.json(
                    { 
                        success: false, 
                        error: 'An account with this email already exists. Please sign in instead.',
                        existingUser: true
                    },
                    { status: 409 }
                )
            }
            return NextResponse.json(
                { success: false, error: error.message },
                { status: 400 }
            )
        }

        // Profile will be auto-created by trigger, but we can update it
        if (data.user) {
            const { error: profileError } = await supabase
                .from('profiles')
                .update({
                    full_name: fullName,
                    role: role,
                    email: email
                })
                .eq('id', data.user.id)

            if (profileError) {
                console.error('Error updating profile:', profileError)
            }
        }

        return NextResponse.json({
            success: true,
            message: data.session 
                ? 'Account created successfully' 
                : 'Please check your email to confirm your account',
            user: data.user,
            requiresConfirmation: !data.session
        })

    } catch (error: any) {
        console.error('Signup error:', error)
        return NextResponse.json(
            { success: false, error: error.message || 'Signup failed' },
            { status: 500 }
        )
    }
}

