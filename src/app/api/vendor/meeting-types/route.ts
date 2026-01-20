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

    // Get meeting types
    const { data: meetingTypes, error } = await supabase
      .from('vendor_meeting_types')
      .select('*')
      .eq('vendor_id', vendor.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching meeting types:', error);
      return NextResponse.json({ success: false, error: 'Failed to fetch meeting types' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      meetingTypes: meetingTypes || []
    });

  } catch (error: any) {
    console.error('Error in meeting types API:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const {
      name,
      description,
      duration_minutes,
      buffer_before_minutes = 0,
      buffer_after_minutes = 15,
      location_type = 'google_meet',
      location_details,
      is_paid = false,
      price = 0,
      currency = 'USD',
      color
    } = body;

    if (!name || !duration_minutes) {
      return NextResponse.json({ success: false, error: 'Name and duration are required' }, { status: 400 });
    }

    // Create meeting type
    const { data: meetingType, error } = await supabase
      .from('vendor_meeting_types')
      .insert({
        vendor_id: vendor.id,
        name,
        description,
        duration_minutes,
        buffer_before_minutes,
        buffer_after_minutes,
        location_type,
        location_details,
        is_paid,
        price,
        currency,
        color,
        is_active: true
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating meeting type:', error);
      return NextResponse.json({ success: false, error: 'Failed to create meeting type' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      meetingType
    });

  } catch (error: any) {
    console.error('Error in meeting types API:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
