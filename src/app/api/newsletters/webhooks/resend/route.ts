import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/newsletters/webhooks/resend
 * Webhook receiver for Resend delivery events
 *
 * Resend sends webhooks for various email events:
 * - email.sent: Email was accepted by the receiving server
 * - email.delivered: Email was successfully delivered
 * - email.delivery_delayed: Delivery was delayed
 * - email.bounced: Email bounced (hard or soft bounce)
 * - email.opened: Email was opened by recipient
 * - email.clicked: Link in email was clicked
 * - email.complained: Recipient marked email as spam
 *
 * To set up webhooks in Resend:
 * 1. Go to https://resend.com/webhooks
 * 2. Add webhook URL: https://your-domain.com/api/newsletters/webhooks/resend
 * 3. Select events to subscribe to
 * 4. Copy the webhook signing secret and add to env as RESEND_WEBHOOK_SECRET
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();

    // Verify webhook signature (if configured)
    const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;
    if (webhookSecret) {
      const signature = request.headers.get('resend-signature');

      if (!signature) {
        console.error('Missing resend-signature header');
        return NextResponse.json(
          { error: 'Unauthorized: Missing signature' },
          { status: 401 }
        );
      }

      // Verify HMAC signature
      const crypto = require('crypto');
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(body)
        .digest('hex');

      if (signature !== expectedSignature) {
        console.error('Invalid webhook signature');
        return NextResponse.json(
          { error: 'Unauthorized: Invalid signature' },
          { status: 401 }
        );
      }
    }

    const payload = JSON.parse(body);
    const { type, data } = payload;

    if (!type || !data) {
      return NextResponse.json(
        { error: 'Invalid webhook payload' },
        { status: 400 }
      );
    }

    // Extract email and event data
    const recipientEmail = data.to;
    const emailId = data.email_id;
    const timestamp = data.created_at || new Date().toISOString();

    // Create supabase client (service role for webhook processing)
    const supabase = await createClient();

    // Find recipient record by email
    // Note: We need to find the most recent recipient record for this email
    const { data: recipients, error: findError } = await supabase
      .from('newsletter_recipients')
      .select('id, status, campaign_id')
      .eq('email', recipientEmail)
      .order('created_at', { ascending: false })
      .limit(1);

    if (findError || !recipients || recipients.length === 0) {
      console.warn(`Recipient not found for email: ${recipientEmail}`);
      // Return 200 to acknowledge receipt even if we can't process
      return NextResponse.json({ message: 'Webhook received (recipient not found)' });
    }

    const recipient = recipients[0];

    // Update recipient status based on event type
    let statusUpdate: any = {};

    switch (type) {
      case 'email.sent':
        // Email was accepted by receiving server
        if (recipient.status === 'pending') {
          statusUpdate = {
            status: 'sent',
            sent_at: timestamp,
          };
        }
        break;

      case 'email.delivered':
        // Email was successfully delivered to inbox
        if (recipient.status === 'sent' || recipient.status === 'pending') {
          statusUpdate = {
            status: 'delivered',
            sent_at: timestamp,
          };
        }
        break;

      case 'email.opened':
        // Email was opened by recipient
        if (!recipient.opened_at) {
          statusUpdate = {
            status: 'opened',
            opened_at: timestamp,
          };

          // If not yet marked as delivered, mark as delivered too
          if (!recipient.sent_at) {
            statusUpdate.sent_at = timestamp;
          }
        }
        break;

      case 'email.clicked':
        // Link in email was clicked
        if (!recipient.clicked_at) {
          statusUpdate = {
            status: 'clicked',
            clicked_at: timestamp,
          };

          // If not yet marked as opened, mark as opened too
          if (!recipient.opened_at) {
            statusUpdate.opened_at = timestamp;
          }

          // If not yet marked as delivered, mark as delivered too
          if (!recipient.sent_at) {
            statusUpdate.sent_at = timestamp;
          }
        }
        break;

      case 'email.bounced':
        // Email bounced (couldn't be delivered)
        statusUpdate = {
          status: 'bounced',
        };
        break;

      case 'email.complained':
        // Recipient marked as spam
        statusUpdate = {
          status: 'unsubscribed', // Treat complaints as unsubscribes
        };
        break;

      case 'email.delivery_delayed':
        // Delivery was delayed, no status update needed
        console.log(`Email delivery delayed for ${recipientEmail}`);
        break;

      default:
        console.log(`Unhandled webhook event type: ${type}`);
    }

    // Apply status update if needed
    if (Object.keys(statusUpdate).length > 0) {
      const { error: updateError } = await supabase
        .from('newsletter_recipients')
        .update(statusUpdate)
        .eq('id', recipient.id);

      if (updateError) {
        console.error('Error updating recipient status:', updateError);
        return NextResponse.json(
          { error: 'Failed to update recipient status' },
          { status: 500 }
        );
      }

      console.log(`Updated recipient ${recipient.id} status to ${statusUpdate.status || recipient.status}`);
    }

    return NextResponse.json({
      message: 'Webhook processed successfully',
      event_type: type,
      recipient_id: recipient.id,
    });
  } catch (error: any) {
    console.error('Unexpected error in Resend webhook:', error);

    // Return 200 to acknowledge receipt even if processing failed
    // This prevents Resend from retrying failed webhooks repeatedly
    return NextResponse.json({
      message: 'Webhook acknowledged (processing error)',
      error: error.message,
    });
  }
}

// GET endpoint for webhook verification (Resend webhook setup)
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Resend webhook endpoint',
    status: 'active',
  });
}
