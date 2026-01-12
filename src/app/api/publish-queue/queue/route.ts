/**
 * POST /api/publish-queue/queue
 *
 * Queue a post or batch of posts for publishing
 *
 * Body:
 * - postId: string (single post)
 * - postIds: string[] (batch of posts)
 * - scheduledFor: ISO date string (optional, defaults to now)
 * - priority: number 1-10 (optional, defaults to 5)
 * - cmsConnectionId: string (optional, auto-detected if not provided)
 * - publishStatus: 'draft' | 'publish' | 'pending' | 'future' (optional, defaults to 'publish')
 * - staggerMinutes: number (optional, for batches - stagger posts by N minutes)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { queuePostForPublish, queueBatchForPublish } from '@/lib/publishing/publish-queue-service'

export async function POST(request: NextRequest) {
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
    const {
      postId,
      postIds,
      scheduledFor,
      priority,
      cmsConnectionId,
      publishStatus,
      staggerMinutes
    } = body

    // Validate input
    if (!postId && !postIds) {
      return NextResponse.json(
        { error: 'Either postId or postIds is required' },
        { status: 400 }
      )
    }

    const scheduledDate = scheduledFor ? new Date(scheduledFor) : undefined

    // Single post
    if (postId) {
      const result = await queuePostForPublish({
        blogPostId: postId,
        scheduledFor: scheduledDate,
        priority,
        cmsConnectionId,
        publishStatus
      })

      if (result.success) {
        return NextResponse.json({
          success: true,
          queueId: result.queueId,
          message: 'Post queued for publishing'
        })
      } else {
        return NextResponse.json(
          { error: result.error },
          { status: 500 }
        )
      }
    }

    // Batch of posts
    if (postIds && Array.isArray(postIds)) {
      const result = await queueBatchForPublish({
        blogPostIds: postIds,
        scheduledFor: scheduledDate,
        priority,
        cmsConnectionId,
        publishStatus,
        staggerMinutes
      })

      return NextResponse.json({
        success: result.success,
        queued: result.queued,
        total: postIds.length,
        errors: result.errors,
        message: `Queued ${result.queued} of ${postIds.length} posts`
      })
    }

    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    )
  } catch (error: any) {
    console.error('[Queue API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to queue posts', details: error.message },
      { status: 500 }
    )
  }
}
