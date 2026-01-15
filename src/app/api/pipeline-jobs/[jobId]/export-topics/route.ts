import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { stringify } from 'csv-stringify/sync';

/**
 * Export pipeline job topics as CSV
 * GET /api/pipeline-jobs/[jobId]/export-topics
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ jobId: string }> }
) {
    try {
        const { jobId } = await params;

        // Fetch job
        const { data: job, error: jobError } = await supabaseAdmin
            .from('pipeline_jobs')
            .select('website_url, topics_result')
            .eq('id', jobId)
            .single();

        if (jobError || !job) {
            return NextResponse.json(
                { success: false, error: 'Job not found' },
                { status: 404 }
            );
        }

        // Extract topics from topics_result
        const topicsResult = job.topics_result as any;
        const topics = topicsResult?.clusters || topicsResult?.topics || [];

        if (!topics || topics.length === 0) {
            return NextResponse.json(
                { success: false, error: 'No topics found for this job' },
                { status: 404 }
            );
        }

        // Prepare CSV data - map topics to consistent format
        const csvData = topics.map((topic: any, index: number) => {
            const name = topic.name || topic.topic || topic.cluster_name || '';
            const primaryKeyword = topic.primaryKeyword || topic.primary_keyword || topic.keyword || topic.name || '';

            // Handle difficulty - could be string ('low', 'medium', 'high') or number (0-100)
            let difficultyValue: number;
            if (typeof topic.difficulty === 'string') {
                difficultyValue = topic.difficulty === 'low' ? 30 : topic.difficulty === 'medium' ? 50 : 70;
            } else {
                difficultyValue = topic.difficulty || 50;
            }

            const estimatedTraffic = topic.estimatedTrafficPotential || topic.estimatedMonthlySearches || topic.estimated_traffic || topic.search_volume || 1000;
            const priority = difficultyValue <= 40 ? 'high' : difficultyValue <= 60 ? 'medium' : 'low';

            return {
                topic: name,
                primary_keyword: primaryKeyword,
                difficulty: difficultyValue,
                estimated_traffic: estimatedTraffic,
                priority: priority,
                pillar_topic: topic.pillarTopic || topic.pillar_topic || '',
                search_intent: topic.searchIntent || topic.search_intent || topic.intent || '',
                currently_covered: topic.currentlyCovered !== undefined ? (topic.currentlyCovered ? 'Yes' : 'No') : '',
                notes: topic.notes || topic.description || ''
            };
        });

        // Column mapping for header
        const columnMapping = {
            topic: 'Topic',
            primary_keyword: 'Primary Keyword',
            difficulty: 'Difficulty (0-100)',
            estimated_traffic: 'Estimated Traffic/Month',
            priority: 'Priority',
            pillar_topic: 'Pillar Topic',
            search_intent: 'Search Intent',
            currently_covered: 'Currently Covered',
            notes: 'Notes'
        };

        // Generate CSV
        const csv = stringify(csvData, {
            header: true,
            columns: columnMapping
        });

        // Return CSV file
        const websiteSlug = (job.website_url || 'website')
            .replace(/^https?:\/\//, '')
            .replace(/[^a-z0-9]/gi, '_')
            .substring(0, 50);
        const filename = `${websiteSlug}_topics_${new Date().toISOString().split('T')[0]}.csv`;

        return new NextResponse(csv, {
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="${filename}"`
            }
        });

    } catch (error: any) {
        console.error('Error exporting topics CSV:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to export topics CSV' },
            { status: 500 }
        );
    }
}
