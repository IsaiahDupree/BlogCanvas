import { NextRequest, NextResponse } from 'next/server';
import { getVendorByHandle } from '@/lib/db/vendor/vendors';
import { incrementPageViews } from '@/lib/db/vendor/offer-pages';
import { supabase } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: { handle: string; slug: string } }
) {
  try {
    const { handle, slug } = params;

    if (!handle || !slug) {
      return NextResponse.json(
        { success: false, error: 'Handle and slug are required' },
        { status: 400 }
      );
    }

    // Remove @ prefix if present
    const cleanHandle = handle.startsWith('@') ? handle.substring(1) : handle;

    // Get vendor
    const vendor = await getVendorByHandle(cleanHandle);

    if (!vendor || vendor.status !== 'active') {
      return NextResponse.json(
        { success: false, error: 'Vendor not found' },
        { status: 404 }
      );
    }

    // Get offer page by vendor_id and slug
    const { data: page, error: pageError } = await supabase
      .from('offer_pages')
      .select('*')
      .eq('vendor_id', vendor.id)
      .eq('slug', slug)
      .eq('is_published', true)
      .single();

    if (pageError || !page) {
      return NextResponse.json(
        { success: false, error: 'Page not found' },
        { status: 404 }
      );
    }

    // Increment view count (async, don't wait)
    incrementPageViews(page.id).catch(console.error);

    return NextResponse.json({
      success: true,
      page
    });

  } catch (error: any) {
    console.error('[Public Page API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
