import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * Generate pitch document (PDF/Email) for a website
 * POST /api/websites/[id]/generate-pitch
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { format = 'email', projection } = body; // format: 'email' | 'pdf' | 'slide'

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
                        target_audience,
                        positioning
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
        const { data: audit } = await supabaseAdmin
            .from('seo_audits')
            .select('*')
            .eq('website_id', id)
            .order('audit_date', { ascending: false })
            .limit(1)
            .single();

        // Fetch topic clusters
        const { data: clusters } = await supabaseAdmin
            .from('topic_clusters')
            .select('*')
            .eq('website_id', id)
            .limit(10);

        // Fetch content gaps
        const { data: gaps } = await supabaseAdmin
            .from('content_gaps')
            .select('*')
            .eq('website_id', id)
            .eq('status', 'open')
            .limit(10);

        const client = (website as any).client;
        const clientProfile = client?.client_profiles?.[0];

        // Generate pitch content
        const pitchData = {
            website: {
                url: website.url,
                name: website.name || website.url
            },
            client: {
                name: client?.name || 'Client',
                email: client?.primary_contact_email,
                productSummary: clientProfile?.product_service_summary,
                targetAudience: clientProfile?.target_audience,
                positioning: clientProfile?.positioning
            },
            audit: {
                baselineScore: audit?.baseline_score || 0,
                auditDate: audit?.audit_date,
                pagesIndexed: audit?.pages_indexed || 0
            },
            projection: projection || {
                current_score: audit?.baseline_score || 0,
                target_score: 78,
                score_increase: 0,
                recommended_posts: 0,
                timeline_months: 6
            },
            clusters: clusters || [],
            gaps: gaps || []
        };

        // Generate based on format
        if (format === 'email') {
            const emailContent = generateEmailPitch(pitchData);
            return NextResponse.json({
                success: true,
                format: 'email',
                content: emailContent,
                subject: `SEO Content Plan to Grow ${client?.name || 'Your Brand'}'s Organic Reach`
            });
        } else if (format === 'pdf') {
            // For PDF, we'll return HTML that can be converted to PDF
            const pdfHtml = generatePDFPitch(pitchData);
            return NextResponse.json({
                success: true,
                format: 'pdf',
                html: pdfHtml
            });
        } else if (format === 'slide') {
            const slideContent = generateSlidePitch(pitchData);
            return NextResponse.json({
                success: true,
                format: 'slide',
                slides: slideContent
            });
        }

        return NextResponse.json(
            { success: false, error: 'Invalid format' },
            { status: 400 }
        );

    } catch (error) {
        console.error('Error generating pitch:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to generate pitch' },
            { status: 500 }
        );
    }
}

/**
 * Generate email pitch content
 */
function generateEmailPitch(data: any): string {
    const { client, audit, projection, clusters, gaps } = data;
    const clientName = client.name || 'there';
    const currentScore = projection.current_score;
    const targetScore = projection.target_score;
    const scoreIncrease = projection.score_increase;
    const recommendedPosts = projection.recommended_posts;
    const timelineMonths = projection.timeline_months;

    // Get top uncovered clusters
    const uncoveredClusters = clusters
        .filter((c: any) => !c.currently_covered)
        .slice(0, 3)
        .map((c: any) => c.name);

    const email = `
Hi ${clientName},

We ran an SEO and content audit on ${data.website.url}. Right now, your content sits around an overall SEO score of ${currentScore}/100, with strong coverage in your current content, but untapped opportunities in:

${uncoveredClusters.map((name: string) => `- ${name}`).join('\n')}

Based on your goals, we recommend a ${recommendedPosts}-post blog package over the next ${timelineMonths} months. This would:

- Fill critical topic gaps in your niche
- Target keywords with combined estimated traffic potential
- Realistically move your SEO score from ${currentScore} → ${targetScore} over the campaign window

Our system will:
- Generate high-quality, fact-checked, SEO-optimized blogs tailored to your brand voice
- Route everything through human review before you ever see it
- Push approved posts directly to your WordPress
- Track performance and send you clear, non-fluffy reports each month

If you'd like, I can walk you through the proposed topics and forecast in a quick call this week.

Best regards,
Your CSM Team
    `.trim();

    return email;
}

/**
 * Generate PDF pitch HTML
 */
