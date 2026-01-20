// WL-002: Domain Verification API

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { getCustomDomain } from '@/lib/db/custom-domains';
import {
  verifyDomain,
  generateSetupInstructions,
  checkDNSRecords,
} from '@/lib/domains/verify';

/**
 * POST /api/vendor/domains/[domainId]/verify
 * Verify domain ownership
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { domainId: string } }
) {
  try {
    const supabase = createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get domain
    const domain = await getCustomDomain(params.domainId);

    if (!domain) {
      return NextResponse.json(
        { success: false, error: 'Domain not found' },
        { status: 404 }
      );
    }

    // Check ownership
    if (domain.vendor_id !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Check if already verified
    if (domain.verification_status === 'verified') {
      return NextResponse.json({
        success: true,
        verified: true,
        message: 'Domain is already verified',
        domain,
      });
    }

    // Perform verification
    const result = await verifyDomain(domain);

    // Get updated domain
    const updatedDomain = await getCustomDomain(params.domainId);

    return NextResponse.json({
      success: result.success,
      verified: result.verified,
      message: result.message,
      details: result.details,
      domain: updatedDomain,
    });
  } catch (error: any) {
    console.error('Error verifying domain:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to verify domain' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/vendor/domains/[domainId]/verify
 * Get setup instructions and check DNS records status
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { domainId: string } }
) {
  try {
    const supabase = createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get domain
    const domain = await getCustomDomain(params.domainId);

    if (!domain) {
      return NextResponse.json(
        { success: false, error: 'Domain not found' },
        { status: 404 }
      );
    }

    // Check ownership
    if (domain.vendor_id !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Generate setup instructions
    const instructions = generateSetupInstructions(domain);

    // Check current DNS records status
    const dnsRecords = await checkDNSRecords(domain);

    return NextResponse.json({
      success: true,
      domain,
      instructions,
      dns_records: dnsRecords,
    });
  } catch (error: any) {
    console.error('Error getting verification info:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get verification info' },
      { status: 500 }
    );
  }
}
