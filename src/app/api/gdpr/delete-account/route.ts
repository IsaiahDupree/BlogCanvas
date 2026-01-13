import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase/server';
import { deleteUserData } from '@/lib/gdpr/data-export';
import { createAuditLogger, AuditAction, AuditResource } from '@/lib/audit-logger';

/**
 * DELETE /api/gdpr/delete-account - Delete user account and all data (GDPR compliance)
 *
 * Body:
 * - confirmation: string (must be "DELETE MY ACCOUNT")
 *
 * This is irreversible!
 */
export async function DELETE(request: NextRequest) {
  const logger = createAuditLogger();
  logger.startTimer();

  try {
    // Authenticate user
    const user = await requireAuth();

    // Parse request body
    const body = await request.json();
    const { confirmation } = body;

    // Require explicit confirmation
    if (confirmation !== 'DELETE MY ACCOUNT') {
      await logger.log({
        userId: user.id,
        actionType: AuditAction.DELETE,
        resourceType: AuditResource.USER,
        resourceId: user.id,
        endpoint: '/api/gdpr/delete-account',
        method: 'DELETE',
        statusCode: 400,
        success: false,
        errorMessage: 'Invalid confirmation text',
        durationMs: logger.getElapsedTime(),
      });

      return NextResponse.json(
        {
          success: false,
          error: 'Invalid confirmation. Please type "DELETE MY ACCOUNT" exactly.'
        },
        { status: 400 }
      );
    }

    // Log the deletion BEFORE actually deleting (so we have a record)
    await logger.log({
      userId: user.id,
      actionType: AuditAction.DELETE,
      resourceType: AuditResource.USER,
      resourceId: user.id,
      endpoint: '/api/gdpr/delete-account',
      method: 'DELETE',
      statusCode: 200,
      success: true,
      metadata: {
        userEmail: user.email,
        deletionReason: 'User-requested account deletion (GDPR)',
      },
      durationMs: logger.getElapsedTime(),
    });

    // Delete all user data (this includes the auth user)
    await deleteUserData(user.id);

    // Return success
    return NextResponse.json({
      success: true,
      message: 'Account and all data have been permanently deleted.',
    });

  } catch (error: any) {
    console.error('Account deletion error:', error);

    // Try to log the error (user may still exist)
    try {
      await logger.log({
        actionType: AuditAction.DELETE,
        resourceType: AuditResource.USER,
        endpoint: '/api/gdpr/delete-account',
        method: 'DELETE',
        statusCode: 500,
        success: false,
        errorMessage: error.message,
        durationMs: logger.getElapsedTime(),
      });
    } catch (logError) {
      // Ignore logging errors at this point
      console.error('Failed to log deletion error:', logError);
    }

    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete account' },
      { status: error.message === 'Authentication required' ? 401 : 500 }
    );
  }
}
