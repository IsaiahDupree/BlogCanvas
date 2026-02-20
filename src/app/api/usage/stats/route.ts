/**
 * Usage Statistics API
 * GET /api/usage/stats - Get current usage statistics for vendor
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUsageStats } from '@/lib/usage-tracking'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get vendor profile
    const { data: profile } = await supabase
      .from('vendor_profiles')
      .select('vendor_id')
      .eq('id', user.id)
      .single()

    if (!profile?.vendor_id) {
      return NextResponse.json(
        { success: false, error: 'Vendor profile not found' },
        { status: 404 }
      )
    }

    const stats = await getUsageStats(profile.vendor_id)

    return NextResponse.json({
      success: true,
      ...stats
    })
  } catch (error) {
    console.error('Error fetching usage stats:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
