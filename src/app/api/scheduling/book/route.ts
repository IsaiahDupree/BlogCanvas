/**
 * Meeting Booking API
 * Create a new meeting and sync with Google Calendar
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createCalendarEvent } from '@/lib/google/calendar';
import { getValidAccessToken } from '@/lib/db/vendor/calendar';
import { v4 as uuidv4 } from 'uuid';
import { sendMeetingBookedEmail, sendMeetingBookedToVendor } from '@/lib/vendor/email-notifications';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const {
      vendor_id,
      meeting_type_id,
      start_time,
      end_time,
      timezone,
      client_name,
      client_email,
      notes
    } = body;

    // Validate required fields
    if (!vendor_id || !meeting_type_id || !start_time || !end_time || !client_email) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get meeting type
    const { data: meetingType, error: mtError } = await supabase
      .from('vendor_meeting_types')
      .select('*')
      .eq('id', meeting_type_id)
      .single();

    if (mtError || !meetingType) {
      return NextResponse.json(
        { success: false, error: 'Meeting type not found' },
        { status: 404 }
      );
    }

    // Get vendor
    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .select('*')
      .eq('id', vendor_id)
      .single();

    if (vendorError || !vendor) {
      return NextResponse.json(
        { success: false, error: 'Vendor not found' },
        { status: 404 }
      );
    }

    // Check if client exists
    const { data: existingClient } = await supabase
      .from('vendor_clients')
      .select('*')
      .eq('vendor_id', vendor_id)
      .eq('email', client_email)
      .single();

    let clientId = existingClient?.id;

    // Create client if doesn't exist
    if (!existingClient) {
      const { data: newClient, error: clientError } = await supabase
        .from('vendor_clients')
        .insert({
          vendor_id,
          email: client_email,
          full_name: client_name,
          status: 'lead'
        })
        .select()
        .single();

      if (clientError) {
        console.error('[Booking API] Error creating client:', clientError);
        return NextResponse.json(
          { success: false, error: 'Failed to create client record' },
          { status: 500 }
        );
      }

      clientId = newClient.id;
    }

    // Get calendar integration
    const { data: calendarIntegration } = await supabase
      .from('vendor_calendar_integrations')
      .select('*')
      .eq('vendor_id', vendor_id)
      .eq('provider', 'google')
      .eq('is_active', true)
      .single();

    let googleEventId: string | null = null;
    let meetingLink: string | null = null;

    // Create Google Calendar event if integrated
    if (calendarIntegration) {
      try {
        const accessToken = await getValidAccessToken(vendor_id);

        if (accessToken && calendarIntegration.refresh_token) {
          const event = await createCalendarEvent(
            accessToken,
            calendarIntegration.refresh_token,
            {
              summary: `${meetingType.name} - ${client_name || client_email}`,
              description: notes || meetingType.description,
              start: {
                dateTime: start_time,
                timeZone: timezone || vendor.timezone || 'UTC'
              },
              end: {
                dateTime: end_time,
                timeZone: timezone || vendor.timezone || 'UTC'
              },
              attendees: [
                { email: client_email, displayName: client_name }
              ],
              conferenceData: meetingType.location_type === 'google_meet' ? {
                createRequest: {
                  requestId: uuidv4(),
                  conferenceSolutionKey: { type: 'hangoutsMeet' }
                }
              } : undefined
            },
            calendarIntegration.calendar_id || 'primary'
          );

          googleEventId = event.id || null;
          meetingLink = event.hangoutLink || event.conferenceData?.entryPoints?.[0]?.uri || null;
        }
      } catch (calError) {
        console.error('[Booking API] Error creating calendar event:', calError);
        // Continue without calendar event
      }
    }

    // Create meeting record
    const { data: meeting, error: meetingError } = await supabase
      .from('vendor_meetings')
      .insert({
        vendor_id,
        client_id: clientId,
        meeting_type_id,
        title: `${meetingType.name} - ${client_name || client_email}`,
        description: notes || meetingType.description,
        start_time,
        end_time,
        timezone: timezone || vendor.timezone || 'UTC',
        location_type: meetingType.location_type,
        location_details: meetingType.location_details,
        meeting_link: meetingLink,
        client_email,
        client_name,
        status: 'scheduled',
        google_calendar_event_id: googleEventId,
        notes
      })
      .select()
      .single();

    if (meetingError) {
      console.error('[Booking API] Error creating meeting:', meetingError);
      return NextResponse.json(
        { success: false, error: 'Failed to create meeting' },
        { status: 500 }
      );
    }

    // Send confirmation emails
    try {
      const startDate = new Date(start_time);
      const meetingDate = startDate.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });
      const meetingTime = startDate.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });

      // Send to client
      await sendMeetingBookedEmail({
        clientEmail: client_email,
        clientName: client_name,
        vendorName: vendor.business_name || 'Your vendor',
        meetingTitle: meetingType.name,
        meetingDate,
        meetingTime,
        meetingDuration: meetingType.duration_minutes,
        meetingLink: meetingLink || undefined,
        timezone: timezone || vendor.timezone || 'UTC'
      });

      // Send to vendor
      const { data: vendorUser } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', vendor.user_id)
        .single();

      if (vendorUser?.email) {
        await sendMeetingBookedToVendor({
          vendorEmail: vendorUser.email,
          clientEmail: client_email,
          clientName: client_name,
          vendorName: vendor.business_name || 'Vendor',
          meetingTitle: meetingType.name,
          meetingDate,
          meetingTime,
          meetingDuration: meetingType.duration_minutes,
          meetingLink: meetingLink || undefined,
          timezone: timezone || vendor.timezone || 'UTC'
        });
      }
    } catch (emailError) {
      console.error('[Booking API] Error sending confirmation emails:', emailError);
      // Don't fail the booking if email fails
    }

    return NextResponse.json({
      success: true,
      meeting
    });

  } catch (error: any) {
    console.error('[Booking API] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// Cancel a meeting
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;
    const meetingId = searchParams.get('meeting_id');

    if (!meetingId) {
      return NextResponse.json(
        { success: false, error: 'Missing meeting_id' },
        { status: 400 }
      );
    }

    // Get meeting
    const { data: meeting, error: meetingError } = await supabase
      .from('vendor_meetings')
      .select('*')
      .eq('id', meetingId)
      .single();

    if (meetingError || !meeting) {
      return NextResponse.json(
        { success: false, error: 'Meeting not found' },
        { status: 404 }
      );
    }

    // Cancel Google Calendar event if exists
    if (meeting.google_calendar_event_id) {
      try {
        const accessToken = await getValidAccessToken(meeting.vendor_id);
        const { data: calendarIntegration } = await supabase
          .from('vendor_calendar_integrations')
          .select('refresh_token, calendar_id')
          .eq('vendor_id', meeting.vendor_id)
          .eq('provider', 'google')
          .eq('is_active', true)
          .single();

        if (accessToken && calendarIntegration?.refresh_token) {
          const { deleteCalendarEvent } = await import('@/lib/google/calendar');
          await deleteCalendarEvent(
            accessToken,
            calendarIntegration.refresh_token,
            meeting.google_calendar_event_id,
            calendarIntegration.calendar_id || 'primary'
          );
        }
      } catch (calError) {
        console.error('[Booking API] Error deleting calendar event:', calError);
        // Continue with cancellation
      }
    }

    // Update meeting status
    const { error: updateError } = await supabase
      .from('vendor_meetings')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString()
      })
      .eq('id', meetingId);

    if (updateError) {
      return NextResponse.json(
        { success: false, error: 'Failed to cancel meeting' },
        { status: 500 }
      );
    }

    // TODO: Send cancellation email

    return NextResponse.json({
      success: true,
      message: 'Meeting cancelled successfully'
    });

  } catch (error: any) {
    console.error('[Booking API] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
