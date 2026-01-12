/**
 * Publish Queue Job Management
 *
 * DELETE /api/publish-queue/[jobId] - Cancel a queued job
 * PATCH /api/publish-queue/[jobId] - Retry a failed job
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cancelPublishJob, retryPublishJob } from '@/lib/publishing/publish-queue-service'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
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

    const result = await cancelPublishJob(params.jobId)

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Publish job cancelled'
      })
    } else {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('[Cancel Job API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to cancel job', details: error.message },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
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

    const body = await request.json()
    const action = body.action

    if (action === 'retry') {
      const result = await retryPublishJob(params.jobId)

      if (result.success) {
        return NextResponse.json({
          success: true,
          message: 'Publish job queued for retry'
        })
      } else {
        return NextResponse.json(
          { error: result.error },
          { status: 500 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )
  } catch (error: any) {
    console.error('[Retry Job API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to retry job', details: error.message },
      { status: 500 }
    )
  }
}
