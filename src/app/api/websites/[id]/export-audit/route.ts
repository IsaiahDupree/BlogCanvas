import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { htmlToPDF, generatePDFFilename } from '@/lib/reports/pdf-generator';

// POST /api/websites/[id]/export-audit - Generate SEO audit report PDF
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { includeHistory = false, limit = 10 } = body;

        // Fetch website with client info
        const { data: website, error: websiteError } = await supabaseAdmin
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
            .eq('id', id)
            .single();

        if (websiteError || !website) {
            return NextResponse.json(
                { success: false, error: 'Website not found' },
                { status: 404 }
            );
        }

        // Fetch latest SEO audit
        const { data: latestAudit } = await supabaseAdmin
            .from('seo_audits')
            .select('*')
            .eq('website_id', id)
            .order('audit_date', { ascending: false })
            .limit(1)
            .single();

        if (!latestAudit) {
            return NextResponse.json(
                { success: false, error: 'No audit data found for this website' },
                { status: 404 }
            );
        }

        // Optionally fetch audit history
        let auditHistory: any[] = [];
        if (includeHistory) {
            const { data: audits } = await supabaseAdmin
                .from('seo_audits')
                .select('*')
                .eq('website_id', id)
                .order('audit_date', { ascending: false })
                .limit(limit);
            auditHistory = audits || [];
        }

        // Fetch topic clusters
        const { data: topicClusters } = await supabaseAdmin
            .from('topic_clusters')
            .select('*')
            .eq('website_id', id)
            .order('difficulty', { ascending: true });

        // Fetch content gaps
        const { data: contentGaps } = await supabaseAdmin
            .from('content_gaps')
            .select('*')
            .eq('website_id', id)
            .limit(20);

        const client = (website as any).client;
        const clientName = client?.name || 'Valued Client';

        // Generate PDF HTML
        const html = generateAuditReportHTML({
            website,
            client,
            latestAudit,
            auditHistory,
            topicClusters: topicClusters || [],
            contentGaps: contentGaps || [],
        });

        // Convert to PDF
        const pdfBuffer = await htmlToPDF(html);

        // Generate filename
        const filename = `seo_audit_${website.url.replace(/https?:\/\//, '').replace(/\W+/g, '_')}_${
            new Date(latestAudit.audit_date).toISOString().split('T')[0]
        }.pdf`;

        // Return PDF as download
        return new NextResponse(pdfBuffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${filename}"`,
                'Content-Length': pdfBuffer.length.toString(),
            },
        });
    } catch (error) {
        console.error('Error generating audit report:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to generate audit report' },
            { status: 500 }
        );
    }
}

