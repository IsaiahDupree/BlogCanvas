import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase/server';
import { createAuditLogger, AuditLogFilter } from '@/lib/audit-logger';

/**
 * List audit logs with filtering
 * GET /api/audit-logs?actionType=...&resourceType=...&startDate=...&endDate=...&limit=50&offset=0
 */
export async function GET(request: NextRequest) {
    try {
        const { user } = await requireAuth();
        const searchParams = request.nextUrl.searchParams;

        // Build filters from query params
        const filters: AuditLogFilter = {
            userId: searchParams.get('userId') || undefined,
            actionType: searchParams.get('actionType') || undefined,
            resourceType: searchParams.get('resourceType') || undefined,
            resourceId: searchParams.get('resourceId') || undefined,
            success: searchParams.get('success') ? searchParams.get('success') === 'true' : undefined,
            limit: parseInt(searchParams.get('limit') || '50'),
            offset: parseInt(searchParams.get('offset') || '0'),
        };

        // Parse date filters
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        if (startDate) {
            filters.startDate = new Date(startDate);
        }
        if (endDate) {
            filters.endDate = new Date(endDate);
        }

        // Query audit logs
        const logger = createAuditLogger();
        const logs = await logger.query(filters);

        return NextResponse.json({
            success: true,
            logs,
            filters,
        });

    } catch (error: any) {
        console.error('Error fetching audit logs:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to fetch audit logs' },
            { status: 500 }
        );
    }
}
