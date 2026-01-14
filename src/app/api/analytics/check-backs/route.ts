import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateMockMetrics, calculatePerformanceScore } from '@/lib/analytics/metrics-collector';

// GET - List check-backs with filtering
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // pending, completed, failed
    const postId = searchParams.get('postId');
    const clientId = searchParams.get('clientId');
    const limit = parseInt(searchParams.get('limit') || '50');

    let query = supabase
      .from('check_back_schedules')
      .select(`
        *,
        blog_post:blog_posts(
          id,
          topic,
          title,
          cms_url,
          cms_published_at,
          client:clients(id, name)
        )
      `)
      .order('scheduled_date', { ascending: true })
      .limit(limit);

    if (status) {
      query = query.eq('status', status);
    }

    if (postId) {
      query = query.eq('blog_post_id', postId);
    }

    const { data: checkBacks, error } = await query;

    if (error) throw error;

    // Filter by client if specified
    let filtered = checkBacks || [];
    if (clientId) {
      filtered = filtered.filter((cb: any) => cb.blog_post?.client?.id === clientId);
    }

    // Get stats
    const stats = {
      pending: (checkBacks || []).filter((cb: any) => cb.status === 'pending').length,
      completed: (checkBacks || []).filter((cb: any) => cb.status === 'completed').length,
      failed: (checkBacks || []).filter((cb: any) => cb.status === 'failed').length,
      dueToday: (checkBacks || []).filter((cb: any) => {
        if (cb.status !== 'pending') return false;
        const scheduledDate = new Date(cb.scheduled_date);
        const today = new Date();
        return scheduledDate <= today;
      }).length
    };

    return NextResponse.json({
      success: true,
      checkBacks: filtered,
      stats
    });

  } catch (error: any) {
    console.error('Get check-backs error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}

// POST - Manually trigger a check-back or schedule new ones
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, postId, checkBackId } = body;

    if (action === 'schedule' && postId) {
      // Schedule check-backs for a post
      const { data: post } = await supabase
        .from('blog_posts')
        .select('cms_published_at')
        .eq('id', postId)
        .single();

      if (!post?.cms_published_at) {
        return NextResponse.json({ 
          error: 'Post must be published before scheduling check-backs' 
        }, { status: 400 });
      }

      const publishedAt = new Date(post.cms_published_at);
      const intervals = [
        { days: 7, type: '1 Week' },
        { days: 30, type: '1 Month' },
        { days: 60, type: '2 Months' },
        { days: 90, type: '3 Months' }
      ];

      const checkBacks = intervals.map(interval => {
        const scheduledDate = new Date(publishedAt);
        scheduledDate.setDate(scheduledDate.getDate() + interval.days);
        return {
          blog_post_id: postId,
          scheduled_date: scheduledDate.toISOString(),
          check_type: interval.type,
          status: 'pending'
        };
      });

      const { error } = await supabase
        .from('check_back_schedules')
        .insert(checkBacks);

      if (error) throw error;

      return NextResponse.json({
        success: true,
        message: `Scheduled ${checkBacks.length} check-backs`,
        checkBacks
      });
    }

    if (action === 'run' && checkBackId) {
      // Run a specific check-back now
      const { data: checkBack } = await supabase
        .from('check_back_schedules')
        .select(`
          *,
          blog_post:blog_posts(id, cms_url, cms_published_at)
        `)
        .eq('id', checkBackId)
        .single();

      if (!checkBack) {
        return NextResponse.json({ error: 'Check-back not found' }, { status: 404 });
      }

      const post = checkBack.blog_post as any;
      if (!post?.cms_url) {
        return NextResponse.json({ 
          error: 'Post has no published URL' 
        }, { status: 400 });
      }

      // Calculate days since publish
      const daysSincePublish = Math.floor(
        (Date.now() - new Date(post.cms_published_at).getTime()) / (1000 * 60 * 60 * 24)
      );

      // Generate metrics (mock for now, real integration would use GSC/GA4)
      const metrics = generateMockMetrics(daysSincePublish);
      const performanceScore = calculatePerformanceScore(metrics);

      // Save metrics
      await supabase.from('blog_post_metrics').insert({
        blog_post_id: post.id,
        snapshot_date: new Date().toISOString(),
        impressions: metrics.impressions,
        clicks: metrics.clicks,
        avg_position: metrics.avgPosition,
        sessions: metrics.pageviews,
        seo_score: performanceScore
      });

      // Update check-back status
      await supabase
        .from('check_back_schedules')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          metrics_snapshot: metrics
        })
        .eq('id', checkBackId);

      return NextResponse.json({
        success: true,
        metrics,
        performanceScore
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error: any) {
    console.error('Check-back action error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
