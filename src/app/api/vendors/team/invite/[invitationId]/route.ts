import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

/**
 * DELETE /api/vendors/team/invite/[invitationId]
 * Cancel a pending invitation
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ invitationId: string }> }
) {
  try {
    const { invitationId } = await params
    const supabase = await createServerClient()

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

    // Check user is owner or staff
    if (!['owner', 'staff'].includes(profile.role)) {
      return NextResponse.json(
        { error: 'Forbidden. Only owners and staff can cancel invitations.' },
        { status: 403 }
      )
    }

    // Get invitation
    const { data: invitation, error: getError } = await supabase
      .from('vendor_team_invitations')
      .select('*')
      .eq('id', invitationId)
      .eq('vendor_id', profile.vendor_id)
      .single()

    if (getError || !invitation) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 })
    }

    // Can only cancel pending invitations
    if (invitation.status !== 'pending') {
      return NextResponse.json(
        { error: `Cannot cancel invitation with status: ${invitation.status}` },
        { status: 400 }
      )
    }

    // Update invitation status to cancelled
    const { error: cancelError } = await supabase
      .from('vendor_team_invitations')
      .update({ status: 'cancelled' })
      .eq('id', invitationId)

    if (cancelError) {
      console.error('Cancel invitation error:', cancelError)
      return NextResponse.json(
        { error: cancelError.message || 'Failed to cancel invitation' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Invitation cancelled successfully',
    })

  } catch (error: any) {
    console.error('Cancel invitation error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
