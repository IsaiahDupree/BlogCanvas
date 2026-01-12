import { NextResponse } from 'next/server';
import { createClient, requireStaff } from '@/lib/supabase/server';

/**
 * GET /api/clients/[clientId]/overview - Get client overview with relationship health metrics
 */
export async function GET(
    request: Request,
    { params }: { params: Promise<{ clientId: string }> }
) {
    try {
        await requireStaff();

        const { clientId } = await params;
        const supabase = createClient();

        // Fetch client with all related data
        const { data: client, error: clientError } = await supabase
            .from('clients')
            .select(`
                *,
                websites (
                    id,
                    url,
                    seo_audits (
                        seo_score,
                        created_at
                    )
                ),
                brand_guides (
                    id,
                    brand_voice,
                    tone,
                    status
                )
            `)
            .eq('id', clientId)
            .single();

        if (clientError || !client) {
            return NextResponse.json(
                { success: false, error: 'Client not found' },
                { status: 404 }
            );
        }

        // Get blog post stats
        const { data: postStats } = await supabase
            .rpc('get_client_post_stats', { p_client_id: clientId });

        // Get content batch stats
        const { data: batches } = await supabase
            .from('content_batches')
            .select('id, name, status, total_count, completed_count, published_count')
            .eq('client_id', clientId)
            .order('created_at', { ascending: false })
            .limit(5);

        // Get recent posts
        const { data: recentPosts } = await supabase
            .from('blog_posts')
            .select('id, topic, status, updated_at, seo_quality_score')
            .eq('client_id', clientId)
            .order('updated_at', { ascending: false })
            .limit(10);

        // Calculate relationship health score
        const healthMetrics = calculateHealthScore({
            client,
            postStats: postStats || {},
            recentPosts: recentPosts || [],
            batches: batches || []
        });

        return NextResponse.json({
            success: true,
            client,
            stats: postStats || {},
            health: healthMetrics,
            batches: batches || [],
            recentPosts: recentPosts || []
        });
    } catch (error: any) {
        console.error('Error fetching client overview:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to fetch client overview' },
            { status: error.message?.includes('Staff access required') ? 403 : 500 }
        );
    }
}

/**
 * Calculate relationship health score based on multiple factors
 */
function calculateHealthScore(data: any) {
    const { client, postStats, recentPosts, batches } = data;

    let score = 100;
    const factors: { factor: string; impact: number; description: string }[] = [];

    // Factor 1: Onboarding completion (20 points)
    if (client.status !== 'active') {
        score -= 20;
        factors.push({
            factor: 'Onboarding Not Complete',
            impact: -20,
            description: 'Client has not completed onboarding'
        });
    }

    // Factor 2: Recent content activity (20 points)
    const recentPostCount = recentPosts?.filter((p: any) =>
        new Date(p.updated_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    ).length || 0;

    if (recentPostCount === 0) {
        score -= 20;
        factors.push({
            factor: 'No Recent Activity',
            impact: -20,
            description: 'No content activity in the last 30 days'
        });
    } else if (recentPostCount < 3) {
        score -= 10;
        factors.push({
            factor: 'Low Activity',
            impact: -10,
            description: 'Less than 3 posts in the last 30 days'
        });
    }

    // Factor 3: Posts in review (15 points)
    const inReviewCount = postStats?.in_review_count || 0;
    if (inReviewCount > 5) {
        score -= 15;
        factors.push({
            factor: 'Review Backlog',
            impact: -15,
            description: `${inReviewCount} posts waiting for review`
        });
    } else if (inReviewCount > 2) {
        score -= 5;
        factors.push({
            factor: 'Review Queue',
            impact: -5,
            description: `${inReviewCount} posts in review`
        });
    }

    // Factor 4: Content quality (15 points)
    const avgSeoScore = recentPosts?.reduce((sum: number, p: any) =>
        sum + (p.seo_quality_score || 0), 0
    ) / (recentPosts?.length || 1);

    if (avgSeoScore < 60) {
        score -= 15;
        factors.push({
            factor: 'Low Content Quality',
            impact: -15,
            description: `Average SEO score: ${avgSeoScore.toFixed(0)}/100`
        });
    } else if (avgSeoScore < 75) {
        score -= 5;
        factors.push({
            factor: 'Content Quality',
            impact: -5,
            description: `Average SEO score could be improved: ${avgSeoScore.toFixed(0)}/100`
        });
    }

    // Factor 5: Publishing consistency (15 points)
    const publishedCount = postStats?.published_count || 0;
    if (publishedCount === 0) {
        score -= 15;
        factors.push({
            factor: 'No Published Content',
            impact: -15,
            description: 'No content has been published yet'
        });
    }

    // Factor 6: Active batches (10 points)
    const activeBatches = batches?.filter((b: any) => b.status === 'active').length || 0;
    if (activeBatches === 0 && client.status === 'active') {
        score -= 10;
        factors.push({
            factor: 'No Active Batches',
            impact: -10,
            description: 'No active content batches in progress'
        });
    }

    // Factor 7: Brand guide completion (5 points)
    const hasBrandGuide = client.brand_guides && client.brand_guides.length > 0;
    if (!hasBrandGuide) {
        score -= 5;
        factors.push({
            factor: 'No Brand Guide',
            impact: -5,
            description: 'Brand guide has not been created'
        });
    }

    // Ensure score doesn't go below 0
    score = Math.max(0, score);

    // Determine health status
    let status: 'excellent' | 'good' | 'fair' | 'needs_attention' | 'critical';
    let statusColor: string;
    let recommendation: string;

    if (score >= 90) {
        status = 'excellent';
        statusColor = 'green';
        recommendation = 'Relationship is thriving! Keep up the great work.';
    } else if (score >= 75) {
        status = 'good';
        statusColor = 'blue';
        recommendation = 'Relationship is healthy with minor areas for improvement.';
    } else if (score >= 60) {
        status = 'fair';
        statusColor = 'yellow';
        recommendation = 'Relationship needs attention in several areas.';
    } else if (score >= 40) {
        status = 'needs_attention';
        statusColor = 'orange';
        recommendation = 'Immediate action needed to improve relationship health.';
    } else {
        status = 'critical';
        statusColor = 'red';
        recommendation = 'Critical: Schedule a meeting to address relationship issues.';
    }

    return {
        score,
        status,
        statusColor,
        recommendation,
        factors,
        metrics: {
            onboarding_complete: client.status === 'active',
            recent_posts: recentPostCount,
            posts_in_review: inReviewCount,
            avg_seo_score: Math.round(avgSeoScore),
            published_count: publishedCount,
            active_batches: activeBatches,
            has_brand_guide: hasBrandGuide
        }
    };
}
