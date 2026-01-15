import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/clients/[clientId]/brand-guide - Get brand guide for a client
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

        // Get brand guide for the client
        const { data: brandGuide, error } = await supabase
            .from('brand_guides')
            .select('*')
            .eq('client_id', clientId)
            .single();

        if (error) {
            // If no brand guide exists, return empty object
            if (error.code === 'PGRST116') {
                return NextResponse.json({
                    success: true,
                    brandGuide: null
                });
            }
            throw error;
        }

        return NextResponse.json({
            success: true,
            brandGuide
        });
    } catch (error) {
        console.error('Error fetching brand guide:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch brand guide' },
            { status: 500 }
        );
    }
}

// PATCH /api/clients/[clientId]/brand-guide - Update brand guide
export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ clientId: string }> }
) {
    try {
        const { clientId } = await params;
        const updates = await request.json();
        const supabase = await createClient();

        // Check if user is authenticated
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        // Check if brand guide exists
        const { data: existingGuide } = await supabase
            .from('brand_guides')
            .select('id')
            .eq('client_id', clientId)
            .single();

        let result;

        if (existingGuide) {
            // Update existing brand guide
            const { data, error } = await supabase
                .from('brand_guides')
                .update(updates)
                .eq('client_id', clientId)
                .select()
                .single();

            if (error) throw error;
            result = data;
        } else {
            // Create new brand guide
            const { data, error } = await supabase
                .from('brand_guides')
                .insert({
                    client_id: clientId,
                    ...updates
                })
                .select()
                .single();

            if (error) throw error;
            result = data;
        }

        return NextResponse.json({
            success: true,
            brandGuide: result
        });
    } catch (error) {
        console.error('Error updating brand guide:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to update brand guide' },
            { status: 500 }
        );
    }
}
