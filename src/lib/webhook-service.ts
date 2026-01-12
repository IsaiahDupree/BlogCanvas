/**
 * Webhook Service
 * Handles webhook registration, delivery, and retry logic
 */

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// List of all available webhook events
export const WEBHOOK_EVENTS = [
  'post.created',
  'post.status_changed',
  'post.published',
  'post.updated',
  'post.deleted',
  'client.created',
  'client.updated',
  'client.deleted',
  'batch.created',
  'batch.completed',
  'review.requested',
  'review.completed',
  'invoice.created',
  'invoice.updated',
  'payment.received',
  'payment.failed',
] as const;

export type WebhookEvent = typeof WEBHOOK_EVENTS[number];

export interface WebhookPayload {
  id: string;
  event: WebhookEvent;
  timestamp: string;
  data: any;
  vendor_id: string;
}

export interface Webhook {
  id: string;
  vendor_id: string;
  name: string;
  url: string;
  events: string[];
  secret: string;
  is_active: boolean;
  retry_count: number;
  retry_delay_seconds: number;
  timeout_seconds: number;
  headers?: Record<string, string>;
  created_at: string;
  updated_at: string;
  last_triggered_at?: string;
}

export interface WebhookDelivery {
  id: string;
  webhook_id: string;
  event: string;
  payload: any;
  response_status?: number;
  response_body?: string;
  response_headers?: Record<string, string>;
  error_message?: string;
  delivered_at?: string;
  attempts: number;
  next_retry_at?: string;
  completed_at?: string;
  status: 'pending' | 'delivered' | 'failed' | 'retrying';
  created_at: string;
}

/**
 * Generate a cryptographically secure webhook secret
 */
export function generateWebhookSecret(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Generate HMAC signature for webhook payload
 */
export function generateWebhookSignature(
  payload: string,
  secret: string
): string {
  return crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
}

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = generateWebhookSignature(payload, secret);
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

/**
 * Trigger webhook event
 * This function finds all webhooks subscribed to the event and creates delivery records
 */
export async function triggerWebhookEvent(
  supabaseUrl: string,
  supabaseServiceKey: string,
  vendorId: string,
  event: WebhookEvent,
  data: any
): Promise<{ success: boolean; webhook_count: number; error?: string }> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Create event log entry
    const eventPayload: WebhookPayload = {
      id: crypto.randomUUID(),
      event,
      timestamp: new Date().toISOString(),
      data,
      vendor_id: vendorId,
    };

    // Find all active webhooks that are subscribed to this event
    const { data: webhooks, error: webhooksError } = await supabase
      .from('webhooks')
      .select('*')
      .eq('vendor_id', vendorId)
      .eq('is_active', true)
      .contains('events', [event]);

    if (webhooksError) {
      throw webhooksError;
    }

    if (!webhooks || webhooks.length === 0) {
      // No webhooks to trigger, but not an error
      await supabase.from('webhook_events_log').insert({
        vendor_id: vendorId,
        event,
        payload: eventPayload,
        webhook_count: 0,
      });

      return { success: true, webhook_count: 0 };
    }

    // Create delivery records for each webhook
    const deliveries = webhooks.map((webhook) => ({
      webhook_id: webhook.id,
      event,
      payload: eventPayload,
      status: 'pending' as const,
      attempts: 0,
      next_retry_at: new Date().toISOString(), // Start immediately
    }));

    const { error: deliveriesError } = await supabase
      .from('webhook_deliveries')
      .insert(deliveries);

    if (deliveriesError) {
      throw deliveriesError;
    }

    // Update webhook last_triggered_at
    await supabase
      .from('webhooks')
      .update({ last_triggered_at: new Date().toISOString() })
      .in(
        'id',
        webhooks.map((w) => w.id)
      );

    // Log the event
    await supabase.from('webhook_events_log').insert({
      vendor_id: vendorId,
      event,
      payload: eventPayload,
      webhook_count: webhooks.length,
    });

    return { success: true, webhook_count: webhooks.length };
  } catch (error: any) {
    console.error('Error triggering webhook event:', error);
    return {
      success: false,
      webhook_count: 0,
      error: error.message || 'Unknown error',
    };
  }
}

/**
 * Deliver webhook (make HTTP request)
 */