function generateAuditReportHTML(data: {
    website: any;
    client: any;
    latestAudit: any;
    auditHistory: any[];
    topicClusters: any[];
    contentGaps: any[];
}): string {
    const { website, client, latestAudit, auditHistory, topicClusters, contentGaps } = data;
    const clientName = client?.name || 'Valued Client';
    const auditDate = new Date(latestAudit.audit_date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    const scoreColor = latestAudit.baseline_score >= 80 ? '#10b981'
        : latestAudit.baseline_score >= 60 ? '#f59e0b'
        : latestAudit.baseline_score >= 40 ? '#f97316'
        : '#ef4444';

    const scoreRating = latestAudit.baseline_score >= 80 ? 'Excellent'
        : latestAudit.baseline_score >= 60 ? 'Good'
        : latestAudit.baseline_score >= 40 ? 'Fair'
        : 'Needs Improvement';

    // Calculate trend if history available
    let trendHTML = '';
    if (auditHistory.length >= 2) {
        const oldest = auditHistory[auditHistory.length - 1];
        const scoreChange = latestAudit.baseline_score - oldest.baseline_score;
        const percentChange = oldest.baseline_score > 0
            ? ((scoreChange / oldest.baseline_score) * 100).toFixed(1)
            : '0';
        const trendIcon = scoreChange > 0 ? '↑' : scoreChange < 0 ? '↓' : '→';
        const trendColor = scoreChange > 0 ? '#10b981' : scoreChange < 0 ? '#ef4444' : '#6b7280';

        trendHTML = `
            <div style="margin-top: 20px; padding: 15px; background: #f9fafb; border-left: 4px solid ${trendColor};">
                <div style="font-size: 14px; color: #6b7280; margin-bottom: 5px;">Score Trend</div>
                <div style="font-size: 24px; font-weight: bold; color: ${trendColor};">
                    ${trendIcon} ${scoreChange > 0 ? '+' : ''}${scoreChange} points (${percentChange}%)
                </div>
                <div style="font-size: 12px; color: #6b7280; margin-top: 5px;">
                    From ${new Date(oldest.audit_date).toLocaleDateString()} to ${auditDate}
                </div>
            </div>
        `;
    }

    // Topic clusters HTML
    const clustersHTML = topicClusters.slice(0, 10).map(cluster => `
        <tr>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${cluster.name}</td>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${cluster.primary_keyword}</td>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: center;">
                ${cluster.estimated_traffic?.toLocaleString() || 'N/A'}
            </td>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: center;">
                <span style="padding: 4px 8px; border-radius: 4px; font-size: 12px; background: ${
                    cluster.currently_covered ? '#d1fae5' : '#fee2e2'
                }; color: ${cluster.currently_covered ? '#065f46' : '#991b1b'};">
                    ${cluster.currently_covered ? 'Covered' : 'Gap'}
                </span>
            </td>
        </tr>
    `).join('');

    // Content gaps HTML
    const gapsHTML = contentGaps.slice(0, 10).map(gap => `
        <tr>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${gap.topic}</td>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${gap.search_volume?.toLocaleString() || 'N/A'}</td>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${gap.difficulty || 'N/A'}</td>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-size: 12px; color: #6b7280;">
                ${gap.reason || 'Opportunity identified'}
            </td>
        </tr>
    `).join('');

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                @page { margin: 40px; }
                body {
                    font-family: 'Helvetica Neue', Arial, sans-serif;
                    line-height: 1.6;
                    color: #1f2937;
                    margin: 0;
                    padding: 0;
                }
                .header {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 30px;
                    margin-bottom: 30px;
                }
                .header h1 {
                    margin: 0 0 10px 0;
                    font-size: 32px;
                }
                .header p {
                    margin: 5px 0;
                    opacity: 0.9;
                }
                .section {
                    margin-bottom: 30px;
                    page-break-inside: avoid;
                }
                .section h2 {
                    color: #667eea;
                    font-size: 20px;
                    margin-bottom: 15px;
                    border-bottom: 2px solid #667eea;
                    padding-bottom: 8px;
                }
                .score-card {
                    background: white;
                    border: 2px solid ${scoreColor};
                    border-radius: 8px;
                    padding: 20px;
                    text-align: center;
                    margin-bottom: 20px;
                }
                .score-value {
                    font-size: 64px;
                    font-weight: bold;
                    color: ${scoreColor};
                    margin: 10px 0;
                }
                .score-rating {
                    font-size: 18px;
                    color: #6b7280;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 15px;
                }
                th {
                    background: #f3f4f6;
                    padding: 12px;
                    text-align: left;
                    font-weight: 600;
                    color: #374151;
                    border-bottom: 2px solid #d1d5db;
                }
                .metric-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 15px;
                    margin-top: 15px;
                }
                .metric-card {
                    background: #f9fafb;
                    padding: 15px;
                    border-radius: 6px;
                    border-left: 4px solid #667eea;
                }
                .metric-label {
                    font-size: 12px;
                    color: #6b7280;
                    margin-bottom: 5px;
                }
                .metric-value {
                    font-size: 24px;
                    font-weight: bold;
                    color: #1f2937;
                }
                .footer {
                    margin-top: 40px;
                    padding-top: 20px;
                    border-top: 1px solid #e5e7eb;
                    text-align: center;
                    color: #6b7280;
                    font-size: 12px;
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>SEO Audit Report</h1>
                <p><strong>Client:</strong> ${clientName}</p>
                <p><strong>Website:</strong> ${website.url}</p>
                <p><strong>Audit Date:</strong> ${auditDate}</p>
            </div>

            <div class="section">
                <h2>Current SEO Score</h2>
                <div class="score-card">
                    <div class="score-value">${latestAudit.baseline_score}<span style="font-size: 32px;">/100</span></div>
                    <div class="score-rating">${scoreRating}</div>
                </div>
                ${trendHTML}
            </div>

            <div class="section">
                <h2>Audit Metrics</h2>
                <div class="metric-grid">
                    <div class="metric-card">
                        <div class="metric-label">Pages Indexed</div>
                        <div class="metric-value">${latestAudit.pages_indexed}</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-label">Topic Clusters Identified</div>
                        <div class="metric-value">${topicClusters.length}</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-label">Content Gaps Found</div>
                        <div class="metric-value">${contentGaps.length}</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-label">Coverage Rate</div>
                        <div class="metric-value">
                            ${topicClusters.length > 0
                                ? ((topicClusters.filter(c => c.currently_covered).length / topicClusters.length) * 100).toFixed(0)
                                : 0}%
                        </div>
                    </div>
                </div>
            </div>

            ${topicClusters.length > 0 ? `
                <div class="section">
                    <h2>Top Topic Clusters</h2>
                    <table>
                        <thead>
                            <tr>
                                <th>Cluster Name</th>
                                <th>Primary Keyword</th>
                                <th style="text-align: center;">Est. Traffic</th>
                                <th style="text-align: center;">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${clustersHTML}
                        </tbody>
                    </table>
                </div>
            ` : ''}

            ${contentGaps.length > 0 ? `
                <div class="section">
                    <h2>Content Opportunities</h2>
                    <table>
                        <thead>
                            <tr>
                                <th>Topic</th>
                                <th>Search Volume</th>
                                <th>Difficulty</th>
                                <th>Reason</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${gapsHTML}
                        </tbody>
                    </table>
                </div>
            ` : ''}

            <div class="footer">
                <p>Generated with BlogCanvas SEO Retainer System</p>
                <p>${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
        </body>
        </html>
    `;
}
