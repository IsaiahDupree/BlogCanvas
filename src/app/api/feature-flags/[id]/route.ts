/**
 * Feature Flag Detail API
 * GET /api/feature-flags/[id] - Get a specific feature flag
 * PATCH /api/feature-flags/[id] - Update a feature flag (admin only)
 * DELETE /api/feature-flags/[id] - Delete a feature flag (admin only)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { updateFeatureFlag, deleteFeatureFlag } from '@/lib/feature-flags'

async function checkAdminAccess(supabase: any, userId: string): Promise<boolean> {
  const { data: profile } = await supabase
    .from('vendor_profiles')
    .select('role')
    .eq('id', userId)
    .single()

  return profile?.role === 'admin'
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { data: flag, error } = await supabase
      .from('feature_flags')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !flag) {
      return NextResponse.json(
        { success: false, error: 'Feature flag not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      flag
    })
  } catch (error) {
    console.error('Error fetching feature flag:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check admin access
    const isAdmin = await checkAdminAccess(supabase, user.id)
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const updates: any = {}

    if (body.name !== undefined) updates.name = body.name
    if (body.description !== undefined) updates.description = body.description
    if (body.enabled !== undefined) updates.enabled = body.enabled
    if (body.rollout_percentage !== undefined) {
      if (body.rollout_percentage < 0 || body.rollout_percentage > 100) {
        return NextResponse.json(
          { success: false, error: 'Rollout percentage must be between 0 and 100' },
          { status: 400 }
        )
      }
      updates.rollout_percentage = body.rollout_percentage
    }
    if (body.targeting_rules !== undefined) updates.targeting_rules = body.targeting_rules
    if (body.metadata !== undefined) updates.metadata = body.metadata

    const flag = await updateFeatureFlag(id, updates)

    if (!flag) {
      return NextResponse.json(
        { success: false, error: 'Failed to update feature flag' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      flag
    })
  } catch (error) {
    console.error('Error updating feature flag:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check admin access
    const isAdmin = await checkAdminAccess(supabase, user.id)
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }

    const success = await deleteFeatureFlag(id)

    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Failed to delete feature flag' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Feature flag deleted'
    })
  } catch (error) {
    console.error('Error deleting feature flag:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
