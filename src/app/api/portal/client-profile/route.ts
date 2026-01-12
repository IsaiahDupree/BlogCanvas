import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/portal/client-profile - Get current client's profile information
 * Client-only endpoint
 */
export async function GET(request: Request) {
    try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Get user profile to check client_id
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('client_id, role, client_role')
            .eq('id', user.id)
            .single();

        if (profileError || !profile || !profile.client_id) {
            return NextResponse.json(
                { success: false, error: 'Client profile not found' },
                { status: 404 }
            );
        }

        // Check if user is a client
        if (!['client', 'client_admin', 'client_reviewer'].includes(profile.role || '')) {
            return NextResponse.json(
                { success: false, error: 'Access denied. Client access required.' },
                { status: 403 }
            );
        }

        // Get client data
        const { data: client, error: clientError } = await supabase
            .from('clients')
            .select('*')
            .eq('id', profile.client_id)
            .single();

        if (clientError || !client) {
            return NextResponse.json(
                { success: false, error: 'Client not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            client,
            profile: {
                role: profile.role,
                client_role: profile.client_role
            }
        });
    } catch (error: any) {
        console.error('Error fetching client profile:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to fetch client profile' },
            { status: 500 }
        );
    }
}
