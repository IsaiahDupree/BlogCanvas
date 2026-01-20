import { NextRequest, NextResponse } from 'next/server';
import { getVendorByHandle } from '@/lib/db/vendor/vendors';

export async function GET(
  request: NextRequest,
  { params }: { params: { handle: string } }
) {
  try {
    const { handle } = params;

    if (!handle) {
      return NextResponse.json(
        { success: false, error: 'Handle is required' },
        { status: 400 }
      );
    }

    // Remove @ prefix if present
    const cleanHandle = handle.startsWith('@') ? handle.substring(1) : handle;

    const vendor = await getVendorByHandle(cleanHandle);

    if (!vendor) {
      return NextResponse.json(
        { success: false, error: 'Vendor not found' },
        { status: 404 }
      );
    }

    // Only return active vendors
    if (vendor.status !== 'active') {
      return NextResponse.json(
        { success: false, error: 'Vendor not found' },
        { status: 404 }
      );
    }

    // Return public vendor info only
    return NextResponse.json({
      success: true,
      vendor: {
        id: vendor.id,
        handle: vendor.handle,
        business_name: vendor.business_name,
        bio: vendor.bio,
        avatar_url: vendor.avatar_url,
        logo_url: vendor.logo_url,
        brand_color: vendor.brand_color
      }
    });

  } catch (error: any) {
    console.error('[Public Vendor API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
