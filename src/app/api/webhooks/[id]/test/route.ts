/**
 * Webhook Test API
 * POST /api/webhooks/[id]/test - Send a test webhook delivery
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { deliverWebhook, WebhookPayload } from '@/lib/webhook-service';

export async function POST(
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
    const { data: webhook, error: webhookError } = await supabase
      .from('webhooks')
      .select('*')
      .eq('id', id)
      .single();

    if (webhookError || !webhook) {
      return NextResponse.json(
        { error: 'Webhook not found' },
        { status: 404 }
      );
    }

    // Create test payload
    const testPayload: WebhookPayload = {
      id: crypto.randomUUID(),
      event: 'post.created' as any,
      timestamp: new Date().toISOString(),
      vendor_id: webhook.vendor_id,
      data: {
        test: true,
        message: 'This is a test webhook delivery',
        post_id: '00000000-0000-0000-0000-000000000000',
        status: 'draft',
        client_id: '00000000-0000-0000-0000-000000000000',
      },
    };

    // Create a test delivery record
    const { data: delivery, error: deliveryError } = await supabase
      .from('webhook_deliveries')
      .insert({
        webhook_id: webhook.id,
        event: 'post.created',
        payload: testPayload,
        status: 'pending',
        attempts: 0,
      })
      .select()
      .single();

    if (deliveryError || !delivery) {
      throw deliveryError;
    }

    // Attempt delivery
    const result = await deliverWebhook(webhook, delivery);

    // Update delivery record with result
    const updateData: any = {
      response_status: result.status,
      response_body: result.body,
      response_headers: result.headers,
      error_message: result.error,
      attempts: 1,
    };

    if (result.success) {
      updateData.status = 'delivered';
      updateData.delivered_at = new Date().toISOString();
      updateData.completed_at = new Date().toISOString();
    } else {
      updateData.status = 'failed';
      updateData.completed_at = new Date().toISOString();
    }

    await supabase
      .from('webhook_deliveries')
      .update(updateData)
      .eq('id', delivery.id);

    return NextResponse.json({
      success: result.success,
      delivery_id: delivery.id,
      response: {
        status: result.status,
        body: result.body,
        error: result.error,
      },
      message: result.success
        ? 'Test webhook delivered successfully'
        : 'Test webhook delivery failed',
    });
  } catch (error: any) {
    console.error('Error testing webhook:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to test webhook' },
      { status: 500 }
    );
  }
}
