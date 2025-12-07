import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { parse } from 'csv-parse/sync';

/**
 * Import blog posts from CSV file
 * POST /api/content-batches/[id]/import-csv
 * 
 * Expected CSV format:
 * topic, target_keyword, target_wordcount, topic_cluster, priority, notes
 * "How to Use AI", "AI tools", 1500, "AI Technology", 1, "Focus on practical examples"
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json(
                { success: false, error: 'No file provided' },
                { status: 400 }
            );
        }

        // Verify batch exists
        const { data: batch, error: batchError } = await supabaseAdmin
            .from('content_batches')
            .select('*, website:websites(id, client_id)')
            .eq('id', id)
            .single();

        if (batchError || !batch) {
            return NextResponse.json(
                { success: false, error: 'Batch not found' },
                { status: 404 }
            );
        }

        // Read and parse CSV
        const fileContent = await file.text();
        const records = parse(fileContent, {
            columns: true,
            skip_empty_lines: true,
            trim: true,
            relax_column_count: true
        }) as Record<string, string>[];

        if (!records || records.length === 0) {
            return NextResponse.json(
                { success: false, error: 'CSV file is empty or invalid' },
                { status: 400 }
            );
        }

        // Get website client_id
        const website = (batch as any).website;
        const clientId = website?.client_id || batch.client_id;

        // Get topic clusters for matching
        const { data: clusters } = await supabaseAdmin
            .from('topic_clusters')
            .select('id, name, primary_keyword')
            .eq('website_id', batch.website_id);

        const clusterMap = new Map(
            (clusters || []).map((c: any) => [c.name.toLowerCase(), c.id])
        );

        // Process each row and create blog post
        const createdPosts = [];
        const errors = [];

        for (let i = 0; i < records.length; i++) {
            const row: Record<string, string> = records[i];
            const topic = row.topic || row.title || row['Topic'] || row['Title'];
            const targetKeyword = row.target_keyword || row.keyword || row['Target Keyword'] || row['Keyword'] || '';
            const targetWordcount = parseInt(row.target_wordcount || row.wordcount || row['Target Wordcount'] || row['Wordcount'] || '1500') || 1500;
            const clusterName = row.topic_cluster || row.cluster || row['Topic Cluster'] || row['Cluster'] || '';
            const priority = parseInt(row.priority || row['Priority'] || '0') || 0;
            const notes = row.notes || row.description || row['Notes'] || row['Description'] || '';

            if (!topic) {
                errors.push(`Row ${i + 2}: Missing topic/title`);
                continue;
            }

            // Find matching topic cluster
            let topicClusterId = null;
            if (clusterName) {
                const clusterKey = clusterName.toLowerCase();
                topicClusterId = clusterMap.get(clusterKey) || null;
            }

            // Create blog post
            const { data: post, error: postError } = await supabaseAdmin
                .from('blog_posts')
                .insert({
                    content_batch_id: id,
                    client_id: clientId,
                    topic_cluster_id: topicClusterId,
                    target_keyword: targetKeyword || null,
                    target_wordcount: targetWordcount,
                    status: 'idea',
                    draft: {
                        topic: topic,
                        notes: notes,
                        priority: priority
                    } as any
                })
                .select()
                .single();

            if (postError) {
                errors.push(`Row ${i + 2}: Failed to create post - ${postError.message}`);
                continue;
            }

            createdPosts.push({
                id: post.id,
                topic,
                target_keyword: targetKeyword,
                target_wordcount: targetWordcount
            });
        }

        // Update batch total_posts count
        const currentTotal = batch.total_posts || 0;
        await supabaseAdmin
            .from('content_batches')
            .update({
                total_posts: currentTotal + createdPosts.length,
                updated_at: new Date().toISOString()
            })
            .eq('id', id);

        return NextResponse.json({
            success: true,
            imported: createdPosts.length,
            total: records.length,
            errors: errors.length > 0 ? errors : undefined,
            posts: createdPosts
        });

    } catch (error: any) {
        console.error('Error importing CSV:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to import CSV' },
            { status: 500 }
        );
    }
}

