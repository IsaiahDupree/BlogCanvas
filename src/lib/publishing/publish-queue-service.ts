/**
 * Publish Queue Service
 *
 * Handles scheduled batch publishing with retry logic and queue management.
 * This service is called by cron jobs to process pending publish jobs.
 *
 * Features:
 * - Queue posts for scheduled publishing
 * - Process pending jobs at scheduled time
 * - Automatic retry with exponential backoff
 * - Batch publishing support
 * - Priority queue processing
 */

import { createClient } from '@supabase/supabase-js'
import { publishToWordPress } from '@/lib/wordpress/publisher'

// Service role client (bypasses RLS for cron job)
const getServiceClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for queue processing')
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

export interface PublishQueueJob {
  id: string
  blog_post_id: string
  content_batch_id: string | null
  client_id: string
  cms_connection_id: string | null
  website_url: string
  publish_status: 'draft' | 'publish' | 'pending' | 'future'
  scheduled_for: string
  priority: number
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
  attempts: number
  max_attempts: number
  last_attempt_at: string | null
  next_retry_at: string | null
  wordpress_post_id: string | null
  published_url: string | null
  error_message: string | null
  error_details: any
  queued_by: string | null
  queued_at: string
  started_at: string | null
  completed_at: string | null
  options: any
  created_at: string
  updated_at: string
}

export interface QueueStats {
  total: number
  pending: number
  processing: number
  completed: number
  failed: number
  cancelled: number
}

export interface ProcessResult {
  success: boolean
  total: number
  succeeded: number
  failed: number
  errors: Array<{ jobId: string; error: string }>
}

/**
 * Queue a single post for publishing
 */
