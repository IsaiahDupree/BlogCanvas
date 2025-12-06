import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { projectSEOScore, getRecommendedTarget, calculateCadence, generateForecast } from '@/lib/analysis/score-projection';

// POST /api/websites/[id]/project-score - Calculate SEO score projection
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { targetScore, customMonths } = body;

        // Fetch current SEO audit
        const { data: audit, error: auditError } = await supabaseAdmin
            .from('seo_audits')
            .select('baseline_score')
            .eq('website_id', id)
            .order('audit_date', { ascending: false })
            .limit(1)
            .single();

        if (auditError || !audit) {
            return NextResponse.json(
                { success: false, error: 'No audit found for this website' },
                { status: 404 }
            );
        }

        const currentScore = audit.baseline_score;

        // Use provided target or recommend one
        const target = targetScore || getRecommendedTarget(currentScore);

        // Get gap and cluster counts
        const { count: gapCount } = await supabaseAdmin
            .from('content_gaps')
            .select('*', { count: 'exact', head: true })
            .eq('website_id', id)
            .eq('status', 'open');

        const { data: clusters } = await supabaseAdmin
            .from('topic_clusters')
            .select('currently_covered')
            .eq('website_id', id);

        const uncoveredClusters = clusters?.filter(c => !c.currently_covered).length || 0;

        // Get current blog post count
        const { count: currentPosts } = await supabaseAdmin
            .from('scraped_pages')
            .select('*', { count: 'exact', head: true })
            .eq('website_id', id)
            .ilike('url', '%/blog/%');

        // Calculate projection
        const projection = projectSEOScore(
            currentScore,
            target,
            gapCount || 0,
            uncoveredClusters,
            currentPosts || 0
        );

        // Use custom timeline if provided
        if (customMonths) {
            projection.timeline_months = customMonths;
        }

        // Calculate cadence
        const cadence = calculateCadence(
            projection.recommended_posts,
            projection.timeline_months
        );

        // Generate forecast
        const forecast = generateForecast(
            currentScore,
            target,
            projection.timeline_months
        );

        return NextResponse.json({
            success: true,
            projection: {
                ...projection,
                cadence,
                forecast
            }
        });

    } catch (error) {
        console.error('Error projecting score:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to calculate projection' },
            { status: 500 }
        );
    }
}
