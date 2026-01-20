import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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

    // Get leads (clients) with their activity
    const { data: clients, error: clientsError } = await supabase
      .from('vendor_clients')
      .select(`
        id,
        email,
        full_name,
        status,
        first_page_id,
        utm_source,
        utm_medium,
        utm_campaign,
        created_at,
        offer_pages:first_page_id(title)
      `)
      .eq('vendor_id', vendor.id)
      .order('created_at', { ascending: false });

    if (clientsError) {
      console.error('Error fetching clients:', clientsError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch leads' },
        { status: 500 }
      );
    }

    // Get activity stats for each lead
    const leadsWithActivity = await Promise.all(
      (clients || []).map(async (client) => {
        // Count page views
        const { count: pageViews } = await supabase
          .from('vendor_event_log')
          .select('*', { count: 'exact', head: true })
          .eq('vendor_id', vendor.id)
          .eq('client_id', client.id)
          .eq('event_name', 'page_view');

        // Count CTA clicks
        const { count: ctaClicks } = await supabase
          .from('vendor_event_log')
          .select('*', { count: 'exact', head: true })
          .eq('vendor_id', vendor.id)
          .eq('client_id', client.id)
          .eq('event_name', 'cta_click');

        // Check if booked a call
        const { data: meetings } = await supabase
          .from('vendor_meetings')
          .select('id')
          .eq('vendor_id', vendor.id)
          .eq('client_id', client.id)
          .limit(1);

        // Check if purchased
        const { data: orders } = await supabase
          .from('vendor_orders')
          .select('id')
          .eq('vendor_id', vendor.id)
          .eq('client_id', client.id)
          .eq('payment_status', 'paid')
          .limit(1);

        return {
          id: client.id,
          email: client.email,
          full_name: client.full_name,
          status: client.status,
          first_page_id: client.first_page_id,
          first_page_title: (client as any).offer_pages?.title,
          utm_source: client.utm_source,
          utm_medium: client.utm_medium,
          utm_campaign: client.utm_campaign,
          created_at: client.created_at,
          page_views: pageViews || 0,
          cta_clicks: ctaClicks || 0,
          has_booked_call: (meetings?.length || 0) > 0,
          has_purchased: (orders?.length || 0) > 0
        };
      })
    );

    // Calculate stats
    const totalLeads = clients?.length || 0;
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const newThisWeek = clients?.filter(
      (c) => new Date(c.created_at) >= oneWeekAgo
    ).length || 0;

    const customers = clients?.filter((c) => c.status === 'customer').length || 0;
    const conversionRate = totalLeads > 0 ? (customers / totalLeads) * 100 : 0;

    // Count booked calls this month
    const firstOfMonth = new Date();
    firstOfMonth.setDate(1);
    firstOfMonth.setHours(0, 0, 0, 0);

    const { count: bookedCallsCount } = await supabase
      .from('vendor_meetings')
      .select('*', { count: 'exact', head: true })
      .eq('vendor_id', vendor.id)
      .gte('created_at', firstOfMonth.toISOString());

    const stats = {
      total_leads: totalLeads,
      new_this_week: newThisWeek,
      conversion_rate: conversionRate,
      booked_calls: bookedCallsCount || 0
    };

    return NextResponse.json({
      success: true,
      leads: leadsWithActivity,
      stats
    });
  } catch (error) {
    console.error('Error in vendor leads API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
