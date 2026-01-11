import { NextRequest, NextResponse } from 'next/server'
import { createClient, requireStaff } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase'

/**
 * POST /api/auth/client-invite - Create a client invitation with token
 * Staff/owner can invite client_admin or client_reviewer
 */
export async function POST(request: NextRequest) {
    try {
        // Require staff/owner role
        await requireStaff()

        const { email, clientId, role = 'client_reviewer' } = await request.json()

        if (!email || !clientId) {
            return NextResponse.json(
                { success: false, error: 'Email and clientId required' },
                { status: 400 }
            )
        }

        if (!['client_admin', 'client_reviewer'].includes(role)) {
            return NextResponse.json(
                { success: false, error: 'Invalid role. Must be client_admin or client_reviewer' },
                { status: 400 }
            )
        }

        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            )
        }

        // Check if client exists
        const { data: client, error: clientError } = await supabase
            .from('clients')
            .select('id, name')
            .eq('id', clientId)
            .single()

        if (clientError || !client) {
            return NextResponse.json(
                { success: false, error: 'Client not found' },
                { status: 404 }
            )
        }

        // Check if there's already a pending invitation for this email/client
        const { data: existingInvitation } = await supabase
            .from('client_invitations')
            .select('id, status')
            .eq('email', email)
            .eq('client_id', clientId)
            .eq('status', 'pending')
            .single()

        if (existingInvitation) {
            return NextResponse.json(
                { success: false, error: 'An invitation is already pending for this email' },
                { status: 400 }
            )
        }

        // Generate token and create invitation
        const { data: tokenData } = await supabase
            .rpc('generate_invitation_token')

        if (!tokenData) {
            return NextResponse.json(
                { success: false, error: 'Failed to generate invitation token' },
                { status: 500 }
            )
        }

        const token = tokenData as string
        const expiresAt = new Date()
        expiresAt.setDate(expiresAt.getDate() + 7) // 7 days expiration

        // Create invitation record
        const { data: invitation, error: inviteError } = await supabase
            .from('client_invitations')
            .insert({
                client_id: clientId,
                email: email,
                token: token,
                role: role,
                invited_by: user.id,
                expires_at: expiresAt.toISOString()
            })
            .select()
            .single()

        if (inviteError) {
            console.error('Invitation creation error:', inviteError)
            return NextResponse.json(
                { success: false, error: 'Failed to create invitation' },
                { status: 500 }
            )
        }

        // TODO: Send invitation email via Resend
        const invitationUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:4848'}/auth/client?token=${token}`

        return NextResponse.json({
            success: true,
            message: 'Client invitation created successfully',
            invitation: {
                id: invitation.id,
                email: email,
                role: role,
                invitationUrl: invitationUrl,
                expiresAt: expiresAt.toISOString()
            }
        })

    } catch (error: any) {
        console.error('Client invite error:', error)

        if (error.message?.includes('Staff access required')) {
            return NextResponse.json(
                { success: false, error: 'Staff access required' },
                { status: 403 }
            )
        }

        return NextResponse.json(
            { success: false, error: error.message || 'Failed to create invitation' },
            { status: 500 }
        )
    }
}

/**
 * GET /api/auth/client-invite?token=xxx - Validate invitation token
 * Public endpoint to check if token is valid
 */
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams
        const token = searchParams.get('token')

        if (!token) {
            return NextResponse.json(
                { success: false, error: 'Token required' },
                { status: 400 }
            )
        }

        const supabase = createClient()

        // Fetch invitation with client info
        const { data: invitation, error } = await supabase
            .from('client_invitations')
            .select(`
                id,
                email,
                role,
                status,
                expires_at,
                client_id,
                clients (
                    id,
                    name,
                    website_url
                )
            `)
            .eq('token', token)
            .single()

        if (error || !invitation) {
            return NextResponse.json(
                { success: false, error: 'Invalid invitation token' },
                { status: 404 }
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

        return NextResponse.json({
            success: true,
            invitation: {
                email: invitation.email,
                role: invitation.role,
                client: invitation.clients
            }
        })

    } catch (error: any) {
        console.error('Token validation error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to validate token' },
            { status: 500 }
        )
    }
}
