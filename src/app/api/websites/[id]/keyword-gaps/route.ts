import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// GET /api/websites/[id]/keyword-gaps - Get keyword gap analysis
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { searchParams } = new URL(request.url);

        const minVolume = parseInt(searchParams.get('min_volume') || '100', 10);
        const limit = parseInt(searchParams.get('limit') || '50', 10);
        const intent = searchParams.get('intent'); // Filter by search intent

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

        // Use the helper function to get keyword gaps
        const { data: keywordGaps, error: gapsError } = await supabaseAdmin
            .rpc('get_keyword_gaps', {
                p_website_id: id,
                p_min_volume: minVolume,
                p_limit: limit
            });

        if (gapsError) {
            console.error('Error fetching keyword gaps:', gapsError);
            return NextResponse.json(
                { success: false, error: 'Failed to fetch keyword gaps' },
                { status: 500 }
            );
        }

        // Filter by intent if provided
        let filteredGaps = keywordGaps || [];
        if (intent) {
            filteredGaps = filteredGaps.filter((gap: any) => gap.search_intent === intent);
        }

        // Get detailed keyword data for top gaps
        const topKeywords = filteredGaps.slice(0, 20).map((gap: any) => gap.keyword);

        let detailedKeywords: any[] = [];
        if (topKeywords.length > 0) {
            const { data: keywords, error: keywordsError } = await supabaseAdmin
                .from('competitor_keywords')
                .select(`
                    *,
                    competitors (
                        id,
                        name,
                        competitor_url,
                        competitor_domain
                    )
                `)
                .in('keyword', topKeywords)
                .eq('we_rank', false)
                .order('gap_priority', { ascending: true });

            if (!keywordsError && keywords) {
                detailedKeywords = keywords;
            }
        }

        // Calculate summary statistics
        const stats = {
            totalGaps: filteredGaps.length,
            highPriorityGaps: filteredGaps.filter((gap: any) => gap.gap_priority <= 3).length,
            avgSearchVolume: filteredGaps.length > 0
                ? Math.round(
                    filteredGaps.reduce((sum: number, gap: any) => sum + (gap.max_search_volume || 0), 0) / filteredGaps.length
                  )
                : 0,
            totalPotentialTraffic: filteredGaps.reduce((sum: number, gap: any) => sum + (gap.max_search_volume || 0), 0),
            intents: {
                informational: filteredGaps.filter((gap: any) => gap.search_intent === 'informational').length,
                commercial: filteredGaps.filter((gap: any) => gap.search_intent === 'commercial').length,
                transactional: filteredGaps.filter((gap: any) => gap.search_intent === 'transactional').length,
                navigational: filteredGaps.filter((gap: any) => gap.search_intent === 'navigational').length
            }
        };

        // Get competitor summary
        const { data: competitors } = await supabaseAdmin
            .from('competitors')
            .select('id, name, competitor_domain, status')
            .eq('website_id', id)
            .eq('status', 'active');

        return NextResponse.json({
            success: true,
            website: {
                id: website.id,
                url: website.url,
                clientId: website.client_id
            },
            gaps: filteredGaps,
            detailedKeywords,
            stats,
            competitors: competitors || [],
            filters: {
                minVolume,
                limit,
                intent: intent || 'all'
            }
        });
    } catch (error) {
        console.error('Error in keyword-gaps endpoint:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
