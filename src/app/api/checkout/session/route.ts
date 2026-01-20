import { NextRequest, NextResponse } from 'next/server';
import { createCheckoutSession } from '@/lib/stripe/checkout';
import { getVendorById } from '@/lib/db/vendor/vendors';
import { getOfferById } from '@/lib/db/vendor/offers';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { offerId, addonIds, customerEmail, successUrl, cancelUrl, metadata } = body;

    if (!offerId) {
      return NextResponse.json(
        { error: 'Offer ID is required' },
        { status: 400 }
      );
    }

    // Get offer to verify it exists and get vendor ID
    const offer = await getOfferById(offerId);
    if (!offer) {
      return NextResponse.json(
        { error: 'Offer not found' },
        { status: 404 }
      );
    }

    // Get vendor to get Stripe account ID
    const vendor = await getVendorById(offer.vendor_id);
    if (!vendor) {
      return NextResponse.json(
        { error: 'Vendor not found' },
        { status: 404 }
      );
    }

    if (!vendor.stripe_account_id) {
      return NextResponse.json(
        { error: 'Vendor has not connected Stripe account' },
        { status: 400 }
      );
    }

    // Check if offer is in quote mode
    if (offer.is_quote_mode) {
      return NextResponse.json(
        { error: 'This offer is in quote mode and cannot be purchased directly' },
        { status: 400 }
      );
    }

    // Check if offer is active
    if (!offer.is_active) {
      return NextResponse.json(
        { error: 'This offer is not currently available' },
        { status: 400 }
      );
    }

    // Create checkout session
    const session = await createCheckoutSession({
      offerId,
      vendorId: offer.vendor_id,
      vendorStripeAccountId: vendor.stripe_account_id,
      addonIds,
      customerEmail,
      successUrl,
      cancelUrl,
      metadata,
    });

    return NextResponse.json(session);
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
