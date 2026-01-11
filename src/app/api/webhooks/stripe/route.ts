/**
 * Stripe Webhook Handler
 * Processes Stripe webhook events to keep database in sync
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe/stripe-client';
import { createClient } from '@supabase/supabase-js';

// Use service role client for webhooks (bypasses RLS)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

/**
 * POST /api/webhooks/stripe
 * Stripe webhook endpoint
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
      return NextResponse.json({ error: 'No signature provided' }, { status: 400 });
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Log webhook event
    await supabase.from('stripe_webhook_events').insert({
      stripe_event_id: event.id,
      event_type: event.type,
      event_data: event as any,
      processed: false,
    });

    // Process event based on type
    try {
      await processWebhookEvent(event);

      // Mark as processed
      await supabase
        .from('stripe_webhook_events')
        .update({ processed: true, processed_at: new Date().toISOString() })
        .eq('stripe_event_id', event.id);
    } catch (error: any) {
      console.error('Error processing webhook event:', error);

      // Log error
      await supabase
        .from('stripe_webhook_events')
        .update({ error: error.message })
        .eq('stripe_event_id', event.id);

      // Return 200 to prevent Stripe from retrying
      return NextResponse.json({ error: error.message, received: true }, { status: 200 });
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * Process webhook event based on type
 */
async function processWebhookEvent(event: Stripe.Event) {
  switch (event.type) {
    // Subscription events
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
      await handleSubscriptionUpdate(event.data.object as Stripe.Subscription);
      break;

    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
      break;

    // Invoice events
    case 'invoice.created':
    case 'invoice.updated':
      await handleInvoiceUpdate(event.data.object as Stripe.Invoice);
      break;

    case 'invoice.paid':
      await handleInvoicePaid(event.data.object as Stripe.Invoice);
      break;

    case 'invoice.payment_failed':
      await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
      break;

    case 'invoice.finalized':
      await handleInvoiceFinalized(event.data.object as Stripe.Invoice);
      break;

    // Payment events
    case 'payment_intent.succeeded':
      await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
      break;

    case 'payment_intent.payment_failed':
      await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
      break;

    // Customer events
    case 'customer.created':
    case 'customer.updated':
      // Customer info is already synced via our API
      break;

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }
}

/**
 * Handle subscription created/updated
 */
async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
      canceled_at: subscription.canceled_at
        ? new Date(subscription.canceled_at * 1000).toISOString()
        : null,
      trial_start: subscription.trial_start
        ? new Date(subscription.trial_start * 1000).toISOString()
        : null,
      trial_end: subscription.trial_end
        ? new Date(subscription.trial_end * 1000).toISOString()
        : null,
    })
    .eq('stripe_subscription_id', subscription.id);

  if (error) {
    throw new Error(`Failed to update subscription: ${error.message}`);
  }
}

/**
 * Handle subscription deleted
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: 'canceled',
      canceled_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id);

  if (error) {
    throw new Error(`Failed to delete subscription: ${error.message}`);
  }
}

/**
 * Handle invoice created/updated
 */
async function handleInvoiceUpdate(invoice: Stripe.Invoice) {
  // Check if invoice exists
  const { data: existing } = await supabase
    .from('invoices')
    .select('id')
    .eq('stripe_invoice_id', invoice.id)
    .single();

  const invoiceData = {
    amount_due: invoice.amount_due,
    amount_paid: invoice.amount_paid,
    status: invoice.status || 'open',
    invoice_number: invoice.number,
    invoice_pdf_url: invoice.invoice_pdf,
    hosted_invoice_url: invoice.hosted_invoice_url,
    due_date: invoice.due_date ? new Date(invoice.due_date * 1000).toISOString() : null,
  };

  if (existing) {
    // Update existing invoice
    const { error } = await supabase
      .from('invoices')
      .update(invoiceData)
      .eq('stripe_invoice_id', invoice.id);

    if (error) {
      throw new Error(`Failed to update invoice: ${error.message}`);
    }
  }
  // If invoice doesn't exist in our DB, it was created outside our system
  // We can optionally create it here if needed
}

/**
 * Handle invoice paid
 */
async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const { error } = await supabase
    .from('invoices')
    .update({
      status: 'paid',
      amount_paid: invoice.amount_paid,
      paid_at: new Date().toISOString(),
    })
    .eq('stripe_invoice_id', invoice.id);

  if (error) {
    throw new Error(`Failed to mark invoice as paid: ${error.message}`);
  }
}

/**
 * Handle invoice payment failed
 */
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const { error } = await supabase
    .from('invoices')
    .update({
      status: 'open',
    })
    .eq('stripe_invoice_id', invoice.id);

  if (error) {
    throw new Error(`Failed to update invoice payment failure: ${error.message}`);
  }

  // TODO: Send payment failure notification email to vendor and client
}

/**
 * Handle invoice finalized
 */
async function handleInvoiceFinalized(invoice: Stripe.Invoice) {
  const { error } = await supabase
    .from('invoices')
    .update({
      status: invoice.status || 'open',
      invoice_number: invoice.number,
      invoice_pdf_url: invoice.invoice_pdf,
      hosted_invoice_url: invoice.hosted_invoice_url,
    })
    .eq('stripe_invoice_id', invoice.id);

  if (error) {
    throw new Error(`Failed to finalize invoice: ${error.message}`);
  }
}

/**
 * Handle payment intent succeeded
 */
async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  // Update invoice if this payment intent is linked to an invoice
  if (paymentIntent.invoice) {
    const { error } = await supabase
      .from('invoices')
      .update({
        status: 'paid',
        amount_paid: paymentIntent.amount,
        paid_at: new Date().toISOString(),
      })
      .eq('stripe_payment_intent_id', paymentIntent.id);

    if (error) {
      console.error('Error updating invoice for payment intent:', error);
    }
  }
}

/**
 * Handle payment intent failed
 */
async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  // Log payment failure
  console.error('Payment intent failed:', paymentIntent.id, paymentIntent.last_payment_error);

  // TODO: Send payment failure notification
}

/**
 * GET /api/webhooks/stripe
 * Health check
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: 'Stripe webhook endpoint active',
    webhookSecret: webhookSecret ? 'configured' : 'not configured',
  });
}
