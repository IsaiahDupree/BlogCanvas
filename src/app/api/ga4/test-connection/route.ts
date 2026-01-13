import { NextRequest, NextResponse } from 'next/server';
import { testGA4Connection } from '@/lib/analytics/google-analytics-4';

/**
 * POST /api/ga4/test-connection
 * Test a GA4 connection before saving
 *
 * Request body:
 * - property_id: string
 * - service_account_email: string
 * - service_account_credentials: JSON object or string
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const {
      property_id,
      service_account_email,
      service_account_credentials,
    } = body;

    // Validate required fields
    if (!property_id || !service_account_email || !service_account_credentials) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Parse service account JSON if it's a string
    let credentials = service_account_credentials;
    if (typeof credentials === 'string') {
      try {
        credentials = JSON.parse(credentials);
      } catch (e) {
        return NextResponse.json(
          { error: 'Invalid service account JSON' },
          { status: 400 }
        );
      }
    }

    // Test connection
    const result = await testGA4Connection({
      propertyId: property_id,
      serviceAccountEmail: service_account_email,
      serviceAccountCredentials: credentials,
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Connection test successful',
        property_name: result.propertyName,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
