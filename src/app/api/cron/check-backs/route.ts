/**
 * Cron job to process pending check-backs
 * Called by Vercel Cron or external scheduler
 */

import { NextRequest, NextResponse } from 'next/server'
import { processPendingCheckBacks } from '@/lib/analytics/check-back-scheduler'

export const runtime = 'edge'
export const maxDuration = 300 // 5 minutes max

/**
 * GET /api/cron/check-backs
 * Process all pending check-backs that are due
 *
 * Security: Should be protected by CRON_SECRET environment variable
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Process pending check-backs
    await processPendingCheckBacks()

    return NextResponse.json({
      success: true,
      message: 'Processed pending check-backs',
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('Error in check-backs cron:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
