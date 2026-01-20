// WL-003: SSL Management API

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { getCustomDomain } from '@/lib/db/custom-domains';
import {
  provisionSSL,
  checkSSLStatus,
  getSSLCertificateInfo,
} from '@/lib/domains/ssl';

/**
 * POST /api/vendor/domains/[domainId]/ssl
 * Provision SSL certificate for the domain
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

    // Domain must be verified first
    if (domain.verification_status !== 'verified') {
      return NextResponse.json(
        {
          success: false,
          error: 'Domain must be verified before provisioning SSL',
        },
        { status: 400 }
      );
    }

    // Check if SSL is already active
    if (domain.ssl_status === 'active') {
      const certInfo = getSSLCertificateInfo(domain);
      return NextResponse.json({
        success: true,
        ssl_status: 'active',
        message: 'SSL certificate is already active',
        certificate: certInfo,
        domain,
      });
    }

    // Provision SSL
    const result = await provisionSSL(domain);

    // Get updated domain
    const updatedDomain = await getCustomDomain(params.domainId);

    return NextResponse.json({
      success: result.success,
      ssl_status: result.ssl_status,
      message: result.message,
      ssl_issued_at: result.ssl_issued_at,
      ssl_expires_at: result.ssl_expires_at,
      error: result.error,
      domain: updatedDomain,
    });
  } catch (error: any) {
    console.error('Error provisioning SSL:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to provision SSL' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/vendor/domains/[domainId]/ssl
 * Check SSL certificate status
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

    // Get SSL certificate info
    const certInfo = getSSLCertificateInfo(domain);

    // Check current status from provider
    const statusResult = await checkSSLStatus(domain);

    // Get updated domain
    const updatedDomain = await getCustomDomain(params.domainId);

    return NextResponse.json({
      success: true,
      domain: updatedDomain,
      ssl_status: statusResult.ssl_status,
      certificate: certInfo,
      provider_status: statusResult,
    });
  } catch (error: any) {
    console.error('Error checking SSL status:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to check SSL status' },
      { status: 500 }
    );
  }
}
