import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { createVendor } from '@/lib/db/vendor/vendors';

// Admin client for user management
const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { email, password, handle, business_name, full_name, phone, bio, timezone } = body;

    // Validate required fields
    if (!email || !password || !handle || !business_name) {
      return NextResponse.json(
        { success: false, error: 'Email, password, handle, and business name are required' },
        { status: 400 }
      );
    }

    // Validate handle format
    const handleRegex = /^[a-z0-9_-]+$/;
    if (!handleRegex.test(handle)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Handle can only contain lowercase letters, numbers, hyphens, and underscores'
        },
        { status: 400 }
      );
    }

    // 1. Create auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: full_name || business_name,
          user_type: 'vendor'
        }
      }
    });

    if (authError) {
      console.error('[Vendor Register] Auth error:', authError);
      return NextResponse.json(
        { success: false, error: authError.message },
        { status: 400 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { success: false, error: 'Failed to create user account' },
        { status: 500 }
      );
    }

    // 2. Create vendor record
    try {
      const vendor = await createVendor(authData.user.id, {
        handle: handle.toLowerCase(),
        business_name,
        email,
        full_name,
        phone,
        bio,
        timezone: timezone || 'UTC'
      });

      if (!vendor) {
        // Rollback: delete the auth user
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
        return NextResponse.json(
          { success: false, error: 'Failed to create vendor profile' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        user: authData.user,
        vendor,
        message: 'Vendor account created successfully'
      });

    } catch (vendorError: any) {
      console.error('[Vendor Register] Vendor creation error:', vendorError);

      // Rollback: delete the auth user
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);

      return NextResponse.json(
        { success: false, error: vendorError.message || 'Failed to create vendor profile' },
        { status: 400 }
      );
    }

  } catch (error: any) {
    console.error('[Vendor Register] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
