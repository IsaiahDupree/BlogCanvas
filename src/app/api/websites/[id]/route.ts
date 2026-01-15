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

// PATCH /api/websites/[id] - Update website details
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { url, targetMarket, platform, isPrimary, clientId } = body;

        // Build update object with only provided fields
        const updateData: any = {};

        if (url) {
            try {
                const websiteUrl = new URL(url);
                updateData.url = websiteUrl.origin;
                updateData.domain = websiteUrl.hostname;
            } catch (e) {
                return NextResponse.json(
                    { success: false, error: 'Invalid URL format' },
                    { status: 400 }
                );
            }
        }

        if (targetMarket !== undefined) {
            updateData.target_market = targetMarket;
        }

        if (platform !== undefined) {
            updateData.platform = platform;
        }

        if (isPrimary !== undefined) {
            updateData.is_primary = isPrimary;

            // If setting this as primary, unset other primary websites for this client
            if (isPrimary) {
                // First get the website to find its client_id
                const { data: existingWebsite } = await supabaseAdmin
                    .from('websites')
                    .select('client_id')
                    .eq('id', id)
                    .single();

                const targetClientId = clientId || existingWebsite?.client_id;

                if (targetClientId) {
                    await supabaseAdmin
                        .from('websites')
                        .update({ is_primary: false })
                        .eq('client_id', targetClientId)
                        .eq('is_primary', true)
                        .neq('id', id);
                }
            }
        }

        // Update website
        const { data: website, error } = await supabaseAdmin
            .from('websites')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Database error updating website:', error);
            return NextResponse.json(
                { success: false, error: error.message || 'Failed to update website' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            website
        });
    } catch (error) {
        console.error('Error updating website:', error);
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
