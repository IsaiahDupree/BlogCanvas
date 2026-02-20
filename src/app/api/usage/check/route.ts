/**
 * Usage Limit Check API
 * POST /api/usage/check - Check if vendor can perform an action
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkUsageLimit, UsageLimitType } from '@/lib/usage-tracking'

export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { limitType } = body

    if (!limitType) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: limitType' },
        { status: 400 }
      )
    }

    const check = await checkUsageLimit(profile.vendor_id, limitType as UsageLimitType)

    return NextResponse.json({
      success: true,
      ...check
    })
  } catch (error) {
    console.error('Error checking usage limit:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
