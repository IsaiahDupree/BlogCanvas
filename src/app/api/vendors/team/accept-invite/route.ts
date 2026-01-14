import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/vendors/team/accept-invite
 * Accept a team invitation and create user account
 *
 * Body: { token, password, fullName }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { token, password, fullName } = body

    // Validation
    if (!token || !password || !fullName) {
      return NextResponse.json(
        { error: 'Missing required fields: token, password, fullName' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Get invitation by token
    const { data: invitation, error: inviteError } = await supabase
      .from('vendor_team_invitations')
      .select('*')
      .eq('token', token)
      .single()

    if (inviteError || !invitation) {
      return NextResponse.json(
        { error: 'Invalid or expired invitation token' },
        { status: 404 }
      )
    }

    // Check invitation status
    if (invitation.status !== 'pending') {
      return NextResponse.json(
        { error: `Invitation is ${invitation.status}. Only pending invitations can be accepted.` },
        { status: 400 }
      )
    }

    // Check if invitation has expired
    if (new Date(invitation.expires_at) < new Date()) {
      // Update invitation status to expired
      await supabase
        .from('vendor_team_invitations')
        .update({ status: 'expired' })
        .eq('id', invitation.id)

      return NextResponse.json(
        { error: 'Invitation has expired' },
        { status: 410 }
      )
    }

    // Check if email is already registered
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', invitation.email)
      .single()

    if (existingProfile) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      )
    }

    // 1. Create user account
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: invitation.email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: fullName,
      },
    })

    if (authError || !authData.user) {
      console.error('Auth error:', authError)
      return NextResponse.json(
        { error: authError?.message || 'Failed to create user account' },
        { status: 500 }
      )
    }

    const userId = authData.user.id

    // 2. Create profile
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        email: invitation.email,
        full_name: fullName,
        role: invitation.role,
        vendor_id: invitation.vendor_id,
      })

    if (profileError) {
      console.error('Profile creation error:', profileError)
      // Rollback: Delete the user
      await supabase.auth.admin.deleteUser(userId)
      return NextResponse.json(
        { error: profileError.message || 'Failed to create user profile' },
        { status: 500 }
      )
    }

    // 3. Mark invitation as accepted
    const { error: updateError } = await supabase
      .from('vendor_team_invitations')
      .update({
        status: 'accepted',
        accepted_at: new Date().toISOString(),
        accepted_by: userId,
      })
      .eq('id', invitation.id)

    if (updateError) {
      console.error('Update invitation error:', updateError)
      // Don't rollback - user account is created successfully
    }

    return NextResponse.json({
      success: true,
      user: {
        id: userId,
        email: invitation.email,
        full_name: fullName,
        role: invitation.role,
      },
      message: 'Account created successfully! You can now sign in.',
    }, { status: 201 })

  } catch (error: any) {
    console.error('Accept invitation error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/vendors/team/accept-invite?token=...
 * Validate invitation token and get invitation details
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json({ error: 'Missing token parameter' }, { status: 400 })
    }

    const supabase = await createClient()

    // Get invitation by token
    const { data: invitation, error: inviteError } = await supabase
      .from('vendor_team_invitations')
      .select(`
        id,
        email,
        role,
        status,
        expires_at,
        created_at,
        vendor_id
      `)
      .eq('token', token)
      .single()

    if (inviteError || !invitation) {
      return NextResponse.json(
        { error: 'Invalid invitation token' },
        { status: 404 }
      )
    }

    // Get vendor details
    const { data: vendor } = await supabase
      .from('vendors')
      .select('name, slug')
      .eq('id', invitation.vendor_id)
      .single()

    // Check if expired
    const isExpired = new Date(invitation.expires_at) < new Date()
    if (isExpired && invitation.status === 'pending') {
      // Update status
      await supabase
        .from('vendor_team_invitations')
        .update({ status: 'expired' })
        .eq('id', invitation.id)
      invitation.status = 'expired'
    }

    return NextResponse.json({
      invitation: {
        email: invitation.email,
        role: invitation.role,
        status: invitation.status,
        expires_at: invitation.expires_at,
        vendor_name: vendor?.name || 'Unknown Vendor',
        vendor_slug: vendor?.slug,
      },
    })

  } catch (error: any) {
    console.error('Validate invitation error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
