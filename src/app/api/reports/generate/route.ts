import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAuth } from '@/lib/supabase/server';

/**
 * Generate analytics report for a website or content batch
 * POST /api/reports/generate
 * 
 * Body: {
 *   websiteId?: string,
 *   batchId?: string,
 *   periodStart: string (ISO date),
 *   periodEnd: string (ISO date),
 *   format: 'email' | 'pdf' | 'slide'
 * }
 */
export async function POST(request: NextRequest) {
    try {
        const { user } = await requireAuth();
        const body = await request.json();
        const { websiteId, batchId, periodStart, periodEnd, format = 'email' } = body;

        if (!periodStart || !periodEnd) {
            return NextResponse.json(
                { success: false, error: 'Period start and end dates are required' },
                { status: 400 }
            );
        }

        // Fetch website/client info
        let website = null;
        let client = null;
        let batch = null;

        if (websiteId) {
            const { data: websiteData } = await supabaseAdmin
                .from('websites')
                .select(`
                    *,
                    client:clients(
                        id,
                        name,
                        primary_contact_email,
                        client_profiles(
                            product_service_summary,
                            target_audience
                        )
                    )
                `)
                .eq('id', websiteId)
                .single();

            website = websiteData;
            client = (websiteData as any)?.client;
        }

        if (batchId) {
            const { data: batchData } = await supabaseAdmin
                .from('content_batches')
                .select(`
                    *,
                    website:websites(
                        *,
                        client:clients(
                            id,
                            name,
                            primary_contact_email
                        )
                    )
                `)
                .eq('id', batchId)
                .single();

            batch = batchData;
            if (!website) {
                website = (batchData as any)?.website;
                client = (website as any)?.client;
            }
        }

        if (!website) {
            return NextResponse.json(
                { success: false, error: 'Website or batch not found' },
                { status: 404 }
            );
        }

        // Fetch posts for the period
        const postQuery = supabaseAdmin
            .from('blog_posts')
            .select('id, target_keyword, status, published_at, cms_url')
            .eq('status', 'published')
            .gte('published_at', periodStart)
            .lte('published_at', periodEnd);

        if (batchId) {
            postQuery.eq('content_batch_id', batchId);
        } else if (websiteId) {
            // Get posts from batches linked to this website
            const { data: batches } = await supabaseAdmin
                .from('content_batches')
                .select('id')
                .eq('website_id', websiteId);

            if (batches && batches.length > 0) {
                postQuery.in('content_batch_id', batches.map(b => b.id));
            } else {
                return NextResponse.json(
                    { success: false, error: 'No posts found for this period' },
                    { status: 404 }
                );
            }
        }

        const { data: posts } = await postQuery;

        if (!posts || posts.length === 0) {
            return NextResponse.json(
                { success: false, error: 'No published posts found for this period' },
                { status: 404 }
            );
        }

        // Fetch metrics for all posts
        const postIds = posts.map(p => p.id);
        const { data: metrics } = await supabaseAdmin
            .from('blog_post_metrics')
            .select('*')
            .in('blog_post_id', postIds)
            .gte('snapshot_date', periodStart)
            .lte('snapshot_date', periodEnd)
            .order('snapshot_date', { ascending: false });

        // Aggregate metrics
        const aggregated = aggregateMetrics(posts, metrics || []);

        // Generate report content
        const reportData = {
            website: {
                url: website.url,
                name: website.name || website.url
            },
            client: {
                name: client?.name || 'Client',
                email: client?.primary_contact_email
            },
            batch: batch ? {
                name: batch.name,
                goalScoreFrom: batch.goal_score_from,
                goalScoreTo: batch.goal_score_to
            } : null,
            period: {
                start: periodStart,
                end: periodEnd
            },
            summary: aggregated,
            topPosts: getTopPosts(posts, metrics || []),
            trends: calculateTrends(metrics || [])
        };

        // Generate based on format
        let reportContent: any = {};
        if (format === 'email') {
            reportContent = generateEmailReport(reportData);
        } else if (format === 'pdf') {
            reportContent = generatePDFReport(reportData);
        } else if (format === 'slide') {
            reportContent = generateSlideReport(reportData);
        }

        // Save report to database
        const { data: savedReport } = await supabaseAdmin
            .from('reports')
            .insert({
                website_id: websiteId || (website as any).id,
                content_batch_id: batchId || null,
                period_start: periodStart,
                period_end: periodEnd,
                report_type: format,
                generated_by: user.id,
                report_data: reportData
            })
            .select()
            .single();

        return NextResponse.json({
            success: true,
            report: savedReport,
            content: reportContent
        });

    } catch (error: any) {
        console.error('Error generating report:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to generate report' },
            { status: 500 }
        );
    }
}

