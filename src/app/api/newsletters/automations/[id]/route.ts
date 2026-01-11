import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/newsletters/automations/[id]
 * Get a specific automation
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const automationId = params.id;

    // Fetch automation (RLS will handle vendor check)
    const { data: automation, error } = await supabase
      .from('newsletter_automations')
      .select(`
        *,
        newsletter_templates (
          id,
          name,
          description
        )
      `)
      .eq('id', automationId)
      .single();

    if (error || !automation) {
      return NextResponse.json({ error: 'Automation not found' }, { status: 404 });
    }

    // Fetch recent executions
    const { data: executions } = await supabase
      .from('newsletter_automation_executions')
      .select('*')
      .eq('automation_id', automationId)
      .order('executed_at', { ascending: false })
      .limit(10);

    return NextResponse.json({
      automation,
      recent_executions: executions || [],
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/newsletters/automations/[id]
 * Update an automation
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const automationId = params.id;
    const updates = await request.json();

    // Remove fields that shouldn't be updated directly
    delete updates.id;
    delete updates.vendor_id;
    delete updates.created_at;
    delete updates.execution_count;

    const { data: automation, error } = await supabase
      .from('newsletter_automations')
      .update(updates)
      .eq('id', automationId)
      .select()
      .single();

    if (error || !automation) {
      console.error('Error updating automation:', error);
      return NextResponse.json(
        { error: error?.message || 'Automation not found' },
        { status: error ? 500 : 404 }
      );
    }

    return NextResponse.json({
      message: 'Automation updated successfully',
      automation,
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/newsletters/automations/[id]
 * Delete an automation
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const automationId = params.id;

    const { error } = await supabase
      .from('newsletter_automations')
      .delete()
      .eq('id', automationId);

    if (error) {
      console.error('Error deleting automation:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Automation deleted successfully',
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
