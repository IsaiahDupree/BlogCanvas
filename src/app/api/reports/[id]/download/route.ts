import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAuth } from '@/lib/supabase/server';
import { htmlToPDF, generatePDFFilename } from '@/lib/reports/pdf-generator';

/**
 * Download PDF report
 * GET /api/reports/[id]/download
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        await requireAuth();

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

        // Only PDF reports can be downloaded
        if (report.report_type !== 'pdf') {
            return NextResponse.json(
                { success: false, error: 'Only PDF reports can be downloaded' },
                { status: 400 }
            );
        }

        // Regenerate PDF HTML from report data
        const reportData = report.report_data as any;
        const pdfHTML = generatePDFReportHTML(reportData);

        // Convert to PDF
        const pdfBuffer = await htmlToPDF(pdfHTML);

        // Generate filename
        const client = (report.website as any)?.client;
        const filename = generatePDFFilename(
            client?.name || 'client',
            report.period_start,
            report.period_end
        );

        // Return PDF file
        return new NextResponse(pdfBuffer, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${filename}"`,
                'Content-Length': pdfBuffer.length.toString()
            }
        });

    } catch (error: any) {
        console.error('Error downloading report:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to download report' },
            { status: 500 }
        );
    }
}

/**
 * Generate PDF HTML from report data
 * (Same as in generate/route.ts)
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
