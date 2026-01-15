import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth';

/**
 * Get CSV import mappings for a client
 * GET /api/csv-mappings?client_id=xxx
 */
export async function GET(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const clientId = searchParams.get('client_id');

        if (!clientId) {
            return NextResponse.json({ error: 'client_id is required' }, { status: 400 });
        }

        const { data: mappings, error } = await supabaseAdmin
            .from('csv_import_mappings')
            .select('*')
            .eq('client_id', clientId)
            .order('is_default', { ascending: false })
            .order('last_used_at', { ascending: false, nullsFirst: false })
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching mappings:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ mappings: mappings || [] });

    } catch (error: any) {
        console.error('Error in GET /api/csv-mappings:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * Create a new CSV import mapping
 * POST /api/csv-mappings
 */
export async function POST(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { client_id, mapping_name, column_mapping, custom_fields, is_default } = body;

        if (!client_id || !mapping_name || !column_mapping) {
            return NextResponse.json(
                { error: 'client_id, mapping_name, and column_mapping are required' },
                { status: 400 }
            );
        }

        const { data: mapping, error } = await supabaseAdmin
            .from('csv_import_mappings')
            .insert({
                client_id,
                user_id: user.id,
                mapping_name,
                column_mapping,
                custom_fields: custom_fields || [],
                is_default: is_default || false
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating mapping:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ mapping });

    } catch (error: any) {
        console.error('Error in POST /api/csv-mappings:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
