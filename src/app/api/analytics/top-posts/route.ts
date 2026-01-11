import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient()
        const searchParams = request.nextUrl.searchParams
        const limit = parseInt(searchParams.get('limit') || '5')
        const clientId = searchParams.get('clientId')

        // Get latest metrics for all published posts
        // Group by blog_post_id and get the most recent snapshot for each post
        let query = supabase
            .from('blog_post_metrics')
            .select(`
                id,
                blog_post_id,
                snapshot_date,
                impressions,
                clicks,
                ctr,
                avg_position,
                seo_score,
                blog_posts!inner (
                    id,
                    topic,
                    status,
                    client_id,
                    published_at
                )
            `)
            .eq('blog_posts.status', 'published')
            .order('snapshot_date', { ascending: false })

        // Filter by client_id if provided (for client portal)
        if (clientId) {
            query = query.eq('blog_posts.client_id', clientId)
        }

        const { data: metricsData, error: metricsError } = await query

        if (metricsError) {
            console.error('Error fetching metrics:', metricsError)
            return NextResponse.json({
                success: false,
                error: 'Failed to fetch metrics'
            }, { status: 500 })
        }

        // Group by blog_post_id and get latest metric for each post
        const latestMetricsByPost = new Map()

        if (metricsData) {
            for (const metric of metricsData) {
                const postId = metric.blog_post_id
                if (!latestMetricsByPost.has(postId)) {
                    latestMetricsByPost.set(postId, {
                        ...metric,
                        post: metric.blog_posts
                    })
                }
            }
        }

        // Convert to array and sort by impressions (or other metric)
        const topPosts = Array.from(latestMetricsByPost.values())
            .sort((a, b) => b.impressions - a.impressions)
            .slice(0, limit)
            .map(metric => ({
                postId: metric.blog_post_id,
                topic: metric.post.topic,
                publishedAt: metric.post.published_at,
                impressions: metric.impressions,
                clicks: metric.clicks,
                ctr: metric.ctr,
                avgPosition: metric.avg_position,
                seoScore: metric.seo_score,
                snapshotDate: metric.snapshot_date
            }))

        return NextResponse.json({
            success: true,
            posts: topPosts,
            count: topPosts.length
        })

    } catch (error) {
        console.error('Top posts API error:', error)
        return NextResponse.json({
            success: false,
            error: 'Internal server error'
        }, { status: 500 })
    }
}
