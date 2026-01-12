/**
 * Individual API Key Endpoints
 * GET /api/api-keys/[id] - Get a specific API key
 * PATCH /api/api-keys/[id] - Update an API key
 * DELETE /api/api-keys/[id] - Delete (revoke) an API key
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import {
  getApiKey,
  updateApiKey,
  deleteApiKey,
  API_SCOPES,
} from '@/lib/api-key-service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createServerClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's vendor_id from profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('vendor_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.vendor_id) {
      return NextResponse.json(
        { error: 'User not associated with a vendor' },
        { status: 403 }
      );
    }

    // Get the API key
    const apiKey = await getApiKey(id);

    if (!apiKey) {
      return NextResponse.json({ error: 'API key not found' }, { status: 404 });
    }

    // Verify ownership
    if (apiKey.vendor_id !== profile.vendor_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ apiKey });
  } catch (error: any) {
    console.error('Error getting API key:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get API key' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createServerClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's vendor_id from profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('vendor_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.vendor_id) {
      return NextResponse.json(
        { error: 'User not associated with a vendor' },
        { status: 403 }
      );
    }

    // Get the API key
    const apiKey = await getApiKey(id);

    if (!apiKey) {
      return NextResponse.json({ error: 'API key not found' }, { status: 404 });
    }

    // Verify ownership
    if (apiKey.vendor_id !== profile.vendor_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();
    const { name, scopes, isActive, expiresAt, rateLimits } = body;

    // Validate scopes if provided
    if (scopes !== undefined) {
      if (!Array.isArray(scopes) || scopes.length === 0) {
        return NextResponse.json(
          { error: 'At least one scope is required' },
          { status: 400 }
        );
      }

      const validScopes = Object.keys(API_SCOPES);
      const invalidScopes = scopes.filter((s) => !validScopes.includes(s));
      if (invalidScopes.length > 0) {
        return NextResponse.json(
          { error: `Invalid scopes: ${invalidScopes.join(', ')}` },
          { status: 400 }
        );
      }
    }

    // Parse expiration date if provided
    let expirationDate: Date | null | undefined;
    if (expiresAt !== undefined) {
      if (expiresAt === null) {
        expirationDate = null; // Remove expiration
      } else {
        expirationDate = new Date(expiresAt);
        if (isNaN(expirationDate.getTime())) {
          return NextResponse.json(
            { error: 'Invalid expiration date' },
            { status: 400 }
          );
        }
        if (expirationDate <= new Date()) {
          return NextResponse.json(
            { error: 'Expiration date must be in the future' },
            { status: 400 }
          );
        }
      }
    }

    // Update the API key
    const updatedApiKey = await updateApiKey(id, {
      name: name?.trim(),
      scopes,
      is_active: isActive,
      expires_at: expirationDate,
      rate_limit_per_minute: rateLimits?.perMinute,
      rate_limit_per_hour: rateLimits?.perHour,
      rate_limit_per_day: rateLimits?.perDay,
    });

    return NextResponse.json({
      message: 'API key updated successfully',
      apiKey: updatedApiKey,
    });
  } catch (error: any) {
    console.error('Error updating API key:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update API key' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createServerClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's vendor_id from profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('vendor_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.vendor_id) {
      return NextResponse.json(
        { error: 'User not associated with a vendor' },
        { status: 403 }
      );
    }

    // Get the API key
    const apiKey = await getApiKey(id);

    if (!apiKey) {
      return NextResponse.json({ error: 'API key not found' }, { status: 404 });
    }

    // Verify ownership
    if (apiKey.vendor_id !== profile.vendor_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete the API key
    await deleteApiKey(id);

    return NextResponse.json({
      message: 'API key deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting API key:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete API key' },
      { status: 500 }
    );
  }
}
