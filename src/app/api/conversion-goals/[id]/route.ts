import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/conversion-goals/[id]
 * Get a single conversion goal
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { id } = await params;

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Query conversion goal
    const { data: goal, error } = await supabase
      .from('conversion_goals')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching conversion goal:', error);
      return NextResponse.json(
        { error: 'Conversion goal not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ goal });

  } catch (error) {
    console.error('Error in GET /api/conversion-goals/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/conversion-goals/[id]
 * Update a conversion goal
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { id } = await params;
    const body = await request.json();

    const {
      name,
      description,
      goal_type,
      ga4_event_name,
      ga4_event_parameters,
      target_value,
      target_count,
      is_active,
    } = body;

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Validate goal_type if provided
    if (goal_type && !['event', 'pageview', 'custom'].includes(goal_type)) {
      return NextResponse.json(
        { error: 'goal_type must be one of: event, pageview, custom' },
        { status: 400 }
      );
    }

    // Build update object (only include provided fields)
    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (goal_type !== undefined) updates.goal_type = goal_type;
    if (ga4_event_name !== undefined) updates.ga4_event_name = ga4_event_name;
    if (ga4_event_parameters !== undefined) updates.ga4_event_parameters = ga4_event_parameters;
    if (target_value !== undefined) updates.target_value = target_value;
    if (target_count !== undefined) updates.target_count = target_count;
    if (is_active !== undefined) updates.is_active = is_active;

    // Update conversion goal
    const { data: goal, error } = await supabase
      .from('conversion_goals')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating conversion goal:', error);
      return NextResponse.json(
        { error: 'Failed to update conversion goal' },
        { status: 500 }
      );
    }

    return NextResponse.json({ goal });

  } catch (error) {
    console.error('Error in PATCH /api/conversion-goals/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/conversion-goals/[id]
 * Delete a conversion goal
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { id } = await params;

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Delete conversion goal
    const { error } = await supabase
      .from('conversion_goals')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting conversion goal:', error);
      return NextResponse.json(
        { error: 'Failed to delete conversion goal' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error in DELETE /api/conversion-goals/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
