import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth';

/**
 * Mark a mapping as used (updates last_used_at timestamp)
 * POST /api/csv-mappings/[id]/use
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        const { error } = await supabaseAdmin
            .from('csv_import_mappings')
            .update({ last_used_at: new Date().toISOString() })
            .eq('id', id);

        if (error) {
            console.error('Error updating last_used_at:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Error in POST /api/csv-mappings/[id]/use:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
