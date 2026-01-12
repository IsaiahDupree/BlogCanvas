import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// GET /api/websites/[id]/competitors/[competitorId] - Get competitor details
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; competitorId: string }> }
) {
    try {
        const { id, competitorId } = await params;

        // Fetch competitor with all audits
        const { data: competitor, error: competitorError } = await supabaseAdmin
            .from('competitors')
            .select(`
                *,
                competitor_audits (
                    id,
                    seo_score,
                    pages_indexed,
                    audit_date,
                    raw_metrics
                )
            `)
            .eq('id', competitorId)
            .eq('website_id', id)
            .single();

        if (competitorError || !competitor) {
            return NextResponse.json(
                { success: false, error: 'Competitor not found' },
                { status: 404 }
            );
        }

        // Get keyword data
        const { data: keywords, error: keywordsError } = await supabaseAdmin
            .from('competitor_keywords')
            .select('*')
            .eq('competitor_id', competitorId)
            .order('search_volume', { ascending: false, nullsFirst: false })
            .limit(100);

        if (keywordsError) {
            console.error('Error fetching keywords:', keywordsError);
        }

        // Calculate statistics
        const audits = (competitor as any).competitor_audits || [];
        const keywordsList = keywords || [];
        const stats = {
            totalAudits: audits.length,
            latestScore: audits.length > 0 ? audits[0].seo_score : null,
            totalKeywords: keywordsList.length,
            keywordGaps: keywordsList.filter((k: any) => !k.we_rank).length,
            avgRanking: keywordsList.length > 0
                ? Math.round(keywordsList.reduce((sum: number, k: any) => sum + (k.ranking_position || 0), 0) / keywordsList.length)
                : null
        };

        return NextResponse.json({
            success: true,
            competitor: {
                ...competitor,
                competitor_audits: audits
            },
            keywords: keywordsList,
            stats
        });
    } catch (error) {
        console.error('Error in competitor GET endpoint:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// PATCH /api/websites/[id]/competitors/[competitorId] - Update competitor
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; competitorId: string }> }
) {
    try {
        const { id, competitorId } = await params;
        const body = await request.json();

        // Build update object with allowed fields
        const updateData: any = {};
        if (body.name !== undefined) updateData.name = body.name;
        if (body.notes !== undefined) updateData.notes = body.notes;
        if (body.status !== undefined) updateData.status = body.status;
        if (body.competitor_url !== undefined) {
            updateData.competitor_url = body.competitor_url;

            // Update domain if URL changed
            try {
                const url = new URL(body.competitor_url);
                updateData.competitor_domain = url.hostname.replace(/^www\./, '');
            } catch {
                return NextResponse.json(
                    { success: false, error: 'Invalid URL format' },
                    { status: 400 }
                );
            }
        }

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json(
                { success: false, error: 'No valid fields to update' },
                { status: 400 }
            );
        }

        // Update competitor
        const { data: competitor, error: updateError } = await supabaseAdmin
            .from('competitors')
            .update(updateData)
            .eq('id', competitorId)
            .eq('website_id', id)
            .select()
            .single();

        if (updateError || !competitor) {
            console.error('Error updating competitor:', updateError);
            return NextResponse.json(
                { success: false, error: 'Failed to update competitor' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            competitor
        });
    } catch (error) {
        console.error('Error in competitor PATCH endpoint:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// DELETE /api/websites/[id]/competitors/[competitorId] - Delete competitor
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; competitorId: string }> }
) {
    try {
        const { id, competitorId } = await params;

        // Delete competitor (cascade will delete audits and keywords)
        const { error: deleteError } = await supabaseAdmin
            .from('competitors')
            .delete()
            .eq('id', competitorId)
            .eq('website_id', id);

        if (deleteError) {
            console.error('Error deleting competitor:', deleteError);
            return NextResponse.json(
                { success: false, error: 'Failed to delete competitor' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Competitor deleted successfully'
        });
    } catch (error) {
        console.error('Error in competitor DELETE endpoint:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
