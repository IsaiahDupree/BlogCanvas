/**
 * Invoice Detail API
 * GET - Get invoice details
 * PATCH - Mark invoice as paid or void
 * POST - Send payment reminder
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { markInvoiceAsPaid, voidInvoice, sendPaymentReminder } from '@/lib/stripe/invoice-manager';
import { isStripeConfigured } from '@/lib/stripe/stripe-client';

type RouteParams = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/invoices/[id]
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get invoice with client details
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('*, client:client_id(*), subscription:subscription_id(*)')
      .eq('id', id)
      .single();

    if (invoiceError || !invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Verify access (vendor or client)
    const { data: client } = await supabase
      .from('clients')
      .select('*')
      .eq('id', invoice.client_id)
      .single();

    if (!client || (client.owner_id !== user.id && invoice.client_id !== user.id)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    return NextResponse.json({ invoice });
  } catch (error: any) {
    console.error('Error fetching invoice:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch invoice' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/invoices/[id]
 * Mark invoice as paid or void
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    if (!isStripeConfigured()) {
      return NextResponse.json({ error: 'Stripe is not configured.' }, { status: 503 });
    }

    const { id } = await params;
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    // Get invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('*, client:client_id(*)')
      .eq('id', id)
      .single();

    if (invoiceError || !invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Verify vendor access
    const client = invoice.client as any;
    if (client.owner_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Handle different actions
    if (action === 'mark_paid') {
      const result = await markInvoiceAsPaid(id);
      return NextResponse.json({ success: true, message: 'Invoice marked as paid' });
    } else if (action === 'void') {
      const result = await voidInvoice(id);
      return NextResponse.json({ success: true, message: 'Invoice voided' });
    } else if (action === 'send_reminder') {
      const result = await sendPaymentReminder(id);
      return NextResponse.json({ success: true, message: result.message });
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use mark_paid, void, or send_reminder' },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Error updating invoice:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update invoice' },
      { status: 500 }
    );
  }
}