function generatePDFPitch(data: any): string {
    const { client, audit, projection, clusters, gaps } = data;
    const currentScore = projection.current_score;
    const targetScore = projection.target_score;
    const scoreIncrease = projection.score_increase;
    const recommendedPosts = projection.recommended_posts;
    const timelineMonths = projection.timeline_months;

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>SEO Content Plan - ${client.name}</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
        .header { border-bottom: 3px solid #6366f1; padding-bottom: 20px; margin-bottom: 30px; }
        .header h1 { color: #6366f1; margin: 0; }
        .section { margin-bottom: 30px; }
        .section h2 { color: #6366f1; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; }
        .score-comparison { display: flex; justify-content: space-around; margin: 30px 0; }
        .score-box { text-align: center; padding: 20px; border-radius: 8px; }
        .current-score { background: #fee2e2; }
        .target-score { background: #d1fae5; }
        .score-value { font-size: 48px; font-weight: bold; }
        .metrics { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin: 20px 0; }
        .metric-card { background: #f9fafb; padding: 20px; border-radius: 8px; text-align: center; }
        .metric-value { font-size: 32px; font-weight: bold; color: #6366f1; }
        .metric-label { color: #6b7280; margin-top: 10px; }
        .footer { margin-top: 50px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>SEO Content Plan</h1>
        <p>${client.name} - ${data.website.url}</p>
        <p>Generated: ${new Date().toLocaleDateString()}</p>
    </div>

    <div class="section">
        <h2>Current SEO Status</h2>
        <p>Baseline SEO Score: <strong>${currentScore}/100</strong></p>
        <p>Pages Indexed: ${audit.pagesIndexed || 0}</p>
        <p>Audit Date: ${audit.auditDate ? new Date(audit.auditDate).toLocaleDateString() : 'N/A'}</p>
    </div>

    <div class="section">
        <h2>Projected Growth</h2>
        <div class="score-comparison">
            <div class="score-box current-score">
                <div class="score-value" style="color: #dc2626;">${currentScore}</div>
                <div>Current Score</div>
            </div>
            <div style="display: flex; align-items: center; font-size: 24px;">→</div>
            <div class="score-box target-score">
                <div class="score-value" style="color: #059669;">${targetScore}</div>
                <div>Target Score</div>
            </div>
        </div>
        <p style="text-align: center; font-size: 24px; font-weight: bold; color: #059669;">
            +${scoreIncrease} Point Improvement
        </p>
    </div>

    <div class="section">
        <h2>Recommended Plan</h2>
        <div class="metrics">
            <div class="metric-card">
                <div class="metric-value">${recommendedPosts}</div>
                <div class="metric-label">Blog Posts</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${timelineMonths}</div>
                <div class="metric-label">Months</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${Math.round(recommendedPosts / timelineMonths)}</div>
                <div class="metric-label">Posts/Month</div>
            </div>
        </div>
    </div>

    <div class="section">
        <h2>Key Opportunities</h2>
        <ul>
            ${clusters.filter((c: any) => !c.currently_covered).slice(0, 5).map((c: any) => 
                `<li><strong>${c.name}</strong> - ${c.estimated_traffic || 0} estimated monthly searches</li>`
            ).join('')}
        </ul>
    </div>

    <div class="footer">
        <p>Generated by BlogCanvas SEO Content Platform</p>
        <p>This proposal is based on automated SEO analysis and content gap identification.</p>
    </div>
</body>
</html>
    `.trim();

    return html;
}

/**
 * Generate slide deck pitch
 */
function generateSlidePitch(data: any): any[] {
    const { client, audit, projection, clusters } = data;
    
    return [
        {
            title: 'SEO Content Plan',
            subtitle: `${client.name}`,
            content: `Current Score: ${projection.current_score} → Target: ${projection.target_score}`
        },
        {
            title: 'Current Status',
            content: `SEO Score: ${projection.current_score}/100\nPages Indexed: ${audit.pagesIndexed || 0}`
        },
        {
            title: 'Recommended Plan',
            content: `${projection.recommended_posts} blog posts over ${projection.timeline_months} months`
        },
        {
            title: 'Key Opportunities',
            content: clusters.filter((c: any) => !c.currently_covered).slice(0, 5).map((c: any) => c.name).join('\n• ')
        },
        {
            title: 'Expected Results',
            content: `SEO Score: ${projection.current_score} → ${projection.target_score}\n+${projection.score_increase} point improvement`
        }
    ];
}

