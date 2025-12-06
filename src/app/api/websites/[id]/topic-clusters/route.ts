import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { generateTopicClusters, saveTopicClusters, prioritizeClusters } from '@/lib/analysis/topic-clusters';

// GET /api/websites/[id]/topic-clusters - Get topic clusters for a website
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Fetch existing clusters from database
        const { data: clusters, error } = await supabaseAdmin
            .from('topic_clusters')
            .select('*')
            .eq('website_id', id)
            .order('estimated_traffic', { ascending: false });

        if (error) {
            console.error('Error fetching clusters:', error);
            return NextResponse.json(
                { success: false, error: 'Failed to fetch topic clusters' },
                { status: 500 }
            );
        }

        // Separate covered vs uncovered
        const covered = clusters?.filter(c => c.currently_covered) || [];
        const opportunities = clusters?.filter(c => !c.currently_covered) || [];

        return NextResponse.json({
            success: true,
            clusters: clusters || [],
            covered,
            opportunities,
            stats: {
                total: clusters?.length || 0,
                covered: covered.length,
                opportunities: opportunities.length
            }
        });

    } catch (error) {
        console.error('Error in topic clusters API:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// POST /api/websites/[id]/topic-clusters - Generate topic clusters
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Check if website exists
        const { data: website, error: websiteError } = await supabaseAdmin
            .from('websites')
            .select('id')
            .eq('id', id)
            .single();

        if (websiteError || !website) {
            return NextResponse.json(
                { success: false, error: 'Website not found' },
                { status: 404 }
            );
        }

        // Generate topic clusters
        const clusters = await generateTopicClusters(id);

        // Save to database
        await saveTopicClusters(clusters);

        // Get prioritized opportunities
        const opportunities = prioritizeClusters(clusters);

        return NextResponse.json({
            success: true,
            clusters,
            opportunities: opportunities.slice(0, 10), // Top 10
            stats: {
                total: clusters.length,
                covered: clusters.filter(c => c.currently_covered).length,
                uncovered: clusters.filter(c => !c.currently_covered).length
            }
        });

    } catch (error) {
        console.error('Error generating clusters:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to generate topic clusters' },
            { status: 500 }
        );
    }
}
