import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/analytics/client-stats
 *
 * Returns aggregated metrics per client, showing all clients with published posts
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all published posts with metrics and client info
    const { data: posts, error: postsError } = await supabase
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
        ),
        client:clients (
          id,
          name,
          company_name
        )
      `)
      .eq('status', 'published')
      .not('client_id', 'is', null);

    if (postsError) {
      console.error('Error fetching posts:', postsError);
      return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
    }

    if (!posts || posts.length === 0) {
      return NextResponse.json({
        clients: [],
        totalClients: 0,
      });
    }

    // Group posts by client and calculate metrics
    const clientMap = new Map<string, {
      clientId: string;
      clientName: string;
      companyName: string;
      totalPosts: number;
      totalImpressions: number;
      totalClicks: number;
      avgCTR: number;
      avgPosition: number;
      avgSeoScore: number;
      postsWithMetrics: number;
    }>();

    posts.forEach((post) => {
      const clientId = post.client_id;
      const client = (post.client as any);

      if (!clientId || !client) return;

      // Initialize client stats if not exists
      if (!clientMap.has(clientId)) {
        clientMap.set(clientId, {
          clientId,
          clientName: client.name || '',
          companyName: client.company_name || '',
          totalPosts: 0,
          totalImpressions: 0,
          totalClicks: 0,
          avgCTR: 0,
          avgPosition: 0,
          avgSeoScore: 0,
          postsWithMetrics: 0,
        });
      }

      const clientStats = clientMap.get(clientId)!;
      clientStats.totalPosts++;

      // Process metrics
      const metrics = post.blog_post_metrics;
      if (metrics && metrics.length > 0) {
        // Sort by snapshot_date descending to get the latest
        const latestMetric = metrics.sort((a, b) =>
          new Date(b.snapshot_date).getTime() - new Date(a.snapshot_date).getTime()
        )[0];

        clientStats.totalImpressions += latestMetric.impressions || 0;
        clientStats.totalClicks += latestMetric.clicks || 0;
        clientStats.avgCTR += latestMetric.ctr || 0;
        clientStats.avgPosition += latestMetric.avg_position || 0;
        clientStats.avgSeoScore += latestMetric.seo_score || 0;
        clientStats.postsWithMetrics++;
      }
    });

    // Calculate averages for each client
    const clients = Array.from(clientMap.values()).map(client => {
      const postsWithMetrics = client.postsWithMetrics;
      return {
        clientId: client.clientId,
        clientName: client.clientName,
        companyName: client.companyName,
        totalPosts: client.totalPosts,
        totalImpressions: client.totalImpressions,
        totalClicks: client.totalClicks,
        avgCTR: postsWithMetrics > 0
          ? Math.round((client.avgCTR / postsWithMetrics) * 100) / 100
          : 0,
        avgPosition: postsWithMetrics > 0
          ? Math.round((client.avgPosition / postsWithMetrics) * 10) / 10
          : 0,
        avgSeoScore: postsWithMetrics > 0
          ? Math.round(client.avgSeoScore / postsWithMetrics)
          : 0,
      };
    });

    // Sort clients by total impressions (descending)
    clients.sort((a, b) => b.totalImpressions - a.totalImpressions);

    return NextResponse.json({
      clients,
      totalClients: clients.length,
    });

  } catch (error) {
    console.error('Error calculating client stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
