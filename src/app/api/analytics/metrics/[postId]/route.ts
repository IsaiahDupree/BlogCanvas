import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * GET /api/analytics/metrics/[postId] - Get metrics history for a post
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ postId: string }> }
) {
    try {
        const { postId } = await params;
        const searchParams = request.nextUrl.searchParams;
        const limit = parseInt(searchParams.get('limit') || '30');

        const { data: metrics, error } = await supabaseAdmin
            .from('blog_post_metrics')
            .select('*')
            .eq('blog_post_id', postId)
            .order('snapshot_date', { ascending: false })
            .limit(limit);

        if (error) {
            throw error;
        }

        // Calculate trends
        const trends = metrics && metrics.length > 1 ? {
            impressions: calculateTrend(metrics, 'impressions'),
            clicks: calculateTrend(metrics, 'clicks'),
            ctr: calculateTrend(metrics, 'ctr'),
            avg_position: calculateTrend(metrics, 'avg_position'),
            seo_score: calculateTrend(metrics, 'seo_score')
        } : null;

        return NextResponse.json({
            success: true,
            metrics: metrics || [],
            trends
        });

    } catch (error: any) {
        console.error('Error fetching metrics:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

/**
 * Calculate trend (increase/decrease) between first and last metric
 */
function calculateTrend(metrics: any[], field: string): {
    change: number;
    percentChange: number;
    direction: 'up' | 'down' | 'stable';
} {
    if (metrics.length < 2) {
        return { change: 0, percentChange: 0, direction: 'stable' };
    }

    const first = metrics[metrics.length - 1][field] || 0;
    const last = metrics[0][field] || 0;
    const change = last - first;
    const percentChange = first > 0 ? (change / first) * 100 : 0;

    let direction: 'up' | 'down' | 'stable' = 'stable';
    if (Math.abs(percentChange) > 5) {
        direction = percentChange > 0 ? 'up' : 'down';
    }

    return { change, percentChange, direction };
}

