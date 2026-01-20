/**
 * Scheduling Slots API
 * Returns available booking slots for a vendor and meeting type
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAvailableSlots } from '@/lib/scheduling/availability';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const vendorId = searchParams.get('vendor_id');
    const meetingTypeId = searchParams.get('meeting_type_id');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    if (!vendorId || !meetingTypeId || !startDate) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get meeting type details
    const { data: meetingType, error: mtError } = await supabase
      .from('vendor_meeting_types')
      .select('*')
      .eq('id', meetingTypeId)
      .eq('vendor_id', vendorId)
      .eq('is_active', true)
      .single();

    if (mtError || !meetingType) {
      return NextResponse.json(
        { success: false, error: 'Meeting type not found' },
        { status: 404 }
      );
    }

    // Parse dates
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000); // Default to 7 days

    // Get available slots
    const slots = await getAvailableSlots(
      vendorId,
      start,
      end,
      meetingType.duration_minutes,
      meetingType.buffer_after_minutes || 0,
      'UTC' // TODO: Use vendor's timezone
    );

    return NextResponse.json({
      success: true,
      slots,
      meeting_type: {
        id: meetingType.id,
        name: meetingType.name,
        duration_minutes: meetingType.duration_minutes,
        description: meetingType.description
      }
    });

  } catch (error: any) {
    console.error('[Scheduling Slots API] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
