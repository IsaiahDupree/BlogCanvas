import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getFunnelMetrics } from '@/lib/db/events';

/**
 * GET /api/vendor/analytics/funnel
 * Get funnel metrics for the vendor
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
    const pageId = searchParams.get('page_id');

    // Calculate date range
    const now = new Date();
    const daysAgo = range === '90d' ? 90 : range === '30d' ? 30 : 7;
    const startDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

    const dateRange = {
      start: startDate.toISOString(),
      end: now.toISOString()
    };

    // Get funnel metrics
    const result = await getFunnelMetrics(vendor.id, pageId || undefined, dateRange);

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      metrics: result.metrics
    });

  } catch (error: any) {
    console.error('[Vendor Analytics Funnel API] Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
