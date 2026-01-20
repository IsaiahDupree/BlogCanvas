import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const {
      session_id,
      vendor_id,
      page_id,
      utm_source,
      utm_medium,
      utm_campaign,
      utm_content,
      utm_term,
      referrer
    } = body;

    if (!session_id || !vendor_id) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if attribution record exists for this session
    const { data: existing, error: fetchError } = await supabase
      .from('vendor_attribution')
      .select('*')
      .eq('session_id', session_id)
      .eq('vendor_id', vendor_id)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      // PGRST116 is "not found" - that's expected for new sessions
      console.error('Error fetching attribution:', fetchError);
    }

    const now = new Date().toISOString();

    if (existing) {
      // Update last touch and last visit time
      const { error: updateError } = await supabase
        .from('vendor_attribution')
        .update({
          last_page_id: page_id,
          last_utm_source: utm_source,
          last_utm_medium: utm_medium,
          last_utm_campaign: utm_campaign,
          last_utm_content: utm_content,
          last_utm_term: utm_term,
          last_referrer: referrer,
          last_visit_at: now
        })
        .eq('session_id', session_id)
        .eq('vendor_id', vendor_id);

      if (updateError) {
        console.error('Error updating attribution:', updateError);
        return NextResponse.json(
          { success: false, error: 'Failed to update attribution' },
          { status: 500 }
        );
      }
    } else {
      // Create new attribution record with first touch data
      const { error: insertError } = await supabase
        .from('vendor_attribution')
        .insert({
          session_id,
          vendor_id,
          first_page_id: page_id,
          first_utm_source: utm_source,
          first_utm_medium: utm_medium,
          first_utm_campaign: utm_campaign,
          first_utm_content: utm_content,
          first_utm_term: utm_term,
          first_referrer: referrer,
          last_page_id: page_id,
          last_utm_source: utm_source,
          last_utm_medium: utm_medium,
          last_utm_campaign: utm_campaign,
          last_utm_content: utm_content,
          last_utm_term: utm_term,
          last_referrer: referrer,
          first_visit_at: now,
          last_visit_at: now,
          converted: false
        });

      if (insertError) {
        console.error('Error inserting attribution:', insertError);
        return NextResponse.json(
          { success: false, error: 'Failed to create attribution' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in attribution tracking API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Mark a session as converted
 */
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const { session_id, vendor_id, client_id, order_id } = body;

    if (!session_id || !vendor_id) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const { error: updateError } = await supabase
      .from('vendor_attribution')
      .update({
        converted: true,
        converted_at: new Date().toISOString(),
        client_id,
        order_id
      })
      .eq('session_id', session_id)
      .eq('vendor_id', vendor_id);

    if (updateError) {
      console.error('Error marking conversion:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to mark conversion' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in conversion tracking API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
