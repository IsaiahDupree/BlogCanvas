import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { sendEmail } from '@/lib/reports/email-sender';

/**
 * POST /api/scheduled-reports/process
 * Process scheduled reports that are due to run
 *
 * This endpoint should be called by a cron job (e.g., every hour or every day)
 * to check for and process any scheduled reports that need to run.
 *
 * Authentication: Requires service role key or cron secret
 */
export async function POST(request: NextRequest) {
    try {
        // Verify cron secret or service role
        const authHeader = request.headers.get('authorization');
        const cronSecret = request.headers.get('x-cron-secret');

        if (cronSecret !== process.env.CRON_SECRET && !authHeader?.includes('Bearer')) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        console.log('Processing scheduled reports...');

        // Find all active schedules that are due to run
        const { data: dueSchedules, error: fetchError } = await supabaseAdmin
            .from('scheduled_reports')
            .select(`
                *,
                website:websites(
                    id,
                    url,
                    name,
                    client:clients(
                        id,
                        name,
                        primary_contact_email
                    )
                )
            `)
            .eq('is_active', true)
            .lte('next_run_at', new Date().toISOString());

        if (fetchError) {
            console.error('Error fetching due schedules:', fetchError);
            return NextResponse.json(
                { success: false, error: fetchError.message },
                { status: 500 }
            );
        }

        if (!dueSchedules || dueSchedules.length === 0) {
            console.log('No schedules due to run');
            return NextResponse.json({
                success: true,
                message: 'No schedules due to run',
                processed: 0
            });
        }

        console.log(`Found ${dueSchedules.length} schedules due to run`);

        const results = [];

        // Process each schedule
        for (const schedule of dueSchedules) {
            try {
                console.log(`Processing schedule: ${schedule.name} (${schedule.id})`);

                // Calculate report period
                const periodEnd = new Date();
                const periodStart = calculatePeriodStart(
                    periodEnd,
                    schedule.period_length,
                    schedule.period_unit
                );

                // Create execution record
                const { data: execution, error: execError } = await supabaseAdmin
                    .from('scheduled_report_executions')
                    .insert({
                        scheduled_report_id: schedule.id,
                        execution_status: 'running',
                        period_start: periodStart.toISOString(),
                        period_end: periodEnd.toISOString()
                    })
                    .select()
                    .single();

                if (execError || !execution) {
                    console.error('Failed to create execution record:', execError);
                    results.push({
                        scheduleId: schedule.id,
                        success: false,
                        error: 'Failed to create execution record'
                    });
                    continue;
                }

                // Generate the report
                const reportResult = await generateScheduledReport({
                    schedule,
                    periodStart,
                    periodEnd
                });

                if (!reportResult.success) {
                    // Update execution as failed
                    await supabaseAdmin
                        .from('scheduled_report_executions')
                        .update({
                            execution_status: 'failed',
                            completed_at: new Date().toISOString(),
                            error_message: reportResult.error
                        })
                        .eq('id', execution.id);

                    results.push({
                        scheduleId: schedule.id,
                        success: false,
                        error: reportResult.error
                    });
                    continue;
                }

                // Send emails
                const emailResult = await sendScheduledReportEmails({
                    schedule,
                    report: reportResult.report,
                    reportContent: reportResult.content
                });

                // Update execution as completed
                await supabaseAdmin
                    .from('scheduled_report_executions')
                    .update({
                        execution_status: 'completed',
                        completed_at: new Date().toISOString(),
                        report_id: reportResult.report.id,
                        emails_sent_to: emailResult.sentTo,
                        email_sent_at: emailResult.success ? new Date().toISOString() : null,
                        email_error: emailResult.error || null
                    })
                    .eq('id', execution.id);

                // Calculate and update next run time
                const nextRunAt = calculateNextRunTime({
                    frequency: schedule.frequency,
                    dayOfWeek: schedule.day_of_week,
                    dayOfMonth: schedule.day_of_month,
                    quarterMonth: schedule.quarter_month,
                    lastRunAt: new Date()
                });

                await supabaseAdmin
                    .from('scheduled_reports')
                    .update({
                        last_run_at: new Date().toISOString(),
                        next_run_at: nextRunAt.toISOString()
                    })
                    .eq('id', schedule.id);

                results.push({
                    scheduleId: schedule.id,
                    success: true,
                    reportId: reportResult.report.id,
                    emailsSent: emailResult.sentTo.length
                });

            } catch (error: any) {
                console.error(`Error processing schedule ${schedule.id}:`, error);
                results.push({
                    scheduleId: schedule.id,
                    success: false,
                    error: error.message
                });
            }
        }

        const successCount = results.filter(r => r.success).length;
        console.log(`Processed ${results.length} schedules, ${successCount} successful`);

        return NextResponse.json({
            success: true,
            processed: results.length,
            successful: successCount,
            results
        });

    } catch (error: any) {
        console.error('Error in POST /api/scheduled-reports/process:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to process scheduled reports' },
            { status: 500 }
        );
    }
}

