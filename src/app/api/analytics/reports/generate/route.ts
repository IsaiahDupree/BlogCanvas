import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { compareMetrics } from '@/lib/analytics/metrics-collector';

export interface PerformanceReport {
  clientId: string;
  clientName: string;
  periodStart: string;
  periodEnd: string;
  summary: {
    totalPosts: number;
    postsWithMetrics: number;
    totalImpressions: number;
    totalClicks: number;
    avgPosition: number;
    avgCtr: number;
  };
  topPerformers: {
    postId: string;
    title: string;
    impressions: number;
    clicks: number;
    position: number;
  }[];
  underperformers: {
    postId: string;
    title: string;
    impressions: number;
    clicks: number;
    position: number;
    recommendation: string;
  }[];
  trends: {
    impressionsChange: number;
    clicksChange: number;
    positionChange: number;
    trend: 'improving' | 'stable' | 'declining';
  };
  recommendations: string[];
  generatedAt: string;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { clientId, periodDays = 30 } = body;

    if (!clientId) {
      return NextResponse.json({ error: 'clientId is required' }, { status: 400 });
    }

    // Get client info
    const { data: client } = await supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .single();

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const periodEnd = new Date();
    const periodStart = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000);
    const previousPeriodStart = new Date(periodStart.getTime() - periodDays * 24 * 60 * 60 * 1000);

    // Get all published posts for this client
    const { data: posts } = await supabase
      .from('blog_posts')
      .select('id, title, topic, cms_url, cms_published_at')
      .eq('client_id', clientId)
      .eq('status', 'published')
      .not('cms_published_at', 'is', null);

    if (!posts || posts.length === 0) {
      return NextResponse.json({
        success: true,
        report: {
          clientId,
          clientName: client.name,
          periodStart: periodStart.toISOString(),
          periodEnd: periodEnd.toISOString(),
          summary: {
            totalPosts: 0,
            postsWithMetrics: 0,
            totalImpressions: 0,
            totalClicks: 0,
            avgPosition: 0,
            avgCtr: 0
          },
          topPerformers: [],
          underperformers: [],
          trends: { impressionsChange: 0, clicksChange: 0, positionChange: 0, trend: 'stable' },
          recommendations: ['No published posts yet. Start publishing content to see performance data.'],
          generatedAt: new Date().toISOString()
        }
      });
    }

    // Get metrics for current period
    const { data: currentMetrics } = await supabase
      .from('blog_post_metrics')
      .select('*')
      .in('blog_post_id', posts.map(p => p.id))
      .gte('snapshot_date', periodStart.toISOString())
      .lte('snapshot_date', periodEnd.toISOString())
      .order('snapshot_date', { ascending: false });

    // Get metrics for previous period (for comparison)
    const { data: previousMetrics } = await supabase
      .from('blog_post_metrics')
      .select('*')
      .in('blog_post_id', posts.map(p => p.id))
      .gte('snapshot_date', previousPeriodStart.toISOString())
      .lt('snapshot_date', periodStart.toISOString())
      .order('snapshot_date', { ascending: false });

    // Aggregate metrics by post
    const postMetricsMap = new Map<string, any>();
    (currentMetrics || []).forEach(m => {
      if (!postMetricsMap.has(m.blog_post_id)) {
        postMetricsMap.set(m.blog_post_id, m);
      }
    });

    const previousMetricsMap = new Map<string, any>();
    (previousMetrics || []).forEach(m => {
      if (!previousMetricsMap.has(m.blog_post_id)) {
        previousMetricsMap.set(m.blog_post_id, m);
      }
    });

    // Calculate summary
    const postsWithMetrics = posts.filter(p => postMetricsMap.has(p.id));
    const totalImpressions = Array.from(postMetricsMap.values()).reduce((sum, m) => sum + (m.impressions || 0), 0);
    const totalClicks = Array.from(postMetricsMap.values()).reduce((sum, m) => sum + (m.clicks || 0), 0);
    const avgPosition = postsWithMetrics.length > 0
      ? Array.from(postMetricsMap.values()).reduce((sum, m) => sum + (m.avg_position || 0), 0) / postsWithMetrics.length
      : 0;

    // Calculate previous period totals
    const prevTotalImpressions = Array.from(previousMetricsMap.values()).reduce((sum, m) => sum + (m.impressions || 0), 0);
    const prevTotalClicks = Array.from(previousMetricsMap.values()).reduce((sum, m) => sum + (m.clicks || 0), 0);
    const prevAvgPosition = previousMetricsMap.size > 0
      ? Array.from(previousMetricsMap.values()).reduce((sum, m) => sum + (m.avg_position || 0), 0) / previousMetricsMap.size
      : 0;

    // Calculate trends
    const trends = compareMetrics(
      { impressions: totalImpressions, clicks: totalClicks, ctr: 0, avgPosition },
      { impressions: prevTotalImpressions, clicks: prevTotalClicks, ctr: 0, avgPosition: prevAvgPosition }
    );

    // Identify top performers (by clicks)
    const rankedPosts = postsWithMetrics
      .map(p => ({
        postId: p.id,
        title: p.title || p.topic,
        ...postMetricsMap.get(p.id)
      }))
      .sort((a, b) => (b.clicks || 0) - (a.clicks || 0));

    const topPerformers = rankedPosts.slice(0, 5).map(p => ({
      postId: p.postId,
      title: p.title,
      impressions: p.impressions || 0,
      clicks: p.clicks || 0,
      position: p.avg_position || 0
    }));

    // Identify underperformers (high impressions, low clicks OR poor position)
    const underperformers = rankedPosts
      .filter(p => {
        const ctr = p.impressions > 0 ? p.clicks / p.impressions : 0;
        return (p.impressions > 100 && ctr < 0.01) || (p.avg_position > 50);
      })
      .slice(0, 5)
      .map(p => {
        const ctr = p.impressions > 0 ? p.clicks / p.impressions : 0;
        let recommendation = '';
        
        if (ctr < 0.01 && p.impressions > 100) {
          recommendation = 'Low CTR - consider improving title and meta description';
        } else if (p.avg_position > 50) {
          recommendation = 'Poor ranking - add internal links and update content';
        } else {
          recommendation = 'Monitor for improvement opportunities';
        }
        
        return {
          postId: p.postId,
          title: p.title,
          impressions: p.impressions || 0,
          clicks: p.clicks || 0,
          position: p.avg_position || 0,
          recommendation
        };
      });

    // Generate recommendations
    const recommendations: string[] = [];
    
    if (trends.trend === 'improving') {
      recommendations.push('🎉 Great progress! Your content is gaining traction. Keep publishing consistently.');
    } else if (trends.trend === 'declining') {
      recommendations.push('⚠️ Performance is declining. Review underperforming content and consider updates.');
    }
    
    if (avgPosition > 30) {
      recommendations.push('📈 Average position is outside page 1. Focus on building backlinks and improving content depth.');
    }
    
    if (totalImpressions > 0 && totalClicks / totalImpressions < 0.02) {
      recommendations.push('✏️ CTR is below 2%. Optimize titles and meta descriptions for better click-through.');
    }
    
    if (postsWithMetrics.length < posts.length) {
      recommendations.push(`📊 ${posts.length - postsWithMetrics.length} posts are awaiting metrics. Check back in a few days.`);
    }
    
    if (recommendations.length === 0) {
      recommendations.push('✅ Performance is on track. Continue monitoring and publishing quality content.');
    }

    const report: PerformanceReport = {
      clientId,
      clientName: client.name,
      periodStart: periodStart.toISOString(),
      periodEnd: periodEnd.toISOString(),
      summary: {
        totalPosts: posts.length,
        postsWithMetrics: postsWithMetrics.length,
        totalImpressions,
        totalClicks,
        avgPosition: Math.round(avgPosition * 10) / 10,
        avgCtr: totalImpressions > 0 ? Math.round((totalClicks / totalImpressions) * 10000) / 100 : 0
      },
      topPerformers,
      underperformers,
      trends,
      recommendations,
      generatedAt: new Date().toISOString()
    };

    // Save report to database
    await supabase.from('reports').insert({
      website_id: null,
      report_type: 'performance_report',
      period_start: periodStart.toISOString(),
      period_end: periodEnd.toISOString(),
      generated_by: user.id,
      storage_url: null
    });

    return NextResponse.json({
      success: true,
      report
    });

  } catch (error: any) {
    console.error('Generate report error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
