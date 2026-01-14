import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all blog posts with their review history
    const { data: posts, error: postsError } = await supabase
      .from('blog_posts')
      .select(`
        id,
        topic,
        status,
        created_at,
        updated_at,
        published_at,
        seo_quality_score,
        client:clients(id, name)
      `)
      .order('created_at', { ascending: false });

    if (postsError) throw postsError;

    // Get review tasks
    const { data: reviewTasks } = await supabase
      .from('review_tasks')
      .select('*')
      .order('created_at', { ascending: false });

    // Get revisions
    const { data: revisions } = await supabase
      .from('blog_post_revisions')
      .select('*')
      .order('created_at', { ascending: false });

    // Calculate metrics
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const recentPosts = (posts || []).filter(
      (p: any) => new Date(p.created_at) >= thirtyDaysAgo
    );

    // Status distribution
    const statusCounts = (posts || []).reduce((acc: any, post: any) => {
      acc[post.status] = (acc[post.status] || 0) + 1;
      return acc;
    }, {});

    // Calculate average time to publish
    const publishedPosts = (posts || []).filter(
      (p: any) => p.status === 'published' && p.published_at
    );
    
    let avgTimeToPublish = 0;
    if (publishedPosts.length > 0) {
      const totalTime = publishedPosts.reduce((sum: number, post: any) => {
        const created = new Date(post.created_at).getTime();
        const published = new Date(post.published_at).getTime();
        return sum + (published - created);
      }, 0);
      avgTimeToPublish = Math.round(totalTime / publishedPosts.length / (1000 * 60 * 60)); // hours
    }

    // Calculate approval rate
    const reviewedPosts = (posts || []).filter(
      (p: any) => ['approved', 'published', 'rejected'].includes(p.status)
    );
    const approvedPosts = (posts || []).filter(
      (p: any) => ['approved', 'published'].includes(p.status)
    );
    const approvalRate = reviewedPosts.length > 0 
      ? Math.round((approvedPosts.length / reviewedPosts.length) * 100) 
      : 0;

    // Calculate revision stats
    const revisionCounts = (revisions || []).reduce((acc: any, rev: any) => {
      acc[rev.blog_post_id] = (acc[rev.blog_post_id] || 0) + 1;
      return acc;
    }, {});
    const revisionValues = Object.values(revisionCounts) as number[];
    const avgRevisionsPerPost = revisionValues.length > 0
      ? Math.round(revisionValues.reduce((a, b) => a + b, 0) / revisionValues.length * 10) / 10
      : 0;

    // Posts by quality score range
    const qualityDistribution = {
      excellent: (posts || []).filter((p: any) => p.seo_quality_score >= 80).length,
      good: (posts || []).filter((p: any) => p.seo_quality_score >= 60 && p.seo_quality_score < 80).length,
      fair: (posts || []).filter((p: any) => p.seo_quality_score >= 40 && p.seo_quality_score < 60).length,
      poor: (posts || []).filter((p: any) => p.seo_quality_score && p.seo_quality_score < 40).length,
      unscored: (posts || []).filter((p: any) => !p.seo_quality_score).length,
    };

    // Weekly trend
    const weeklyData = [];
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date(now);
      dayStart.setDate(dayStart.getDate() - i);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const dayPosts = (posts || []).filter((p: any) => {
        const created = new Date(p.created_at);
        return created >= dayStart && created < dayEnd;
      });

      const dayPublished = dayPosts.filter((p: any) => p.status === 'published');
      const dayApproved = dayPosts.filter((p: any) => ['approved', 'published'].includes(p.status));

      weeklyData.push({
        date: dayStart.toISOString().split('T')[0],
        created: dayPosts.length,
        published: dayPublished.length,
        approved: dayApproved.length,
      });
    }

    // Top clients by content volume
    const clientCounts = (posts || []).reduce((acc: any, post: any) => {
      if (post.client?.name) {
        acc[post.client.name] = (acc[post.client.name] || 0) + 1;
      }
      return acc;
    }, {});
    const topClients = Object.entries(clientCounts)
      .sort((a: any, b: any) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    // Review task metrics
    const pendingReviews = (reviewTasks || []).filter(
      (t: any) => t.status === 'pending'
    ).length;
    const completedReviews = (reviewTasks || []).filter(
      (t: any) => t.status === 'completed'
    ).length;

    return NextResponse.json({
      success: true,
      metrics: {
        totalPosts: (posts || []).length,
        recentPosts: recentPosts.length,
        statusCounts,
        avgTimeToPublish,
        approvalRate,
        avgRevisionsPerPost,
        qualityDistribution,
        weeklyData,
        topClients,
        reviewTasks: {
          pending: pendingReviews,
          completed: completedReviews,
          total: (reviewTasks || []).length
        },
        totalRevisions: (revisions || []).length
      }
    });

  } catch (error: any) {
    console.error('Review metrics error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
