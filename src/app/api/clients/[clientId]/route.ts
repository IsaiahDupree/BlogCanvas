import { NextResponse } from 'next/server';

// GET /api/clients/[clientId] - Get client details
export async function GET(
    request: Request,
    { params }: { params: Promise<{ clientId: string }> }
) {
    try {
        const { clientId } = await params;

        // Mock client data
        const client = {
            id: clientId,
            name: 'Acme Software Inc',
            slug: 'acme-software',
            website: 'acme.com',
            contact_email: 'marketing@acme.com',
            status: 'active',
            product_service_summary: 'AI-powered CRM platform for sales teams',
            target_audience: 'B2B sales managers and founders',
            positioning: 'Enterprise-grade CRM with AI intelligence',
            tone_of_voice: {
                casual_to_formal: 60,
                playful_to_serious: 70,
                direct_to_story: 40
            },
            cms_type: 'wordpress',
            cms_base_url: 'https://acme.com',
            cms_status: 'connected',
            created_at: new Date().toISOString()
        };

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