/**
 * Aggregate metrics across all posts
 */
function aggregateMetrics(posts: any[], metrics: any[]): any {
    const totalImpressions = metrics.reduce((sum, m) => sum + (m.impressions || 0), 0);
    const totalClicks = metrics.reduce((sum, m) => sum + (m.clicks || 0), 0);
    const totalSessions = metrics.reduce((sum, m) => sum + (m.sessions || 0), 0);
    const avgCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
    const avgPosition = metrics.length > 0
        ? metrics.reduce((sum, m) => sum + (m.avg_position || 0), 0) / metrics.length
        : 0;
    const avgSEO = metrics.length > 0
        ? metrics.filter(m => m.seo_score).reduce((sum, m) => sum + (m.seo_score || 0), 0) / metrics.filter(m => m.seo_score).length
        : 0;

    return {
        totalPosts: posts.length,
        totalImpressions,
        totalClicks,
        totalSessions,
        avgCTR: Math.round(avgCTR * 100) / 100,
        avgPosition: Math.round(avgPosition * 10) / 10,
        avgSEO: Math.round(avgSEO)
    };
}

/**
 * Get top performing posts
 */
function getTopPosts(posts: any[], metrics: any[]): any[] {
    const postMetrics = new Map<string, any>();

    // Aggregate metrics per post
    metrics.forEach(m => {
        const existing = postMetrics.get(m.blog_post_id) || {
            impressions: 0,
            clicks: 0,
            sessions: 0
        };
        postMetrics.set(m.blog_post_id, {
            impressions: existing.impressions + (m.impressions || 0),
            clicks: existing.clicks + (m.clicks || 0),
            sessions: existing.sessions + (m.sessions || 0)
        });
    });

    // Combine with post data and sort by clicks
    const topPosts = posts
        .map(post => ({
            ...post,
            metrics: postMetrics.get(post.id) || { impressions: 0, clicks: 0, sessions: 0 }
        }))
        .sort((a, b) => b.metrics.clicks - a.metrics.clicks)
        .slice(0, 5);

    return topPosts;
}

/**
 * Calculate trends
 */
function calculateTrends(metrics: any[]): any {
    if (metrics.length < 2) return null;

    const sorted = [...metrics].sort((a, b) => 
        new Date(a.snapshot_date).getTime() - new Date(b.snapshot_date).getTime()
    );

    const first = sorted[0];
    const last = sorted[sorted.length - 1];

    return {
        impressions: {
            change: (last.impressions || 0) - (first.impressions || 0),
            percentChange: first.impressions > 0 
                ? (((last.impressions || 0) - (first.impressions || 0)) / first.impressions) * 100 
                : 0
        },
        clicks: {
            change: (last.clicks || 0) - (first.clicks || 0),
            percentChange: first.clicks > 0
                ? (((last.clicks || 0) - (first.clicks || 0)) / first.clicks) * 100
                : 0
        }
    };
}

/**
 * Generate email report
 */
function generateEmailReport(data: any): any {
    const { client, period, summary, topPosts, trends } = data;
    const periodStart = new Date(period.start).toLocaleDateString();
    const periodEnd = new Date(period.end).toLocaleDateString();

    const email = `
Hi ${client.name},

Here's your monthly SEO content performance report for ${periodStart} - ${periodEnd}.

📊 Performance Summary
- Total Posts Published: ${summary.totalPosts}
- Total Impressions: ${summary.totalImpressions.toLocaleString()}
- Total Clicks: ${summary.totalClicks.toLocaleString()}
- Average CTR: ${summary.avgCTR}%
- Average Position: ${summary.avgPosition}
- Average SEO Score: ${summary.avgSEO}/100

${trends ? `
📈 Trends
- Impressions: ${trends.impressions.change >= 0 ? '+' : ''}${trends.impressions.change.toLocaleString()} (${trends.impressions.percentChange >= 0 ? '+' : ''}${trends.impressions.percentChange.toFixed(1)}%)
- Clicks: ${trends.clicks.change >= 0 ? '+' : ''}${trends.clicks.change.toLocaleString()} (${trends.clicks.percentChange >= 0 ? '+' : ''}${trends.clicks.percentChange.toFixed(1)}%)
` : ''}

🏆 Top Performing Posts
${topPosts.map((post: any, i: number) => 
    `${i + 1}. ${post.target_keyword || 'Untitled'}
   - ${post.metrics.clicks.toLocaleString()} clicks, ${post.metrics.impressions.toLocaleString()} impressions`
).join('\n')}

Best regards,
Your SEO Team
    `.trim();

    return {
        subject: `Monthly SEO Report - ${periodStart} to ${periodEnd}`,
        body: email
    };
}

