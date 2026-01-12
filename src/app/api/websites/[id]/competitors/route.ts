import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// GET /api/websites/[id]/competitors - List all competitors for a website
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

        // Get all competitors for this website with their latest audit data
        const { data: competitors, error: competitorsError } = await supabaseAdmin
            .from('competitors')
            .select(`
                *,
                competitor_audits (
                    id,
                    seo_score,
                    pages_indexed,
                    audit_date
                )
            `)
            .eq('website_id', id)
            .order('created_at', { ascending: false });

        if (competitorsError) {
            console.error('Error fetching competitors:', competitorsError);
            return NextResponse.json(
                { success: false, error: 'Failed to fetch competitors' },
                { status: 500 }
            );
        }

        // Get our latest SEO score for comparison
        const { data: ourAudit } = await supabaseAdmin
            .from('seo_audits')
            .select('baseline_score, audit_date')
            .eq('website_id', id)
            .order('audit_date', { ascending: false })
            .limit(1)
            .single();

        // Get competitor comparison summary using helper function
        const { data: comparison, error: comparisonError } = await supabaseAdmin
            .rpc('get_competitor_comparison', { p_website_id: id });

        if (comparisonError) {
            console.error('Error fetching competitor comparison:', comparisonError);
        }

        // Transform competitors to include latest audit
        const competitorsWithLatest = competitors?.map(comp => {
            const audits = (comp as any).competitor_audits || [];
            const latestAudit = audits.length > 0
                ? audits.reduce((latest: any, current: any) =>
                    new Date(current.audit_date) > new Date(latest.audit_date) ? current : latest
                  )
                : null;

            return {
                ...comp,
                latestAudit,
                competitor_audits: undefined // Remove nested array
            };
        });

        return NextResponse.json({
            success: true,
            website: {
                id: website.id,
                url: website.url,
                clientId: website.client_id,
                latestScore: ourAudit?.baseline_score || null,
                latestAuditDate: ourAudit?.audit_date || null
            },
            competitors: competitorsWithLatest || [],
            comparison: comparison || [],
            total: competitors?.length || 0
        });
    } catch (error) {
        console.error('Error in competitors GET endpoint:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// POST /api/websites/[id]/competitors - Add a new competitor
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();

        // Validate required fields
        if (!body.competitor_url) {
            return NextResponse.json(
                { success: false, error: 'competitor_url is required' },
                { status: 400 }
            );
        }

        // Verify website exists
        const { data: website, error: websiteError } = await supabaseAdmin
            .from('websites')
            .select('id')
            .eq('id', id)
            .single();

        if (websiteError || !website) {
            return NextResponse.json(
                { success: false, error: 'Website not found' },
                { status: 404 }
            );
        }

        // Extract domain from URL
        let competitorDomain: string;
        try {
            const url = new URL(body.competitor_url);
            competitorDomain = url.hostname.replace(/^www\./, '');
        } catch {
            return NextResponse.json(
                { success: false, error: 'Invalid URL format' },
                { status: 400 }
            );
        }

        // Create competitor
        const { data: competitor, error: createError } = await supabaseAdmin
            .from('competitors')
            .insert({
                website_id: id,
                competitor_url: body.competitor_url,
                competitor_domain: competitorDomain,
                name: body.name || null,
                notes: body.notes || null,
                status: body.status || 'active'
            })
            .select()
            .single();

        if (createError) {
            console.error('Error creating competitor:', createError);

            // Check for unique constraint violation
            if (createError.code === '23505') {
                return NextResponse.json(
                    { success: false, error: 'This competitor already exists for this website' },
                    { status: 409 }
                );
            }

            return NextResponse.json(
                { success: false, error: 'Failed to create competitor' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            competitor
        }, { status: 201 });
    } catch (error) {
        console.error('Error in competitors POST endpoint:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
