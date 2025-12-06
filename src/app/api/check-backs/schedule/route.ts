import { NextRequest, NextResponse } from 'next/server';
import { scheduleCheckBacks } from '@/lib/analytics/check-back-scheduler';

/**
 * POST /api/check-backs/schedule - Schedule check-backs for a published post
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { blogPostId, publishedDate } = body;

        if (!blogPostId) {
            return NextResponse.json(
                { success: false, error: 'Blog post ID required' },
                { status: 400 }
            );
        }

        const publishDate = publishedDate ? new Date(publishedDate) : new Date();

        // Schedule check-backs (returns void)
        await scheduleCheckBacks(blogPostId, publishDate);

        return NextResponse.json({
            success: true,
            message: 'Check-backs scheduled successfully'
        });

    } catch (error: any) {
        console.error('Error scheduling check-backs:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

