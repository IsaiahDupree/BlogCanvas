import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSharedClientContext } from '@/lib/brand/shared-context';
import { validateBrandContext, formatValidationMessage } from '@/lib/brand/context-validator';

/**
 * GET /api/brand/validate-context?clientId={id}
 * Validate brand context completeness before content generation
 *
 * @feat-173 PRD Brand: Context validation before generation
 *
 * Response:
 * {
 *   success: boolean;
 *   validation: {
 *     isValid: boolean;
 *     completeness: number;
 *     canProceed: boolean;
 *     message: string;
 *     issues: ValidationIssue[];
 *     suggestions: Record<string, any>;
 *   };
 * }
 */
export async function GET(request: Request) {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get clientId from query params
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');

    if (!clientId) {
      return NextResponse.json(
        { success: false, error: 'clientId parameter is required' },
        { status: 400 }
      );
    }

    // Verify client access
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id, name')
      .eq('id', clientId)
      .single();

    if (clientError || !client) {
      return NextResponse.json(
        { success: false, error: 'Client not found or access denied' },
        { status: 404 }
      );
    }

    // Fetch brand context
    const context = await getSharedClientContext(clientId);

    // Validate context
    const validationResult = validateBrandContext(context);

    // Format user-friendly message
    const message = formatValidationMessage(validationResult);

    return NextResponse.json({
      success: true,
      validation: {
        isValid: validationResult.isValid,
        completeness: validationResult.completeness,
        canProceed: validationResult.canProceed,
        message,
        issues: validationResult.issues,
        missingFields: validationResult.missingFields,
        suggestions: validationResult.suggestions
      }
    });

  } catch (error) {
    console.error('Error validating brand context:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to validate context'
      },
      { status: 500 }
    );
  }
}
