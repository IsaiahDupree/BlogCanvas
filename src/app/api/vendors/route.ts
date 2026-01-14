import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/vendors
 * Get current user's vendor organization details
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

    // Get vendor details
    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .select('*')
      .eq('id', profile.vendor_id)
      .single()

    if (vendorError || !vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 })
    }

    // Get team member count
    const { count: teamCount } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('vendor_id', vendor.id)

    // Get client count
    const { count: clientCount } = await supabase
      .from('clients')
      .select('id', { count: 'exact', head: true })
      .eq('vendor_id', vendor.id)

    return NextResponse.json({
      vendor,
      stats: {
        team_members: teamCount || 0,
        clients: clientCount || 0,
      },
    })

  } catch (error: any) {
    console.error('Get vendor error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/vendors
 * Update vendor organization settings (owners only)
 */
export async function PATCH(request: Request) {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's profile to check role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('vendor_id, role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Only owners can update vendor settings
    if (profile.role !== 'owner') {
      return NextResponse.json(
        { error: 'Forbidden. Only vendor owners can update settings.' },
        { status: 403 }
      )
    }

    if (!profile.vendor_id) {
      return NextResponse.json({ error: 'User is not associated with a vendor' }, { status: 404 })
    }

    const body = await request.json()
    const {
      name,
      email,
      phone,
      website,
      logo_url,
      brand_colors,
      company_type,
      team_size,
      industry_focus,
      default_timezone,
      notification_settings,
    } = body

    // Build update object (only include provided fields)
    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (email !== undefined) updateData.email = email
    if (phone !== undefined) updateData.phone = phone
    if (website !== undefined) updateData.website = website
    if (logo_url !== undefined) updateData.logo_url = logo_url
    if (brand_colors !== undefined) updateData.brand_colors = brand_colors
    if (company_type !== undefined) updateData.company_type = company_type
    if (team_size !== undefined) updateData.team_size = team_size
    if (industry_focus !== undefined) updateData.industry_focus = industry_focus
    if (default_timezone !== undefined) updateData.default_timezone = default_timezone
    if (notification_settings !== undefined) updateData.notification_settings = notification_settings

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    // Update vendor
    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .update(updateData)
      .eq('id', profile.vendor_id)
      .select()
      .single()

    if (vendorError) {
      console.error('Update vendor error:', vendorError)
      return NextResponse.json(
        { error: vendorError.message || 'Failed to update vendor' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      vendor,
    })

  } catch (error: any) {
    console.error('Update vendor error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
