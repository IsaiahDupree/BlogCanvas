import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// GET /api/websites/[id]/seo-audits - Get historical SEO audit data for trend analysis
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '50', 10);
        const offset = parseInt(searchParams.get('offset') || '0', 10);

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

        // Fetch historical SEO audits ordered by date (newest first)
        const { data: audits, error: auditsError, count } = await supabaseAdmin
            .from('seo_audits')
            .select('*', { count: 'exact' })
            .eq('website_id', id)
            .order('audit_date', { ascending: false })
            .range(offset, offset + limit - 1);

        if (auditsError) {
            console.error('Error fetching SEO audits:', auditsError);
            return NextResponse.json(
                { success: false, error: 'Failed to fetch audit history' },
                { status: 500 }
            );
        }

        // Calculate trend statistics if we have multiple audits
        let trendStats = null;
        if (audits && audits.length >= 2) {
            const latest = audits[0];
            const oldest = audits[audits.length - 1];
            const scoreChange = latest.baseline_score - oldest.baseline_score;
            const percentChange = oldest.baseline_score > 0
                ? ((scoreChange / oldest.baseline_score) * 100).toFixed(1)
                : '0';

            trendStats = {
                totalAudits: count || audits.length,
                latestScore: latest.baseline_score,
                oldestScore: oldest.baseline_score,
                scoreChange,
                percentChange: parseFloat(percentChange),
                timespan: {
                    from: oldest.audit_date,
                    to: latest.audit_date
                },
                trend: scoreChange > 0 ? 'improving' : scoreChange < 0 ? 'declining' : 'stable'
            };
        }

        return NextResponse.json({
            success: true,
            website: {
                id: website.id,
                url: website.url,
                clientId: website.client_id
            },
            audits: audits || [],
            total: count || 0,
            pagination: {
                limit,
                offset,
                hasMore: (count || 0) > offset + limit
            },
            trendStats
        });
    } catch (error) {
        console.error('Error in seo-audits endpoint:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
