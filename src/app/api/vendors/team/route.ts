import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/vendors/team
 * Get all team members for current vendor
 */
export async function GET(request: Request) {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's profile to find vendor_id
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('vendor_id, role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    if (!profile.vendor_id) {
      return NextResponse.json({ error: 'User is not associated with a vendor' }, { status: 404 })
    }

    // Get all team members for this vendor
    const { data: teamMembers, error: teamError } = await supabase
      .from('profiles')
      .select('id, email, full_name, role, avatar_url, created_at')
      .eq('vendor_id', profile.vendor_id)
      .order('created_at', { ascending: true })

    if (teamError) {
      console.error('Get team members error:', teamError)
      return NextResponse.json(
        { error: teamError.message || 'Failed to get team members' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      team_members: teamMembers || [],
    })

  } catch (error: any) {
    console.error('Get team error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
