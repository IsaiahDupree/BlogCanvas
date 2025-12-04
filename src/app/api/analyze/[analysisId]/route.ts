import { NextResponse } from 'next/server';

// GET /api/analyze/[analysisId] - Get analysis results
export async function GET(
    request: Request,
    { params }: { params: Promise<{ analysisId: string }> }
) {
    try {
        const { analysisId } = await params;

        // Mock analysis results
        const results = {
            id: analysisId,
            status: 'completed',
            website: 'example.com',
            pagesScraped: 47,
            gaps: [
                {
                    type: 'missing_topic',
                    severity: 'high',
                    title: 'No content about AI automation',
                    description: 'Competitors are covering AI extensively',
                    impact: 'High traffic opportunity'
                }
            ],
            suggestions: [
                {
                    title: 'Ultimate Guide to AI CRM',
                    targetKeyword: 'AI CRM',
                    estimatedWords: 2500,
                    priority: 10,
                    impact: 'high'
                }
            ],
            completedAt: new Date().toISOString()
        };

        return NextResponse.json({
            success: true,
            analysis: results
        });
    } catch (error) {
        console.error('Error fetching analysis:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch analysis' },
            { status: 500 }
        );
    }
}
