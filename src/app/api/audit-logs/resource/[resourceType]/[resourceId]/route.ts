import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase/server';
import { createAuditLogger } from '@/lib/audit-logger';

/**
 * Get audit history for a specific resource
 * GET /api/audit-logs/resource/:resourceType/:resourceId
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ resourceType: string; resourceId: string }> }
) {
    try {
        await requireAuth();

        const { resourceType, resourceId } = await params;

        if (!resourceType || !resourceId) {
            return NextResponse.json(
                { success: false, error: 'Resource type and ID are required' },
                { status: 400 }
            );
        }

        // Get resource history
        const logger = createAuditLogger();
        const history = await logger.getResourceHistory(resourceType, resourceId);

        return NextResponse.json({
            success: true,
            resourceType,
            resourceId,
            history,
        });

    } catch (error: any) {
        console.error('Error fetching resource history:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to fetch resource history' },
            { status: 500 }
        );
    }
}
