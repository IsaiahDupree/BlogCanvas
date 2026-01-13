import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase/server';
import { createAuditLogger, AuditLogFilter } from '@/lib/audit-logger';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * Export audit logs
 * POST /api/audit-logs/export
 * Body: { exportType: 'csv' | 'json' | 'pdf', filters: AuditLogFilter }
 */
export async function POST(request: NextRequest) {
    try {
        const { user } = await requireAuth();
        const body = await request.json();
        const { exportType, filters } = body;

        if (!exportType || !['csv', 'json', 'pdf'].includes(exportType)) {
            return NextResponse.json(
                { success: false, error: 'Invalid export type' },
                { status: 400 }
            );
        }

        // Get vendor ID
        const { data: vendor } = await supabaseAdmin
            .from('vendors')
            .select('id')
            .eq('user_id', user.id)
            .single();

        if (!vendor) {
            return NextResponse.json(
                { success: false, error: 'Vendor not found' },
                { status: 404 }
            );
        }

        // Create export
        const logger = createAuditLogger();
        const exportId = await logger.exportLogs(user.id, vendor.id, exportType, filters || {});

        if (!exportId) {
            return NextResponse.json(
                { success: false, error: 'Failed to create export' },
                { status: 500 }
            );
        }

        // Fetch the logs for the export
        const logs = await logger.query(filters || {});

        // Format based on export type
        let content: string;
        let contentType: string;
        let filename: string;

        if (exportType === 'json') {
            content = JSON.stringify(logs, null, 2);
            contentType = 'application/json';
            filename = `audit-logs-${Date.now()}.json`;
        } else if (exportType === 'csv') {
            // Convert to CSV
            const headers = [
                'Timestamp',
                'Action Type',
                'Resource Type',
                'Resource ID',
                'User ID',
                'Endpoint',
                'Method',
                'Status Code',
                'Success',
                'IP Address',
                'Duration (ms)',
            ];

            const rows = logs.map(log => [
                log.created_at,
                log.action_type,
                log.resource_type,
                log.resource_id || '',
                log.user_id || '',
                log.endpoint,
                log.method,
                log.status_code || '',
                log.success ? 'Yes' : 'No',
                log.ip_address || '',
                log.duration_ms || '',
            ]);

            content = [
                headers.join(','),
                ...rows.map(row => row.map(cell => {
                    // Escape CSV values
                    const value = String(cell);
                    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
                        return `"${value.replace(/"/g, '""')}"`;
                    }
                    return value;
                }).join(','))
            ].join('\n');

            contentType = 'text/csv';
            filename = `audit-logs-${Date.now()}.csv`;
        } else {
            // PDF export would require a PDF generation library
            // For now, return JSON
            content = JSON.stringify(logs, null, 2);
            contentType = 'application/json';
            filename = `audit-logs-${Date.now()}.json`;
        }

        // Return the file as a download
        return new NextResponse(content, {
            status: 200,
            headers: {
                'Content-Type': contentType,
                'Content-Disposition': `attachment; filename="${filename}"`,
            },
        });

    } catch (error: any) {
        console.error('Error exporting audit logs:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to export audit logs' },
            { status: 500 }
        );
    }
}
