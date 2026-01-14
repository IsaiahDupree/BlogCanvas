import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateMockMetrics, calculatePerformanceScore } from '@/lib/analytics/metrics-collector';

/**
 * Cron job endpoint to process pending check-backs
 * Should be called by Vercel Cron or external scheduler
 * 
 * To set up in vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/analytics/check-backs/process",
 *     "schedule": "0 6 * * *"
 *   }]
 * }
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    // Allow in development or with valid secret
    if (process.env.NODE_ENV === 'production' && cronSecret) {
      if (authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const supabase = await createClient();
    
    // Get pending check-backs that are due
    const { data: pendingCheckBacks, error } = await supabase
      .from('check_back_schedules')
      .select(`
        *,
        blog_post:blog_posts(
          id,
          cms_url,
          cms_published_at,
          client_id
        )
      `)
      .eq('status', 'pending')
      .lte('scheduled_date', new Date().toISOString())
      .limit(50); // Process in batches

    if (error) throw error;

    if (!pendingCheckBacks || pendingCheckBacks.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No pending check-backs to process',
        processed: 0
      });
    }

    let processed = 0;
    let failed = 0;
    const results: any[] = [];

    for (const checkBack of pendingCheckBacks) {
      try {
        const post = checkBack.blog_post as any;
        
        if (!post?.cms_url || !post?.cms_published_at) {
          // Skip posts without published URL
          await supabase
            .from('check_back_schedules')
            .update({
              status: 'skipped',
              error_message: 'Post not published or missing URL'
            })
            .eq('id', checkBack.id);
          continue;
        }

        // Calculate days since publish
        const daysSincePublish = Math.floor(
          (Date.now() - new Date(post.cms_published_at).getTime()) / (1000 * 60 * 60 * 24)
        );

        // Collect metrics
        // In production, this would use real GSC/GA4 APIs
        // For now, using mock data that simulates realistic growth curves
        const metrics = generateMockMetrics(daysSincePublish);
        const performanceScore = calculatePerformanceScore(metrics);

        // Save metrics snapshot
        await supabase.from('blog_post_metrics').insert({
          blog_post_id: post.id,
          snapshot_date: new Date().toISOString(),
          impressions: metrics.impressions,
          clicks: metrics.clicks,
          avg_position: metrics.avgPosition,
          sessions: metrics.pageviews,
          conversions: 0,
          seo_score: performanceScore
        });

        // Mark check-back as completed
        await supabase
          .from('check_back_schedules')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            metrics_snapshot: metrics
          })
          .eq('id', checkBack.id);

        processed++;
        results.push({
          checkBackId: checkBack.id,
          postId: post.id,
          status: 'completed',
          performanceScore
        });

      } catch (err: any) {
        failed++;
        
        // Mark as failed
        await supabase
          .from('check_back_schedules')
          .update({
            status: 'failed',
            error_message: err.message
          })
          .eq('id', checkBack.id);

        results.push({
          checkBackId: checkBack.id,
          status: 'failed',
          error: err.message
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${processed} check-backs, ${failed} failed`,
      processed,
      failed,
      results
    });

  } catch (error: any) {
    console.error('Process check-backs error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}

// POST - Manual trigger with optional filters
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { clientId, limit = 20 } = body;

    // Build query
    let query = supabase
      .from('check_back_schedules')
      .select(`
        *,
        blog_post:blog_posts(
          id,
          cms_url,
          cms_published_at,
          client_id
        )
      `)
      .eq('status', 'pending')
      .lte('scheduled_date', new Date().toISOString())
      .limit(limit);

    const { data: pendingCheckBacks, error } = await query;

    if (error) throw error;

    // Filter by client if specified
    let checkBacksToProcess = pendingCheckBacks || [];
    if (clientId) {
      checkBacksToProcess = checkBacksToProcess.filter(
        (cb: any) => cb.blog_post?.client_id === clientId
      );
    }

    if (checkBacksToProcess.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No pending check-backs to process',
        processed: 0
      });
    }

    let processed = 0;

    for (const checkBack of checkBacksToProcess) {
      try {
        const post = checkBack.blog_post as any;
        
        if (!post?.cms_url || !post?.cms_published_at) continue;

        const daysSincePublish = Math.floor(
          (Date.now() - new Date(post.cms_published_at).getTime()) / (1000 * 60 * 60 * 24)
        );

        const metrics = generateMockMetrics(daysSincePublish);
        const performanceScore = calculatePerformanceScore(metrics);

        await supabase.from('blog_post_metrics').insert({
          blog_post_id: post.id,
          snapshot_date: new Date().toISOString(),
          impressions: metrics.impressions,
          clicks: metrics.clicks,
          avg_position: metrics.avgPosition,
          sessions: metrics.pageviews,
          seo_score: performanceScore
        });

        await supabase
          .from('check_back_schedules')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            metrics_snapshot: metrics
          })
          .eq('id', checkBack.id);

        processed++;
      } catch (err) {
        console.error(`Failed to process check-back ${checkBack.id}:`, err);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${processed} check-backs`,
      processed
    });

  } catch (error: any) {
    console.error('Manual process check-backs error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
