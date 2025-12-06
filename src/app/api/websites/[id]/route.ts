import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// GET /api/websites/[id] - Get website details with audit data
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Fetch website
        const { data: website, error: websiteError } = await supabaseAdmin
            .from('websites')
            .select('*')
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

        // Fetch scraped pages count
        const { count: pagesCount } = await supabaseAdmin
            .from('scraped_pages')
            .select('*', { count: 'exact', head: true })
            .eq('website_id', id);

        return NextResponse.json({
            success: true,
            website: {
                ...website,
                pagesScraped: pagesCount || 0,
                latestAudit: audit
            }
        });
    } catch (error) {
        console.error('Error fetching website:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// DELETE /api/websites/[id] - Delete website and all related data
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Delete website (cascades to scraped_pages, seo_audits, etc.)
        const { error } = await supabaseAdmin
            .from('websites')
            .delete()
            .eq('id', id);

        if (error) {
            return NextResponse.json(
                { success: false, error: 'Failed to delete website' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Website deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting website:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