/**
 * Generate a report for a scheduled report
 */
async function generateScheduledReport(params: {
    schedule: any;
    periodStart: Date;
    periodEnd: Date;
}): Promise<{ success: boolean; report?: any; content?: any; error?: string }> {
    const { schedule, periodStart, periodEnd } = params;

    try {
        // Fetch posts for the period
        const postQuery = supabaseAdmin
            .from('blog_posts')
            .select('id, target_keyword, status, published_at, cms_url')
            .eq('status', 'published')
            .gte('published_at', periodStart.toISOString())
            .lte('published_at', periodEnd.toISOString());

        if (schedule.content_batch_id) {
            postQuery.eq('content_batch_id', schedule.content_batch_id);
        } else if (schedule.website_id) {
            const { data: batches } = await supabaseAdmin
                .from('content_batches')
                .select('id')
                .eq('website_id', schedule.website_id);

            if (batches && batches.length > 0) {
                postQuery.in('content_batch_id', batches.map(b => b.id));
            }
        }

        const { data: posts } = await postQuery;

        if (!posts || posts.length === 0) {
            return {
                success: false,
                error: 'No published posts found for this period'
            };
        }

        // Fetch metrics
        const postIds = posts.map(p => p.id);
        const { data: metrics } = await supabaseAdmin
            .from('blog_post_metrics')
            .select('*')
            .in('blog_post_id', postIds)
            .gte('snapshot_date', periodStart.toISOString())
            .lte('snapshot_date', periodEnd.toISOString())
            .order('snapshot_date', { ascending: false });

        // Aggregate metrics
        const aggregated = aggregateMetrics(posts, metrics || []);

        // Generate report data
        const reportData = {
            website: {
                url: schedule.website?.url || '',
                name: schedule.website?.name || schedule.website?.url
            },
            client: {
                name: schedule.website?.client?.name || 'Client',
                email: schedule.website?.client?.primary_contact_email
            },
            period: {
                start: periodStart.toISOString(),
                end: periodEnd.toISOString()
            },
            summary: aggregated,
            topPosts: getTopPosts(posts, metrics || []),
            trends: calculateTrends(metrics || [])
        };

        // Generate report content
        let reportContent: any = {};
        if (schedule.report_type === 'email') {
            reportContent = generateEmailReport(reportData);
        } else if (schedule.report_type === 'pdf') {
            reportContent = generatePDFReport(reportData);
        } else if (schedule.report_type === 'slide_deck') {
            reportContent = generateSlideReport(reportData);
        }

        // Save report to database
        const { data: savedReport } = await supabaseAdmin
            .from('reports')
            .insert({
                website_id: schedule.website_id,
                content_batch_id: schedule.content_batch_id || null,
                period_start: periodStart.toISOString(),
                period_end: periodEnd.toISOString(),
                report_type: schedule.report_type,
                generated_by: schedule.vendor_id,
                report_data: reportData
            })
            .select()
            .single();

        return {
            success: true,
            report: savedReport,
            content: reportContent
        };

    } catch (error: any) {
        console.error('Error generating report:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Send emails for a scheduled report
 */
async function sendScheduledReportEmails(params: {
    schedule: any;
    report: any;
    reportContent: any;
}): Promise<{ success: boolean; sentTo: string[]; error?: string }> {
    const { schedule, reportContent } = params;

    try {
        const recipients = schedule.recipient_emails || [];

        if (recipients.length === 0) {
            return {
                success: false,
                sentTo: [],
                error: 'No recipients specified'
            };
        }

        // Send to each recipient
        const sentTo: string[] = [];
        for (const email of recipients) {
            try {
                await sendEmail({
                    to: email,
                    subject: reportContent.subject || `Scheduled Report: ${schedule.name}`,
                    body: reportContent.body || 'Report attached',
                    html: reportContent.html || reportContent.body
                });
                sentTo.push(email);
            } catch (error) {
                console.error(`Failed to send email to ${email}:`, error);
            }
        }

        return {
            success: sentTo.length > 0,
            sentTo,
            error: sentTo.length === 0 ? 'Failed to send to any recipients' : undefined
        };

    } catch (error: any) {
        console.error('Error sending emails:', error);
        return {
            success: false,
            sentTo: [],
            error: error.message
        };
    }
}

// Helper functions (copied from report generation)

function calculatePeriodStart(endDate: Date, length: number, unit: string): Date {
    const start = new Date(endDate);

    switch (unit) {
        case 'days':
            start.setDate(start.getDate() - length);
            break;
        case 'weeks':
            start.setDate(start.getDate() - (length * 7));
            break;
        case 'months':
            start.setMonth(start.getMonth() - length);
            break;
        default:
            start.setDate(start.getDate() - length);
    }

    return start;
}

function calculateNextRunTime(params: {
    frequency: string;
    dayOfWeek?: number | null;
    dayOfMonth?: number | null;
    quarterMonth?: number | null;
    lastRunAt: Date;
}): Date {
    const { frequency, dayOfWeek, dayOfMonth, lastRunAt } = params;
    let nextRun = new Date(lastRunAt);

    switch (frequency) {
        case 'daily':
            nextRun.setDate(nextRun.getDate() + 1);
            break;

        case 'weekly':
            if (dayOfWeek !== null && dayOfWeek !== undefined) {
                nextRun.setDate(nextRun.getDate() + 7);
            }
            break;

        case 'monthly':
            if (dayOfMonth !== null && dayOfMonth !== undefined) {
                nextRun.setMonth(nextRun.getMonth() + 1);
                nextRun.setDate(Math.min(dayOfMonth, new Date(nextRun.getFullYear(), nextRun.getMonth() + 1, 0).getDate()));
            }
            break;

        case 'quarterly':
            nextRun.setMonth(nextRun.getMonth() + 3);
            break;

        default:
            nextRun.setDate(nextRun.getDate() + 1);
    }

    return nextRun;
}

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

function getTopPosts(posts: any[], metrics: any[]): any[] {
    const postMetrics = new Map<string, any>();

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

    const topPosts = posts
        .map(post => ({
            ...post,
            metrics: postMetrics.get(post.id) || { impressions: 0, clicks: 0, sessions: 0 }
        }))
        .sort((a, b) => b.metrics.clicks - a.metrics.clicks)
        .slice(0, 5);

    return topPosts;
}

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

function generateEmailReport(data: any): any {
    const { client, period, summary, topPosts, trends } = data;
    const periodStart = new Date(period.start).toLocaleDateString();
    const periodEnd = new Date(period.end).toLocaleDateString();

    const email = `
Hi ${client.name},

Here's your scheduled SEO content performance report for ${periodStart} - ${periodEnd}.

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
        subject: `Scheduled SEO Report - ${periodStart} to ${periodEnd}`,
        body: email
    };
}

function generatePDFReport(data: any): string {
    return ''; // PDF generation handled separately
}

function generateSlideReport(data: any): any[] {
    return []; // Slide generation handled separately
}
