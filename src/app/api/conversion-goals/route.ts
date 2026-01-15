import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/conversion-goals
 * Get all conversion goals for a website
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const searchParams = request.nextUrl.searchParams;
    const websiteId = searchParams.get('website_id');

    if (!websiteId) {
      return NextResponse.json(
        { error: 'website_id is required' },
        { status: 400 }
      );
    }

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Query conversion goals
    const { data: goals, error } = await supabase
      .from('conversion_goals')
      .select('*')
      .eq('website_id', websiteId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching conversion goals:', error);
      return NextResponse.json(
        { error: 'Failed to fetch conversion goals' },
        { status: 500 }
      );
    }

    return NextResponse.json({ goals });

  } catch (error) {
    console.error('Error in GET /api/conversion-goals:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/conversion-goals
 * Create a new conversion goal
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const body = await request.json();

    const {
      website_id,
      name,
      description,
      goal_type,
      ga4_event_name,
      ga4_event_parameters,
      target_value,
      target_count,
      is_active = true,
    } = body;

    // Validate required fields
    if (!website_id || !name || !goal_type) {
      return NextResponse.json(
        { error: 'website_id, name, and goal_type are required' },
        { status: 400 }
      );
    }

    // Validate goal_type
    if (!['event', 'pageview', 'custom'].includes(goal_type)) {
      return NextResponse.json(
        { error: 'goal_type must be one of: event, pageview, custom' },
        { status: 400 }
      );
    }

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Insert conversion goal
    const { data: goal, error } = await supabase
      .from('conversion_goals')
      .insert({
        website_id,
        name,
        description,
        goal_type,
        ga4_event_name,
        ga4_event_parameters,
        target_value,
        target_count,
        is_active,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating conversion goal:', error);
      return NextResponse.json(
        { error: 'Failed to create conversion goal' },
        { status: 500 }
      );
    }

    return NextResponse.json({ goal }, { status: 201 });

  } catch (error) {
    console.error('Error in POST /api/conversion-goals:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
