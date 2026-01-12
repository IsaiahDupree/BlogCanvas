/**
 * GET /api/publish-queue/stats
 *
 * Get publish queue statistics
 *
 * Query params:
 * - clientId: string (optional)
 * - batchId: string (optional)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getQueueStats } from '@/lib/publishing/publish-queue-service'

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
    const clientId = searchParams.get('clientId') || undefined
    const batchId = searchParams.get('batchId') || undefined

    const stats = await getQueueStats({ clientId, batchId })

    if (!stats) {
      return NextResponse.json(
        { error: 'Failed to fetch queue stats' },
        { status: 500 }
      )
    }

    return NextResponse.json(stats)
  } catch (error: any) {
    console.error('[Queue Stats API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stats', details: error.message },
      { status: 500 }
    )
  }
}