export async function queuePostForPublish(options: {
  blogPostId: string
  scheduledFor?: Date
  priority?: number
  cmsConnectionId?: string
  publishStatus?: 'draft' | 'publish' | 'pending' | 'future'
}): Promise<{ success: boolean; queueId?: string; error?: string }> {
  try {
    const supabase = getServiceClient()

    const scheduledFor = options.scheduledFor || new Date()
    const priority = options.priority || 5
    const publishStatus = options.publishStatus || 'publish'

    const { data, error } = await supabase.rpc('queue_post_for_publish', {
      p_blog_post_id: options.blogPostId,
      p_scheduled_for: scheduledFor.toISOString(),
      p_priority: priority,
      p_cms_connection_id: options.cmsConnectionId || null,
      p_publish_status: publishStatus
    })

    if (error) {
      console.error('Failed to queue post:', error)
      return { success: false, error: error.message }
    }

    return { success: true, queueId: data }
  } catch (error: any) {
    console.error('Error queueing post:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Queue multiple posts for batch publishing
 */
export async function queueBatchForPublish(options: {
  blogPostIds: string[]
  scheduledFor?: Date
  priority?: number
  cmsConnectionId?: string
  publishStatus?: 'draft' | 'publish' | 'pending' | 'future'
  staggerMinutes?: number // Optional: stagger posts by N minutes
}): Promise<{ success: boolean; queued: number; errors: string[] }> {
  const errors: string[] = []
  let queued = 0

  for (let i = 0; i < options.blogPostIds.length; i++) {
    const postId = options.blogPostIds[i]

    // Calculate staggered time if specified
    let scheduledFor = options.scheduledFor
    if (scheduledFor && options.staggerMinutes && i > 0) {
      scheduledFor = new Date(scheduledFor.getTime() + (i * options.staggerMinutes * 60 * 1000))
    }

    const result = await queuePostForPublish({
      blogPostId: postId,
      scheduledFor,
      priority: options.priority,
      cmsConnectionId: options.cmsConnectionId,
      publishStatus: options.publishStatus
    })

    if (result.success) {
      queued++
    } else {
      errors.push(`Post ${postId}: ${result.error}`)
    }

    // Rate limiting: wait 100ms between queue operations
    if (i < options.blogPostIds.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }

  return {
    success: queued > 0,
    queued,
    errors
  }
}

/**
 * Process a single publish job
 */
async function processPublishJob(job: PublishQueueJob): Promise<{
  success: boolean
  wordpressId?: string
  url?: string
  error?: string
  errorDetails?: any
}> {
  const supabase = getServiceClient()

  try {
    // Mark as processing
    await supabase
      .from('publish_queue')
      .update({
        status: 'processing',
        started_at: new Date().toISOString(),
        attempts: job.attempts + 1,
        last_attempt_at: new Date().toISOString()
      })
      .eq('id', job.id)

    // Get CMS credentials
    const { data: cmsConnection } = await supabase
      .from('cms_connections')
      .select('*')
      .eq('id', job.cms_connection_id)
      .single()

    if (!cmsConnection) {
      throw new Error('CMS connection not found')
    }

    const credentials = {
      username: cmsConnection.auth_payload?.username,
      appPassword: cmsConnection.auth_payload?.appPassword || cmsConnection.auth_payload?.password
    }

    // Determine publish options based on scheduled time and publish_status
    const now = new Date()
    const scheduledDate = new Date(job.scheduled_for)
    const isFutureScheduled = scheduledDate > now

    const publishOptions = {
      status: isFutureScheduled ? 'future' : job.publish_status,
      publishDate: isFutureScheduled ? scheduledDate.toISOString() : undefined
    }

    // Publish to WordPress
    const result = await publishToWordPress(
      job.blog_post_id,
      job.website_url,
      credentials,
      publishOptions
    )

    if (result.success) {
      // Mark as completed
      await supabase
        .from('publish_queue')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          wordpress_post_id: result.wordpress_id,
          published_url: result.url,
          error_message: null,
          error_details: null
        })
        .eq('id', job.id)

      return {
        success: true,
        wordpressId: result.wordpress_id,
        url: result.url
      }
    } else {
      throw new Error(result.error || 'Unknown publishing error')
    }
  } catch (error: any) {
    console.error(`Failed to process publish job ${job.id}:`, error)

    // Calculate next retry time with exponential backoff
    const nextAttempt = job.attempts + 1
    const shouldRetry = nextAttempt < job.max_attempts

    let nextRetryAt = null
    if (shouldRetry) {
      // Exponential backoff: 5 min, 15 min, 60 min
      const backoffMinutes = nextAttempt === 0 ? 5 : nextAttempt === 1 ? 15 : 60
      nextRetryAt = new Date(Date.now() + backoffMinutes * 60 * 1000).toISOString()
    }

    // Mark as failed
    await supabase
      .from('publish_queue')
      .update({
        status: 'failed',
        error_message: error.message,
        error_details: {
          error: error.message,
          stack: error.stack,
          attempt: nextAttempt
        },
        next_retry_at: nextRetryAt
      })
      .eq('id', job.id)

    return {
      success: false,
      error: error.message,
      errorDetails: error
    }
  }
}

/**
 * Process pending publish jobs (called by cron)
 */
export async function processPendingPublishJobs(options: {
  limit?: number
  includeRetries?: boolean
}): Promise<ProcessResult> {
  const limit = options.limit || 10
  const includeRetries = options.includeRetries !== false // Default true

  const supabase = getServiceClient()

  try {
    // Get pending jobs
    const { data: pendingJobs, error: pendingError } = await supabase
      .rpc('get_pending_publish_jobs', { batch_limit: limit })

    if (pendingError) {
      console.error('Failed to fetch pending jobs:', pendingError)
      throw pendingError
    }

    let jobs = pendingJobs || []

    // Get retry jobs if enabled
    if (includeRetries) {
      const { data: retryJobs, error: retryError } = await supabase
        .rpc('get_retry_publish_jobs', { batch_limit: Math.max(limit - jobs.length, 5) })

      if (!retryError && retryJobs) {
        jobs = [...jobs, ...retryJobs]
      }
    }

    if (jobs.length === 0) {
      return {
        success: true,
        total: 0,
        succeeded: 0,
        failed: 0,
        errors: []
      }
    }

    console.log(`Processing ${jobs.length} publish jobs...`)

    // Process jobs sequentially with rate limiting
    const results: ProcessResult = {
      success: true,
      total: jobs.length,
      succeeded: 0,
      failed: 0,
      errors: []
    }

    for (const job of jobs) {
      const result = await processPublishJob(job)

      if (result.success) {
        results.succeeded++
        console.log(`✓ Published post ${job.blog_post_id} to ${result.url}`)
      } else {
        results.failed++
        results.errors.push({
          jobId: job.id,
          error: result.error || 'Unknown error'
        })
        console.error(`✗ Failed to publish post ${job.blog_post_id}: ${result.error}`)
      }

      // Rate limiting: 1 second between publishes
      if (jobs.indexOf(job) < jobs.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }

    results.success = results.succeeded > 0

    return results
  } catch (error: any) {
    console.error('Error processing publish queue:', error)
    return {
      success: false,
      total: 0,
      succeeded: 0,
      failed: 0,
      errors: [{ jobId: 'system', error: error.message }]
    }
  }
}

/**
 * Get queue statistics
 */
export async function getQueueStats(options?: {
  clientId?: string
  batchId?: string
}): Promise<QueueStats | null> {
  try {
    const supabase = getServiceClient()

    let query = supabase
      .from('publish_queue')
      .select('status', { count: 'exact' })

    if (options?.clientId) {
      query = query.eq('client_id', options.clientId)
    }

    if (options?.batchId) {
      query = query.eq('content_batch_id', options.batchId)
    }

    const { data: allJobs, error } = await query

    if (error) {
      console.error('Failed to fetch queue stats:', error)
      return null
    }

    const stats: QueueStats = {
      total: allJobs?.length || 0,
      pending: allJobs?.filter(j => j.status === 'pending').length || 0,
      processing: allJobs?.filter(j => j.status === 'processing').length || 0,
      completed: allJobs?.filter(j => j.status === 'completed').length || 0,
      failed: allJobs?.filter(j => j.status === 'failed').length || 0,
      cancelled: allJobs?.filter(j => j.status === 'cancelled').length || 0
    }

    return stats
  } catch (error: any) {
    console.error('Error fetching queue stats:', error)
    return null
  }
}

/**
 * Cancel a queued publish job
 */
export async function cancelPublishJob(jobId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getServiceClient()

    const { error } = await supabase
      .from('publish_queue')
      .update({ status: 'cancelled' })
      .eq('id', jobId)
      .in('status', ['pending', 'failed']) // Can only cancel pending or failed jobs

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Retry a failed publish job immediately
 */
export async function retryPublishJob(jobId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getServiceClient()

    // Reset job to pending and clear retry timer
    const { error } = await supabase
      .from('publish_queue')
      .update({
        status: 'pending',
        next_retry_at: null,
        error_message: null,
        error_details: null
      })
      .eq('id', jobId)
      .eq('status', 'failed')

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Get upcoming scheduled publishes (for calendar view)
 */
export async function getScheduledPublishes(options?: {
  startDate?: Date
  endDate?: Date
  clientId?: string
  limit?: number
}): Promise<PublishQueueJob[]> {
  try {
    const supabase = getServiceClient()

    let query = supabase
      .from('publish_queue')
      .select('*')
      .in('status', ['pending', 'processing', 'failed'])
      .order('scheduled_for', { ascending: true })

    if (options?.startDate) {
      query = query.gte('scheduled_for', options.startDate.toISOString())
    }

    if (options?.endDate) {
      query = query.lte('scheduled_for', options.endDate.toISOString())
    }

    if (options?.clientId) {
      query = query.eq('client_id', options.clientId)
    }

    if (options?.limit) {
      query = query.limit(options.limit)
    }

    const { data, error } = await query

    if (error) {
      console.error('Failed to fetch scheduled publishes:', error)
      return []
    }

    return (data || []) as PublishQueueJob[]
  } catch (error: any) {
    console.error('Error fetching scheduled publishes:', error)
    return []
  }
}
