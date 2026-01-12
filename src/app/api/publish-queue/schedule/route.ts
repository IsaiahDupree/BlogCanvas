/**
 * GET /api/publish-queue/schedule
 *
 * Get scheduled publishes for calendar view
 *
 * Query params:
 * - startDate: ISO date string (optional)
 * - endDate: ISO date string (optional)
 * - clientId: string (optional)
 * - limit: number (optional)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getScheduledPublishes } from '@/lib/publishing/publish-queue-service'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
      ? new Date(searchParams.get('startDate')!)
      : undefined
    const endDate = searchParams.get('endDate')
      ? new Date(searchParams.get('endDate')!)
      : undefined
    const clientId = searchParams.get('clientId') || undefined
    const limit = searchParams.get('limit')
      ? parseInt(searchParams.get('limit')!)
      : undefined

    const schedules = await getScheduledPublishes({
      startDate,
      endDate,
      clientId,
      limit
    })

    return NextResponse.json({
      success: true,
      count: schedules.length,
      schedules
    })
  } catch (error: any) {
    console.error('[Schedule API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch schedules', details: error.message },
      { status: 500 }
    )
  }
}
