/**
 * API Keys Management Endpoints
 * GET /api/api-keys - List all API keys for the authenticated vendor
 * POST /api/api-keys - Create a new API key
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import {
  generateApiKey,
  listApiKeys,
  API_SCOPES,
} from '@/lib/api-key-service';

export async function GET(request: NextRequest) {
  try {
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

    // List all API keys for this vendor
    const apiKeys = await listApiKeys(profile.vendor_id);

    return NextResponse.json({ apiKeys });
  } catch (error: any) {
    console.error('Error listing API keys:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to list API keys' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
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

    // Parse request body
    const body = await request.json();
    const { name, scopes, expiresAt, rateLimits } = body;

    // Validate required fields
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    // Validate scopes
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

    // Parse expiration date if provided
    let expirationDate: Date | undefined;
    if (expiresAt) {
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

    // Generate API key
    const { key, apiKey } = await generateApiKey(
      profile.vendor_id,
      name.trim(),
      scopes,
      {
        expiresAt: expirationDate,
        rateLimitPerMinute: rateLimits?.perMinute,
        rateLimitPerHour: rateLimits?.perHour,
        rateLimitPerDay: rateLimits?.perDay,
      }
    );

    return NextResponse.json(
      {
        message: 'API key created successfully',
        key, // Only returned once!
        apiKey,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating API key:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create API key' },
      { status: 500 }
    );
  }
}
