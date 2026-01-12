import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

/**
 * POST /api/vendors/register
 * Register a new vendor organization and create the first owner user
 *
 * This endpoint is called during vendor sign-up to create:
 * 1. Vendor organization record
 * 2. User account via Supabase Auth
 * 3. Profile record linked to vendor
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      vendorName,
      slug,
      email,
      password,
      fullName,
      companyType,
      teamSize,
    } = body

    // Validation
    if (!vendorName || !slug || !email || !password || !fullName) {
      return NextResponse.json(
        { error: 'Missing required fields: vendorName, slug, email, password, fullName' },
        { status: 400 }
      )
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      )
    }

    // Slug validation (URL-safe)
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
    if (!slugRegex.test(slug)) {
      return NextResponse.json(
        { error: 'Slug must be lowercase, alphanumeric, and hyphen-separated' },
        { status: 400 }
      )
    }

    const supabase = await createServerClient()

    // Check if slug already exists
    const { data: existingVendor } = await supabase
      .from('vendors')
      .select('id')
      .eq('slug', slug)
      .single()

    if (existingVendor) {
      return NextResponse.json(
        { error: 'Vendor slug already exists. Please choose a different one.' },
        { status: 409 }
      )
    }

    // 1. Create user account via Supabase Auth (service role)
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email for now (can be changed for production)
      user_metadata: {
        full_name: fullName,
      },
    })

    if (authError || !authData.user) {
      console.error('Auth error:', authError)
      return NextResponse.json(
        { error: authError?.message || 'Failed to create user account' },
        { status: 500 }
      )
    }

    const userId = authData.user.id

    // 2. Create vendor organization
    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .insert({
        name: vendorName,
        slug,
        email,
        company_type: companyType || 'agency',
        team_size: teamSize || 'solo',
        status: 'onboarding',
        created_by: userId,
        onboarded_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (vendorError || !vendor) {
      console.error('Vendor creation error:', vendorError)
      // Rollback: Delete the user if vendor creation fails
      await supabase.auth.admin.deleteUser(userId)
      return NextResponse.json(
        { error: vendorError?.message || 'Failed to create vendor organization' },
        { status: 500 }
      )
    }

    // 3. Create/update profile for the user
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        email,
        full_name: fullName,
        role: 'owner', // First user is always the owner
        vendor_id: vendor.id,
      })

    if (profileError) {
      console.error('Profile creation error:', profileError)
      // Rollback: Delete vendor and user
      await supabase.from('vendors').delete().eq('id', vendor.id)
      await supabase.auth.admin.deleteUser(userId)
      return NextResponse.json(
        { error: profileError.message || 'Failed to create user profile' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      vendor: {
        id: vendor.id,
        name: vendor.name,
        slug: vendor.slug,
      },
      user: {
        id: userId,
        email,
        full_name: fullName,
      },
      message: 'Vendor account created successfully! You can now sign in.',
    }, { status: 201 })

  } catch (error: any) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
