/**
 * Vendor availability API
 * Manage vendor availability slots
 */

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

    // Get availability slots
    const { data: availability, error: availError } = await supabase
      .from('vendor_availability')
      .select('*')
      .eq('vendor_id', vendor.id)
      .eq('is_active', true)
      .order('day_of_week', { ascending: true })
      .order('start_time', { ascending: true });

    if (availError) {
      console.error('[Availability API] Error fetching availability:', availError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch availability' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      availability: availability || []
    });

  } catch (error: any) {
    console.error('[Availability API] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { day_of_week, start_time, end_time } = body;

    // Validate input
    if (
      day_of_week === undefined ||
      day_of_week < 0 ||
      day_of_week > 6 ||
      !start_time ||
      !end_time
    ) {
      return NextResponse.json(
        { success: false, error: 'Invalid availability data' },
        { status: 400 }
      );
    }

    // Create availability slot
    const { data, error } = await supabase
      .from('vendor_availability')
      .insert({
        vendor_id: vendor.id,
        day_of_week,
        start_time,
        end_time,
        is_active: true
      })
      .select()
      .single();

    if (error) {
      console.error('[Availability API] Error creating availability:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to create availability' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      availability: data
    });

  } catch (error: any) {
    console.error('[Availability API] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
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

    const body = await request.json();
    const { availability } = body; // Array of availability slots

    if (!Array.isArray(availability)) {
      return NextResponse.json(
        { success: false, error: 'Invalid availability data' },
        { status: 400 }
      );
    }

    // Delete all existing availability slots
    await supabase
      .from('vendor_availability')
      .delete()
      .eq('vendor_id', vendor.id);

    // Insert new availability slots
    if (availability.length > 0) {
      const slots = availability.map(slot => ({
        vendor_id: vendor.id,
        day_of_week: slot.day_of_week,
        start_time: slot.start_time,
        end_time: slot.end_time,
        is_active: true
      }));

      const { error } = await supabase
        .from('vendor_availability')
        .insert(slots);

      if (error) {
        console.error('[Availability API] Error updating availability:', error);
        return NextResponse.json(
          { success: false, error: 'Failed to update availability' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Availability updated successfully'
    });

  } catch (error: any) {
    console.error('[Availability API] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
