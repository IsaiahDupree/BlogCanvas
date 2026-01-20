import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;
    const range = searchParams.get('range') || 'month';

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get vendor profile
    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (vendorError || !vendor) {
      return NextResponse.json(
        { success: false, error: 'Vendor profile not found' },
        { status: 404 }
      );
    }

    // Calculate date range
    const now = new Date();
    let startDate: Date | null = null;

    switch (range) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = null;
    }

    // Build query for orders
    let ordersQuery = supabase
      .from('vendor_orders')
      .select(`
        id,
        order_number,
        total_amount,
        currency,
        payment_status,
        payment_method,
        paid_at,
        created_at,
        vendor_clients!inner(
          email,
          full_name
        ),
        offers!inner(
          name
        )
      `)
      .eq('vendor_id', vendor.id)
      .order('created_at', { ascending: false });

    if (startDate) {
      ordersQuery = ordersQuery.gte('created_at', startDate.toISOString());
    }

    const { data: orders, error: ordersError } = await ordersQuery;

    if (ordersError) {
      console.error('Error fetching orders:', ordersError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch orders' },
        { status: 500 }
      );
    }

    // Transform orders data
    const transformedOrders = (orders || []).map((order: any) => ({
      id: order.id,
      order_number: order.order_number,
      client_email: order.vendor_clients?.email || 'Unknown',
      client_name: order.vendor_clients?.full_name,
      offer_name: order.offers?.name || 'Unknown Offer',
      total_amount: parseFloat(order.total_amount),
      currency: order.currency,
      payment_status: order.payment_status,
      payment_method: order.payment_method,
      paid_at: order.paid_at,
      created_at: order.created_at
    }));

    // Calculate stats - all time
    const { data: allOrders } = await supabase
      .from('vendor_orders')
      .select('total_amount, payment_status, currency')
      .eq('vendor_id', vendor.id);

    const paidOrders = (allOrders || []).filter((o: any) => o.payment_status === 'paid');
    const totalRevenue = paidOrders.reduce((sum: number, o: any) => sum + parseFloat(o.total_amount), 0);
    const avgOrderValue = paidOrders.length > 0 ? totalRevenue / paidOrders.length : 0;

    // Monthly revenue
    const firstOfMonth = new Date();
    firstOfMonth.setDate(1);
    firstOfMonth.setHours(0, 0, 0, 0);

    const { data: monthOrders } = await supabase
      .from('vendor_orders')
      .select('total_amount')
      .eq('vendor_id', vendor.id)
      .eq('payment_status', 'paid')
      .gte('created_at', firstOfMonth.toISOString());

    const monthlyRevenue = (monthOrders || []).reduce((sum: number, o: any) => sum + parseFloat(o.total_amount), 0);

    // Pending orders
    const { data: pendingOrders } = await supabase
      .from('vendor_orders')
      .select('total_amount')
      .eq('vendor_id', vendor.id)
      .eq('payment_status', 'pending');

    const pendingAmount = (pendingOrders || []).reduce((sum: number, o: any) => sum + parseFloat(o.total_amount), 0);

    // Calculate MRR from active subscriptions
    const { data: subscriptions } = await supabase
      .from('vendor_subscriptions')
      .select('amount, billing_period')
      .eq('vendor_id', vendor.id)
      .eq('status', 'active');

    let mrr = 0;
    (subscriptions || []).forEach((sub: any) => {
      const amount = parseFloat(sub.amount);
      if (sub.billing_period === 'monthly') {
        mrr += amount;
      } else if (sub.billing_period === 'annual') {
        mrr += amount / 12;
      }
    });

    const stats = {
      total_revenue: totalRevenue,
      monthly_revenue: monthlyRevenue,
      total_orders: paidOrders.length,
      avg_order_value: avgOrderValue,
      mrr,
      pending_amount: pendingAmount
    };

    return NextResponse.json({
      success: true,
      orders: transformedOrders,
      stats
    });
  } catch (error) {
    console.error('Error in vendor sales API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
