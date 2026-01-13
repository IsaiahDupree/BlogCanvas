/**
 * POST /api/auth/2fa/setup
 * Initialize 2FA setup for a user - generates TOTP secret and QR code
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { TOTPService, getTOTPEncryptionKey } from '@/lib/auth/totp-service'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user profile for email
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { success: false, error: 'User profile not found' },
        { status: 404 }
      )
    }

    // Check if user already has 2FA enabled
    const { data: existing2FA, error: check2FAError } = await supabase
      .from('user_2fa_settings')
      .select('enabled, totp_verified')
      .eq('user_id', user.id)
      .single()

    if (check2FAError && check2FAError.code !== 'PGRST116') {
      // PGRST116 = not found
      return NextResponse.json(
        { success: false, error: 'Failed to check 2FA status' },
        { status: 500 }
      )
    }

    if (existing2FA?.enabled && existing2FA?.totp_verified) {
      return NextResponse.json(
        {
          success: false,
          error: '2FA is already enabled. Disable it first to setup again.',
        },
        { status: 400 }
      )
    }

    // Generate TOTP secret and QR code
    const setupData = await TOTPService.generateSetupData(
      user.id,
      profile.email
    )

    // Encrypt the secret before storing
    const encryptionKey = getTOTPEncryptionKey()
    const encryptedSecret = TOTPService.encryptSecret(
      setupData.secret,
      encryptionKey
    )

    // Store encrypted secret in database (not yet verified/enabled)
    const { error: upsertError } = await supabase
      .from('user_2fa_settings')
      .upsert(
        {
          user_id: user.id,
          totp_secret: encryptedSecret,
          totp_verified: false,
          enabled: false,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id',
        }
      )

    if (upsertError) {
      console.error('Failed to store 2FA settings:', upsertError)
      return NextResponse.json(
        { success: false, error: 'Failed to initialize 2FA setup' },
        { status: 500 }
      )
    }

    // Log the setup initiation
    await supabase.rpc('log_2fa_event', {
      p_user_id: user.id,
      p_event_type: '2fa_setup_initiated',
      p_ip_address: request.headers.get('x-forwarded-for') || null,
      p_user_agent: request.headers.get('user-agent') || null,
      p_metadata: {},
    })

    // Return setup data (excluding raw secret for security)
    return NextResponse.json({
      success: true,
      data: {
        qrCodeDataUrl: setupData.qrCodeDataUrl,
        manualEntryKey: setupData.manualEntryKey,
        issuer: setupData.issuer,
        accountName: setupData.accountName,
      },
    })
  } catch (error: any) {
    console.error('2FA setup error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to setup 2FA' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/auth/2fa/setup
 * Get current 2FA setup status
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get 2FA status
    const { data: settings, error: settingsError } = await supabase
      .from('user_2fa_settings')
      .select('enabled, totp_verified, enforced, enabled_at, last_used_at')
      .eq('user_id', user.id)
      .single()

    if (settingsError && settingsError.code !== 'PGRST116') {
      return NextResponse.json(
        { success: false, error: 'Failed to get 2FA status' },
        { status: 500 }
      )
    }

    // Get backup codes count
    const { count: backupCodesCount, error: codesError } = await supabase
      .from('user_2fa_backup_codes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('used', false)

    if (codesError) {
      console.error('Failed to count backup codes:', codesError)
    }

    return NextResponse.json({
      success: true,
      data: {
        enabled: settings?.enabled || false,
        verified: settings?.totp_verified || false,
        enforced: settings?.enforced || false,
        enabledAt: settings?.enabled_at || null,
        lastUsedAt: settings?.last_used_at || null,
        backupCodesCount: backupCodesCount || 0,
        needsSetup: !settings || !settings.enabled,
      },
    })
  } catch (error: any) {
    console.error('2FA status check error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to check 2FA status' },
      { status: 500 }
    )
  }
}
