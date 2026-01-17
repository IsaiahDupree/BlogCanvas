import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { createClient } from '@/lib/supabase/server';

/**
 * Update a CSV import mapping
 * PUT /api/csv-mappings/[id]
 */
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();
        const { mapping_name, column_mapping, custom_fields, is_default } = body;

        const updates: any = {};
        if (mapping_name !== undefined) updates.mapping_name = mapping_name;
        if (column_mapping !== undefined) updates.column_mapping = column_mapping;
        if (custom_fields !== undefined) updates.custom_fields = custom_fields;
        if (is_default !== undefined) updates.is_default = is_default;

        const { data: mapping, error } = await supabaseAdmin
            .from('csv_import_mappings')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating mapping:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ mapping });

    } catch (error: any) {
        console.error('Error in PUT /api/csv-mappings/[id]:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * Delete a CSV import mapping
 * DELETE /api/csv-mappings/[id]
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        const { error } = await supabaseAdmin
            .from('csv_import_mappings')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting mapping:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Error in DELETE /api/csv-mappings/[id]:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
