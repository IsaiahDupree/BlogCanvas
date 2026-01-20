import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getVendorByUserId } from '@/lib/db/vendor/vendors';
import { getVendorOfferPages, createOfferPage } from '@/lib/db/vendor/offer-pages';

/**
 * GET /api/vendor/pages
 * Get all offer pages for the current vendor
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

    // Get offer pages
    const pages = await getVendorOfferPages(vendor.id);

    return NextResponse.json({
      success: true,
      pages,
      count: pages.length
    });

  } catch (error: any) {
    console.error('[Vendor Pages GET] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/vendor/pages
 * Create a new offer page
 */
export async function POST(request: NextRequest) {
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

    // Get request body
    const body = await request.json();
    const { title, slug, description, blocks, meta_title, meta_description, og_image_url } = body;

    // Validate required fields
    if (!title || !slug) {
      return NextResponse.json(
        { success: false, error: 'Title and slug are required' },
        { status: 400 }
      );
    }

    // Create offer page
    const page = await createOfferPage({
      vendor_id: vendor.id,
      title,
      slug,
      description,
      blocks,
      meta_title,
      meta_description,
      og_image_url
    });

    if (!page) {
      return NextResponse.json(
        { success: false, error: 'Failed to create offer page' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      page,
      message: 'Offer page created successfully'
    });

  } catch (error: any) {
    console.error('[Vendor Pages POST] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 400 }
    );
  }
}
