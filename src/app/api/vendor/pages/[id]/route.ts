import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getVendorByUserId } from '@/lib/db/vendor/vendors';
import { getOfferPageById, updateOfferPage, deleteOfferPage } from '@/lib/db/vendor/offer-pages';

/**
 * GET /api/vendor/pages/[id]
 * Get a specific offer page
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Get offer page
    const page = await getOfferPageById(params.id);

    if (!page) {
      return NextResponse.json(
        { success: false, error: 'Offer page not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (page.vendor_id !== vendor.id) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      page
    });

  } catch (error: any) {
    console.error('[Vendor Page GET] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/vendor/pages/[id]
 * Update an offer page
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Get offer page
    const page = await getOfferPageById(params.id);

    if (!page) {
      return NextResponse.json(
        { success: false, error: 'Offer page not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (page.vendor_id !== vendor.id) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Get update data
    const body = await request.json();
    const {
      title,
      slug,
      description,
      blocks,
      meta_title,
      meta_description,
      og_image_url,
      is_published
    } = body;

    // Update offer page
    const updatedPage = await updateOfferPage(params.id, {
      title,
      slug,
      description,
      blocks,
      meta_title,
      meta_description,
      og_image_url,
      is_published
    });

    if (!updatedPage) {
      return NextResponse.json(
        { success: false, error: 'Failed to update offer page' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      page: updatedPage,
      message: 'Offer page updated successfully'
    });

  } catch (error: any) {
    console.error('[Vendor Page PATCH] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 400 }
    );
  }
}

/**
 * DELETE /api/vendor/pages/[id]
 * Delete an offer page
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Get offer page
    const page = await getOfferPageById(params.id);

    if (!page) {
      return NextResponse.json(
        { success: false, error: 'Offer page not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (page.vendor_id !== vendor.id) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Delete offer page
    const success = await deleteOfferPage(params.id);

    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Failed to delete offer page' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Offer page deleted successfully'
    });

  } catch (error: any) {
    console.error('[Vendor Page DELETE] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
