import { NextRequest, NextResponse } from 'next/server';
import { getPostCheckBacks } from '@/lib/analytics/check-back-scheduler';

/**
 * GET /api/check-backs/posts/[postId] - Get check-back schedules for a post
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ postId: string }> }
) {
    try {
        const { postId } = await params;
        const checkBacks = await getPostCheckBacks(postId);

        return NextResponse.json({
            success: true,
            checkBacks
        });

    } catch (error: any) {
        console.error('Error fetching check-backs:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

