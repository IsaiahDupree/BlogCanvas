/**
 * Webhooks API - Individual Webhook Operations
 * GET /api/webhooks/[id] - Get webhook details
 * PATCH /api/webhooks/[id] - Update webhook
 * DELETE /api/webhooks/[id] - Delete webhook
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { WEBHOOK_EVENTS } from '@/lib/webhook-service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get webhook (RLS will ensure it belongs to user's vendor)
    const { data: webhook, error } = await supabase
      .from('webhooks')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !webhook) {
      return NextResponse.json(
        { error: 'Webhook not found' },
        { status: 404 }
      );
    }

    // Don't expose full secret
    const sanitizedWebhook = {
      ...webhook,
      secret: undefined,
      secret_preview: webhook.secret.substring(0, 8) + '...',
    };

    return NextResponse.json({ webhook: sanitizedWebhook });
  } catch (error: any) {
    console.error('Error fetching webhook:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch webhook' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const {
      name,
      url,
      events,
      is_active,
      retry_count,
      retry_delay_seconds,
      timeout_seconds,
      headers,
    } = body;

    // Build update object with only provided fields
    const updates: any = {};

    if (name !== undefined) updates.name = name;
    if (url !== undefined) {
      // Validate URL format
      try {
        new URL(url);
        updates.url = url;
      } catch {
        return NextResponse.json(
          { error: 'Invalid URL format' },
          { status: 400 }
        );
      }
    }
    if (events !== undefined) {
      if (!Array.isArray(events)) {
        return NextResponse.json(
          { error: 'Events must be an array' },
          { status: 400 }
        );
      }
      const validEvents = events.filter((event) =>
        WEBHOOK_EVENTS.includes(event as any)
      );
      if (validEvents.length === 0) {
        return NextResponse.json(
          { error: 'At least one valid event is required' },
          { status: 400 }
        );
      }
      updates.events = validEvents;
    }
    if (is_active !== undefined) updates.is_active = is_active;
    if (retry_count !== undefined) updates.retry_count = retry_count;
    if (retry_delay_seconds !== undefined)
      updates.retry_delay_seconds = retry_delay_seconds;
    if (timeout_seconds !== undefined)
      updates.timeout_seconds = timeout_seconds;
    if (headers !== undefined) updates.headers = headers;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    // Update webhook (RLS will ensure it belongs to user's vendor)
    const { data: webhook, error } = await supabase
      .from('webhooks')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error || !webhook) {
      if (error?.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Webhook not found' },
          { status: 404 }
        );
      }
      throw error;
    }

    // Don't expose secret
    const sanitizedWebhook = {
      ...webhook,
      secret: undefined,
      secret_preview: webhook.secret.substring(0, 8) + '...',
    };

    return NextResponse.json({
      webhook: sanitizedWebhook,
      message: 'Webhook updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating webhook:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update webhook' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Delete webhook (RLS will ensure it belongs to user's vendor)
    const { error } = await supabase
      .from('webhooks')
      .delete()
      .eq('id', id);

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Webhook not found' },
          { status: 404 }
        );
      }
      throw error;
    }

    return NextResponse.json({ message: 'Webhook deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting webhook:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete webhook' },
      { status: 500 }
    );
  }
}
