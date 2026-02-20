/**
 * Webhook Notification System for Slack and Discord
 * Implements VENDOR-WC-149: Slack/Discord notifications
 */

export type NotificationPlatform = 'slack' | 'discord'

export interface WebhookNotification {
  platform: NotificationPlatform
  webhookUrl: string
  title: string
  message: string
  color?: string
  fields?: Array<{ name: string; value: string; inline?: boolean }>
  url?: string
  timestamp?: string
}

/**
 * Format notification for Slack
 */
function formatSlackMessage(notification: WebhookNotification): any {
  const { title, message, color, fields, url, timestamp } = notification

  const attachment: any = {
    color: color || '#36a64f',
    title,
    text: message,
    ts: timestamp ? new Date(timestamp).getTime() / 1000 : undefined
  }

  if (url) {
    attachment.title_link = url
  }

  if (fields && fields.length > 0) {
    attachment.fields = fields.map(field => ({
      title: field.name,
      value: field.value,
      short: field.inline || false
    }))
  }

  return {
    attachments: [attachment]
  }
}

/**
 * Format notification for Discord
 */
function formatDiscordMessage(notification: WebhookNotification): any {
  const { title, message, color, fields, url, timestamp } = notification

  const embed: any = {
    title,
    description: message,
    color: color ? parseInt(color.replace('#', ''), 16) : 3447003,
    timestamp: timestamp || new Date().toISOString()
  }

  if (url) {
    embed.url = url
  }

  if (fields && fields.length > 0) {
    embed.fields = fields.map(field => ({
      name: field.name,
      value: field.value,
      inline: field.inline || false
    }))
  }

  return {
    embeds: [embed]
  }
}

/**
 * Send notification to webhook
 */
export async function sendWebhookNotification(
  notification: WebhookNotification
): Promise<{ success: boolean; error?: string }> {
  try {
    const { platform, webhookUrl } = notification

    let payload: any
    if (platform === 'slack') {
      payload = formatSlackMessage(notification)
    } else if (platform === 'discord') {
      payload = formatDiscordMessage(notification)
    } else {
      return { success: false, error: 'Unsupported platform' }
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Webhook notification failed for ${platform}:`, errorText)
      return { success: false, error: `HTTP ${response.status}: ${errorText}` }
    }

    return { success: true }
  } catch (error) {
    console.error('Error sending webhook notification:', error)
    return { success: false, error: String(error) }
  }
}

/**
 * Send batch notifications to multiple webhooks
 */
export async function sendBatchWebhookNotifications(
  notifications: WebhookNotification[]
): Promise<Array<{ success: boolean; error?: string }>> {
  return Promise.all(notifications.map(sendWebhookNotification))
}

/**
 * Predefined notification templates
 */
export const NotificationTemplates = {
  /**
   * New order notification
   */
  newOrder: (orderDetails: {
    orderNumber: string
    clientName: string
    amount: string
    items: string
    orderUrl?: string
  }): Omit<WebhookNotification, 'platform' | 'webhookUrl'> => ({
    title: '🛒 New Order Received',
    message: `Order #${orderDetails.orderNumber} from ${orderDetails.clientName}`,
    color: '#4CAF50',
    fields: [
      { name: 'Client', value: orderDetails.clientName, inline: true },
      { name: 'Amount', value: orderDetails.amount, inline: true },
      { name: 'Items', value: orderDetails.items, inline: false }
    ],
    url: orderDetails.orderUrl,
    timestamp: new Date().toISOString()
  }),

  /**
   * New message notification
   */
  newMessage: (messageDetails: {
    from: string
    subject: string
    preview: string
    messageUrl?: string
  }): Omit<WebhookNotification, 'platform' | 'webhookUrl'> => ({
    title: '💬 New Message',
    message: messageDetails.subject,
    color: '#2196F3',
    fields: [
      { name: 'From', value: messageDetails.from, inline: true },
      { name: 'Preview', value: messageDetails.preview, inline: false }
    ],
    url: messageDetails.messageUrl,
    timestamp: new Date().toISOString()
  }),

  /**
   * Meeting scheduled notification
   */
  meetingScheduled: (meetingDetails: {
    clientName: string
    dateTime: string
    duration: string
    meetingUrl?: string
  }): Omit<WebhookNotification, 'platform' | 'webhookUrl'> => ({
    title: '📅 Meeting Scheduled',
    message: `New meeting with ${meetingDetails.clientName}`,
    color: '#FF9800',
    fields: [
      { name: 'Client', value: meetingDetails.clientName, inline: true },
      { name: 'Date & Time', value: meetingDetails.dateTime, inline: true },
      { name: 'Duration', value: meetingDetails.duration, inline: true }
    ],
    url: meetingDetails.meetingUrl,
    timestamp: new Date().toISOString()
  }),

  /**
   * Content approval needed
   */
  approvalNeeded: (approvalDetails: {
    contentTitle: string
    clientName: string
    contentType: string
    approvalUrl?: string
  }): Omit<WebhookNotification, 'platform' | 'webhookUrl'> => ({
    title: '✅ Approval Needed',
    message: `"${approvalDetails.contentTitle}" is ready for client review`,
    color: '#9C27B0',
    fields: [
      { name: 'Client', value: approvalDetails.clientName, inline: true },
      { name: 'Type', value: approvalDetails.contentType, inline: true },
      { name: 'Content', value: approvalDetails.contentTitle, inline: false }
    ],
    url: approvalDetails.approvalUrl,
    timestamp: new Date().toISOString()
  }),

  /**
   * Payment received notification
   */
  paymentReceived: (paymentDetails: {
    amount: string
    clientName: string
    invoiceNumber: string
    paymentUrl?: string
  }): Omit<WebhookNotification, 'platform' | 'webhookUrl'> => ({
    title: '💰 Payment Received',
    message: `Payment of ${paymentDetails.amount} received`,
    color: '#4CAF50',
    fields: [
      { name: 'Client', value: paymentDetails.clientName, inline: true },
      { name: 'Amount', value: paymentDetails.amount, inline: true },
      { name: 'Invoice', value: paymentDetails.invoiceNumber, inline: true }
    ],
    url: paymentDetails.paymentUrl,
    timestamp: new Date().toISOString()
  }),

  /**
   * Error/Alert notification
   */
  alert: (alertDetails: {
    title: string
    description: string
    severity: 'low' | 'medium' | 'high' | 'critical'
    url?: string
  }): Omit<WebhookNotification, 'platform' | 'webhookUrl'> => {
    const colors = {
      low: '#FFC107',
      medium: '#FF9800',
      high: '#FF5722',
      critical: '#F44336'
    }

    return {
      title: `⚠️ ${alertDetails.title}`,
      message: alertDetails.description,
      color: colors[alertDetails.severity],
      fields: [
        { name: 'Severity', value: alertDetails.severity.toUpperCase(), inline: true }
      ],
      url: alertDetails.url,
      timestamp: new Date().toISOString()
    }
  }
}
