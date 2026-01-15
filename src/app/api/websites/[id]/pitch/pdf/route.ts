import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { PitchDeckGenerator, generatePitchDeckData } from '@/lib/pitch-deck/generator';

/**
 * Generate PDF pitch deck for a website
 * POST /api/websites/[id]/pitch/pdf
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: websiteId } = await params;
        const supabase = await createClient();

        // Authenticate user
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get request body (optional parameters)
        const body = await request.json().catch(() => ({}));
        const {
            targetScore = 80,
            timelineMonths = 6,
        } = body;

        // Fetch website with client info
        const { data: website, error: websiteError } = await supabase
            .from('websites')
            .select(`
                *,
                client:clients(
                    id,
                    name,
                    website_url,
                    primary_contact_email
                )
            `)
            .eq('id', websiteId)
            .single();

        if (websiteError || !website) {
            return NextResponse.json(
                { success: false, error: 'Website not found' },
                { status: 404 }
            );
        }

        const client = (website as any).client;
        if (!client) {
            return NextResponse.json(
                { success: false, error: 'Client not found for website' },
                { status: 404 }
            );
        }

        // Fetch latest SEO audit
        const { data: audit } = await supabase
            .from('seo_audits')
            .select('*')
            .eq('website_id', websiteId)
            .order('audit_date', { ascending: false })
            .limit(1)
            .single();

        // Fetch topic clusters
        const { data: topicClusters } = await supabase
            .from('topic_clusters')
            .select('*')
            .eq('website_id', websiteId)
            .order('estimated_traffic', { ascending: false })
            .limit(20);

        // Get user profile for vendor info
        const { data: profile } = await supabase
            .from('profiles')
            .select('*, vendor:vendors(*)')
            .eq('id', user.id)
            .single();

        const vendorInfo = {
            name: profile?.vendor?.company_name || 'BlogCanvas',
            csmName: profile?.full_name || user.email?.split('@')[0] || 'Account Manager',
            csmEmail: user.email || ''
        };

        // Prepare audit data
        const auditData = {
            baseline_score: audit?.baseline_score || 50,
            pages_indexed: audit?.pages_indexed || 0
        };

        // Generate pitch deck data
        const pitchData = generatePitchDeckData(
            {
                name: client.name,
                website_url: website.url || client.website_url
            },
            auditData,
            topicClusters || [],
            vendorInfo,
            targetScore,
            timelineMonths
        );

        // Generate PDF using PitchDeckGenerator
        const generator = new PitchDeckGenerator();
        const pdfBlob = generator.generate(pitchData);

        // Convert blob to base64 for JSON response
        const arrayBuffer = await pdfBlob.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString('base64');

        // Store in reports table
        const { data: reportRecord, error: reportError } = await supabase
            .from('reports')
            .insert({
                website_id: websiteId,
                report_type: 'pitch_deck',
                generated_by: user.id,
                period_start: new Date().toISOString(),
                period_end: new Date().toISOString(),
                storage_url: null // Could store in Supabase Storage if needed
            })
            .select()
            .single();

        if (reportError) {
            console.warn('Failed to store report record:', reportError);
        }

        const filename = `${client.name.replace(/\s+/g, '_')}_SEO_Pitch_${new Date().toISOString().split('T')[0]}.pdf`;

        return NextResponse.json({
            success: true,
            pdf: base64,
            filename: filename,
            reportId: reportRecord?.id,
            data: {
                clientName: client.name,
                websiteUrl: website.url || client.website_url,
                currentScore: auditData.baseline_score,
                targetScore: targetScore,
                timelineMonths: timelineMonths,
                recommendedPosts: pitchData.recommendedPosts || 0,
                generatedAt: new Date().toISOString()
            }
        });

    } catch (error: any) {
        console.error('PDF pitch generation error:', error);
        return NextResponse.json({
            success: false,
            error: error.message || 'Failed to generate pitch PDF'
        }, { status: 500 });
    }
}

/**
 * Get pitch PDF generation options and status
 * GET /api/websites/[id]/pitch/pdf
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: websiteId } = await params;
        const supabase = await createClient();

        // Authenticate user
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if website exists
        const { data: website, error: websiteError } = await supabase
            .from('websites')
            .select('id, url')
            .eq('id', websiteId)
            .single();

        if (websiteError || !website) {
            return NextResponse.json(
                { success: false, error: 'Website not found' },
                { status: 404 }
            );
        }

        // Get recent pitch reports for this website
        const { data: recentReports } = await supabase
            .from('reports')
            .select('id, report_type, created_at, generated_by')
            .eq('website_id', websiteId)
            .eq('report_type', 'pitch_deck')
            .order('created_at', { ascending: false })
            .limit(5);

        return NextResponse.json({
            success: true,
            websiteId: websiteId,
            websiteUrl: website.url,
            options: {
                targetScoreOptions: [70, 75, 80, 85, 90],
                defaultTargetScore: 80,
                timelineOptions: [3, 6, 9, 12],
                defaultTimeline: 6
            },
            recentReports: recentReports || []
        });

    } catch (error: any) {
        console.error('Get pitch PDF options error:', error);
        return NextResponse.json({
            success: false,
            error: error.message || 'Failed to get pitch options'
        }, { status: 500 });
    }
}
