import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { analyzeContentGaps, saveContentGaps } from '@/lib/analysis/gap-analyzer';

// GET /api/websites/[id]/gaps - Get content gaps for a website
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Check if website exists
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

        // Fetch existing gaps from database
        const { data: existingGaps, error: gapsError } = await supabaseAdmin
            .from('content_gaps')
            .select('*')
            .eq('website_id', id)
            .order('severity', { ascending: false });

        if (gapsError) {
            console.error('Error fetching gaps:', gapsError);
        }

        return NextResponse.json({
            success: true,
            gaps: existingGaps || []
        });

    } catch (error) {
        console.error('Error in gaps API:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// POST /api/websites/[id]/gaps - Analyze and generate content gaps
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Check if website exists
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

        // Analyze content gaps
        const gaps = await analyzeContentGaps(id);

        // Save to database
        await saveContentGaps(gaps);

        return NextResponse.json({
            success: true,
            gaps,
            count: gaps.length
        });

    } catch (error) {
        console.error('Error analyzing gaps:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to analyze content gaps' },
            { status: 500 }
        );
    }
}
