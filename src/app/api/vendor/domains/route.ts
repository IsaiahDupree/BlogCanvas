// WL-001: Custom Domains API - List and Create

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import {
  getVendorDomains,
  createCustomDomain,
  isDomainAvailable,
} from '@/lib/db/custom-domains';
import type { CreateCustomDomainInput } from '@/types/custom-domain';

/**
 * GET /api/vendor/domains
 * List all custom domains for the authenticated vendor
 */
export async function GET(request: NextRequest) {
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

    // Get vendor domains
    const domains = await getVendorDomains(user.id);

    return NextResponse.json({
      success: true,
      domains,
      count: domains.length,
    });
  } catch (error: any) {
    console.error('Error fetching vendor domains:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch domains' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/vendor/domains
 * Create a new custom domain for the authenticated vendor
 */
export async function POST(request: NextRequest) {
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

    // Parse request body
    const body = (await request.json()) as CreateCustomDomainInput;

    // Validate domain
    if (!body.domain || typeof body.domain !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Domain is required' },
        { status: 400 }
      );
    }

    // Normalize domain
    const domain = body.domain.toLowerCase().trim();

    // Basic domain validation
    const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/;
    if (!domainRegex.test(domain)) {
      return NextResponse.json(
        { success: false, error: 'Invalid domain format' },
        { status: 400 }
      );
    }

    // Check if domain is available
    const available = await isDomainAvailable(domain);
    if (!available) {
      return NextResponse.json(
        { success: false, error: 'Domain is already registered' },
        { status: 409 }
      );
    }

    // Create custom domain
    const customDomain = await createCustomDomain(user.id, {
      domain,
      subdomain: body.subdomain,
      verification_method: body.verification_method || 'txt',
    });

    return NextResponse.json(
      {
        success: true,
        domain: customDomain,
        message: 'Custom domain created successfully',
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating custom domain:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create domain' },
      { status: 500 }
    );
  }
}
