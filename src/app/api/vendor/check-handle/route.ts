import { NextRequest, NextResponse } from 'next/server';
import { isHandleAvailable } from '@/lib/db/vendor/vendors';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const handle = searchParams.get('handle');

    if (!handle) {
      return NextResponse.json(
        { success: false, error: 'Handle parameter is required' },
        { status: 400 }
      );
    }

    // Validate handle format
    const handleRegex = /^[a-z0-9_-]+$/;
    if (!handleRegex.test(handle)) {
      return NextResponse.json(
        {
          success: false,
          available: false,
          error: 'Invalid handle format'
        },
        { status: 400 }
      );
    }

    const available = await isHandleAvailable(handle);

    return NextResponse.json({
      success: true,
      available,
      handle
    });

  } catch (error: any) {
    console.error('[Check Handle] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
