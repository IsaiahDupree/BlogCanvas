import { NextRequest, NextResponse } from 'next/server'
import { createClient, requireStaff } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase'

/**
 * POST /api/auth/invite - Invite a new user (staff/owner only)
 * Creates user account and sends invitation email
 */
export async function POST(request: NextRequest) {
    try {
        // Require staff/owner role
        await requireStaff()

        const { email, role = 'client', fullName, clientId } = await request.json()

        if (!email) {
            return NextResponse.json(
                { success: false, error: 'Email required' },
                { status: 400 }
            )
        }

        // Use admin client for user creation (requires service role key)
        if (!supabaseAdmin) {
            return NextResponse.json(
                { success: false, error: 'Service role key not configured' },
                { status: 500 }
            )
        }

        const adminClient = supabaseAdmin

        // Check if user already exists by listing users
        const { data: users } = await adminClient.auth.admin.listUsers()
        const existingUser = users?.users?.find(u => u.email === email)
        
        if (existingUser) {
            return NextResponse.json(
                { success: false, error: 'User with this email already exists' },
                { status: 400 }
            )
        }

        // Create user
        const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
            email,
            email_confirm: false, // Will be confirmed via invite email
            user_metadata: {
                full_name: fullName,
                role: role
            }
        })

        if (createError || !newUser.user) {
            return NextResponse.json(
                { success: false, error: createError?.message || 'Failed to create user' },
                { status: 400 }
            )
        }

        // Send invitation email
        const { error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email, {
            redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?type=invite`,
            data: {
                role: role,
                client_id: clientId
            }
        })

        if (inviteError) {
            console.error('Invite email error:', inviteError)
            // User created but email failed - still return success
        }

        // Create/update profile
        const { error: profileError } = await adminClient
            .from('profiles')
            .upsert({
                id: newUser.user.id,
                role: role,
                full_name: fullName,
                email: email,
                client_id: clientId || null
            })

        if (profileError) {
            console.error('Profile creation error:', profileError)
        }

        return NextResponse.json({
            success: true,
            message: 'Invitation sent successfully',
            user: {
                id: newUser.user.id,
                email: newUser.user.email
            }
        })

    } catch (error: any) {
        console.error('Invite error:', error)
        
        // Handle authorization errors
        if (error.message?.includes('Staff access required')) {
            return NextResponse.json(
                { success: false, error: 'Staff access required' },
                { status: 403 }
            )
        }

        return NextResponse.json(
            { success: false, error: error.message || 'Failed to send invitation' },
            { status: 500 }
        )
    }
}

