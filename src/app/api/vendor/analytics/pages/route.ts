import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/vendor/analytics/pages
 * Get page performance metrics for the vendor
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Get vendor
    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (vendorError || !vendor) {
      return NextResponse.json({ success: false, error: 'Vendor not found' }, { status: 404 });
    }

    // Get date range from query params
    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '7d';

    // Calculate date range
    const now = new Date();
    const daysAgo = range === '90d' ? 90 : range === '30d' ? 30 : 7;
    const startDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

    // Get page performance from events
    const { data: pageEvents, error } = await supabase.rpc('get_vendor_page_performance', {
      p_vendor_id: vendor.id,
      p_start_date: startDate.toISOString(),
      p_end_date: now.toISOString()
    });

    if (error) {
      console.error('[Vendor Analytics Pages API] Error:', error);
      // If RPC doesn't exist yet, return empty array
      return NextResponse.json({
        success: true,
        pages: []
      });
    }

    return NextResponse.json({
      success: true,
      pages: pageEvents || []
    });

  } catch (error: any) {
    console.error('[Vendor Analytics Pages API] Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
