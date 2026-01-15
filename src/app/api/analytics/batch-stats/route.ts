import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/analytics/batch-stats
 *
 * Query params:
 * - batchId: (optional) Specific batch to get stats for
 * - clientId: (optional) Get stats for all batches of a client
 *
 * Returns aggregated metrics for specified batch or all batches
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const batchId = searchParams.get('batchId');
    const clientId = searchParams.get('clientId');

    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Build query to get posts with metrics
    let postsQuery = supabase
      .from('blog_posts')
      .select(`
        id,
        status,
        client_id,
        content_batch_id,
        blog_post_metrics (
          impressions,
          clicks,
          ctr,
          avg_position,
          seo_score,
          snapshot_date
        ),
        content_batch:content_batches (
          id,
          name,
          client_id
        )
      `)
      .eq('status', 'published')
      .not('content_batch_id', 'is', null);

    // Filter by specific batch
    if (batchId) {
      postsQuery = postsQuery.eq('content_batch_id', batchId);
    }

    // Filter by client
    if (clientId) {
      postsQuery = postsQuery.eq('client_id', clientId);
    }

    const { data: posts, error: postsError } = await postsQuery;

    if (postsError) {
      console.error('Error fetching posts:', postsError);
      return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
    }

    if (!posts || posts.length === 0) {
      return NextResponse.json({
        batches: [],
        totalBatches: 0,
      });
    }

    // Group posts by batch and calculate metrics
    const batchMap = new Map<string, {
      batchId: string;
      batchName: string;
      clientId: string;
      totalPosts: number;
      totalImpressions: number;
      totalClicks: number;
      avgCTR: number;
      avgPosition: number;
      avgSeoScore: number;
      postsWithMetrics: number;
    }>();

    posts.forEach((post) => {
      const batchId = post.content_batch_id;
      const batch = (post.content_batch as any);

      if (!batchId || !batch) return;

      // Initialize batch stats if not exists
      if (!batchMap.has(batchId)) {
        batchMap.set(batchId, {
          batchId,
          batchName: batch.name,
          clientId: batch.client_id,
          totalPosts: 0,
          totalImpressions: 0,
          totalClicks: 0,
          avgCTR: 0,
          avgPosition: 0,
          avgSeoScore: 0,
          postsWithMetrics: 0,
        });
      }

      const batchStats = batchMap.get(batchId)!;
      batchStats.totalPosts++;

      // Process metrics
      const metrics = post.blog_post_metrics;
      if (metrics && metrics.length > 0) {
        // Sort by snapshot_date descending to get the latest
        const latestMetric = metrics.sort((a, b) =>
          new Date(b.snapshot_date).getTime() - new Date(a.snapshot_date).getTime()
        )[0];

        batchStats.totalImpressions += latestMetric.impressions || 0;
        batchStats.totalClicks += latestMetric.clicks || 0;
        batchStats.avgCTR += latestMetric.ctr || 0;
        batchStats.avgPosition += latestMetric.avg_position || 0;
        batchStats.avgSeoScore += latestMetric.seo_score || 0;
        batchStats.postsWithMetrics++;
      }
    });

    // Calculate averages for each batch
    const batches = Array.from(batchMap.values()).map(batch => {
      const postsWithMetrics = batch.postsWithMetrics;
      return {
        batchId: batch.batchId,
        batchName: batch.batchName,
        clientId: batch.clientId,
        totalPosts: batch.totalPosts,
        totalImpressions: batch.totalImpressions,
        totalClicks: batch.totalClicks,
        avgCTR: postsWithMetrics > 0
          ? Math.round((batch.avgCTR / postsWithMetrics) * 100) / 100
          : 0,
        avgPosition: postsWithMetrics > 0
          ? Math.round((batch.avgPosition / postsWithMetrics) * 10) / 10
          : 0,
        avgSeoScore: postsWithMetrics > 0
          ? Math.round(batch.avgSeoScore / postsWithMetrics)
          : 0,
      };
    });

    // Sort batches by total impressions (descending)
    batches.sort((a, b) => b.totalImpressions - a.totalImpressions);

    return NextResponse.json({
      batches,
      totalBatches: batches.length,
    });

  } catch (error) {
    console.error('Error calculating batch stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