export async function deliverWebhook(
  webhook: Webhook,
  delivery: WebhookDelivery
): Promise<{
  success: boolean;
  status?: number;
  body?: string;
  headers?: Record<string, string>;
  error?: string;
}> {
  try {
    const payloadString = JSON.stringify(delivery.payload);
    const signature = generateWebhookSignature(payloadString, webhook.secret);

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'X-Webhook-Signature': signature,
      'X-Webhook-Event': delivery.event,
      'X-Webhook-Delivery-ID': delivery.id,
      'User-Agent': 'BlogCanvas-Webhooks/1.0',
      ...(webhook.headers || {}),
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      webhook.timeout_seconds * 1000
    );

    const response = await fetch(webhook.url, {
      method: 'POST',
      headers,
      body: payloadString,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const responseBody = await response.text();
    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    return {
      success: response.ok,
      status: response.status,
      body: responseBody,
      headers: responseHeaders,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Unknown error',
    };
  }
}

/**
 * Process pending webhook deliveries
 * This should be called by a cron job or background worker
 */
export async function processPendingDeliveries(
  supabaseUrl: string,
  supabaseServiceKey: string,
  batchSize: number = 50
): Promise<{
  processed: number;
  succeeded: number;
  failed: number;
  retrying: number;
}> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const stats = {
    processed: 0,
    succeeded: 0,
    failed: 0,
    retrying: 0,
  };

  try {
    // Get pending deliveries
    const { data: pendingDeliveries, error: queryError } = await supabase.rpc(
      'get_pending_webhook_deliveries',
      { limit_count: batchSize }
    );

    if (queryError) {
      throw queryError;
    }

    if (!pendingDeliveries || pendingDeliveries.length === 0) {
      return stats;
    }

    // Process each delivery
    for (const delivery of pendingDeliveries) {
      stats.processed++;

      const webhook: Webhook = {
        id: delivery.webhook_id,
        vendor_id: '',
        name: '',
        url: delivery.webhook_url,
        events: [],
        secret: delivery.webhook_secret,
        is_active: true,
        retry_count: delivery.retry_count,
        retry_delay_seconds: 60,
        timeout_seconds: delivery.webhook_timeout,
        headers: delivery.webhook_headers,
        created_at: '',
        updated_at: '',
      };

      const deliveryRecord: WebhookDelivery = {
        id: delivery.id,
        webhook_id: delivery.webhook_id,
        event: delivery.event,
        payload: delivery.payload,
        attempts: delivery.attempts,
        status: 'pending',
        created_at: '',
      };

      // Attempt delivery
      const result = await deliverWebhook(webhook, deliveryRecord);
      const newAttempts = delivery.attempts + 1;
      const now = new Date().toISOString();

      if (result.success) {
        // Success!
        stats.succeeded++;
        await supabase
          .from('webhook_deliveries')
          .update({
            status: 'delivered',
            response_status: result.status,
            response_body: result.body,
            response_headers: result.headers,
            delivered_at: now,
            completed_at: now,
            attempts: newAttempts,
            next_retry_at: null,
          })
          .eq('id', delivery.id);
      } else {
        // Failed - check if we should retry
        if (newAttempts >= delivery.retry_count) {
          // Max retries reached
          stats.failed++;
          await supabase
            .from('webhook_deliveries')
            .update({
              status: 'failed',
              response_status: result.status,
              response_body: result.body,
              error_message: result.error,
              completed_at: now,
              attempts: newAttempts,
              next_retry_at: null,
            })
            .eq('id', delivery.id);
        } else {
          // Schedule retry with exponential backoff
          stats.retrying++;
          const delaySeconds = Math.pow(2, newAttempts) * 60; // 2^n minutes
          const nextRetry = new Date(Date.now() + delaySeconds * 1000).toISOString();

          await supabase
            .from('webhook_deliveries')
            .update({
              status: 'retrying',
              response_status: result.status,
              response_body: result.body,
              error_message: result.error,
              attempts: newAttempts,
              next_retry_at: nextRetry,
            })
            .eq('id', delivery.id);
        }
      }
    }

    return stats;
  } catch (error: any) {
    console.error('Error processing pending webhook deliveries:', error);
    return stats;
  }
}

/**
 * Get webhook delivery statistics
 */
export async function getWebhookStats(
  supabaseUrl: string,
  supabaseServiceKey: string,
  webhookId: string,
  daysBack: number = 30
): Promise<{
  total_deliveries: number;
  successful_deliveries: number;
  failed_deliveries: number;
  pending_deliveries: number;
  avg_attempts: number;
  success_rate: number;
} | null> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { data, error } = await supabase.rpc('get_webhook_delivery_stats', {
    webhook_uuid: webhookId,
    days_back: daysBack,
  });

  if (error) {
    console.error('Error getting webhook stats:', error);
    return null;
  }

  return data?.[0] || null;
}
