import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/vendors/team/invite
 * Create a team member invitation
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('vendor_id, role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Check user is owner or staff
    if (!['owner', 'staff'].includes(profile.role)) {
      return NextResponse.json(
        { error: 'Forbidden. Only owners and staff can invite team members.' },
        { status: 403 }
      )
    }

    if (!profile.vendor_id) {
      return NextResponse.json({ error: 'User is not associated with a vendor' }, { status: 404 })
    }

    const body = await request.json()
    const { email, role } = body

    // Validation
    if (!email || !role) {
      return NextResponse.json(
        { error: 'Missing required fields: email, role' },
        { status: 400 }
      )
    }

    if (!['owner', 'staff'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be "owner" or "staff"' },
        { status: 400 }
      )
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
    }

    // Check if user already exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id, vendor_id')
      .eq('email', email)
      .single()

    if (existingProfile) {
      if (existingProfile.vendor_id === profile.vendor_id) {
        return NextResponse.json(
          { error: 'User is already a member of this vendor organization' },
          { status: 409 }
        )
      } else {
        return NextResponse.json(
          { error: 'Email is already registered with another vendor organization' },
          { status: 409 }
        )
      }
    }

    // Check if there's already a pending invitation
    const { data: existingInvite } = await supabase
      .from('vendor_team_invitations')
      .select('id, status')
      .eq('email', email)
      .eq('vendor_id', profile.vendor_id)
      .eq('status', 'pending')
      .single()

    if (existingInvite) {
      return NextResponse.json(
        { error: 'An invitation has already been sent to this email' },
        { status: 409 }
      )
    }

    // Create invitation
    const { data: invitation, error: inviteError } = await supabase
      .from('vendor_team_invitations')
      .insert({
        vendor_id: profile.vendor_id,
        email,
        role,
        invited_by: user.id,
      })
      .select()
      .single()

    if (inviteError || !invitation) {
      console.error('Create invitation error:', inviteError)
      return NextResponse.json(
        { error: inviteError?.message || 'Failed to create invitation' },
        { status: 500 }
      )
    }

    // TODO: Send invitation email via transactional email system
    // await queueTransactionalEmail({
    //   template_slug: 'user_invitation',
    //   to_email: email,
    //   variables: {
    //     user_name: email,
    //     vendor_name: vendorName,
    //     inviter_name: profile.full_name,
    //     invite_url: `${process.env.NEXT_PUBLIC_APP_URL}/auth/accept-team-invite?token=${invitation.token}`,
    //   },
    // })

    return NextResponse.json({
      success: true,
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        token: invitation.token,
        expires_at: invitation.expires_at,
        invite_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:4848'}/auth/accept-team-invite?token=${invitation.token}`,
      },
      message: 'Invitation created successfully',
    }, { status: 201 })

  } catch (error: any) {
    console.error('Create invitation error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/vendors/team/invite
 * Get all pending invitations for current vendor
 */
export async function GET(request: Request) {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('vendor_id, role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || !profile.vendor_id) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Get all invitations for this vendor
    const { data: invitations, error: inviteError } = await supabase
      .from('vendor_team_invitations')
      .select('*')
      .eq('vendor_id', profile.vendor_id)
      .order('created_at', { ascending: false })

    if (inviteError) {
      console.error('Get invitations error:', inviteError)
      return NextResponse.json(
        { error: inviteError.message || 'Failed to get invitations' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      invitations: invitations || [],
    })

  } catch (error: any) {
    console.error('Get invitations error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
