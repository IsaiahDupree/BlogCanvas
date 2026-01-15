import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { parse } from 'csv-parse/sync';
import { isValidSearchIntent } from '@/lib/search-intent';
import { isValidToneVoice } from '@/lib/tone-voice';

/**
 * Import blog posts from CSV file with flexible column mapping
 * POST /api/content-batches/[id]/import-csv
 *
 * Supports custom column mapping via formData:
 * - file: CSV file
 * - column_mapping: JSON string mapping internal fields to CSV columns
 * - custom_fields: JSON string defining custom fields
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const columnMappingStr = formData.get('column_mapping') as string;
        const customFieldsStr = formData.get('custom_fields') as string;

        if (!file) {
            return NextResponse.json(
                { success: false, error: 'No file provided' },
                { status: 400 }
            );
        }

        // Parse column mapping and custom fields if provided
        let columnMapping: Record<string, string> = {};
        let customFields: Array<{name: string, csvColumn: string, type: string}> = [];

        if (columnMappingStr) {
            try {
                columnMapping = JSON.parse(columnMappingStr);
            } catch (e) {
                console.error('Invalid column_mapping JSON:', e);
            }
        }

        if (customFieldsStr) {
            try {
                customFields = JSON.parse(customFieldsStr);
            } catch (e) {
                console.error('Invalid custom_fields JSON:', e);
            }
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

        // Helper function to extract value from CSV row using mapping
        const getValue = (row: Record<string, string>, internalField: string): string => {
            // Use custom mapping if available
            if (columnMapping[internalField]) {
                return row[columnMapping[internalField]] || '';
            }

            // Fallback to default column name variations
            const synonyms: Record<string, string[]> = {
                'topic': ['topic', 'title', 'Topic', 'Title', 'post_title', 'Post Title'],
                'target_keyword': ['target_keyword', 'keyword', 'keywords', 'Target Keyword', 'Keyword'],
                'target_wordcount': ['target_wordcount', 'wordcount', 'Target Wordcount', 'Wordcount', 'word_count'],
                'topic_cluster': ['topic_cluster', 'cluster', 'Topic Cluster', 'Cluster', 'category'],
                'priority': ['priority', 'Priority'],
                'notes': ['notes', 'description', 'Notes', 'Description'],
                'search_intent': ['search_intent', 'intent', 'Search Intent', 'Intent'],
                'tone_voice': ['tone_voice', 'tone', 'Tone Voice', 'Tone', 'voice'],
                'due_date': ['due_date', 'Due Date', 'due date', 'deadline'],
                'publish_window_start': ['publish_window_start', 'Publish Window Start', 'publish window start'],
                'publish_window_end': ['publish_window_end', 'Publish Window End', 'publish window end']
            };

            const possibleColumns = synonyms[internalField] || [internalField];
            for (const col of possibleColumns) {
                if (row[col]) return row[col];
            }
            return '';
        };

        // Process each row and create blog post
        const createdPosts = [];
        const errors = [];

        for (let i = 0; i < records.length; i++) {
            const row: Record<string, string> = records[i];

            // Extract standard fields using flexible mapping
            const topic = getValue(row, 'topic');
            const targetKeyword = getValue(row, 'target_keyword');
            const targetWordcountStr = getValue(row, 'target_wordcount');
            const targetWordcount = parseInt(targetWordcountStr || '1500') || 1500;
            const clusterName = getValue(row, 'topic_cluster');
            const priorityStr = getValue(row, 'priority');
            const priority = parseInt(priorityStr || '0') || 0;
            const notes = getValue(row, 'notes');
            const searchIntent = getValue(row, 'search_intent');
            const toneVoice = getValue(row, 'tone_voice');
            const dueDate = getValue(row, 'due_date') || null;
            const publishWindowStart = getValue(row, 'publish_window_start') || null;
            const publishWindowEnd = getValue(row, 'publish_window_end') || null;

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

            // Validate and set search intent
            const validIntent = isValidSearchIntent(searchIntent.toLowerCase()) ? searchIntent.toLowerCase() : null;

            // Validate and set tone/voice
            const validTone = isValidToneVoice(toneVoice.toLowerCase()) ? toneVoice.toLowerCase() : null;

            // Extract custom fields
            const customFieldsData: Record<string, any> = {};
            for (const customField of customFields) {
                if (customField.csvColumn && row[customField.csvColumn]) {
                    let value: any = row[customField.csvColumn];

                    // Type conversion
                    if (customField.type === 'number') {
                        value = parseFloat(value) || 0;
                    } else if (customField.type === 'boolean') {
                        value = value.toLowerCase() === 'true' || value === '1';
                    } else if (customField.type === 'date') {
                        value = value; // Keep as string for now
                    }

                    customFieldsData[customField.name] = value;
                }
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
                    search_intent: validIntent,
                    tone_of_voice: validTone,
                    due_date: dueDate || null,
                    publish_window_start: publishWindowStart || null,
                    publish_window_end: publishWindowEnd || null,
                    status: 'idea',
                    draft: {
                        topic: topic,
                        notes: notes,
                        priority: priority,
                        custom_fields: customFieldsData
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

