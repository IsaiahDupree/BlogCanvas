/**
 * Feature Flag Check API
 * POST /api/feature-flags/check - Check if a feature is enabled for the current user
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isFeatureEnabled } from '@/lib/feature-flags'

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

    const body = await request.json()
    const { flagKey, entityType, entityId } = body

    if (!flagKey) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: flagKey' },
        { status: 400 }
      )
    }

    // Use the current user if no entity specified
    const effectiveEntityType = entityType || 'user'
    const effectiveEntityId = entityId || user.id

    const enabled = await isFeatureEnabled(
      flagKey,
      effectiveEntityType,
      effectiveEntityId
    )

    return NextResponse.json({
      success: true,
      enabled,
      flagKey,
      entityType: effectiveEntityType,
      entityId: effectiveEntityId
    })
  } catch (error) {
    console.error('Error checking feature flag:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
