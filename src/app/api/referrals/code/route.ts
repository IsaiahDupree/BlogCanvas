/**
 * GET /api/referrals/code - Get my referral code
 * POST /api/referrals/code - Create or update referral code
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  getOrCreateVendorReferralCode,
  getOrCreateAffiliateReferralCode,
  validateCustomSlug,
} from '@/lib/referrals/generate';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is vendor
    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!vendorError && vendor) {
      const result = await getOrCreateVendorReferralCode(vendor.id);
      return NextResponse.json(result);
    }

    // Check if user is affiliate
    const { data: affiliate, error: affiliateError } = await supabase
      .from('affiliates')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'approved')
      .single();

    if (!affiliateError && affiliate) {
      const result = await getOrCreateAffiliateReferralCode(affiliate.id);
      return NextResponse.json(result);
    }

    return NextResponse.json(
      { error: 'User is not eligible for referral program' },
      { status: 403 }
    );
  } catch (error) {
    console.error('Error getting referral code:', error);
    return NextResponse.json(
      { error: 'Failed to get referral code' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
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
    const { custom_slug } = body;

    // Validate custom slug if provided
    if (custom_slug) {
      const validation = validateCustomSlug(custom_slug);
      if (!validation.valid) {
        return NextResponse.json(
          { error: validation.error },
          { status: 400 }
        );
      }

      // Check if slug is already taken
      const { data: existing } = await supabase
        .from('referral_codes')
        .select('id')
        .eq('custom_slug', custom_slug)
        .single();

      if (existing) {
        return NextResponse.json(
          { error: 'This custom slug is already taken' },
          { status: 400 }
        );
      }
    }

    // Check if user is vendor
    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!vendorError && vendor) {
      const result = await getOrCreateVendorReferralCode(vendor.id, custom_slug);
      return NextResponse.json(result);
    }

    // Check if user is affiliate
    const { data: affiliate, error: affiliateError } = await supabase
      .from('affiliates')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'approved')
      .single();

    if (!affiliateError && affiliate) {
      const result = await getOrCreateAffiliateReferralCode(affiliate.id, custom_slug);
      return NextResponse.json(result);
    }

    return NextResponse.json(
      { error: 'User is not eligible for referral program' },
      { status: 403 }
    );
  } catch (error) {
    console.error('Error updating referral code:', error);
    return NextResponse.json(
      { error: 'Failed to update referral code' },
      { status: 500 }
    );
  }
}
