import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const view = searchParams.get('view') || 'upcoming';

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

    const now = new Date().toISOString();

    // Build query based on view
    let query = supabase
      .from('vendor_meetings')
      .select(`
        id,
        title,
        start_time,
        end_time,
        duration_minutes,
        status,
        meeting_url,
        notes,
        vendor_clients (
          email,
          full_name
        ),
        vendor_meeting_types (
          name
        )
      `)
      .eq('vendor_id', vendor.id);

    if (view === 'upcoming') {
      query = query
        .gte('start_time', now)
        .in('status', ['scheduled'])
        .order('start_time', { ascending: true });
    } else {
      query = query
        .lt('start_time', now)
        .order('start_time', { ascending: false });
    }

    const { data: meetings, error: meetingsError } = await query.limit(50);

    if (meetingsError) {
      console.error('Error fetching meetings:', meetingsError);
      return NextResponse.json({ success: false, error: 'Failed to fetch meetings' }, { status: 500 });
    }

    // Transform meetings data
    const transformedMeetings = (meetings || []).map(meeting => ({
      id: meeting.id,
      title: meeting.title,
      client_name: meeting.vendor_clients?.full_name,
      client_email: meeting.vendor_clients?.email,
      meeting_type: meeting.vendor_meeting_types?.name || 'Meeting',
      start_time: meeting.start_time,
      end_time: meeting.end_time,
      duration_minutes: meeting.duration_minutes,
      status: meeting.status,
      meeting_url: meeting.meeting_url,
      notes: meeting.notes
    }));

    // Calculate stats
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

    // Get upcoming count
    const { count: upcomingCount } = await supabase
      .from('vendor_meetings')
      .select('*', { count: 'exact', head: true })
      .eq('vendor_id', vendor.id)
      .gte('start_time', now)
      .eq('status', 'scheduled');

    // Get completed this week
    const { count: completedThisWeek } = await supabase
      .from('vendor_meetings')
      .select('*', { count: 'exact', head: true })
      .eq('vendor_id', vendor.id)
      .gte('start_time', weekAgo)
      .eq('status', 'completed');

    // Get cancelled this month
    const { count: cancelledThisMonth } = await supabase
      .from('vendor_meetings')
      .select('*', { count: 'exact', head: true })
      .eq('vendor_id', vendor.id)
      .gte('start_time', monthStart)
      .eq('status', 'cancelled');

    // Get total hours this month
    const { data: monthMeetings } = await supabase
      .from('vendor_meetings')
      .select('duration_minutes')
      .eq('vendor_id', vendor.id)
      .gte('start_time', monthStart)
      .eq('status', 'completed');

    const totalMinutes = monthMeetings?.reduce((sum, m) => sum + (m.duration_minutes || 0), 0) || 0;

    const stats = {
      upcoming: upcomingCount || 0,
      completed_this_week: completedThisWeek || 0,
      cancelled_this_month: cancelledThisMonth || 0,
      total_hours_this_month: totalMinutes / 60
    };

    return NextResponse.json({
      success: true,
      meetings: transformedMeetings,
      stats
    });

  } catch (error: any) {
    console.error('Error in meetings API:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
