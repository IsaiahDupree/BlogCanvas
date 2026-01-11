import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAuth } from '@/lib/supabase/server';
import { sendReportEmail } from '@/lib/reports/email-sender';
import { htmlToPDF, generatePDFFilename } from '@/lib/reports/pdf-generator';

/**
 * Send report via email
 * POST /api/reports/[id]/send-email
 *
 * Body: {
 *   recipientEmail?: string (optional, defaults to client email)
 *   includePDF?: boolean (optional, attach PDF if report type is email)
 * }
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        await requireAuth();
        const body = await request.json();
        const { recipientEmail, includePDF = false } = body;

        // Fetch the report
        const { data: report, error } = await supabaseAdmin
            .from('reports')
            .select(`
                *,
                website:websites(
                    url,
                    name,
                    client:clients(
                        name,
                        primary_contact_email
                    )
                )
            `)
            .eq('id', id)
            .single();

        if (error || !report) {
            return NextResponse.json(
                { success: false, error: 'Report not found' },
                { status: 404 }
            );
        }

        const reportData = report.report_data as any;
        const client = (report.website as any)?.client;
        const recipientTo = recipientEmail || client?.primary_contact_email;

        if (!recipientTo) {
            return NextResponse.json(
                { success: false, error: 'No recipient email provided' },
                { status: 400 }
            );
        }

        // Generate email content based on report type
        let subject: string;
        let body: string;
        let pdfAttachment: { filename: string; content: Buffer } | undefined;

        if (report.report_type === 'email') {
            // Email report type - use email format
            const emailContent = generateEmailReportContent(reportData);
            subject = emailContent.subject;
            body = emailContent.body;

            // Optionally attach PDF version
            if (includePDF) {
                const pdfHTML = generatePDFReportHTML(reportData);
                const pdfBuffer = await htmlToPDF(pdfHTML);
                const filename = generatePDFFilename(
                    client?.name || 'client',
                    report.period_start,
                    report.period_end
                );
                pdfAttachment = { filename, content: pdfBuffer };
            }

        } else if (report.report_type === 'pdf') {
            // PDF report type - generate PDF and attach
            const pdfHTML = generatePDFReportHTML(reportData);
            const pdfBuffer = await htmlToPDF(pdfHTML);
            const filename = generatePDFFilename(
                client?.name || 'client',
                report.period_start,
                report.period_end
            );

            const periodStart = new Date(report.period_start).toLocaleDateString();
            const periodEnd = new Date(report.period_end).toLocaleDateString();

            subject = `SEO Performance Report - ${periodStart} to ${periodEnd}`;
            body = `Hi ${client?.name || 'there'},\n\nPlease find your SEO performance report attached.\n\nPeriod: ${periodStart} to ${periodEnd}\n\nBest regards,\nYour SEO Team`;
            pdfAttachment = { filename, content: pdfBuffer };

        } else {
            return NextResponse.json(
                { success: false, error: 'Email sending not supported for this report type' },
                { status: 400 }
            );
        }

        // Send email
        const emailResult = await sendReportEmail(
            recipientTo,
            subject,
            body,
            pdfAttachment
        );

        if (!emailResult.success) {
            return NextResponse.json(
                { success: false, error: emailResult.error || 'Failed to send email' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Email sent successfully',
            emailId: emailResult.id
        });

    } catch (error: any) {
        console.error('Error sending report email:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to send email' },
            { status: 500 }
        );
    }
}

/**
 * Generate email report content
 */
function generateEmailReportContent(data: any): { subject: string; body: string } {
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
 * Generate PDF HTML from report data
 */
function generatePDFReportHTML(data: any): string {
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
