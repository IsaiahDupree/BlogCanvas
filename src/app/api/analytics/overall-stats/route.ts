import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');

    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Build query to get latest metrics for each published post
    let postsQuery = supabase
      .from('blog_posts')
      .select(`
        id,
        status,
        client_id,
        blog_post_metrics (
          impressions,
          clicks,
          ctr,
          avg_position,
          seo_score,
          snapshot_date
        )
      `)
      .eq('status', 'published');

    // Filter by client if provided
    if (clientId) {
      postsQuery = postsQuery.eq('client_id', clientId);
    }

    const { data: posts, error: postsError } = await postsQuery;

    if (postsError) {
      console.error('Error fetching posts:', postsError);
      return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
    }

    // Calculate aggregated stats
    const totalPosts = posts?.length || 0;

    if (totalPosts === 0) {
      return NextResponse.json({
        totalPosts: 0,
        totalImpressions: 0,
        totalClicks: 0,
        avgCTR: 0,
        avgPosition: 0,
        avgSeoScore: 0,
      });
    }

    // For each post, get the latest metric snapshot
    let totalImpressions = 0;
    let totalClicks = 0;
    let totalCTR = 0;
    let totalPosition = 0;
    let totalSeoScore = 0;
    let postsWithMetrics = 0;

    posts.forEach((post) => {
      const metrics = post.blog_post_metrics;
      if (metrics && metrics.length > 0) {
        // Sort by snapshot_date descending to get the latest
        const latestMetric = metrics.sort((a, b) =>
          new Date(b.snapshot_date).getTime() - new Date(a.snapshot_date).getTime()
        )[0];

        totalImpressions += latestMetric.impressions || 0;
        totalClicks += latestMetric.clicks || 0;
        totalCTR += latestMetric.ctr || 0;
        totalPosition += latestMetric.avg_position || 0;
        totalSeoScore += latestMetric.seo_score || 0;
        postsWithMetrics++;
      }
    });

    // Calculate averages (only for posts that have metrics)
    const avgCTR = postsWithMetrics > 0 ? totalCTR / postsWithMetrics : 0;
    const avgPosition = postsWithMetrics > 0 ? totalPosition / postsWithMetrics : 0;
    const avgSeoScore = postsWithMetrics > 0 ? totalSeoScore / postsWithMetrics : 0;

    return NextResponse.json({
      totalPosts,
      totalImpressions,
      totalClicks,
      avgCTR: Math.round(avgCTR * 100) / 100, // Round to 2 decimal places
      avgPosition: Math.round(avgPosition * 10) / 10, // Round to 1 decimal place
      avgSeoScore: Math.round(avgSeoScore), // Round to nearest integer
    });

  } catch (error) {
    console.error('Error calculating overall stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
