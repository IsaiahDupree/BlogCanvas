import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { stringify } from 'csv-stringify/sync';

/**
 * Export batch topics as CSV with filtering options
 * GET /api/content-batches/[id]/export-csv
 * Query params:
 *   - status: Filter by post status (optional)
 *   - dateFrom: Filter by created date >= (YYYY-MM-DD, optional)
 *   - dateTo: Filter by created date <= (YYYY-MM-DD, optional)
 *   - columns: Comma-separated list of columns to export (optional)
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { searchParams } = new URL(request.url);

        // Parse query parameters
        const statusFilter = searchParams.get('status');
        const dateFrom = searchParams.get('dateFrom');
        const dateTo = searchParams.get('dateTo');
        const columnsParam = searchParams.get('columns');

        // Fetch batch
        const { data: batch, error: batchError } = await supabaseAdmin
            .from('content_batches')
            .select('name')
            .eq('id', id)
            .single();

        if (batchError || !batch) {
            return NextResponse.json(
                { success: false, error: 'Batch not found' },
                { status: 404 }
            );
        }

        // Build query for posts with filters
        let query = supabaseAdmin
            .from('blog_posts')
            .select(`
                id,
                target_keyword,
                target_wordcount,
                status,
                draft,
                due_date,
                publish_window_start,
                publish_window_end,
                seo_quality_score,
                created_at,
                topic_cluster:topic_clusters(name, primary_keyword)
            `)
            .eq('content_batch_id', id);

        // Apply status filter
        if (statusFilter && statusFilter !== 'all') {
            query = query.eq('status', statusFilter);
        }

        // Apply date range filters
        if (dateFrom) {
            query = query.gte('created_at', `${dateFrom}T00:00:00`);
        }
        if (dateTo) {
            query = query.lte('created_at', `${dateTo}T23:59:59`);
        }

        query = query.order('created_at', { ascending: true });

        const { data: posts, error: postsError } = await query;

        if (postsError) {
            return NextResponse.json(
                { success: false, error: 'Failed to fetch posts' },
                { status: 500 }
            );
        }

        // Define all available columns
        const allColumns = {
            topic: { label: 'Topic', extract: (post: any, draft: any) => draft.topic || draft.title || 'Untitled' },
            target_keyword: { label: 'Target Keyword', extract: (post: any, draft: any, cluster: any) => post.target_keyword || cluster?.primary_keyword || '' },
            target_wordcount: { label: 'Target Wordcount', extract: (post: any) => post.target_wordcount || 1500 },
            topic_cluster: { label: 'Topic Cluster', extract: (post: any, draft: any, cluster: any) => cluster?.name || '' },
            priority: { label: 'Priority', extract: (post: any, draft: any) => draft.priority || 0 },
            notes: { label: 'Notes', extract: (post: any, draft: any) => draft.notes || draft.description || '' },
            status: { label: 'Status', extract: (post: any) => post.status || 'idea' },
            due_date: { label: 'Due Date', extract: (post: any) => post.due_date || '' },
            publish_window_start: { label: 'Publish Window Start', extract: (post: any) => post.publish_window_start || '' },
            publish_window_end: { label: 'Publish Window End', extract: (post: any) => post.publish_window_end || '' },
            seo_quality_score: { label: 'SEO Quality Score', extract: (post: any) => post.seo_quality_score || 0 },
            created_at: { label: 'Created Date', extract: (post: any) => post.created_at ? new Date(post.created_at).toISOString().split('T')[0] : '' },
        };

        // Determine which columns to include
        const selectedColumns = columnsParam
            ? columnsParam.split(',').filter(col => col in allColumns)
            : Object.keys(allColumns);

        // Prepare CSV data with selected columns
        const csvData = (posts || []).map((post: any) => {
            const draft = post.draft as any || {};
            const cluster = post.topic_cluster as any;
            const row: any = {};

            selectedColumns.forEach(columnKey => {
                const column = allColumns[columnKey as keyof typeof allColumns];
                if (column) {
                    row[columnKey] = column.extract(post, draft, cluster);
                }
            });

            return row;
        });

        // Build column mapping for CSV header
        const columnMapping: Record<string, string> = {};
        selectedColumns.forEach(columnKey => {
            const column = allColumns[columnKey as keyof typeof allColumns];
            if (column) {
                columnMapping[columnKey] = column.label;
            }
        });

        // Generate CSV
        const csv = stringify(csvData, {
            header: true,
            columns: columnMapping
        });

        // Return CSV file
        const filename = `${(batch.name || 'batch').replace(/[^a-z0-9]/gi, '_')}_export_${new Date().toISOString().split('T')[0]}.csv`;

        return new NextResponse(csv, {
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="${filename}"`
            }
        });

    } catch (error: any) {
        console.error('Error exporting CSV:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to export CSV' },
            { status: 500 }
        );
    }
}

