import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/clients/[clientId] - Get client details by ID or slug
export async function GET(
    request: Request,
    { params }: { params: Promise<{ clientId: string }> }
) {
    try {
        const { clientId } = await params;
        const supabase = await createClient();

        // Check if user is authenticated
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        // Get user profile to get vendor_id
        const { data: profile } = await supabase
            .from('profiles')
            .select('vendor_id')
            .eq('id', user.id)
            .single();

        // Try to find client by UUID first, then by slug
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clientId);
        
        let query = supabase
            .from('clients')
            .select(`
                *,
                brand_guides (
                    id,
                    product_service_summary,
                    target_audience,
                    positioning,
                    tone_profile,
                    brand_messaging,
                    competitors,
                    key_differentiators,
                    content_guidelines
                ),
                wordpress_sites (
                    id,
                    name,
                    site_url,
                    status
                )
            `);

        if (isUUID) {
            query = query.eq('id', clientId);
        } else {
            query = query.eq('slug', clientId);
        }

        // Filter by vendor if user has vendor_id
        if (profile?.vendor_id) {
            query = query.eq('vendor_id', profile.vendor_id);
        }

        const { data: client, error } = await query.single();

        if (error || !client) {
            return NextResponse.json(
                { success: false, error: 'Client not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            client
        });
    } catch (error) {
        console.error('Error fetching client:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch client' },
            { status: 500 }
        );
    }
}

// PATCH /api/clients/[clientId] - Update client
export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ clientId: string }> }
) {
    try {
        const { clientId } = await params;
        const updates = await request.json();

        console.log(`Updating client ${clientId}:`, updates);

        // In production: update in Supabase

        return NextResponse.json({
            success: true,
            message: 'Client updated successfully'
        });
    } catch (error) {
        console.error('Error updating client:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to update client' },
            { status: 500 }
        );
    }
}
