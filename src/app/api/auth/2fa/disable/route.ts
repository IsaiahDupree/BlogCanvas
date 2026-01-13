/**
 * POST /api/auth/2fa/disable
 * Disable 2FA for the authenticated user
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { TOTPService, getTOTPEncryptionKey } from '@/lib/auth/totp-service'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { token, password } = await request.json()

    if (!token && !password) {
      return NextResponse.json(
        {
          success: false,
          error: 'Either TOTP token or password is required',
        },
        { status: 400 }
      )
    }

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

    // Get user's 2FA settings
    const { data: settings, error: settingsError } = await supabase
      .from('user_2fa_settings')
      .select('totp_secret, enabled, enforced')
      .eq('user_id', user.id)
      .single()

    if (settingsError || !settings) {
      return NextResponse.json(
        { success: false, error: '2FA settings not found' },
        { status: 404 }
      )
    }

    if (!settings.enabled) {
      return NextResponse.json(
        { success: false, error: '2FA is not enabled' },
        { status: 400 }
      )
    }

    // Check if 2FA is enforced (admin users)
    if (settings.enforced) {
      return NextResponse.json(
        {
          success: false,
          error:
            '2FA is enforced for your role and cannot be disabled. Contact support if you need help.',
        },
        { status: 403 }
      )
    }

    // Verify identity with TOTP token or password
    let verified = false

    if (token && settings.totp_secret) {
      // Verify TOTP token
      const encryptionKey = getTOTPEncryptionKey()
      try {
        const decryptedSecret = TOTPService.decryptSecret(
          settings.totp_secret,
          encryptionKey
        )
        const verifyResult = TOTPService.verifyToken(decryptedSecret, token)
        verified = verifyResult.valid
      } catch (error) {
        console.error('Failed to verify TOTP:', error)
      }
    } else if (password) {
      // Verify password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email!,
        password,
      })
      verified = !signInError
    }

    if (!verified) {
      return NextResponse.json(
        { success: false, error: 'Invalid token or password' },
        { status: 401 }
      )
    }

    // Disable 2FA
    const { error: updateError } = await supabase
      .from('user_2fa_settings')
      .update({
        enabled: false,
        totp_verified: false,
        totp_secret: null,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)

    if (updateError) {
      console.error('Failed to disable 2FA:', updateError)
      return NextResponse.json(
        { success: false, error: 'Failed to disable 2FA' },
        { status: 500 }
      )
    }

    // Delete all backup codes
    await supabase
      .from('user_2fa_backup_codes')
      .delete()
      .eq('user_id', user.id)

    // Log the event
    await supabase.rpc('log_2fa_event', {
      p_user_id: user.id,
      p_event_type: '2fa_disabled',
      p_ip_address: request.headers.get('x-forwarded-for') || null,
      p_user_agent: request.headers.get('user-agent') || null,
      p_metadata: {},
    })

    return NextResponse.json({
      success: true,
      message: '2FA disabled successfully',
    })
  } catch (error: any) {
    console.error('2FA disable error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to disable 2FA' },
      { status: 500 }
    )
  }
}
