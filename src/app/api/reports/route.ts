import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAuth } from '@/lib/supabase/server';

/**
 * List all reports with optional filtering
 * GET /api/reports?websiteId=...&limit=20&offset=0
 */
export async function GET(request: NextRequest) {
    try {
        await requireAuth();
        const searchParams = request.nextUrl.searchParams;
        const websiteId = searchParams.get('websiteId');
        const limit = parseInt(searchParams.get('limit') || '20');
        const offset = parseInt(searchParams.get('offset') || '0');

        let query = supabaseAdmin
            .from('reports')
            .select(`
                *,
                website:websites(
                    id,
                    url,
                    name,
                    client:clients(
                        id,
                        name
                    )
                )
            `, { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (websiteId) {
            query = query.eq('website_id', websiteId);
        }

        const { data: reports, error, count } = await query;

        if (error) {
            return NextResponse.json(
                { success: false, error: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            reports: reports || [],
            total: count || 0,
            limit,
            offset
        });

    } catch (error: any) {
        console.error('Error fetching reports:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to fetch reports' },
            { status: 500 }
        );
    }
}
