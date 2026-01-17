import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/blog-posts/[id]/conversions
 * Get conversion data for a blog post
 * Returns total conversions and per-goal breakdown
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id: postId } = await params;

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get blog post to verify access
    const { data: post, error: postError } = await supabase
      .from('blog_posts')
      .select('id, website_id')
      .eq('id', postId)
      .single();

    if (postError || !post) {
      return NextResponse.json(
        { error: 'Blog post not found' },
        { status: 404 }
      );
    }

    // Get latest metrics with conversions
    const { data: metrics, error: metricsError } = await supabase
      .from('blog_post_metrics')
      .select('*')
      .eq('blog_post_id', postId)
      .order('snapshot_date', { ascending: false })
      .limit(1)
      .single();

    if (metricsError && metricsError.code !== 'PGRST116') { // PGRST116 = no rows
      console.error('Error fetching metrics:', metricsError);
      return NextResponse.json(
        { error: 'Failed to fetch metrics' },
        { status: 500 }
      );
    }

    // Get conversion goals for this website
    const { data: goals, error: goalsError } = await supabase
      .from('conversion_goals')
      .select('*')
      .eq('website_id', post.website_id)
      .eq('is_active', true);

    if (goalsError) {
      console.error('Error fetching conversion goals:', goalsError);
      return NextResponse.json(
        { error: 'Failed to fetch conversion goals' },
        { status: 500 }
      );
    }

    // Build response
    const totalConversions = metrics?.conversions || 0;
    const goalConversions = metrics?.goal_conversions || {};

    // Map goal conversions to include goal details
    const goalBreakdown = (goals || []).map(goal => ({
      goal_id: goal.id,
      goal_name: goal.name,
      goal_type: goal.goal_type,
      conversions: goalConversions[goal.id] || 0,
      target_count: goal.target_count,
      target_value: goal.target_value,
      progress: goal.target_count
        ? ((goalConversions[goal.id] || 0) / goal.target_count) * 100
        : null,
    }));

    return NextResponse.json({
      post_id: postId,
      total_conversions: totalConversions,
      snapshot_date: metrics?.snapshot_date || null,
      goal_breakdown: goalBreakdown,
      has_metrics: !!metrics,
    });

  } catch (error) {
    console.error('Error in GET /api/blog-posts/[id]/conversions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/blog-posts/[id]/conversions/history
 * Get conversion history over time for a blog post
 */
export async function getConversionHistory(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id: postId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '30');

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get metrics history
    const { data: metricsHistory, error } = await supabase
      .from('blog_post_metrics')
      .select('snapshot_date, conversions, goal_conversions')
      .eq('blog_post_id', postId)
      .order('snapshot_date', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching conversion history:', error);
      return NextResponse.json(
        { error: 'Failed to fetch conversion history' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      post_id: postId,
      history: metricsHistory || [],
    });

  } catch (error) {
    console.error('Error in GET /api/blog-posts/[id]/conversions/history:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
