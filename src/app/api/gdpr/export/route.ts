import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase/server';
import { exportUserData, convertToCSV } from '@/lib/gdpr/data-export';
import { createAuditLogger, AuditAction, AuditResource } from '@/lib/audit-logger';

/**
 * GET /api/gdpr/export - Export all user data (GDPR compliance)
 *
 * Query params:
 * - format: 'json' | 'zip' (default: 'json')
 *
 * Returns user data in requested format
 */
export async function GET(request: NextRequest) {
  const logger = createAuditLogger();
  logger.startTimer();

  try {
    // Authenticate user
    const user = await requireAuth();

    // Get format from query params
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json';

    // Export all user data
    const userData = await exportUserData(user.id);

    // Log the export action
    await logger.log({
      userId: user.id,
      actionType: AuditAction.EXPORT,
      resourceType: AuditResource.USER,
      resourceId: user.id,
      endpoint: '/api/gdpr/export',
      method: 'GET',
      statusCode: 200,
      success: true,
      metadata: {
        format,
        recordCount: {
          clients: userData.clients?.length || 0,
          blogPosts: userData.blogPosts?.length || 0,
          comments: userData.comments?.length || 0,
          files: userData.files?.length || 0,
        },
      },
      durationMs: logger.getElapsedTime(),
    });

    // Return data based on format
    if (format === 'zip') {
      // For ZIP format, we'll return JSON and CSV as separate files
      // In a production app, you'd use a ZIP library like jszip
      const json = JSON.stringify(userData, null, 2);
      const csv = convertToCSV(userData);

      // For now, return JSON (ZIP generation can be added later)
      return new NextResponse(json, {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="user-data-${user.id}-${Date.now()}.json"`,
        },
      });
    }

    // JSON format (default)
    const json = JSON.stringify(userData, null, 2);
    return new NextResponse(json, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="user-data-${user.id}-${Date.now()}.json"`,
      },
    });

  } catch (error: any) {
    console.error('Data export error:', error);

    await logger.log({
      actionType: AuditAction.EXPORT,
      resourceType: AuditResource.USER,
      endpoint: '/api/gdpr/export',
      method: 'GET',
      statusCode: 500,
      success: false,
      errorMessage: error.message,
      durationMs: logger.getElapsedTime(),
    });

    return NextResponse.json(
      { success: false, error: error.message || 'Failed to export data' },
      { status: error.message === 'Authentication required' ? 401 : 500 }
    );
  }
}
