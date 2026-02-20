/**
 * Feature Flags API
 * GET /api/feature-flags - List all feature flags
 * POST /api/feature-flags - Create a new feature flag (admin only)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAllFeatureFlags, createFeatureFlag } from '@/lib/feature-flags'

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

    const flags = await getAllFeatureFlags()

    return NextResponse.json({
      success: true,
      flags
    })
  } catch (error) {
    console.error('Error fetching feature flags:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

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

    // Check if user is admin
    const { data: profile } = await supabase
      .from('vendor_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { key, name, description, enabled, rollout_percentage } = body

    if (!key || !name) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: key, name' },
        { status: 400 }
      )
    }

    const flag = await createFeatureFlag({
      key,
      name,
      description: description || null,
      enabled: enabled ?? false,
      rollout_percentage: rollout_percentage ?? 0,
      targeting_rules: [],
      metadata: {}
    })

    if (!flag) {
      return NextResponse.json(
        { success: false, error: 'Failed to create feature flag' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      flag
    })
  } catch (error) {
    console.error('Error creating feature flag:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
