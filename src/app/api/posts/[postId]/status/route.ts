import { NextResponse } from 'next/server';

// Mock post storage
const mockPosts: Record<string, any> = {};

// POST /api/posts/[postId]/status - Update post status
export async function POST(
    request: Request,
    { params }: { params: Promise<{ postId: string }> }
) {
    try {
        const { postId } = await params;
        const body = await request.json();
        const { status, notes } = body;

        const validStatuses = ['idea', 'researching', 'drafting', 'editing', 'ready_for_review', 'approved', 'scheduled', 'published', 'rejected'];

        if (!validStatuses.includes(status)) {
            return NextResponse.json(
                { success: false, error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
                { status: 400 }
            );
        }

        if (!mockPosts[postId]) {
            mockPosts[postId] = { id: postId, status: 'editing' };
        }

        const previousStatus = mockPosts[postId].status;
        mockPosts[postId].status = status;
        mockPosts[postId].updated_at = new Date().toISOString();

        if (notes) {
            mockPosts[postId].status_notes = notes;
        }

        console.log(`Post ${postId} status: ${previousStatus} → ${status}`);

        // Log activity
        // In production: create activity_log entry, send notifications

        // If status is ready_for_review, notify client
        if (status === 'ready_for_review') {
            console.log('Notifying client that post is ready for review');
            // sendEmailNotification(client, post);
        }

        // If status is published, push to CMS
        if (status === 'published') {
            console.log('Publishing post to CMS');
            // publishToWordPress(post);
        }

        return NextResponse.json({
            success: true,
            post: mockPosts[postId],
            message: `Post status updated to ${status}`
        });
    } catch (error) {
        console.error('Error updating post status:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to update post status' },
            { status: 500 }
        );
    }
}
