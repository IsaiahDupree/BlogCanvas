import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase'

/**
 * POST /api/auth/accept-invitation - Accept client invitation and create account
 * Creates user account with email/password and links to client
 */
export async function POST(request: NextRequest) {
    try {
        const { token, email, password, fullName } = await request.json()

        if (!token || !email || !password) {
            return NextResponse.json(
                { success: false, error: 'Token, email, and password required' },
                { status: 400 }
            )
        }

        const supabase = createClient()

        // Validate invitation token
        const { data: invitation, error: inviteError } = await supabase
            .from('client_invitations')
            .select('id, email, role, status, expires_at, client_id')
            .eq('token', token)
            .single()

        if (inviteError || !invitation) {
            return NextResponse.json(
                { success: false, error: 'Invalid invitation token' },
                { status: 404 }
            )
        }

        // Verify email matches
        if (invitation.email.toLowerCase() !== email.toLowerCase()) {
            return NextResponse.json(
                { success: false, error: 'Email does not match invitation' },
                { status: 400 }
            )
        }

        // Check if expired
        if (new Date(invitation.expires_at) < new Date()) {
            return NextResponse.json(
                { success: false, error: 'Invitation has expired' },
                { status: 410 }
            )
        }

        // Check if already accepted
        if (invitation.status !== 'pending') {
            return NextResponse.json(
                { success: false, error: `Invitation has been ${invitation.status}` },
                { status: 400 }
            )
        }

        // Create user account using Supabase Auth
        const { data: authData, error: signupError } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    full_name: fullName,
                    role: invitation.role,
                    client_id: invitation.client_id
                }
            }
        })

        if (signupError || !authData.user) {
            console.error('Signup error:', signupError)
            return NextResponse.json(
                { success: false, error: signupError?.message || 'Failed to create account' },
                { status: 400 }
            )
        }

        const userId = authData.user.id

        // Use admin client to ensure profile is created properly
        if (!supabaseAdmin) {
            return NextResponse.json(
                { success: false, error: 'Service role key not configured' },
                { status: 500 }
            )
        }

        const adminClient = supabaseAdmin

        // Create/update profile with client association
        const { error: profileError } = await adminClient
            .from('profiles')
            .upsert({
                id: userId,
                email: email,
                full_name: fullName || null,
                role: invitation.role,
                client_id: invitation.client_id,
                client_role: invitation.role === 'client_admin' ? 'admin' : 'reviewer'
            })

        if (profileError) {
            console.error('Profile creation error:', profileError)
            // Don't fail the request if profile creation fails
        }

        // Mark invitation as accepted
        const { error: updateError } = await adminClient
            .from('client_invitations')
            .update({
                status: 'accepted',
                accepted_at: new Date().toISOString()
            })
            .eq('id', invitation.id)

        if (updateError) {
            console.error('Invitation update error:', updateError)
        }

        return NextResponse.json({
            success: true,
            message: 'Account created successfully',
            redirectUrl: '/portal/dashboard',
            user: {
                id: userId,
                email: email,
                role: invitation.role
            }
        })

    } catch (error: any) {
        console.error('Accept invitation error:', error)
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to accept invitation' },
            { status: 500 }
        )
    }
}
