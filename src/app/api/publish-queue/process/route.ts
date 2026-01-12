/**
 * POST /api/publish-queue/process
 *
 * Cron endpoint to process pending publish jobs
 * This should be called periodically (e.g., every 5 minutes) by a cron service
 *
 * Authentication: Bearer token (CRON_SECRET)
 */

import { NextRequest, NextResponse } from 'next/server'
import { processPendingPublishJobs } from '@/lib/publishing/publish-queue-service'

export async function POST(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret) {
      console.warn('CRON_SECRET not configured - publish queue processor disabled')
      return NextResponse.json(
        { error: 'CRON_SECRET not configured' },
        { status: 500 }
      )
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse request body for options
    const body = await request.json().catch(() => ({}))
    const limit = body.limit || 10
    const includeRetries = body.includeRetries !== false

    console.log(`[Publish Queue Processor] Processing up to ${limit} jobs...`)

    // Process pending jobs
    const result = await processPendingPublishJobs({
      limit,
      includeRetries
    })

    console.log(
      `[Publish Queue Processor] Completed: ${result.succeeded} succeeded, ${result.failed} failed`
    )

    return NextResponse.json({
      success: result.success,
      total: result.total,
      succeeded: result.succeeded,
      failed: result.failed,
      errors: result.errors,
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('[Publish Queue Processor] Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to process publish queue',
        details: error.message
      },
      { status: 500 }
    )
  }
}
