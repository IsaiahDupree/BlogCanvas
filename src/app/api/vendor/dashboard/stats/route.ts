import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Get vendor profile
    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (vendorError || !vendor) {
      return NextResponse.json({ success: false, error: 'Vendor not found' }, { status: 404 });
    }

    const vendorId = vendor.id;

    // Get page stats
    const { data: pages, error: pagesError } = await supabase
      .from('offer_pages')
      .select('id, is_published, view_count')
      .eq('vendor_id', vendorId);

    const totalPages = pages?.length || 0;
    const publishedPages = pages?.filter(p => p.is_published).length || 0;
    const totalViews = pages?.reduce((sum, p) => sum + (p.view_count || 0), 0) || 0;

    // Get client stats
    const { count: totalClients } = await supabase
      .from('vendor_clients')
      .select('*', { count: 'exact', head: true })
      .eq('vendor_id', vendorId);

    // Get active workspaces
    const { count: activeWorkspaces } = await supabase
      .from('vendor_workspaces')
      .select('*', { count: 'exact', head: true })
      .eq('vendor_id', vendorId)
      .in('status', ['active', 'onboarding']);

    // Get revenue stats
    const { data: orders } = await supabase
      .from('vendor_orders')
      .select('total_amount, created_at')
      .eq('vendor_id', vendorId)
      .eq('payment_status', 'paid');

    const totalRevenue = orders?.reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0;

    // Calculate monthly revenue (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const monthlyRevenue = orders
      ?.filter(o => new Date(o.created_at) >= thirtyDaysAgo)
      .reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0;

    // Calculate conversion rate (checkouts / views)
    const { count: completedCheckouts } = await supabase
      .from('vendor_orders')
      .select('*', { count: 'exact', head: true })
      .eq('vendor_id', vendorId)
      .eq('payment_status', 'paid');

    const conversionRate = totalViews > 0 
      ? ((completedCheckouts || 0) / totalViews) * 100 
      : 0;

    // Get recent activity for the dashboard
    const { data: recentOrders } = await supabase
      .from('vendor_orders')
      .select(`
        id,
        order_number,
        total_amount,
        payment_status,
        created_at,
        vendor_clients (
          email,
          full_name
        )
      `)
      .eq('vendor_id', vendorId)
      .order('created_at', { ascending: false })
      .limit(5);

    const { data: recentClients } = await supabase
      .from('vendor_clients')
      .select('id, email, full_name, status, created_at')
      .eq('vendor_id', vendorId)
      .order('created_at', { ascending: false })
      .limit(5);

    return NextResponse.json({
      success: true,
      stats: {
        totalPages,
        publishedPages,
        totalClients: totalClients || 0,
        activeWorkspaces: activeWorkspaces || 0,
        totalRevenue,
        monthlyRevenue,
        totalViews,
        conversionRate: Math.round(conversionRate * 100) / 100
      },
      recentActivity: {
        orders: recentOrders || [],
        clients: recentClients || []
      }
    });

  } catch (error: any) {
    console.error('Error in dashboard stats API:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
