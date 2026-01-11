/**
 * Invoice Manager
 * Handles Stripe invoice creation, sending, and tracking
 */

import { stripe, formatAmountForStripe } from './stripe-client';
import { createClient } from '@/lib/supabase/server';

export interface CreateInvoiceParams {
  clientId: string;
  amount: number; // in dollars
  currency?: string;
  description: string;
  dueDate?: Date;
  items?: Array<{
    description: string;
    amount: number;
    quantity?: number;
  }>;
  metadata?: Record<string, string>;
}

export interface CreatePaymentLinkParams {
  vendorId: string;
  clientId?: string;
  amount: number; // in dollars
  currency?: string;
  description: string;
  expiresAt?: Date;
  metadata?: Record<string, string>;
}

/**
 * Create and send an invoice to a client
 */
export async function createInvoice(params: CreateInvoiceParams) {
  const supabase = await createClient();

  // Get client info
  const { data: client, error: clientError } = await supabase
    .from('clients')
    .select('*, owner:owner_id(*)')
    .eq('id', params.clientId)
    .single();

  if (clientError || !client) {
    throw new Error('Client not found');
  }

  // Create or get Stripe customer
  let stripeCustomerId = client.stripe_customer_id;

  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      name: client.company_name,
      email: client.contact_email,
      metadata: {
        client_id: client.id,
        vendor_id: client.owner_id,
      },
    });

    stripeCustomerId = customer.id;

    // Update client with Stripe customer ID
    await supabase
      .from('clients')
      .update({ stripe_customer_id: stripeCustomerId })
      .eq('id', client.id);
  }

  // Create invoice in Stripe
  const invoice = await stripe.invoices.create({
    customer: stripeCustomerId,
    description: params.description,
    auto_advance: true, // Automatically finalize and charge
    collection_method: 'send_invoice',
    days_until_due: params.dueDate
      ? Math.ceil((params.dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : 30,
    metadata: {
      client_id: client.id,
      vendor_id: client.owner_id,
      ...params.metadata,
    },
  });

  // Add invoice items
  if (params.items && params.items.length > 0) {
    for (const item of params.items) {
      await stripe.invoiceItems.create({
        customer: stripeCustomerId,
        invoice: invoice.id,
        description: item.description,
        amount: formatAmountForStripe(item.amount, params.currency || 'usd'),
        currency: params.currency || 'usd',
        quantity: item.quantity || 1,
      });
    }
  } else {
    // Create a single line item for the total amount
    await stripe.invoiceItems.create({
      customer: stripeCustomerId,
      invoice: invoice.id,
      description: params.description,
      amount: formatAmountForStripe(params.amount, params.currency || 'usd'),
      currency: params.currency || 'usd',
    });
  }

  // Finalize the invoice
  const finalizedInvoice = await stripe.invoices.finalizeInvoice(invoice.id);

  // Send the invoice
  await stripe.invoices.sendInvoice(invoice.id);

  // Save to database
  const { data: savedInvoice, error: saveError } = await supabase
    .from('invoices')
    .insert({
      client_id: client.id,
      stripe_invoice_id: finalizedInvoice.id,
      stripe_payment_intent_id: finalizedInvoice.payment_intent as string,
      amount_due: finalizedInvoice.amount_due,
      amount_paid: finalizedInvoice.amount_paid,
      currency: finalizedInvoice.currency,
      status: finalizedInvoice.status || 'open',
      description: params.description,
      invoice_number: finalizedInvoice.number,
      invoice_pdf_url: finalizedInvoice.invoice_pdf,
      hosted_invoice_url: finalizedInvoice.hosted_invoice_url,
      due_date: finalizedInvoice.due_date
        ? new Date(finalizedInvoice.due_date * 1000).toISOString()
        : null,
      metadata: params.metadata || {},
    })
    .select()
    .single();

  if (saveError) {
    throw new Error(`Failed to save invoice: ${saveError.message}`);
  }

  return savedInvoice;
}

/**
 * Create a payment link for one-time payments
 */
export async function createPaymentLink(params: CreatePaymentLinkParams) {
  const supabase = await createClient();

  // Create a one-time price
  const price = await stripe.prices.create({
    unit_amount: formatAmountForStripe(params.amount, params.currency || 'usd'),
    currency: params.currency || 'usd',
    product_data: {
      name: params.description,
    },
    metadata: {
      vendor_id: params.vendorId,
      client_id: params.clientId || '',
    },
  });

  // Create payment link
  const paymentLinkParams: any = {
    line_items: [
      {
        price: price.id,
        quantity: 1,
      },
    ],
    metadata: {
      vendor_id: params.vendorId,
      client_id: params.clientId || '',
      ...params.metadata,
    },
  };

  if (params.expiresAt) {
    paymentLinkParams.expires_at = Math.floor(params.expiresAt.getTime() / 1000);
  }

  const paymentLink = await stripe.paymentLinks.create(paymentLinkParams);

  // Save to database
  const { data: savedLink, error: saveError } = await supabase
    .from('payment_links')
    .insert({
      vendor_id: params.vendorId,
      client_id: params.clientId || null,
      stripe_payment_link_id: paymentLink.id,
      stripe_price_id: price.id,
      amount: formatAmountForStripe(params.amount, params.currency || 'usd'),
      currency: params.currency || 'usd',
      description: params.description,
      url: paymentLink.url,
      is_active: paymentLink.active,
      expires_at: params.expiresAt?.toISOString() || null,
      metadata: params.metadata || {},
    })
    .select()
    .single();

  if (saveError) {
    throw new Error(`Failed to save payment link: ${saveError.message}`);
  }

  return savedLink;
}

/**
 * Mark invoice as paid (for manual/offline payments)
 */
export async function markInvoiceAsPaid(invoiceId: string) {
  const supabase = await createClient();

  // Get invoice
  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .select('*')
    .eq('id', invoiceId)
    .single();

  if (invoiceError || !invoice) {
    throw new Error('Invoice not found');
  }

  if (!invoice.stripe_invoice_id) {
    // Manual invoice without Stripe
    const { error: updateError } = await supabase
      .from('invoices')
      .update({
        status: 'paid',
        amount_paid: invoice.amount_due,
        paid_at: new Date().toISOString(),
      })
      .eq('id', invoiceId);

    if (updateError) {
      throw new Error(`Failed to update invoice: ${updateError.message}`);
    }

    return { success: true };
  }

  // Mark paid in Stripe
  await stripe.invoices.pay(invoice.stripe_invoice_id, {
    paid_out_of_band: true,
  });

  // Update database
  const { error: updateError } = await supabase
    .from('invoices')
    .update({
      status: 'paid',
      amount_paid: invoice.amount_due,
      paid_at: new Date().toISOString(),
    })
    .eq('id', invoiceId);

  if (updateError) {
    throw new Error(`Failed to update invoice: ${updateError.message}`);
  }

  return { success: true };
}

/**
 * Void an invoice
 */
export async function voidInvoice(invoiceId: string) {
  const supabase = await createClient();

  // Get invoice
  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .select('*')
    .eq('id', invoiceId)
    .single();

  if (invoiceError || !invoice) {
    throw new Error('Invoice not found');
  }

  if (invoice.stripe_invoice_id) {
    // Void in Stripe
    await stripe.invoices.voidInvoice(invoice.stripe_invoice_id);
  }

  // Update database
  const { error: updateError } = await supabase
    .from('invoices')
    .update({
      status: 'void',
    })
    .eq('id', invoiceId);

  if (updateError) {
    throw new Error(`Failed to update invoice: ${updateError.message}`);
  }

  return { success: true };
}

/**
 * Send payment reminder for overdue invoice
 */
export async function sendPaymentReminder(invoiceId: string) {
  const supabase = await createClient();

  // Get invoice
  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .select('*')
    .eq('id', invoiceId)
    .single();

  if (invoiceError || !invoice) {
    throw new Error('Invoice not found');
  }

  if (!invoice.stripe_invoice_id) {
    throw new Error('Cannot send reminder for manual invoice');
  }

  // Send reminder via Stripe
  await stripe.invoices.sendInvoice(invoice.stripe_invoice_id);

  return { success: true, message: 'Payment reminder sent' };
}
