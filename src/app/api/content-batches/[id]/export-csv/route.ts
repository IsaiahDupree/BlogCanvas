import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { stringify } from 'csv-stringify/sync';

/**
 * Export batch topics as CSV
 * GET /api/content-batches/[id]/export-csv
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

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

        // Fetch all posts in batch
        const { data: posts, error: postsError } = await supabaseAdmin
            .from('blog_posts')
            .select(`
                id,
                target_keyword,
                target_wordcount,
                status,
                draft,
                topic_cluster:topic_clusters(name, primary_keyword)
            `)
            .eq('content_batch_id', id)
            .order('created_at', { ascending: true });

        if (postsError) {
            return NextResponse.json(
                { success: false, error: 'Failed to fetch posts' },
                { status: 500 }
            );
        }

        // Prepare CSV data
        const csvData = (posts || []).map((post: any) => {
            const draft = post.draft as any || {};
            const cluster = post.topic_cluster as any;

            return {
                topic: draft.topic || draft.title || 'Untitled',
                target_keyword: post.target_keyword || cluster?.primary_keyword || '',
                target_wordcount: post.target_wordcount || 1500,
                topic_cluster: cluster?.name || '',
                priority: draft.priority || 0,
                notes: draft.notes || draft.description || '',
                status: post.status || 'idea'
            };
        });

        // Generate CSV
        const csv = stringify(csvData, {
            header: true,
            columns: {
                topic: 'Topic',
                target_keyword: 'Target Keyword',
                target_wordcount: 'Target Wordcount',
                topic_cluster: 'Topic Cluster',
                priority: 'Priority',
                notes: 'Notes',
                status: 'Status'
            }
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

