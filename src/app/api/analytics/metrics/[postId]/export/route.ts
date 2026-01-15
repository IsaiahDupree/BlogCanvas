import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * GET /api/analytics/metrics/[postId]/export - Export metrics history as CSV or JSON
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ postId: string }> }
) {
    try {
        const { postId } = await params;
        const searchParams = request.nextUrl.searchParams;
        const format = searchParams.get('format') || 'csv'; // csv or json
        const limit = parseInt(searchParams.get('limit') || '365'); // up to 1 year

        // Fetch post details
        const { data: post, error: postError } = await supabaseAdmin
            .from('blog_posts')
            .select('title, target_keyword')
            .eq('id', postId)
            .single();

        if (postError) {
            throw postError;
        }

        // Fetch metrics
        const { data: metrics, error: metricsError } = await supabaseAdmin
            .from('blog_post_metrics')
            .select('*')
            .eq('blog_post_id', postId)
            .order('snapshot_date', { ascending: true })
            .limit(limit);

        if (metricsError) {
            throw metricsError;
        }

        if (!metrics || metrics.length === 0) {
            return NextResponse.json(
                { success: false, error: 'No metrics data available for this post' },
                { status: 404 }
            );
        }

        // Format as CSV
        if (format === 'csv') {
            const csv = convertToCSV(metrics);
            const filename = `metrics-${sanitizeFilename(post.title || postId)}-${new Date().toISOString().split('T')[0]}.csv`;

            return new NextResponse(csv, {
                headers: {
                    'Content-Type': 'text/csv',
                    'Content-Disposition': `attachment; filename="${filename}"`,
                },
            });
        }

        // Format as JSON
        if (format === 'json') {
            const filename = `metrics-${sanitizeFilename(post.title || postId)}-${new Date().toISOString().split('T')[0]}.json`;
            const jsonData = {
                post: {
                    id: postId,
                    title: post.title,
                    target_keyword: post.target_keyword
                },
                exported_at: new Date().toISOString(),
                metrics_count: metrics.length,
                date_range: {
                    from: metrics[0].snapshot_date,
                    to: metrics[metrics.length - 1].snapshot_date
                },
                metrics: metrics.map(m => ({
                    snapshot_date: m.snapshot_date,
                    impressions: m.impressions,
                    clicks: m.clicks,
                    ctr: m.ctr,
                    avg_position: m.avg_position,
                    sessions: m.sessions,
                    time_on_page: m.time_on_page,
                    conversions: m.conversions,
                    seo_score: m.seo_score
                }))
            };

            return new NextResponse(JSON.stringify(jsonData, null, 2), {
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Disposition': `attachment; filename="${filename}"`,
                },
            });
        }

        return NextResponse.json(
            { success: false, error: 'Invalid format. Use "csv" or "json"' },
            { status: 400 }
        );

    } catch (error: any) {
        console.error('Error exporting metrics:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

/**
 * Convert metrics array to CSV format
 */
function convertToCSV(metrics: any[]): string {
    const headers = [
        'Snapshot Date',
        'Impressions',
        'Clicks',
        'CTR (%)',
        'Avg Position',
        'Sessions',
        'Time on Page (s)',
        'Conversions',
        'SEO Score'
    ];

    const rows = metrics.map(m => [
        new Date(m.snapshot_date).toISOString().split('T')[0],
        m.impressions || 0,
        m.clicks || 0,
        (m.ctr || 0).toFixed(2),
        (m.avg_position || 0).toFixed(1),
        m.sessions || 0,
        (m.time_on_page || 0).toFixed(1),
        m.conversions || 0,
        m.seo_score || 0
    ]);

    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
    ].join('\n');

    return csvContent;
}

/**
 * Sanitize filename by removing special characters
 */
function sanitizeFilename(filename: string): string {
    return filename
        .replace(/[^a-z0-9]/gi, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .substring(0, 50)
        .toLowerCase();
}
