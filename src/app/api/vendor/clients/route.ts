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

    // Get clients with aggregated data
    const { data: clients, error: clientsError } = await supabase
      .from('vendor_clients')
      .select(`
        id,
        email,
        full_name,
        phone,
        status,
        created_at,
        last_activity_at,
        page_views,
        first_page_id,
        utm_source,
        utm_campaign
      `)
      .eq('vendor_id', vendor.id)
      .order('created_at', { ascending: false });

    if (clientsError) {
      console.error('Error fetching clients:', clientsError);
      return NextResponse.json({ success: false, error: 'Failed to fetch clients' }, { status: 500 });
    }

    // Get workspace counts and total spent per client
    const clientsWithStats = await Promise.all(
      (clients || []).map(async (client) => {
        // Get workspace count
        const { count: workspaceCount } = await supabase
          .from('vendor_workspaces')
          .select('*', { count: 'exact', head: true })
          .eq('client_id', client.id);

        // Get total spent
        const { data: orders } = await supabase
          .from('vendor_orders')
          .select('total_amount')
          .eq('client_id', client.id)
          .eq('payment_status', 'paid');

        const totalSpent = orders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;

        return {
          ...client,
          workspace_count: workspaceCount || 0,
          total_spent: totalSpent
        };
      })
    );

    // Calculate stats
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const stats = {
      total_clients: clientsWithStats.length,
      active_clients: clientsWithStats.filter(c => c.status === 'customer').length,
      new_this_month: clientsWithStats.filter(c => new Date(c.created_at) >= thirtyDaysAgo).length,
      total_revenue: clientsWithStats.reduce((sum, c) => sum + c.total_spent, 0)
    };

    return NextResponse.json({
      success: true,
      clients: clientsWithStats,
      stats
    });

  } catch (error: any) {
    console.error('Error in clients API:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
