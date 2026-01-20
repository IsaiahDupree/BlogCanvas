import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const clientId = params.id;

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

    // Get client profile
    const { data: client, error: clientError } = await supabase
      .from('vendor_clients')
      .select(`
        id,
        email,
        full_name,
        phone,
        status,
        first_page_id,
        utm_source,
        utm_medium,
        utm_campaign,
        created_at,
        offer_pages:first_page_id(title)
      `)
      .eq('id', clientId)
      .eq('vendor_id', vendor.id)
      .single();

    if (clientError || !client) {
      return NextResponse.json(
        { success: false, error: 'Client not found' },
        { status: 404 }
      );
    }

    // Get page views count
    const { count: pageViews } = await supabase
      .from('vendor_event_log')
      .select('*', { count: 'exact', head: true })
      .eq('vendor_id', vendor.id)
      .eq('client_id', clientId)
      .eq('event_name', 'page_view');

    // Get last activity
    const { data: lastActivity } = await supabase
      .from('vendor_event_log')
      .select('created_at')
      .eq('vendor_id', vendor.id)
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Get workspaces
    const { data: workspaces } = await supabase
      .from('vendor_workspaces')
      .select('id, name, status, started_at')
      .eq('vendor_id', vendor.id)
      .eq('client_id', clientId)
      .order('started_at', { ascending: false });

    // Get orders
    const { data: orders } = await supabase
      .from('vendor_orders')
      .select('id, order_number, total_amount, payment_status, created_at')
      .eq('vendor_id', vendor.id)
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });

    // Get meetings
    const { data: meetings } = await supabase
      .from('vendor_meetings')
      .select('id, title, start_time, status')
      .eq('vendor_id', vendor.id)
      .eq('client_id', clientId)
      .order('start_time', { ascending: false });

    // Get message count
    const { count: messageCount } = await supabase
      .from('vendor_messages')
      .select('*', { count: 'exact', head: true })
      .eq('vendor_id', vendor.id)
      .in('workspace_id', (workspaces || []).map((w: any) => w.id));

    // Calculate total spent
    const totalSpent = (orders || [])
      .filter((o: any) => o.payment_status === 'paid')
      .reduce((sum: number, o: any) => sum + parseFloat(o.total_amount), 0);

    const clientProfile = {
      id: client.id,
      email: client.email,
      full_name: client.full_name,
      phone: client.phone,
      status: client.status,
      created_at: client.created_at,

      // Attribution
      first_page_title: (client as any).offer_pages?.title,
      utm_source: client.utm_source,
      utm_medium: client.utm_medium,
      utm_campaign: client.utm_campaign,

      // Activity
      page_views: pageViews || 0,
      last_activity_at: lastActivity?.created_at,

      // Workspaces
      workspaces: workspaces || [],

      // Orders
      orders: (orders || []).map((o: any) => ({
        ...o,
        total_amount: parseFloat(o.total_amount)
      })),

      // Meetings
      meetings: meetings || [],

      // Messages
      message_count: messageCount || 0,

      // Totals
      total_spent: totalSpent,
      total_workspaces: (workspaces || []).length
    };

    return NextResponse.json({
      success: true,
      client: clientProfile
    });
  } catch (error) {
    console.error('Error in vendor client profile API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
