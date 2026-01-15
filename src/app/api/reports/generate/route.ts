import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAuth } from '@/lib/supabase/server';
import { generateReportNarrative, NarrativeSummary } from '@/lib/reports/narrative-generator';
import { generateHTMLSlides } from '@/lib/reports/slide-deck-generator';

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
        const user = await requireAuth();
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

        // Fetch baseline SEO audit (first audit for this website)
        const { data: audits } = await supabaseAdmin
            .from('seo_audits')
            .select('*')
            .eq('website_id', websiteId || (website as any).id)
            .order('audit_date', { ascending: true })
            .limit(2);

        const baselineAudit = audits && audits.length > 0 ? audits[0] : null;
        const latestAudit = audits && audits.length > 1 ? audits[audits.length - 1] : audits?.[0];

        // Fetch topic clusters to show coverage delta
        const { data: topicClusters } = await supabaseAdmin
            .from('topic_clusters')
            .select('*')
            .eq('website_id', websiteId || (website as any).id);

        // Aggregate metrics
        const aggregated = aggregateMetrics(posts, metrics || []);

        // Calculate topic coverage delta
        const topicCoverageDelta = calculateTopicCoverageDelta(topicClusters || [], posts);

        // Identify underperformers with recommendations
        const underperformers = identifyUnderperformers(posts, metrics || []);

        // Generate AI narrative summary
        let narrative: NarrativeSummary | null = null;
        try {
            narrative = await generateReportNarrative({
                clientName: client?.name || 'Client',
                websiteUrl: website.url,
                periodStart,
                periodEnd,
                summary: aggregated,
                baseline: baselineAudit ? {
                    score: baselineAudit.baseline_score,
                    date: baselineAudit.audit_date,
                    pagesIndexed: baselineAudit.pages_indexed
                } : undefined,
                current: latestAudit ? {
                    score: latestAudit.baseline_score,
                    date: latestAudit.audit_date,
                    pagesIndexed: latestAudit.pages_indexed
                } : undefined,
                comparison: (baselineAudit && latestAudit) ? {
                    scoreChange: latestAudit.baseline_score - baselineAudit.baseline_score,
                    scorePercentChange: baselineAudit.baseline_score > 0
                        ? (((latestAudit.baseline_score - baselineAudit.baseline_score) / baselineAudit.baseline_score) * 100).toFixed(1)
                        : '0',
                    pagesChange: latestAudit.pages_indexed - baselineAudit.pages_indexed
                } : undefined,
                topicCoverageDelta,
                topPosts: getTopPosts(posts, metrics || []),
                underperformers,
                trends: calculateTrends(metrics || []),
                batch: batch ? {
                    name: batch.name,
                    goalScoreFrom: batch.goal_score_from,
                    goalScoreTo: batch.goal_score_to
                } : undefined
            });
        } catch (error) {
            console.error('Failed to generate narrative, continuing without it:', error);
        }

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
            baseline: baselineAudit ? {
                score: baselineAudit.baseline_score,
                date: baselineAudit.audit_date,
                pagesIndexed: baselineAudit.pages_indexed
            } : null,
            current: latestAudit ? {
                score: latestAudit.baseline_score,
                date: latestAudit.audit_date,
                pagesIndexed: latestAudit.pages_indexed
            } : null,
            comparison: (baselineAudit && latestAudit) ? {
                scoreChange: latestAudit.baseline_score - baselineAudit.baseline_score,
                scorePercentChange: baselineAudit.baseline_score > 0
                    ? (((latestAudit.baseline_score - baselineAudit.baseline_score) / baselineAudit.baseline_score) * 100).toFixed(1)
                    : '0',
                pagesChange: latestAudit.pages_indexed - baselineAudit.pages_indexed
            } : null,
            topicCoverageDelta,
            topPosts: getTopPosts(posts, metrics || []),
            underperformers,
            trends: calculateTrends(metrics || []),
            narrative
        };

        // Generate based on format
        let reportContent: any = {};
        let storageUrl: string | null = null;

        if (format === 'email') {
            reportContent = generateEmailReport(reportData);
        } else if (format === 'pdf') {
            reportContent = generatePDFReport(reportData);
        } else if (format === 'slide' || format === 'slide_deck') {
            // Generate HTML slide deck with charts
            const htmlSlides = generateHTMLSlides(reportData);
            reportContent = { html: htmlSlides };

            // Upload to Supabase Storage
            try {
                const fileName = `slide-deck-${Date.now()}-${Math.random().toString(36).substring(7)}.html`;
                const filePath = `reports/${websiteId || (website as any).id}/${fileName}`;

                const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
                    .from('reports')
                    .upload(filePath, htmlSlides, {
                        contentType: 'text/html',
                        upsert: false
                    });

                if (uploadError) {
                    console.error('Failed to upload slide deck to storage:', uploadError);
                } else {
                    // Get public URL
                    const { data: urlData } = supabaseAdmin.storage
                        .from('reports')
                        .getPublicUrl(filePath);

                    storageUrl = urlData.publicUrl;
                    reportContent.url = storageUrl;
                }
            } catch (storageError) {
                console.error('Error uploading to storage:', storageError);
            }
        }

        // Save report to database
        const { data: savedReport } = await supabaseAdmin
            .from('reports')
            .insert({
                website_id: websiteId || (website as any).id,
                content_batch_id: batchId || null,
                period_start: periodStart,
                period_end: periodEnd,
                report_type: format === 'slide' ? 'slide_deck' : format,
                generated_by: user.id,
                report_data: reportData,
                storage_url: storageUrl
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
 * Calculate topic coverage delta
 */
function calculateTopicCoverageDelta(topicClusters: any[], posts: any[]): any {
    if (!topicClusters || topicClusters.length === 0) return null;

    const totalTopics = topicClusters.length;
    const coveredTopics = topicClusters.filter(tc => tc.currently_covered).length;
    const coveragePercentage = totalTopics > 0 ? (coveredTopics / totalTopics) * 100 : 0;

    // Count posts per topic cluster
    const topicPostCounts = new Map<string, number>();
    posts.forEach(post => {
        if (post.topic_cluster_id) {
            const count = topicPostCounts.get(post.topic_cluster_id) || 0;
            topicPostCounts.set(post.topic_cluster_id, count + 1);
        }
    });

    // Find gaps (uncovered high-value topics)
    const gaps = topicClusters
        .filter(tc => !tc.currently_covered && tc.estimated_traffic > 0)
        .sort((a, b) => b.estimated_traffic - a.estimated_traffic)
        .slice(0, 5)
        .map(tc => ({
            name: tc.name,
            keyword: tc.primary_keyword,
            estimatedTraffic: tc.estimated_traffic,
            difficulty: tc.difficulty
        }));

    return {
        totalTopics,
        coveredTopics,
        uncoveredTopics: totalTopics - coveredTopics,
        coveragePercentage: Math.round(coveragePercentage * 10) / 10,
        newPostsThisPeriod: posts.length,
        topGaps: gaps
    };
}

/**
 * Identify underperforming posts with recommendations
 */
function identifyUnderperformers(posts: any[], metrics: any[]): any[] {
    const postMetrics = new Map<string, any>();

    // Aggregate metrics per post
    metrics.forEach(m => {
        const existing = postMetrics.get(m.blog_post_id) || {
            impressions: 0,
            clicks: 0,
            sessions: 0,
            avgPosition: [],
            seoScores: []
        };
        postMetrics.set(m.blog_post_id, {
            impressions: existing.impressions + (m.impressions || 0),
            clicks: existing.clicks + (m.clicks || 0),
            sessions: existing.sessions + (m.sessions || 0),
            avgPosition: [...existing.avgPosition, m.avg_position || 0],
            seoScores: m.seo_score ? [...existing.seoScores, m.seo_score] : existing.seoScores
        });
    });

    // Calculate average metrics and identify underperformers
    const postsWithMetrics = posts
        .map(post => {
            const m = postMetrics.get(post.id) || { impressions: 0, clicks: 0, sessions: 0, avgPosition: [], seoScores: [] };
            const avgPos = m.avgPosition.length > 0
                ? m.avgPosition.reduce((sum: number, p: number) => sum + p, 0) / m.avgPosition.length
                : 100;
            const avgSEO = m.seoScores.length > 0
                ? m.seoScores.reduce((sum: number, s: number) => sum + s, 0) / m.seoScores.length
                : 0;
            const ctr = m.impressions > 0 ? (m.clicks / m.impressions) * 100 : 0;

            return {
                ...post,
                metrics: {
                    impressions: m.impressions,
                    clicks: m.clicks,
                    sessions: m.sessions,
                    avgPosition: Math.round(avgPos * 10) / 10,
                    avgSEO: Math.round(avgSEO),
                    ctr: Math.round(ctr * 100) / 100
                }
            };
        })
        .filter(post => post.metrics.impressions > 0); // Only posts with some traffic

    // Calculate median CTR for comparison
    const ctrs = postsWithMetrics.map(p => p.metrics.ctr).sort((a, b) => a - b);
    const medianCTR = ctrs.length > 0 ? ctrs[Math.floor(ctrs.length / 2)] : 0;

    // Identify underperformers: low CTR or high position (>20) with decent impressions
    const underperformers = postsWithMetrics
        .filter(post =>
            (post.metrics.ctr < medianCTR * 0.5 && post.metrics.impressions > 100) ||
            (post.metrics.avgPosition > 20 && post.metrics.impressions > 50)
        )
        .sort((a, b) => a.metrics.ctr - b.metrics.ctr)
        .slice(0, 5)
        .map(post => {
            const recommendations = [];

            if (post.metrics.avgPosition > 20) {
                recommendations.push('Improve content quality and depth');
                recommendations.push('Add more internal links to this post');
            }
            if (post.metrics.ctr < medianCTR * 0.5) {
                recommendations.push('Rewrite title and meta description for better CTR');
                recommendations.push('Add FAQ schema or rich snippets');
            }
            if (post.metrics.avgSEO < 70) {
                recommendations.push('Run SEO optimization pass to improve on-page SEO');
            }
            if (post.metrics.sessions < post.metrics.clicks * 0.8) {
                recommendations.push('Check for technical issues (slow load, mobile issues)');
            }

            return {
                id: post.id,
                title: post.target_keyword || 'Untitled',
                url: post.cms_url,
                metrics: post.metrics,
                recommendations
            };
        });

    return underperformers;
}

/**
 * Generate email report
 */
function generateEmailReport(data: any): any {
    const { client, batch, period, summary, baseline, current, comparison, topicCoverageDelta, topPosts, underperformers, trends, narrative } = data;
    const periodStart = new Date(period.start).toLocaleDateString();
    const periodEnd = new Date(period.end).toLocaleDateString();

    const email = `
Hi ${client.name},

Here's your ${batch ? `content batch "${batch.name}"` : 'monthly SEO content'} performance report for ${periodStart} - ${periodEnd}.

${narrative ? `
📋 EXECUTIVE SUMMARY
${narrative.executiveSummary}

${narrative.keyWins.length > 0 ? `
🎉 KEY WINS
${narrative.keyWins.map((win: string, i: number) => `${i + 1}. ${win}`).join('\n')}
` : ''}

${narrative.concernsAndOpportunities.length > 0 ? `
💡 OPPORTUNITIES FOR IMPROVEMENT
${narrative.concernsAndOpportunities.map((opp: string, i: number) => `${i + 1}. ${opp}`).join('\n')}
` : ''}
` : ''}

${batch ? `
📦 Content Batch Progress: ${batch.name}
- Goal: Increase SEO score from ${batch.goalScoreFrom || 'baseline'} to ${batch.goalScoreTo || 'target'}
- Current Score: ${current ? current.score : 'N/A'}/100
${batch.goalScoreFrom && batch.goalScoreTo && current ? `
- Progress: ${current.score >= batch.goalScoreTo ? '✅ Goal Achieved!' :
  `${Math.round(((current.score - (batch.goalScoreFrom || 0)) / ((batch.goalScoreTo || 100) - (batch.goalScoreFrom || 0))) * 100)}% toward goal`}
` : ''}
- Posts in Batch: ${summary.totalPosts}

` : ''}

${comparison ? `
📈 Baseline vs Current Comparison
- Baseline SEO Score: ${baseline.score}/100 (${new Date(baseline.date).toLocaleDateString()})
- Current SEO Score: ${current.score}/100 (${new Date(current.date).toLocaleDateString()})
- Change: ${comparison.scoreChange >= 0 ? '+' : ''}${comparison.scoreChange} points (${comparison.scorePercentChange >= 0 ? '+' : ''}${comparison.scorePercentChange}%)
- Pages Indexed: ${baseline.pagesIndexed} → ${current.pagesIndexed} (${comparison.pagesChange >= 0 ? '+' : ''}${comparison.pagesChange})
` : ''}

📊 Performance Summary
- Total Posts Published: ${summary.totalPosts}
- Total Impressions: ${summary.totalImpressions.toLocaleString()}
- Total Clicks: ${summary.totalClicks.toLocaleString()}
- Average CTR: ${summary.avgCTR}%
- Average Position: ${summary.avgPosition}
- Average SEO Score: ${summary.avgSEO}/100

${topicCoverageDelta ? `
🎯 Topic Coverage Delta
- Total Topics Identified: ${topicCoverageDelta.totalTopics}
- Topics Covered: ${topicCoverageDelta.coveredTopics} (${topicCoverageDelta.coveragePercentage}%)
- Uncovered Topics: ${topicCoverageDelta.uncoveredTopics}
- New Posts This Period: ${topicCoverageDelta.newPostsThisPeriod}
${topicCoverageDelta.topGaps.length > 0 ? `
Top Content Gaps:
${topicCoverageDelta.topGaps.map((gap: any, i: number) =>
    `${i + 1}. ${gap.name} (${gap.keyword}) - Est. ${gap.estimatedTraffic} monthly traffic`
).join('\n')}
` : ''}
` : ''}

${trends ? `
📈 Period Trends
- Impressions: ${trends.impressions.change >= 0 ? '+' : ''}${trends.impressions.change.toLocaleString()} (${trends.impressions.percentChange >= 0 ? '+' : ''}${trends.impressions.percentChange.toFixed(1)}%)
- Clicks: ${trends.clicks.change >= 0 ? '+' : ''}${trends.clicks.change.toLocaleString()} (${trends.clicks.percentChange >= 0 ? '+' : ''}${trends.clicks.percentChange.toFixed(1)}%)
` : ''}

🏆 Top Performing Posts
${topPosts.map((post: any, i: number) =>
    `${i + 1}. ${post.target_keyword || 'Untitled'}
   - ${post.metrics.clicks.toLocaleString()} clicks, ${post.metrics.impressions.toLocaleString()} impressions`
).join('\n')}

${underperformers.length > 0 ? `
⚠️ Underperformers & Recommendations
${underperformers.map((post: any, i: number) =>
    `${i + 1}. ${post.title}
   - CTR: ${post.metrics.ctr}%, Position: ${post.metrics.avgPosition}, SEO: ${post.metrics.avgSEO}/100
   Recommendations:
   ${post.recommendations.map((rec: string) => `   • ${rec}`).join('\n')}
`).join('\n')}
` : ''}

${narrative ? `
📞 TALKING POINTS FOR OUR NEXT CALL
${narrative.talkingPoints.map((point: string, i: number) => `${i + 1}. ${point}`).join('\n')}

🎯 RECOMMENDED NEXT STEPS
${narrative.nextSteps.map((step: string, i: number) => `${i + 1}. ${step}`).join('\n')}

${narrative.callToAction ? `
❓ ${narrative.callToAction}
` : ''}
` : ''}

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
    const { website, client, batch, period, summary, baseline, current, comparison, topicCoverageDelta, topPosts, underperformers, trends, narrative } = data;
    const periodStart = new Date(period.start).toLocaleDateString();
    const periodEnd = new Date(period.end).toLocaleDateString();

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>SEO Performance Report - ${client.name}${batch ? ` - ${batch.name}` : ''}</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
        .header { border-bottom: 3px solid #6366f1; padding-bottom: 20px; margin-bottom: 30px; }
        .header h1 { color: #6366f1; margin: 0; }
        .section { margin-bottom: 30px; page-break-inside: avoid; }
        .section h2 { color: #6366f1; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; }
        .metrics { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin: 20px 0; }
        .metric-card { background: #f9fafb; padding: 20px; border-radius: 8px; text-align: center; }
        .metric-card.positive { background: #ecfdf5; }
        .metric-card.negative { background: #fef2f2; }
        .metric-value { font-size: 32px; font-weight: bold; color: #6366f1; }
        .metric-value.positive { color: #10b981; }
        .metric-value.negative { color: #ef4444; }
        .metric-label { color: #6b7280; margin-top: 10px; }
        .comparison-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin: 20px 0; }
        .top-posts { margin-top: 20px; }
        .post-item { padding: 15px; border-bottom: 1px solid #e5e7eb; }
        .post-item:last-child { border-bottom: none; }
        .recommendation { background: #fef3c7; padding: 10px; margin: 5px 0; border-radius: 4px; font-size: 14px; }
        .recommendation ul { margin: 5px 0; padding-left: 20px; }
        .gap-item { background: #f3f4f6; padding: 10px; margin: 5px 0; border-radius: 4px; }
        .footer { margin-top: 50px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>SEO Performance Report</h1>
        <p>${client.name} - ${website.url}</p>
        ${batch ? `<p><strong>Content Batch:</strong> ${batch.name}</p>` : ''}
        <p>Period: ${periodStart} to ${periodEnd}</p>
    </div>

    ${batch ? `
    <div class="section">
        <h2>Content Batch Progress</h2>
        <p style="font-size: 16px;"><strong>${batch.name}</strong></p>
        <div class="metrics">
            <div class="metric-card">
                <div class="metric-value">${batch.goalScoreFrom || 'N/A'}</div>
                <div class="metric-label">Starting Goal</div>
            </div>
            <div class="metric-card ${current && batch.goalScoreTo && current.score >= batch.goalScoreTo ? 'positive' : ''}">
                <div class="metric-value ${current && batch.goalScoreTo && current.score >= batch.goalScoreTo ? 'positive' : ''}">${current ? current.score : 'N/A'}</div>
                <div class="metric-label">Current Score</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${batch.goalScoreTo || 'N/A'}</div>
                <div class="metric-label">Target Goal</div>
            </div>
        </div>
        ${batch.goalScoreFrom && batch.goalScoreTo && current ? `
        <div style="background: ${current.score >= batch.goalScoreTo ? '#ecfdf5' : '#fef3c7'}; padding: 20px; border-radius: 8px; margin-top: 20px; text-align: center;">
            <strong>${current.score >= batch.goalScoreTo ? '✅ Goal Achieved!' :
                `Progress: ${Math.round(((current.score - batch.goalScoreFrom) / (batch.goalScoreTo - batch.goalScoreFrom)) * 100)}% toward goal`}</strong>
        </div>
        ` : ''}
        <p style="margin-top: 20px;"><strong>Posts in Batch:</strong> ${summary.totalPosts}</p>
    </div>
    ` : ''}

    ${narrative ? `
    <div class="section">
        <h2>Executive Summary</h2>
        <p style="font-size: 16px; line-height: 1.6; margin: 20px 0;">${narrative.executiveSummary}</p>

        ${narrative.keyWins.length > 0 ? `
        <h3 style="color: #10b981; margin-top: 20px;">Key Wins</h3>
        <ul style="line-height: 1.8;">
            ${narrative.keyWins.map((win: string) => `<li>${win}</li>`).join('')}
        </ul>
        ` : ''}

        ${narrative.concernsAndOpportunities.length > 0 ? `
        <h3 style="color: #f59e0b; margin-top: 20px;">Opportunities for Improvement</h3>
        <ul style="line-height: 1.8;">
            ${narrative.concernsAndOpportunities.map((opp: string) => `<li>${opp}</li>`).join('')}
        </ul>
        ` : ''}
    </div>
    ` : ''}

    ${comparison ? `
    <div class="section">
        <h2>Baseline vs Current Comparison</h2>
        <div class="comparison-grid">
            <div class="metric-card">
                <div class="metric-value">${baseline.score}/100</div>
                <div class="metric-label">Baseline SEO Score<br/>(${new Date(baseline.date).toLocaleDateString()})</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${current.score}/100</div>
                <div class="metric-label">Current SEO Score<br/>(${new Date(current.date).toLocaleDateString()})</div>
            </div>
        </div>
        <div class="metrics">
            <div class="metric-card ${Number(comparison.scoreChange) >= 0 ? 'positive' : 'negative'}">
                <div class="metric-value ${Number(comparison.scoreChange) >= 0 ? 'positive' : 'negative'}">
                    ${Number(comparison.scoreChange) >= 0 ? '+' : ''}${comparison.scoreChange}
                </div>
                <div class="metric-label">Score Change (${Number(comparison.scorePercentChange) >= 0 ? '+' : ''}${comparison.scorePercentChange}%)</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${baseline.pagesIndexed}</div>
                <div class="metric-label">Baseline Pages Indexed</div>
            </div>
            <div class="metric-card ${Number(comparison.pagesChange) >= 0 ? 'positive' : 'negative'}">
                <div class="metric-value ${Number(comparison.pagesChange) >= 0 ? 'positive' : 'negative'}">
                    ${current.pagesIndexed} (${Number(comparison.pagesChange) >= 0 ? '+' : ''}${comparison.pagesChange})
                </div>
                <div class="metric-label">Current Pages Indexed</div>
            </div>
        </div>
    </div>
    ` : ''}

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

    ${topicCoverageDelta ? `
    <div class="section">
        <h2>Topic Coverage Delta</h2>
        <div class="metrics">
            <div class="metric-card">
                <div class="metric-value">${topicCoverageDelta.totalTopics}</div>
                <div class="metric-label">Total Topics</div>
            </div>
            <div class="metric-card positive">
                <div class="metric-value positive">${topicCoverageDelta.coveredTopics}</div>
                <div class="metric-label">Covered (${topicCoverageDelta.coveragePercentage}%)</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${topicCoverageDelta.uncoveredTopics}</div>
                <div class="metric-label">Uncovered</div>
            </div>
        </div>
        ${topicCoverageDelta.topGaps.length > 0 ? `
        <h3 style="margin-top: 20px;">Top Content Gaps</h3>
        ${topicCoverageDelta.topGaps.map((gap: any, i: number) => `
            <div class="gap-item">
                <strong>${i + 1}. ${gap.name}</strong> (${gap.keyword})<br/>
                Est. Traffic: ${gap.estimatedTraffic}/month | Difficulty: ${gap.difficulty}
            </div>
        `).join('')}
        ` : ''}
    </div>
    ` : ''}

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

    ${underperformers.length > 0 ? `
    <div class="section">
        <h2>Underperformers & Recommendations</h2>
        ${underperformers.map((post: any, i: number) => `
            <div class="post-item">
                <h3>${i + 1}. ${post.title}</h3>
                <p>CTR: ${post.metrics.ctr}% | Position: ${post.metrics.avgPosition} | SEO Score: ${post.metrics.avgSEO}/100</p>
                <div class="recommendation">
                    <strong>Recommendations:</strong>
                    <ul>
                        ${post.recommendations.map((rec: string) => `<li>${rec}</li>`).join('')}
                    </ul>
                </div>
            </div>
        `).join('')}
    </div>
    ` : ''}

    ${narrative ? `
    <div class="section">
        <h2>Client Call Talking Points</h2>
        <ul style="line-height: 1.8; font-size: 15px;">
            ${narrative.talkingPoints.map((point: string) => `<li>${point}</li>`).join('')}
        </ul>

        <h3 style="margin-top: 20px;">Recommended Next Steps</h3>
        <ul style="line-height: 1.8; font-size: 15px;">
            ${narrative.nextSteps.map((step: string) => `<li>${step}</li>`).join('')}
        </ul>

        ${narrative.callToAction ? `
        <div style="background: #dbeafe; padding: 20px; border-radius: 8px; margin-top: 20px; border-left: 4px solid #3b82f6;">
            <strong>Question for Discussion:</strong> ${narrative.callToAction}
        </div>
        ` : ''}
    </div>
    ` : ''}

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
    const { client, batch, period, summary, baseline, current, comparison, topicCoverageDelta, topPosts, underperformers, narrative } = data;
    const periodStart = new Date(period.start).toLocaleDateString();
    const periodEnd = new Date(period.end).toLocaleDateString();

    const slides: any[] = [
        {
            title: 'SEO Performance Report',
            subtitle: `${client.name}${batch ? ` - ${batch.name}` : ''}`,
            content: `Period: ${periodStart} - ${periodEnd}`
        }
    ];

    // Add batch progress slide if batch exists
    if (batch) {
        const progress = batch.goalScoreFrom && batch.goalScoreTo && current
            ? Math.round(((current.score - batch.goalScoreFrom) / (batch.goalScoreTo - batch.goalScoreFrom)) * 100)
            : null;

        slides.push({
            title: 'Content Batch Progress',
            content: `Batch: ${batch.name}\n\nStarting Goal: ${batch.goalScoreFrom || 'N/A'}\nCurrent Score: ${current ? current.score : 'N/A'}/100\nTarget Goal: ${batch.goalScoreTo || 'N/A'}\n\n${progress !== null ? `Progress: ${progress}% toward goal${current && batch.goalScoreTo && current.score >= batch.goalScoreTo ? ' ✅ Goal Achieved!' : ''}` : ''}\n\nPosts in Batch: ${summary.totalPosts}`
        });
    }

    if (narrative) {
        slides.push({
            title: 'Executive Summary',
            content: narrative.executiveSummary
        });

        if (narrative.keyWins.length > 0) {
            slides.push({
                title: 'Key Wins',
                content: narrative.keyWins.map((win: string, i: number) => `${i + 1}. ${win}`).join('\n\n')
            });
        }
    }

    if (comparison) {
        slides.push({
            title: 'Baseline vs Current',
            content: `Baseline: ${baseline.score}/100 (${new Date(baseline.date).toLocaleDateString()})\nCurrent: ${current.score}/100 (${new Date(current.date).toLocaleDateString()})\nChange: ${Number(comparison.scoreChange) >= 0 ? '+' : ''}${comparison.scoreChange} points (${Number(comparison.scorePercentChange) >= 0 ? '+' : ''}${comparison.scorePercentChange}%)\nPages: ${baseline.pagesIndexed} → ${current.pagesIndexed} (${Number(comparison.pagesChange) >= 0 ? '+' : ''}${comparison.pagesChange})`
        });
    }

    slides.push({
        title: 'Performance Summary',
        content: `Posts: ${summary.totalPosts}\nImpressions: ${summary.totalImpressions.toLocaleString()}\nClicks: ${summary.totalClicks.toLocaleString()}\nCTR: ${summary.avgCTR}%\nAvg Position: ${summary.avgPosition}\nAvg SEO Score: ${summary.avgSEO}/100`
    });

    if (topicCoverageDelta) {
        slides.push({
            title: 'Topic Coverage',
            content: `Total Topics: ${topicCoverageDelta.totalTopics}\nCovered: ${topicCoverageDelta.coveredTopics} (${topicCoverageDelta.coveragePercentage}%)\nUncovered: ${topicCoverageDelta.uncoveredTopics}\nNew Posts: ${topicCoverageDelta.newPostsThisPeriod}`
        });

        if (topicCoverageDelta.topGaps.length > 0) {
            slides.push({
                title: 'Top Content Gaps',
                content: topicCoverageDelta.topGaps.map((gap: any, i: number) =>
                    `${i + 1}. ${gap.name} (${gap.keyword})\n   Est. ${gap.estimatedTraffic}/mo traffic`
                ).join('\n\n')
            });
        }
    }

    slides.push({
        title: 'Top Performing Posts',
        content: topPosts.map((post: any, i: number) =>
            `${i + 1}. ${post.target_keyword || 'Untitled'}\n   ${post.metrics.clicks.toLocaleString()} clicks, ${post.metrics.impressions.toLocaleString()} impressions`
        ).join('\n\n')
    });

    if (underperformers.length > 0) {
        slides.push({
            title: 'Underperformers',
            content: underperformers.map((post: any, i: number) =>
                `${i + 1}. ${post.title}\n   CTR: ${post.metrics.ctr}%, Pos: ${post.metrics.avgPosition}\n   Fix: ${post.recommendations[0]}`
            ).join('\n\n')
        });

        if (narrative && narrative.talkingPoints.length > 0) {
            slides.push({
                title: 'Client Call Talking Points',
                content: narrative.talkingPoints.map((point: string, i: number) => `${i + 1}. ${point}`).join('\n\n')
            });
        }

        if (narrative && narrative.nextSteps.length > 0) {
            slides.push({
                title: 'Recommended Next Steps',
                content: narrative.nextSteps.map((step: string, i: number) => `${i + 1}. ${step}`).join('\n\n')
            });
        }
    }

    return slides;
}

