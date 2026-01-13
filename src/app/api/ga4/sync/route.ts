import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { syncGA4MetricsForPost } from '@/lib/analytics/google-analytics-4';

/**
 * POST /api/ga4/sync
 * Sync GA4 metrics for blog posts
 *
 * Request body:
 * - blog_post_id: UUID (optional) - specific post to sync
 * - website_id: UUID (optional) - all posts for a website
 * - date_range: { start: ISO string, end: ISO string } (optional, defaults to last 30 days)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { blog_post_id, website_id, date_range } = body;

    // Validate: must provide either blog_post_id or website_id
    if (!blog_post_id && !website_id) {
      return NextResponse.json(
        { error: 'Must provide either blog_post_id or website_id' },
        { status: 400 }
      );
    }

    // Set date range (default: last 30 days)
    const endDate = date_range?.end ? new Date(date_range.end) : new Date();
    const startDate = date_range?.start
      ? new Date(date_range.start)
      : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

    const results: any[] = [];
    const errors: any[] = [];

    if (blog_post_id) {
      // Sync single post
      const { data: post, error: postError } = await supabase
        .from('blog_posts')
        .select('id, cms_publish_info, client_id, clients(website_id)')
        .eq('id', blog_post_id)
        .single();

      if (postError || !post) {
        return NextResponse.json({ error: 'Post not found' }, { status: 404 });
      }

      const publishInfo = post.cms_publish_info as any;
      if (!publishInfo?.url) {
        return NextResponse.json(
          { error: 'Post is not published yet' },
          { status: 400 }
        );
      }

      // Get page path from URL
      const url = new URL(publishInfo.url);
      const pagePath = url.pathname;

      // Get website_id
      const websiteId = (post.clients as any)?.website_id;
      if (!websiteId) {
        return NextResponse.json(
          { error: 'Website not found for this post' },
          { status: 404 }
        );
      }

      // Sync metrics
      const result = await syncGA4MetricsForPost(
        blog_post_id,
        websiteId,
        pagePath,
        startDate,
        endDate
      );

      if (result.success) {
        results.push({ blog_post_id, status: 'success' });
      } else {
        errors.push({ blog_post_id, error: result.error });
      }
    } else if (website_id) {
      // Sync all published posts for a website
      const { data: posts, error: postsError } = await supabase
        .from('blog_posts')
        .select('id, cms_publish_info')
        .eq('status', 'published')
        .not('cms_publish_info', 'is', null)
        .eq('client_id', (
          await supabase
            .from('clients')
            .select('id')
            .eq('website_id', website_id)
            .single()
        ).data?.id || '');

      if (postsError) {
        return NextResponse.json(
          { error: 'Failed to fetch posts' },
          { status: 500 }
        );
      }

      if (!posts || posts.length === 0) {
        return NextResponse.json({
          message: 'No published posts found for this website',
          results: [],
        });
      }

      // Sync each post
      for (const post of posts) {
        const publishInfo = post.cms_publish_info as any;
        if (!publishInfo?.url) continue;

        try {
          const url = new URL(publishInfo.url);
          const pagePath = url.pathname;

          const result = await syncGA4MetricsForPost(
            post.id,
            website_id,
            pagePath,
            startDate,
            endDate
          );

          if (result.success) {
            results.push({ blog_post_id: post.id, status: 'success' });
          } else {
            errors.push({ blog_post_id: post.id, error: result.error });
          }
        } catch (error) {
          errors.push({
            blog_post_id: post.id,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }
    }

    return NextResponse.json({
      message: 'Sync completed',
      results,
      errors,
      summary: {
        total: results.length + errors.length,
        successful: results.length,
        failed: errors.length,
      },
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
