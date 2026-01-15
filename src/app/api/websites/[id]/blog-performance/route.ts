import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// GET /api/websites/[id]/blog-performance - Get existing blog performance analysis
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Verify website exists
        const { data: website, error: websiteError } = await supabaseAdmin
            .from('websites')
            .select('id, url, client_id')
            .eq('id', id)
            .single();

        if (websiteError || !website) {
            return NextResponse.json(
                { success: false, error: 'Website not found' },
                { status: 404 }
            );
        }

        // Fetch the latest SEO audit with blog performance data
        const { data: latestAudit, error: auditError } = await supabaseAdmin
            .from('seo_audits')
            .select('id, baseline_score, pages_indexed, audit_date, blog_posts_detected, blog_posts_analyzed, blog_performance_summary, raw_metrics')
            .eq('website_id', id)
            .order('audit_date', { ascending: false })
            .limit(1)
            .single();

        if (auditError) {
            // No audits found yet
            return NextResponse.json({
                success: true,
                website: {
                    id: website.id,
                    url: website.url,
                    clientId: website.client_id
                },
                blogPerformance: null,
                message: 'No audits found. Run an audit first.'
            });
        }

        // Return blog performance data
        return NextResponse.json({
            success: true,
            website: {
                id: website.id,
                url: website.url,
                clientId: website.client_id
            },
            blogPerformance: {
                auditId: latestAudit.id,
                auditDate: latestAudit.audit_date,
                baselineScore: latestAudit.baseline_score,
                pagesIndexed: latestAudit.pages_indexed,
                blogPostsDetected: latestAudit.blog_posts_detected || 0,
                blogPostsAnalyzed: latestAudit.blog_posts_analyzed || [],
                summary: latestAudit.blog_performance_summary || null
            }
        });
    } catch (error) {
        console.error('Error in blog-performance endpoint:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
