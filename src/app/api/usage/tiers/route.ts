/**
 * Tier Limits API
 * GET /api/usage/tiers - Get all tier limits (pricing information)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAllTierLimits } from '@/lib/usage-tracking'

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

    const tiers = await getAllTierLimits()

    return NextResponse.json({
      success: true,
      tiers
    })
  } catch (error) {
    console.error('Error fetching tier limits:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
