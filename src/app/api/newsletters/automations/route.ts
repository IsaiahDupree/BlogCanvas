import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/newsletters/automations
 * List all newsletter automations for the vendor
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const enabled = searchParams.get('enabled');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get vendor ID
    const { data: userData } = await supabase
      .from('users')
      .select('vendor_id')
      .eq('id', user.id)
      .single();

    if (!userData?.vendor_id) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }

    // Build query
    let query = supabase
      .from('newsletter_automations')
      .select(`
        *,
        newsletter_templates (
          id,
          name
        )
      `, { count: 'exact' })
      .eq('vendor_id', userData.vendor_id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply enabled filter if provided
    if (enabled !== null) {
      query = query.eq('enabled', enabled === 'true');
    }

    const { data: automations, count, error } = await query;

    if (error) {
      console.error('Error fetching automations:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      automations: automations || [],
      total: count || 0,
      limit,
      offset,
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
 * POST /api/newsletters/automations
 * Create a new newsletter automation
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      template_id,
      name,
      description,
      trigger_type,
      trigger_config,
      subject,
      preview_text,
      html_content,
      json_content,
      recipient_selection,
      recipient_config,
      enabled,
    } = body;

    // Validation
    if (!name || !trigger_type || !recipient_selection) {
      return NextResponse.json(
        { error: 'name, trigger_type, and recipient_selection are required' },
        { status: 400 }
      );
    }

    // Get vendor ID
    const { data: userData } = await supabase
      .from('users')
      .select('vendor_id')
      .eq('id', user.id)
      .single();

    if (!userData?.vendor_id) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }

    // Create automation
    const { data: automation, error } = await supabase
      .from('newsletter_automations')
      .insert({
        vendor_id: userData.vendor_id,
        template_id,
        name,
        description,
        trigger_type,
        trigger_config: trigger_config || {},
        subject,
        preview_text,
        html_content,
        json_content,
        recipient_selection,
        recipient_config: recipient_config || {},
        enabled: enabled !== undefined ? enabled : true,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating automation:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Automation created successfully',
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
