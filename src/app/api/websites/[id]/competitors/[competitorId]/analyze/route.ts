import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { analyzeCompetitor } from '@/lib/competitors/analyzer';

// POST /api/websites/[id]/competitors/[competitorId]/analyze - Run SEO analysis on competitor
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; competitorId: string }> }
) {
    try {
        const { id, competitorId } = await params;

        // Verify competitor exists
        const { data: competitor, error: competitorError } = await supabaseAdmin
            .from('competitors')
            .select('id, competitor_url, competitor_domain')
            .eq('id', competitorId)
            .eq('website_id', id)
            .single();

        if (competitorError || !competitor) {
            return NextResponse.json(
                { success: false, error: 'Competitor not found' },
                { status: 404 }
            );
        }

        // Run real competitor analysis using AI and web scraping
        const analysisResult = await analyzeCompetitor(
            competitor.competitor_url,
            competitor.competitor_domain
        );

        // Create competitor audit with real analysis data
        const { data: audit, error: auditError } = await supabaseAdmin
            .from('competitor_audits')
            .insert({
                competitor_id: competitorId,
                seo_score: analysisResult.seo_score,
                pages_indexed: analysisResult.pages_indexed,
                raw_metrics: {
                    technical_seo: analysisResult.technical_seo,
                    content_quality: analysisResult.content_quality,
                    backlinks: analysisResult.backlinks,
                    mobile_friendly: analysisResult.mobile_friendly,
                    page_speed: analysisResult.page_speed,
                    content_insights: analysisResult.content_insights,
                    meta_description: analysisResult.meta_description,
                    title_tag: analysisResult.title_tag
                }
            })
            .select()
            .single();

        if (auditError) {
            console.error('Error creating competitor audit:', auditError);
            return NextResponse.json(
                { success: false, error: 'Failed to create audit' },
                { status: 500 }
            );
        }

        // Update competitor's last_analyzed_at
        await supabaseAdmin
            .from('competitors')
            .update({ last_analyzed_at: new Date().toISOString() })
            .eq('id', competitorId);

        // Store analyzed keywords
        if (analysisResult.keywords.length > 0) {
            const keywordPromises = analysisResult.keywords.map((kw, index) => {
                return supabaseAdmin
                    .from('competitor_keywords')
                    .upsert({
                        competitor_id: competitorId,
                        keyword: kw.keyword,
                        search_volume: kw.search_volume,
                        difficulty: kw.difficulty,
                        ranking_position: kw.ranking_position,
                        ranking_url: kw.ranking_url,
                        search_intent: kw.search_intent,
                        we_rank: false, // Default to false, can be updated later
                        our_position: null,
                        gap_priority: index + 1
                    }, {
                        onConflict: 'competitor_id,keyword'
                    });
            });

            await Promise.all(keywordPromises);
        }

        return NextResponse.json({
            success: true,
            message: 'Competitor analysis completed using real web scraping and AI analysis',
            audit,
            keywords_found: analysisResult.keywords.length,
            content_insights: analysisResult.content_insights
        });
    } catch (error) {
        console.error('Error in competitor analyze endpoint:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
