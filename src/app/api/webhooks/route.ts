/**
 * Webhooks API - List and Create
 * GET /api/webhooks - List all webhooks for the vendor
 * POST /api/webhooks - Create a new webhook
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateWebhookSecret, WEBHOOK_EVENTS } from '@/lib/webhook-service';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's vendor_id
    const { data: profile } = await supabase
      .from('profiles')
      .select('vendor_id')
      .eq('id', user.id)
      .single();

    if (!profile?.vendor_id) {
      return NextResponse.json(
        { error: 'Vendor not found' },
        { status: 404 }
      );
    }

    // Get all webhooks for the vendor
    const { data: webhooks, error } = await supabase
      .from('webhooks')
      .select('*')
      .eq('vendor_id', profile.vendor_id)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    // Don't expose secrets in list view
    const sanitizedWebhooks = webhooks.map((webhook) => ({
      ...webhook,
      secret: undefined,
      secret_preview: webhook.secret.substring(0, 8) + '...',
    }));

    return NextResponse.json({
      webhooks: sanitizedWebhooks,
      available_events: WEBHOOK_EVENTS,
    });
  } catch (error: any) {
    console.error('Error fetching webhooks:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch webhooks' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's vendor_id
    const { data: profile } = await supabase
      .from('profiles')
      .select('vendor_id')
      .eq('id', user.id)
      .single();

    if (!profile?.vendor_id) {
      return NextResponse.json(
        { error: 'Vendor not found' },
        { status: 404 }
      );
    }

    // Parse request body
    const body = await request.json();
    const {
      name,
      url,
      events,
      retry_count = 3,
      retry_delay_seconds = 60,
      timeout_seconds = 30,
      headers = {},
    } = body;

    // Validation
    if (!name || !url || !events || !Array.isArray(events)) {
      return NextResponse.json(
        { error: 'Missing required fields: name, url, events' },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    // Validate events
    const validEvents = events.filter((event) =>
      WEBHOOK_EVENTS.includes(event as any)
    );

    if (validEvents.length === 0) {
      return NextResponse.json(
        { error: 'At least one valid event is required' },
        { status: 400 }
      );
    }

    // Generate webhook secret
    const secret = generateWebhookSecret();

    // Create webhook
    const { data: webhook, error } = await supabase
      .from('webhooks')
      .insert({
        vendor_id: profile.vendor_id,
        name,
        url,
        events: validEvents,
        secret,
        retry_count,
        retry_delay_seconds,
        timeout_seconds,
        headers,
        is_active: true,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(
      {
        webhook: {
          ...webhook,
          // Only show secret once at creation time
          secret,
        },
        message: 'Webhook created successfully. Save the secret - it will not be shown again.',
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating webhook:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create webhook' },
      { status: 500 }
    );
  }
}
