/**
 * Stripe Webhook Handler
 * Processes Stripe webhook events to keep database in sync
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe/stripe-client';
import { createClient } from '@supabase/supabase-js';
import { sendOrderConfirmationEmail, sendNewOrderToVendor } from '@/lib/vendor/email-notifications';

// Use service role client for webhooks (bypasses RLS)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

/**
 * Generate a unique order number
 */
async function generateOrderNumber(): Promise<string> {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `ORD-${dateStr}-${random}`;
}

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
    // Checkout session completed (vendor platform)
    case 'checkout.session.completed':
      await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
      break;

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
 * Handle checkout session completed (vendor platform)
 */
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  try {
    const metadata = session.metadata;

    if (!metadata?.offer_id || !metadata?.vendor_id) {
      console.log('Checkout session completed but missing vendor platform metadata');
      return;
    }

    // Extract customer information
    const customerEmail = session.customer_email || session.customer_details?.email;
    const customerName = session.customer_details?.name;

    // Create or get client
    let clientId: string;

    const { data: existingClient } = await supabase
      .from('vendor_clients')
      .select('id')
      .eq('email', customerEmail)
      .eq('vendor_id', metadata.vendor_id)
      .single();

    if (existingClient) {
      clientId = existingClient.id;

      // Update client status to customer
      await supabase
        .from('vendor_clients')
        .update({ status: 'customer' })
        .eq('id', clientId);
    } else {
      // Create new client
      const { data: newClient, error } = await supabase
        .from('vendor_clients')
        .insert({
          vendor_id: metadata.vendor_id,
          email: customerEmail,
          full_name: customerName,
          status: 'customer',
          first_page_id: metadata.page_id || null,
          utm_source: metadata.utm_source || null,
          utm_medium: metadata.utm_medium || null,
          utm_campaign: metadata.utm_campaign || null,
        })
        .select('id')
        .single();

      if (error || !newClient) {
        throw new Error(`Failed to create client: ${error?.message}`);
      }

      clientId = newClient.id;
    }

    // Get offer details for workspace name
    const { data: offer } = await supabase
      .from('offers')
      .select('name')
      .eq('id', metadata.offer_id)
      .single();

    // Create workspace
    const workspaceName = offer?.name
      ? `${offer.name} - ${customerName || customerEmail}`
      : `${customerName || customerEmail}'s Workspace`;

    const { data: workspace, error: workspaceError } = await supabase
      .from('vendor_workspaces')
      .insert({
        vendor_id: metadata.vendor_id,
        client_id: clientId,
        offer_id: metadata.offer_id,
        page_id: metadata.page_id || null,
        name: workspaceName,
        status: 'onboarding',
      })
      .select('id')
      .single();

    if (workspaceError || !workspace) {
      throw new Error(`Failed to create workspace: ${workspaceError?.message}`);
    }

    // Calculate amounts
    const totalAmount = session.amount_total ? session.amount_total / 100 : 0;
    const currency = session.currency?.toUpperCase() || 'USD';

    // Get base offer price
    const { data: offerData } = await supabase
      .from('offers')
      .select('base_price')
      .eq('id', metadata.offer_id)
      .single();

    const baseAmount = offerData?.base_price || totalAmount;
    const addonsAmount = totalAmount - baseAmount;

    // Generate order number
    const orderNumber = await generateOrderNumber();

    // Create order
    const { data: order, error: orderError } = await supabase
      .from('vendor_orders')
      .insert({
        vendor_id: metadata.vendor_id,
        client_id: clientId,
        workspace_id: workspace.id,
        offer_id: metadata.offer_id,
        order_number: orderNumber,
        base_amount: baseAmount,
        addons_amount: addonsAmount,
        total_amount: totalAmount,
        currency,
        payment_method: 'stripe',
        payment_status: 'paid',
        stripe_checkout_session_id: session.id,
        stripe_payment_intent_id: session.payment_intent as string,
        stripe_customer_id: session.customer as string,
        paid_at: new Date().toISOString(),
        metadata: metadata as any,
      })
      .select('id')
      .single();

    if (orderError || !order) {
      throw new Error(`Failed to create order: ${orderError?.message}`);
    }

    // Create base offer order item
    await supabase
      .from('vendor_order_items')
      .insert({
        order_id: order.id,
        item_type: 'base_offer',
        offer_id: metadata.offer_id,
        name: offer?.name || 'Base Offer',
        unit_price: baseAmount,
        quantity: 1,
        total_price: baseAmount,
      });

    // Create order items for addons
    if (metadata.addon_ids) {
      const addonIds = metadata.addon_ids.split(',').filter(Boolean);

      for (const addonId of addonIds) {
        const { data: addon } = await supabase
          .from('offer_addons')
          .select('*')
          .eq('id', addonId)
          .single();

        if (addon) {
          await supabase
            .from('vendor_order_items')
            .insert({
              order_id: order.id,
              item_type: 'addon',
              addon_id: addon.id,
              name: addon.name,
              description: addon.description,
              unit_price: parseFloat(addon.price),
              quantity: 1,
              total_price: parseFloat(addon.price),
            });
        }
      }
    }

    // Create subscription record if applicable
    if (session.subscription) {
      // Fetch full subscription details
      const subscription = await stripe.subscriptions.retrieve(session.subscription as string);

      await supabase
        .from('vendor_subscriptions')
        .insert({
          vendor_id: metadata.vendor_id,
          client_id: clientId,
          workspace_id: workspace.id,
          offer_id: metadata.offer_id,
          stripe_subscription_id: session.subscription as string,
          stripe_customer_id: session.customer as string,
          status: subscription.status,
          amount: totalAmount,
          currency,
          billing_period: metadata.billing_period || 'monthly',
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        });
    }

    // Create default onboarding steps
    await createDefaultOnboardingSteps(workspace.id, metadata.vendor_id);

    // Track checkout complete event
    await supabase.from('vendor_event_log').insert({
      event_name: 'checkout_complete',
      event_type: 'checkout',
      vendor_id: metadata.vendor_id,
      page_id: metadata.page_id || null,
      client_id: clientId,
      workspace_id: workspace.id,
      session_id: metadata.session_id || null,
      user_type: 'client',
      properties: {
        order_id: order.id,
        offer_id: metadata.offer_id,
        amount: totalAmount,
        currency,
        order_number: orderNumber
      }
    });

    // Send welcome email (async, don't wait)
    sendWorkspaceWelcomeEmail(customerEmail!, workspace.id, metadata.vendor_id, customerName).catch(err => {
      console.error('Error sending welcome email:', err);
    });

    // Send order confirmation emails
    try {
      // Get vendor info for emails
      const { data: vendor } = await supabase
        .from('vendors')
        .select('business_name, user_id')
        .eq('id', metadata.vendor_id)
        .single();

      // Send to client
      await sendOrderConfirmationEmail({
        clientEmail: customerEmail!,
        clientName: customerName || undefined,
        vendorName: vendor?.business_name || 'Vendor',
        orderNumber,
        offerName: offer?.name || 'Purchase',
        amount: totalAmount,
        currency
      });

      // Get vendor user email and send notification
      if (vendor?.user_id) {
        const { data: vendorProfile } = await supabase
          .from('profiles')
          .select('email')
          .eq('id', vendor.user_id)
          .single();

        if (vendorProfile?.email) {
          await sendNewOrderToVendor({
            vendorEmail: vendorProfile.email,
            clientEmail: customerEmail!,
            clientName: customerName || undefined,
            vendorName: vendor.business_name || 'Vendor',
            orderNumber,
            offerName: offer?.name || 'Purchase',
            amount: totalAmount,
            currency
          });
        }
      }
    } catch (emailError) {
      console.error('Error sending order confirmation emails:', emailError);
      // Don't fail the webhook if email fails
    }

    // Mark attribution as converted if session_id is available
    if (metadata.session_id) {
      await supabase
        .from('vendor_attribution')
        .update({
          converted: true,
          converted_at: new Date().toISOString(),
          client_id: clientId,
          order_id: order.id,
          updated_at: new Date().toISOString()
        })
        .eq('session_id', metadata.session_id);
    }

    console.log('Vendor platform checkout completed successfully', {
      orderId: order.id,
      workspaceId: workspace.id,
    });
  } catch (error) {
    console.error('Error handling vendor platform checkout:', error);
    throw error;
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
 * Create default onboarding steps for a new workspace
 */
async function createDefaultOnboardingSteps(workspaceId: string, vendorId: string) {
  const defaultSteps = [
    {
      workspace_id: workspaceId,
      vendor_id: vendorId,
      title: 'Welcome! Review your purchase details',
      description: 'Take a moment to review what you purchased and what to expect next.',
      step_order: 1,
      is_completed: false,
    },
    {
      workspace_id: workspaceId,
      vendor_id: vendorId,
      title: 'Complete your profile information',
      description: 'Help us serve you better by completing your profile details.',
      step_order: 2,
      is_completed: false,
      requires_form_submission: true,
    },
    {
      workspace_id: workspaceId,
      vendor_id: vendorId,
      title: 'Review project requirements',
      description: 'Make sure we have all the information needed to deliver great results.',
      step_order: 3,
      is_completed: false,
      requires_form_submission: true,
    },
    {
      workspace_id: workspaceId,
      vendor_id: vendorId,
      title: 'Schedule your kickoff call',
      description: 'Book a time to discuss your project in detail.',
      step_order: 4,
      is_completed: false,
    },
    {
      workspace_id: workspaceId,
      vendor_id: vendorId,
      title: 'Provide necessary assets',
      description: 'Upload any files, credentials, or materials we need to get started.',
      step_order: 5,
      is_completed: false,
      requires_file_upload: true,
    },
  ];

  const { error } = await supabase
    .from('onboarding_steps')
    .insert(defaultSteps);

  if (error) {
    console.error('Error creating onboarding steps:', error);
    throw error;
  }
}

/**
 * Send welcome email to new client
 */
async function sendWorkspaceWelcomeEmail(
  email: string,
  workspaceId: string,
  vendorId: string,
  customerName?: string
) {
  try {
    // Get vendor details
    const { data: vendor } = await supabase
      .from('vendors')
      .select('business_name, handle')
      .eq('id', vendorId)
      .single();

    if (!vendor) {
      console.error('Vendor not found for welcome email');
      return;
    }

    const portalUrl = `${process.env.NEXT_PUBLIC_APP_URL}/client-portal/${workspaceId}`;
    const firstName = customerName?.split(' ')[0] || 'there';

    // TODO: Replace with actual email service (Resend, SendGrid, etc.)
    console.log('Welcome email would be sent to:', email);
    console.log('Email content:', {
      to: email,
      subject: `Welcome to ${vendor.business_name}! Your portal is ready`,
      body: `
        Hi ${firstName},

        Welcome to ${vendor.business_name}! We're excited to work with you.

        Your client portal is now ready. You can access it here:
        ${portalUrl}

        In your portal, you can:
        - Complete your onboarding checklist
        - Upload files and materials
        - Message our team
        - View deliverables
        - Schedule meetings
        - Track project progress

        Let's get started!

        Best regards,
        ${vendor.business_name} Team
      `,
    });

    // When ready, uncomment and use actual email service:
    /*
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: process.env.FROM_EMAIL || 'noreply@blogcanvas.com',
      to: email,
      subject: `Welcome to ${vendor.business_name}! Your portal is ready`,
      html: welcomeEmailTemplate({
        firstName,
        vendorName: vendor.business_name,
        portalUrl,
      }),
    });
    */
  } catch (error) {
    console.error('Error sending welcome email:', error);
    // Don't throw - email is not critical for checkout completion
  }
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
