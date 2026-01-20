import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getVendorByUserId, updateVendor } from '@/lib/db/vendor/vendors';

/**
 * GET /api/vendor/profile
 * Get the current user's vendor profile
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get vendor profile
    const vendor = await getVendorByUserId(user.id);

    if (!vendor) {
      return NextResponse.json(
        { success: false, error: 'Vendor profile not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      vendor
    });

  } catch (error: any) {
    console.error('[Vendor Profile GET] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/vendor/profile
 * Update the current user's vendor profile
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get vendor profile
    const vendor = await getVendorByUserId(user.id);

    if (!vendor) {
      return NextResponse.json(
        { success: false, error: 'Vendor profile not found' },
        { status: 404 }
      );
    }

    // Get update data
    const body = await request.json();
    const {
      handle,
      business_name,
      full_name,
      phone,
      avatar_url,
      bio,
      brand_color,
      logo_url,
      timezone
    } = body;

    // Update vendor
    const updatedVendor = await updateVendor(vendor.id, {
      handle,
      business_name,
      full_name,
      phone,
      avatar_url,
      bio,
      brand_color,
      logo_url,
      timezone
    });

    if (!updatedVendor) {
      return NextResponse.json(
        { success: false, error: 'Failed to update vendor profile' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      vendor: updatedVendor,
      message: 'Profile updated successfully'
    });

  } catch (error: any) {
    console.error('[Vendor Profile PATCH] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
