import { NextRequest, NextResponse } from 'next/server';
import {
  createConnectAccount,
  createAccountLink,
  getConnectAccountStatus,
  createLoginLink,
} from '@/lib/stripe/connect';
import { getVendorById } from '@/lib/db/vendor/vendors';

/**
 * GET /api/stripe/connect - Get Connect account status
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const vendorId = searchParams.get('vendorId');
    const action = searchParams.get('action');

    if (!vendorId) {
      return NextResponse.json(
        { error: 'Vendor ID is required' },
        { status: 400 }
      );
    }

    const vendor = await getVendorById(vendorId);
    if (!vendor) {
      return NextResponse.json(
        { error: 'Vendor not found' },
        { status: 404 }
      );
    }

    // If no Stripe account yet
    if (!vendor.stripe_account_id) {
      return NextResponse.json({
        connected: false,
        requiresOnboarding: true,
      });
    }

    // Get account status
    const status = await getConnectAccountStatus(vendor.stripe_account_id);

    // If action is 'dashboard', return login link
    if (action === 'dashboard') {
      const loginUrl = await createLoginLink(vendor.stripe_account_id);
      return NextResponse.json({
        connected: true,
        ...status,
        dashboardUrl: loginUrl,
      });
    }

    return NextResponse.json({
      connected: true,
      ...status,
    });
  } catch (error) {
    console.error('Error fetching Connect account status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch account status' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/stripe/connect - Create or onboard Connect account
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { vendorId, action } = body;

    if (!vendorId) {
      return NextResponse.json(
        { error: 'Vendor ID is required' },
        { status: 400 }
      );
    }

    const vendor = await getVendorById(vendorId);
    if (!vendor) {
      return NextResponse.json(
        { error: 'Vendor not found' },
        { status: 404 }
      );
    }

    let stripeAccountId = vendor.stripe_account_id;

    // Create account if it doesn't exist
    if (!stripeAccountId) {
      stripeAccountId = await createConnectAccount(
        vendorId,
        vendor.email,
        vendor.business_name
      );
    }

    // Create onboarding or refresh link
    const accountLinkUrl = await createAccountLink(stripeAccountId);

    return NextResponse.json({
      url: accountLinkUrl,
      accountId: stripeAccountId,
    });
  } catch (error) {
    console.error('Error creating Connect account or link:', error);
    return NextResponse.json(
      { error: 'Failed to create account or onboarding link' },
      { status: 500 }
    );
  }
}
