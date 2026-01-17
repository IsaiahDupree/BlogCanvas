import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase';
import { querySearchConsole, type GSCConfig } from '@/lib/analytics/google-search-console';
import { savePostMetrics } from '@/lib/analytics/analytics-collector';

/**
 * POST /api/gsc/sync - Sync metrics from Google Search Console
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { website_id, days_back = 30 } = body;

    if (!website_id) {
      return NextResponse.json(
        { error: 'website_id is required' },
        { status: 400 }
      );
    }

    // Get GSC connection for this website
    const { data: connection, error: connError } = await supabaseAdmin
      .from('gsc_connections')
      .select('*')
      .eq('vendor_id', session.user.id)
      .eq('website_id', website_id)
      .eq('status', 'active')
      .single();

    if (connError || !connection) {
      return NextResponse.json(
        { error: 'No active GSC connection found for this website' },
        { status: 404 }
      );
    }

    // Get all published posts for this website
    const { data: posts, error: postsError } = await supabaseAdmin
      .from('blog_posts')
      .select('id, title, cms_publish_info')
      .eq('website_id', website_id)
      .eq('status', 'published')
      .not('cms_publish_info', 'is', null);

    if (postsError) {
      throw postsError;
    }

    if (!posts || posts.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No published posts to sync',
        summary: {
          total: 0,
          successful: 0,
          failed: 0,
        },
      });
    }

    // Build GSC config
    const gscConfig: GSCConfig = {
      clientId: connection.client_id_gsc,
      clientSecret: connection.client_secret_gsc,
      refreshToken: connection.refresh_token,
      siteUrl: connection.site_url,
    };

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days_back);

    const results = {
      total: posts.length,
      successful: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Sync metrics for each post
    for (const post of posts) {
      try {
        const publishInfo = post.cms_publish_info as any;
        if (!publishInfo?.url) {
          results.failed++;
          results.errors.push(`${post.title}: No published URL`);
          continue;
        }

        // Query GSC for metrics
        const metrics = await querySearchConsole(
          publishInfo.url,
          startDate,
          endDate,
          gscConfig
        );

        if (!metrics) {
          results.failed++;
          results.errors.push(`${post.title}: Failed to fetch metrics`);
          continue;
        }

        // Save metrics
        const saved = await savePostMetrics(post.id, new Date(), metrics);

        if (saved) {
          results.successful++;
        } else {
          results.failed++;
          results.errors.push(`${post.title}: Failed to save metrics`);
        }

        // Rate limiting: wait 100ms between requests
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error: any) {
        results.failed++;
        results.errors.push(`${post.title}: ${error.message}`);
      }
    }

    // Update connection sync status
    await supabaseAdmin
      .from('gsc_connections')
      .update({
        last_sync_at: new Date().toISOString(),
        last_sync_status: results.failed === 0 ? 'success' : 'partial',
        last_sync_error: results.failed > 0 ? `${results.failed} posts failed` : null,
      })
      .eq('id', connection.id);

    return NextResponse.json({
      success: true,
      summary: results,
    });
  } catch (error: any) {
    console.error('Error syncing GSC metrics:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
