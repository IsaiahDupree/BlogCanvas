/**
 * Webhook Service - Trigger webhooks on platform events
 * Implements VENDOR-WC-149: Slack/Discord notifications
 */

import { supabaseAdmin } from '@/lib/supabase'
import { sendWebhookNotification, NotificationTemplates } from './webhook-notifier'

export type WebhookEvent =
  | 'order'
  | 'message'
  | 'meeting'
  | 'approval'
  | 'payment'
  | 'alert'

/**
 * Get active webhooks for a vendor that subscribe to a specific event
 */
async function getActiveWebhooksForEvent(
  vendorId: string,
  eventType: WebhookEvent
): Promise<any[]> {
  const { data, error } = await supabaseAdmin
    .from('vendor_webhooks')
    .select('*')
    .eq('vendor_id', vendorId)
    .eq('is_active', true)

  if (error) {
    console.error('Error fetching webhooks:', error)
    return []
  }

  // Filter webhooks that have this event in their subscriptions
  return (data || []).filter((webhook) => {
    const events = webhook.events as string[]
    return events.includes(eventType)
  })
}

/**
 * Log webhook delivery
 */
async function logWebhookDelivery(
  webhookId: string,
  eventType: string,
  payload: any,
  success: boolean,
  responseCode?: number,
  errorMessage?: string
): Promise<void> {
  try {
    await supabaseAdmin.from('webhook_logs').insert({
      webhook_id: webhookId,
      event_type: eventType,
      payload,
      status: success ? 'success' : 'failed',
      response_code: responseCode,
      error_message: errorMessage
    })

    // Update webhook stats
    await supabaseAdmin.rpc('update_webhook_stats', {
      webhook_id_param: webhookId,
      success
    })
  } catch (error) {
    console.error('Error logging webhook delivery:', error)
  }
}

/**
 * Trigger webhooks for a new order event
 */
export async function triggerOrderWebhooks(
  vendorId: string,
  orderDetails: {
    orderNumber: string
    clientName: string
    amount: string
    items: string
    orderUrl?: string
  }
): Promise<void> {
  const webhooks = await getActiveWebhooksForEvent(vendorId, 'order')

  for (const webhook of webhooks) {
    const notification = {
      ...NotificationTemplates.newOrder(orderDetails),
      platform: webhook.platform,
      webhookUrl: webhook.webhook_url
    }

    const result = await sendWebhookNotification(notification)

    await logWebhookDelivery(
      webhook.id,
      'order',
      orderDetails,
      result.success,
      undefined,
      result.error
    )
  }
}

/**
 * Trigger webhooks for a new message event
 */
export async function triggerMessageWebhooks(
  vendorId: string,
  messageDetails: {
    from: string
    subject: string
    preview: string
    messageUrl?: string
  }
): Promise<void> {
  const webhooks = await getActiveWebhooksForEvent(vendorId, 'message')

  for (const webhook of webhooks) {
    const notification = {
      ...NotificationTemplates.newMessage(messageDetails),
      platform: webhook.platform,
      webhookUrl: webhook.webhook_url
    }

    const result = await sendWebhookNotification(notification)

    await logWebhookDelivery(
      webhook.id,
      'message',
      messageDetails,
      result.success,
      undefined,
      result.error
    )
  }
}

/**
 * Trigger webhooks for a meeting scheduled event
 */
export async function triggerMeetingWebhooks(
  vendorId: string,
  meetingDetails: {
    clientName: string
    dateTime: string
    duration: string
    meetingUrl?: string
  }
): Promise<void> {
  const webhooks = await getActiveWebhooksForEvent(vendorId, 'meeting')

  for (const webhook of webhooks) {
    const notification = {
      ...NotificationTemplates.meetingScheduled(meetingDetails),
      platform: webhook.platform,
      webhookUrl: webhook.webhook_url
    }

    const result = await sendWebhookNotification(notification)

    await logWebhookDelivery(
      webhook.id,
      'meeting',
      meetingDetails,
      result.success,
      undefined,
      result.error
    )
  }
}

/**
 * Trigger webhooks for content approval needed event
 */
export async function triggerApprovalWebhooks(
  vendorId: string,
  approvalDetails: {
    contentTitle: string
    clientName: string
    contentType: string
    approvalUrl?: string
  }
): Promise<void> {
  const webhooks = await getActiveWebhooksForEvent(vendorId, 'approval')

  for (const webhook of webhooks) {
    const notification = {
      ...NotificationTemplates.approvalNeeded(approvalDetails),
      platform: webhook.platform,
      webhookUrl: webhook.webhook_url
    }

    const result = await sendWebhookNotification(notification)

    await logWebhookDelivery(
      webhook.id,
      'approval',
      approvalDetails,
      result.success,
      undefined,
      result.error
    )
  }
}

/**
 * Trigger webhooks for payment received event
 */
export async function triggerPaymentWebhooks(
  vendorId: string,
  paymentDetails: {
    amount: string
    clientName: string
    invoiceNumber: string
    paymentUrl?: string
  }
): Promise<void> {
  const webhooks = await getActiveWebhooksForEvent(vendorId, 'payment')

  for (const webhook of webhooks) {
    const notification = {
      ...NotificationTemplates.paymentReceived(paymentDetails),
      platform: webhook.platform,
      webhookUrl: webhook.webhook_url
    }

    const result = await sendWebhookNotification(notification)

    await logWebhookDelivery(
      webhook.id,
      'payment',
      paymentDetails,
      result.success,
      undefined,
      result.error
    )
  }
}

/**
 * Trigger webhooks for alert/error event
 */
export async function triggerAlertWebhooks(
  vendorId: string,
  alertDetails: {
    title: string
    description: string
    severity: 'low' | 'medium' | 'high' | 'critical'
    url?: string
  }
): Promise<void> {
  const webhooks = await getActiveWebhooksForEvent(vendorId, 'alert')

  for (const webhook of webhooks) {
    const notification = {
      ...NotificationTemplates.alert(alertDetails),
      platform: webhook.platform,
      webhookUrl: webhook.webhook_url
    }

    const result = await sendWebhookNotification(notification)

    await logWebhookDelivery(
      webhook.id,
      'alert',
      alertDetails,
      result.success,
      undefined,
      result.error
    )
  }
}