/**
 * Generate PDF report HTML
 */
function generatePDFReport(data: any): string {
    const { website, client, period, summary, topPosts, trends } = data;
    const periodStart = new Date(period.start).toLocaleDateString();
    const periodEnd = new Date(period.end).toLocaleDateString();

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>SEO Performance Report - ${client.name}</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
        .header { border-bottom: 3px solid #6366f1; padding-bottom: 20px; margin-bottom: 30px; }
        .header h1 { color: #6366f1; margin: 0; }
        .section { margin-bottom: 30px; }
        .section h2 { color: #6366f1; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; }
        .metrics { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin: 20px 0; }
        .metric-card { background: #f9fafb; padding: 20px; border-radius: 8px; text-align: center; }
        .metric-value { font-size: 32px; font-weight: bold; color: #6366f1; }
        .metric-label { color: #6b7280; margin-top: 10px; }
        .top-posts { margin-top: 20px; }
        .post-item { padding: 15px; border-bottom: 1px solid #e5e7eb; }
        .post-item:last-child { border-bottom: none; }
        .footer { margin-top: 50px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>SEO Performance Report</h1>
        <p>${client.name} - ${website.url}</p>
        <p>Period: ${periodStart} to ${periodEnd}</p>
    </div>

    <div class="section">
        <h2>Performance Summary</h2>
        <div class="metrics">
            <div class="metric-card">
                <div class="metric-value">${summary.totalPosts}</div>
                <div class="metric-label">Posts Published</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${summary.totalImpressions.toLocaleString()}</div>
                <div class="metric-label">Total Impressions</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${summary.totalClicks.toLocaleString()}</div>
                <div class="metric-label">Total Clicks</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${summary.avgCTR}%</div>
                <div class="metric-label">Avg CTR</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${summary.avgPosition}</div>
                <div class="metric-label">Avg Position</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${summary.avgSEO}</div>
                <div class="metric-label">Avg SEO Score</div>
            </div>
        </div>
    </div>

    <div class="section">
        <h2>Top Performing Posts</h2>
        <div class="top-posts">
            ${topPosts.map((post: any, i: number) => `
                <div class="post-item">
                    <h3>${i + 1}. ${post.target_keyword || 'Untitled'}</h3>
                    <p>Clicks: ${post.metrics.clicks.toLocaleString()} | Impressions: ${post.metrics.impressions.toLocaleString()}</p>
                </div>
            `).join('')}
        </div>
    </div>

    <div class="footer">
        <p>Generated by BlogCanvas SEO Content Platform</p>
        <p>Report Period: ${periodStart} to ${periodEnd}</p>
    </div>
</body>
</html>
    `.trim();
}

/**
 * Generate slide deck report
 */
function generateSlideReport(data: any): any[] {
    const { client, period, summary, topPosts } = data;
    const periodStart = new Date(period.start).toLocaleDateString();
    const periodEnd = new Date(period.end).toLocaleDateString();

    return [
        {
            title: 'SEO Performance Report',
            subtitle: `${client.name}`,
            content: `Period: ${periodStart} - ${periodEnd}`
        },
        {
            title: 'Performance Summary',
            content: `Posts: ${summary.totalPosts}\nImpressions: ${summary.totalImpressions.toLocaleString()}\nClicks: ${summary.totalClicks.toLocaleString()}\nCTR: ${summary.avgCTR}%`
        },
        {
            title: 'Top Performing Posts',
            content: topPosts.map((post: any, i: number) => 
                `${i + 1}. ${post.target_keyword || 'Untitled'} - ${post.metrics.clicks.toLocaleString()} clicks`
            ).join('\n')
        }
    ];
}

