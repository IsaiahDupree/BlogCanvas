import { NextResponse } from 'next/server';

// POST /api/posts/[postId]/pipeline/run - Trigger/restart AI pipeline
export async function POST(
    request: Request,
    { params }: { params: Promise<{ postId: string }> }
) {
    try {
        const { postId } = await params;
        const body = await request.json();
        const { stage, retryFrom } = body;

        console.log(`Starting AI pipeline for post ${postId}`);
        if (stage) console.log(`Starting from stage: ${stage}`);
        if (retryFrom) console.log(`Retrying from: ${retryFrom}`);

        // In production: trigger background job
        // - Start orchestrator
        // - Run agents sequentially
        // - Apply quality gates
        // - Update status real-time via WebSocket/SSE

        // For now, simulate immediate success
        return NextResponse.json({
            success: true,
            message: 'AI pipeline started',
            pipelineId: `pipeline-${Date.now()}`,
            stages: ['research', 'outline', 'draft', 'seo', 'voice_tone'],
            currentStage: 'research',
            status: 'running'
        });
    } catch (error) {
        console.error('Error starting pipeline:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to start pipeline' },
            { status: 500 }
        );
    }
}

// GET /api/posts/[postId]/pipeline/status - Get pipeline status
export async function GET(
    request: Request,
    { params }: { params: Promise<{ postId: string }> }
) {
    try {
        const { postId } = await params;

        // Mock pipeline status
        const pipelineStatus = {
            postId,
            status: 'completed',
            currentStage: 'voice_tone',
            completedStages: ['research', 'outline', 'draft', 'seo', 'voice_tone'],
            qualityGates: {
                outline: { score: 85, passed: true },
                completeness: { score: 92, passed: true },
                seo: { score: 88, passed: true },
                voice_tone: { score: 83, passed: true }
            },
            startedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // 10 min ago
            completedAt: new Date().toISOString()
        };

        return NextResponse.json({
            success: true,
            pipeline: pipelineStatus
        });
    } catch (error) {
        console.error('Error fetching pipeline status:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch pipeline status' },
            { status: 500 }
        );
    }
}
