/**
 * Push Notification Service (PWA-005)
 *
 * Handles browser push notifications using the Web Push API.
 * Supports sending notifications for:
 * - New orders
 * - New messages
 * - Meeting reminders
 * - Deliverable approvals/revisions
 * - Workspace updates
 */

import webpush from 'web-push'
import { createClient } from '@/lib/supabase/server'

// VAPID keys should be stored in environment variables
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || ''
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:support@blogcanvas.com'

// Configure web-push
if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    VAPID_SUBJECT,
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  )
}

export interface PushSubscription {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
}

export interface NotificationPayload {
  title: string
  body: string
  icon?: string
  badge?: string
  url?: string
  data?: Record<string, unknown>
}

export type NotificationEventType =
  | 'order.created'
  | 'message.received'
  | 'meeting.reminder'
  | 'deliverable.approved'
  | 'deliverable.revision'
  | 'workspace.created'
  | 'form.submitted'

/**
 * Subscribe a user to push notifications
 */
export async function subscribeToPush(
  userId: string,
  subscription: PushSubscription,
  deviceInfo?: Record<string, unknown>
) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('push_subscriptions')
    .upsert({
      user_id: userId,
      endpoint: subscription.endpoint,
      p256dh_key: subscription.keys.p256dh,
      auth_key: subscription.keys.auth,
      device_info: deviceInfo || {},
      last_used_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) {
    console.error('Error subscribing to push:', error)
    throw error
  }

  return data
}

/**
 * Unsubscribe a user from push notifications
 */
export async function unsubscribeFromPush(userId: string, endpoint: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('push_subscriptions')
    .delete()
    .eq('user_id', userId)
    .eq('endpoint', endpoint)

  if (error) {
    console.error('Error unsubscribing from push:', error)
    throw error
  }
}

/**
 * Get all push subscriptions for a user
 */
export async function getUserSubscriptions(userId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('push_subscriptions')
    .select('*')
    .eq('user_id', userId)

  if (error) {
    console.error('Error fetching push subscriptions:', error)
    throw error
  }

  return data || []
}

/**
 * Check if user has enabled notifications for a specific event type
 */
export async function isNotificationEnabled(
  userId: string,
  eventType: NotificationEventType,
  channel: 'push' | 'email' | 'sms' = 'push'
): Promise<boolean> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('notification_preferences')
    .select('enabled')
    .eq('user_id', userId)
    .eq('channel', channel)
    .eq('event_type', eventType)
    .single()

  if (error || !data) {
    // Default to enabled if no preference is set
    return true
  }

  return data.enabled
}

/**
 * Send a push notification to a specific user
 */
export async function sendPushNotification(
  userId: string,
  eventType: NotificationEventType,
  payload: NotificationPayload
) {
  // Check if user has enabled this notification type
  const enabled = await isNotificationEnabled(userId, eventType)
  if (!enabled) {
    console.log(`Push notifications disabled for ${eventType} by user ${userId}`)
    return { sent: 0, failed: 0 }
  }

  // Get user's push subscriptions
  const subscriptions = await getUserSubscriptions(userId)

  if (subscriptions.length === 0) {
    console.log(`No push subscriptions found for user ${userId}`)
    return { sent: 0, failed: 0 }
  }

  const supabase = await createClient()
  let sent = 0
  let failed = 0

  // Send notification to all subscriptions
  const results = await Promise.allSettled(
    subscriptions.map(async (sub) => {
      try {
        const pushSubscription: webpush.PushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh_key,
            auth: sub.auth_key,
          },
        }

        const notificationPayload = JSON.stringify({
          title: payload.title,
          body: payload.body,
          icon: payload.icon || '/icon-192x192.png',
          badge: payload.badge || '/icon-192x192.png',
          url: payload.url || '/',
          data: payload.data || {},
        })

        await webpush.sendNotification(pushSubscription, notificationPayload)

        // Log successful notification
        await supabase.from('notification_log').insert({
          user_id: userId,
          channel: 'push',
          event_type: eventType,
          title: payload.title,
          body: payload.body,
          data: payload.data || {},
          status: 'sent',
        })

        sent++
      } catch (error: unknown) {
        console.error('Error sending push notification:', error)

        // If subscription is invalid (410 Gone), remove it
        if (error && typeof error === 'object' && 'statusCode' in error && error.statusCode === 410) {
          await supabase
            .from('push_subscriptions')
            .delete()
            .eq('id', sub.id)
        }

        // Log failed notification
        await supabase.from('notification_log').insert({
          user_id: userId,
          channel: 'push',
          event_type: eventType,
          title: payload.title,
          body: payload.body,
          data: {
            ...payload.data,
            error: error instanceof Error ? error.message : String(error),
          },
          status: 'failed',
        })

        failed++
      }
    })
  )

  return { sent, failed }
}

/**
 * Helper functions for common notification types
 */

export async function notifyNewOrder(
  vendorId: string,
  clientName: string,
  offerName: string,
  orderId: string
) {
  return sendPushNotification(vendorId, 'order.created', {
    title: 'New Order! 🎉',
    body: `${clientName} purchased ${offerName}`,
    url: `/vendor/orders/${orderId}`,
    data: { orderId, clientName, offerName },
  })
}

export async function notifyNewMessage(
  recipientId: string,
  senderName: string,
  messagePreview: string,
  workspaceId: string
) {
  return sendPushNotification(recipientId, 'message.received', {
    title: 'New Message',
    body: `${senderName}: ${messagePreview}`,
    url: `/portal/${workspaceId}/messages`,
    data: { workspaceId, senderName },
  })
}

export async function notifyMeetingReminder(
  userId: string,
  meetingType: string,
  clientName: string,
  meetingId: string,
  minutesUntil: number
) {
  return sendPushNotification(userId, 'meeting.reminder', {
    title: `Meeting in ${minutesUntil} minutes`,
    body: `${meetingType} with ${clientName}`,
    url: `/vendor/meetings/${meetingId}`,
    data: { meetingId, meetingType, clientName, minutesUntil },
  })
}

export async function notifyDeliverableApproved(
  vendorId: string,
  clientName: string,
  deliverableName: string,
  workspaceId: string
) {
  return sendPushNotification(vendorId, 'deliverable.approved', {
    title: 'Deliverable Approved ✅',
    body: `${clientName} approved ${deliverableName}`,
    url: `/portal/${workspaceId}/deliverables`,
    data: { workspaceId, clientName, deliverableName },
  })
}

export async function notifyDeliverableRevision(
  vendorId: string,
  clientName: string,
  deliverableName: string,
  workspaceId: string
) {
  return sendPushNotification(vendorId, 'deliverable.revision', {
    title: 'Revision Requested',
    body: `${clientName} requested changes to ${deliverableName}`,
    url: `/portal/${workspaceId}/deliverables`,
    data: { workspaceId, clientName, deliverableName },
  })
}

export async function notifyWorkspaceCreated(
  clientId: string,
  vendorName: string,
  workspaceId: string
) {
  return sendPushNotification(clientId, 'workspace.created', {
    title: 'Welcome to Your Portal!',
    body: `Your workspace with ${vendorName} is ready`,
    url: `/portal/${workspaceId}`,
    data: { workspaceId, vendorName },
  })
}

export async function notifyFormSubmitted(
  vendorId: string,
  clientName: string,
  formName: string,
  workspaceId: string
) {
  return sendPushNotification(vendorId, 'form.submitted', {
    title: 'Form Submitted',
    body: `${clientName} submitted ${formName}`,
    url: `/portal/${workspaceId}/forms`,
    data: { workspaceId, clientName, formName },
  })
}
