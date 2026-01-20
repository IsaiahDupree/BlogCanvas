// WL-001: Custom Domains API - Get, Update, Delete

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import {
  getCustomDomain,
  updateCustomDomain,
  deleteCustomDomain,
} from '@/lib/db/custom-domains';
import type { UpdateCustomDomainInput } from '@/types/custom-domain';

/**
 * GET /api/vendor/domains/[domainId]
 * Get a specific custom domain
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

    return NextResponse.json({
      success: true,
      domain,
    });
  } catch (error: any) {
    console.error('Error fetching custom domain:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch domain' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/vendor/domains/[domainId]
 * Update a custom domain
 */
export async function PATCH(
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

    // Parse request body
    const body = (await request.json()) as UpdateCustomDomainInput;

    // Update domain
    const updatedDomain = await updateCustomDomain(
      params.domainId,
      user.id,
      body
    );

    return NextResponse.json({
      success: true,
      domain: updatedDomain,
      message: 'Domain updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating custom domain:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update domain' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/vendor/domains/[domainId]
 * Delete a custom domain
 */
export async function DELETE(
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

    // Delete domain
    const deleted = await deleteCustomDomain(params.domainId, user.id);

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Failed to delete domain' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Domain deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting custom domain:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete domain' },
      { status: 500 }
    );
  }
}
