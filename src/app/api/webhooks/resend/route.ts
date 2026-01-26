import { NextRequest, NextResponse } from 'next/server';
import { Webhook } from 'svix';
import { logEmailSent, trackEmailEvent, findPersonByExternalId } from '@/lib/db/growth-data-plane';

/**
 * Resend Webhook Handler
 * Handles email events: sent, delivered, opened, clicked, bounced, complained
 */

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('RESEND_WEBHOOK_SECRET not configured');
    return NextResponse.json(
      { error: 'Webhook secret not configured' },
      { status: 500 }
    );
  }

  // Get the raw body
  const payload = await request.text();

  // Get Svix headers
  const svix_id = request.headers.get('svix-id');
  const svix_timestamp = request.headers.get('svix-timestamp');
  const svix_signature = request.headers.get('svix-signature');

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return NextResponse.json(
      { error: 'Missing Svix headers' },
      { status: 400 }
    );
  }

  // Verify webhook signature
  const wh = new Webhook(webhookSecret);
  let event: any;

  try {
    event = wh.verify(payload, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    });
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 401 }
    );
  }

  // Parse event
  const eventType = event.type;
  const data = event.data;

  console.log('Resend webhook event:', eventType, data);

  try {
    switch (eventType) {
      case 'email.sent':
        await handleEmailSent(data);
        break;

      case 'email.delivered':
        await handleEmailDelivered(data);
        break;

      case 'email.delivery_delayed':
        // Ignore for now
        break;

      case 'email.complained':
        await handleEmailComplained(data);
        break;

      case 'email.bounced':
        await handleEmailBounced(data);
        break;

      case 'email.opened':
        await handleEmailOpened(data);
        break;

      case 'email.clicked':
        await handleEmailClicked(data);
        break;

      default:
        console.log('Unknown event type:', eventType);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    );
  }
}

/**
 * Handle email.sent event
 */
async function handleEmailSent(data: any) {
  const { email_id, to, from, subject, tags } = data;

  // Extract person_id from tags if available
  // Tags format: ["person_id:abc-123", "campaign:onboarding"]
  let personId: string | undefined;
  const tagsList = tags || [];

  for (const tag of tagsList) {
    if (tag.startsWith('person_id:')) {
      personId = tag.replace('person_id:', '');
      break;
    }
  }

  // If no person_id in tags, try to find by email
  if (!personId && to) {
    const person = await findPersonByExternalId('email', to);
    personId = person?.id;
  }

  await logEmailSent({
    person_id: personId,
    message_id: email_id,
    email_to: to,
    email_from: from,
    subject: subject || null,
    tags: tagsList,
  });
}

/**
 * Handle email.delivered event
 */
async function handleEmailDelivered(data: any) {
  const { email_id } = data;

  await trackEmailEvent({
    message_id: email_id,
    event_type: 'delivered',
  });
}

/**
 * Handle email.opened event
 */
async function handleEmailOpened(data: any) {
  const { email_id } = data;

  await trackEmailEvent({
    message_id: email_id,
    event_type: 'opened',
  });
}

/**
 * Handle email.clicked event
 */
async function handleEmailClicked(data: any) {
  const { email_id, link } = data;

  await trackEmailEvent({
    message_id: email_id,
    event_type: 'clicked',
    link_url: link?.url || null,
    link_text: link?.text || null,
  });
}

/**
 * Handle email.bounced event
 */
async function handleEmailBounced(data: any) {
  const { email_id } = data;

  await trackEmailEvent({
    message_id: email_id,
    event_type: 'bounced',
  });
}

/**
 * Handle email.complained event
 */
async function handleEmailComplained(data: any) {
  const { email_id } = data;

  await trackEmailEvent({
    message_id: email_id,
    event_type: 'complained',
  });
}
