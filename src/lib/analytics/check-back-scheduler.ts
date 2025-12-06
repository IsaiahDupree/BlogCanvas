import { supabaseAdmin } from '@/lib/supabase'

/**
 * Schedule check-backs for a published post
 * Check-backs track post performance over time
 */
export async function scheduleCheckBacks(
    postId: string,
    publishedAt: Date
): Promise<void> {
    const intervals = [
        { days: 1, label: '1 Day' },
        { days: 7, label: '1 Week' },
        { days: 30, label: '1 Month' },
        { days: 90, label: '3 Months' },
        { days: 180, label: '6 Months' },
    ]

    const checkBacks = intervals.map(interval => {
        const scheduledDate = new Date(publishedAt)
        scheduledDate.setDate(scheduledDate.getDate() + interval.days)

        return {
            blog_post_id: postId,
            scheduled_date: scheduledDate.toISOString(),
            check_type: interval.label,
            status: 'pending',
            created_at: new Date().toISOString()
        }
    })

    const { error } = await supabaseAdmin
        .from('check_back_schedules')
        .insert(checkBacks)

    if (error) {
        console.error('Failed to schedule check-backs:', error)
        throw error
    }
}

/**
 * Fetch metrics for a post (Google Analytics, Search Console)
 * This would integrate with actual analytics APIs
 */
export async function fetchPostMetrics(
    postId: string,
    postUrl: string
): Promise<{
    pageviews?: number
    unique_visitors?: number
    avg_time_on_page?: number
    bounce_rate?: number
    organic_traffic?: number
    impressions?: number
    clicks?: number
    avg_position?: number
}> {
    // TODO: Integrate with Google Analytics and Search Console APIs
    // For now, return mock data
    return {
        pageviews: Math.floor(Math.random() * 1000),
        unique_visitors: Math.floor(Math.random() * 500),
        avg_time_on_page: Math.floor(Math.random() * 300),
        bounce_rate: Math.random() * 0.8,
        organic_traffic: Math.floor(Math.random() * 300),
        impressions: Math.floor(Math.random() * 5000),
        clicks: Math.floor(Math.random() * 200),
        avg_position: Math.random() * 50 + 10
    }
}

/**
 * Get due check-backs for processing
 */
export async function getDueCheckBacks(limit: number = 100) {
    const { data, error } = await supabaseAdmin
        .from('check_back_schedules')
        .select(`
            *,
            blog_post:blog_posts(
                id,
                topic,
                cms_publish_info
            )
        `)
        .eq('status', 'pending')
        .lte('scheduled_date', new Date().toISOString())
        .limit(limit)

    if (error) {
        throw error
    }

    return data || []
}

/**
 * Process pending check-backs
 * This would be called by a cron job
 */
export async function processPendingCheckBacks(): Promise<void> {
    const { data: pendingCheckBacks, error } = await supabaseAdmin
        .from('check_back_schedules')
        .select(`
            *,
            blog_post:blog_posts(
                id,
                cms_publish_info
            )
        `)
        .eq('status', 'pending')
        .lte('scheduled_date', new Date().toISOString())

    if (error || !pendingCheckBacks) {
        console.error('Failed to fetch pending check-backs:', error)
        return
    }

    for (const checkBack of pendingCheckBacks) {
        try {
            const publishInfo = (checkBack.blog_post as any)?.cms_publish_info
            if (!publishInfo?.url) {
                continue
            }

            // Fetch metrics
            const metrics = await fetchPostMetrics(
                (checkBack.blog_post as any).id,
                publishInfo.url
            )

            // Save to blog_post_metrics
            await supabaseAdmin
                .from('blog_post_metrics')
                .insert({
                    blog_post_id: checkBack.blog_post_id,
                    check_date: new Date().toISOString(),
                    ...metrics
                })

            // Mark check-back as completed
            await supabaseAdmin
                .from('check_back_schedules')
                .update({
                    status: 'completed',
                    completed_at: new Date().toISOString()
                })
                .eq('id', checkBack.id)

        } catch (error) {
            console.error(`Failed to process check-back ${checkBack.id}:`, error)

            // Mark as failed
            await supabaseAdmin
                .from('check_back_schedules')
                .update({
                    status: 'failed',
                    error_message: (error as Error).message
                })
                .eq('id', checkBack.id)
        }
    }
}

/**
 * Mark a check-back as completed with metrics
 */
export async function markCheckBackCompleted(
    checkBackId: string,
    metrics: any
): Promise<void> {
    await supabaseAdmin
        .from('check_back_schedules')
        .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            metrics_snapshot: metrics
        })
        .eq('id', checkBackId)
}

/**
 * Get check-backs for a specific post
 */
export async function getPostCheckBacks(postId: string) {
    const { data, error } = await supabaseAdmin
        .from('check_back_schedules')
        .select('*')
        .eq('blog_post_id', postId)
        .order('scheduled_date', { ascending: true })

    if (error) {
        throw error
    }

    return data || []
}

/**
 * Get performance summary for a post
 */
export async function getPostPerformanceSummary(postId: string) {
    const { data: metrics, error } = await supabaseAdmin
        .from('blog_post_metrics')
        .select('*')
        .eq('blog_post_id', postId)
        .order('check_date', { ascending: true })

    if (error || !metrics || metrics.length === 0) {
        return null
    }

    const latest = metrics[metrics.length - 1]
    const first = metrics[0]

    return {
        latest_metrics: latest,
        total_pageviews: metrics.reduce((sum, m) => sum + (m.pageviews || 0), 0),
        avg_position: latest.avg_position,
        position_change: first.avg_position && latest.avg_position
            ? first.avg_position - latest.avg_position
            : 0,
        data_points: metrics.length
    }
}
