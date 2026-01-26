/**
 * Stripe + Growth Data Plane Integration
 * Links Stripe events to person records and tracks subscription changes
 */

import type Stripe from 'stripe';
import {
  findOrCreatePerson,
  linkIdentity,
  trackEvent,
  upsertSubscription,
  findPersonByExternalId,
} from '@/lib/db/growth-data-plane';
import { trackServerSideEvent } from './meta-events';

/**
 * Handle checkout session completed for Growth Data Plane
 */
export async function trackCheckoutCompleted(
  session: Stripe.Checkout.Session,
  vendorId?: string
) {
  try {
    const customerEmail = session.customer_email || session.customer_details?.email;
    const customerName = session.customer_details?.name;

    if (!customerEmail) {
      console.warn('Checkout completed without customer email');
      return;
    }

    // Find or create person
    const person = await findOrCreatePerson({
      email: customerEmail,
      name: customerName || undefined,
      tenant_id: vendorId,
    });

    if (!person) {
      console.error('Failed to create person for checkout');
      return;
    }

    // Link Stripe customer ID
    if (session.customer) {
      await linkIdentity(
        person.id,
        'stripe',
        session.customer as string,
        {
          stripe_checkout_session_id: session.id,
        }
      );
    }

    // Track purchase event
    const totalAmount = session.amount_total ? session.amount_total / 100 : 0;
    const currency = session.currency?.toUpperCase() || 'USD';

    await trackEvent({
      person_id: person.id,
      event_name: 'purchase_completed',
      event_source: 'stripe',
      event_id: `stripe_checkout_${session.id}`,
      properties: {
        checkout_session_id: session.id,
        amount: totalAmount,
        currency,
        payment_status: session.payment_status,
        metadata: session.metadata,
      },
      tenant_id: vendorId,
    });

    // Track to Meta CAPI (server-side)
    if (process.env.NEXT_PUBLIC_FB_PIXEL_ID) {
      await trackServerSideEvent(
        'Purchase',
        `${process.env.NEXT_PUBLIC_SITE_URL || 'https://blogcanvas.com'}/checkout`,
        {
          email: customerEmail,
          externalId: person.id,
          clientIpAddress: session.customer_details?.address?.country,
        },
        {
          value: totalAmount,
          currency,
          content_ids: [session.metadata?.offer_id || 'unknown'],
        }
      ).catch((err) => console.error('Failed to track Purchase to Meta:', err));
    }
  } catch (error) {
    console.error('Error tracking checkout completed:', error);
  }
}

/**
 * Handle subscription created/updated for Growth Data Plane
 */
export async function trackSubscriptionUpdate(subscription: Stripe.Subscription) {
  try {
    // Find person by Stripe customer ID
    const person = await findPersonByExternalId(
      'stripe',
      subscription.customer as string
    );

    if (!person) {
      console.warn('Person not found for subscription update:', subscription.customer);
      return;
    }

    // Calculate MRR (Monthly Recurring Revenue)
    let mrr = 0;
    if (subscription.items.data[0]) {
      const price = subscription.items.data[0].price;
      const amount = price.unit_amount || 0;

      if (price.recurring?.interval === 'year') {
        mrr = Math.round(amount / 12); // Convert annual to monthly
      } else {
        mrr = amount;
      }
    }

    // Upsert subscription
    await upsertSubscription(subscription.id, {
      person_id: person.id,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: subscription.customer as string,
      status: subscription.status as any,
      plan_id: subscription.items.data[0]?.price?.id || null,
      plan_name: subscription.items.data[0]?.price?.nickname || null,
      billing_interval: subscription.items.data[0]?.price?.recurring?.interval || null,
      amount: subscription.items.data[0]?.price?.unit_amount || null,
      currency: subscription.currency || 'usd',
      mrr,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      trial_end: subscription.trial_end
        ? new Date(subscription.trial_end * 1000).toISOString()
        : null,
      canceled_at: subscription.canceled_at
        ? new Date(subscription.canceled_at * 1000).toISOString()
        : null,
      ended_at: subscription.ended_at
        ? new Date(subscription.ended_at * 1000).toISOString()
        : null,
      metadata: subscription.metadata as any,
      tenant_id: person.tenant_id || undefined,
    });

    // Track event
    await trackEvent({
      person_id: person.id,
      event_name: 'subscription_updated',
      event_source: 'stripe',
      event_id: `stripe_sub_${subscription.id}_${Date.now()}`,
      properties: {
        subscription_id: subscription.id,
        status: subscription.status,
        mrr,
        plan_id: subscription.items.data[0]?.price?.id,
      },
      tenant_id: person.tenant_id || undefined,
    });
  } catch (error) {
    console.error('Error tracking subscription update:', error);
  }
}

/**
 * Handle subscription deleted for Growth Data Plane
 */
export async function trackSubscriptionDeleted(subscription: Stripe.Subscription) {
  try {
    // Find person by Stripe customer ID
    const person = await findPersonByExternalId(
      'stripe',
      subscription.customer as string
    );

    if (!person) {
      console.warn('Person not found for subscription deletion:', subscription.customer);
      return;
    }

    // Update subscription
    await upsertSubscription(subscription.id, {
      person_id: person.id,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: subscription.customer as string,
      status: 'canceled',
      ended_at: new Date().toISOString(),
      tenant_id: person.tenant_id || undefined,
    });

    // Track event
    await trackEvent({
      person_id: person.id,
      event_name: 'subscription_canceled',
      event_source: 'stripe',
      event_id: `stripe_sub_cancel_${subscription.id}`,
      properties: {
        subscription_id: subscription.id,
      },
      tenant_id: person.tenant_id || undefined,
    });
  } catch (error) {
    console.error('Error tracking subscription deletion:', error);
  }
}

/**
 * Handle invoice paid for Growth Data Plane
 */
export async function trackInvoicePaid(invoice: Stripe.Invoice) {
  try {
    if (!invoice.customer) return;

    // Find person by Stripe customer ID
    const person = await findPersonByExternalId('stripe', invoice.customer as string);

    if (!person) {
      console.warn('Person not found for invoice paid:', invoice.customer);
      return;
    }

    // Track event
    await trackEvent({
      person_id: person.id,
      event_name: 'invoice_paid',
      event_source: 'stripe',
      event_id: `stripe_inv_${invoice.id}`,
      properties: {
        invoice_id: invoice.id,
        amount: invoice.amount_paid / 100,
        currency: invoice.currency?.toUpperCase(),
        subscription_id: invoice.subscription,
      },
      tenant_id: person.tenant_id || undefined,
    });
  } catch (error) {
    console.error('Error tracking invoice paid:', error);
  }
}

/**
 * Handle invoice payment failed for Growth Data Plane
 */
export async function trackInvoicePaymentFailed(invoice: Stripe.Invoice) {
  try {
    if (!invoice.customer) return;

    // Find person by Stripe customer ID
    const person = await findPersonByExternalId('stripe', invoice.customer as string);

    if (!person) {
      console.warn('Person not found for invoice payment failed:', invoice.customer);
      return;
    }

    // Track event
    await trackEvent({
      person_id: person.id,
      event_name: 'invoice_payment_failed',
      event_source: 'stripe',
      event_id: `stripe_inv_fail_${invoice.id}`,
      properties: {
        invoice_id: invoice.id,
        amount: invoice.amount_due / 100,
        currency: invoice.currency?.toUpperCase(),
        subscription_id: invoice.subscription,
        attempt_count: invoice.attempt_count,
      },
      tenant_id: person.tenant_id || undefined,
    });
  } catch (error) {
    console.error('Error tracking invoice payment failed:', error);
  }
}
