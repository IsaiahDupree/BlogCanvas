/**
 * POST /api/auth/2fa/verify
 * Verify TOTP token and complete 2FA setup OR verify during login
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { TOTPService, getTOTPEncryptionKey } from '@/lib/auth/totp-service'
import {
  BackupCodesService,
  prepareBackupCodesForDB,
} from '@/lib/auth/backup-codes-service'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { token, purpose = 'setup' } = await request.json()

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Token is required' },
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
      .select('totp_secret, enabled, totp_verified')
      .eq('user_id', user.id)
      .single()

    if (settingsError || !settings || !settings.totp_secret) {
      return NextResponse.json(
        {
          success: false,
          error: '2FA not initialized. Please setup 2FA first.',
        },
        { status: 400 }
      )
    }

    // Decrypt the TOTP secret
    const encryptionKey = getTOTPEncryptionKey()
    let decryptedSecret: string
    try {
      decryptedSecret = TOTPService.decryptSecret(
        settings.totp_secret,
        encryptionKey
      )
    } catch (error) {
      console.error('Failed to decrypt TOTP secret:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to verify token' },
        { status: 500 }
      )
    }

    // Verify the token
    const verifyResult = TOTPService.verifyToken(decryptedSecret, token)

    if (!verifyResult.valid) {
      // Log failed verification
      await supabase.rpc('log_2fa_event', {
        p_user_id: user.id,
        p_event_type: '2fa_verified_failed',
        p_ip_address: request.headers.get('x-forwarded-for') || null,
        p_user_agent: request.headers.get('user-agent') || null,
        p_metadata: { purpose },
      })

      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 400 }
      )
    }

    // Token is valid!

    if (purpose === 'setup') {
      // Complete 2FA setup
      if (settings.enabled && settings.totp_verified) {
        return NextResponse.json(
          { success: false, error: '2FA is already enabled' },
          { status: 400 }
        )
      }

      // Generate backup codes
      const backupCodesResult = await BackupCodesService.generateBackupCodes()

      // Store backup codes in database
      const backupCodeRecords = prepareBackupCodesForDB(
        backupCodesResult.codeHashes
      )

      const { error: codesInsertError } = await supabase
        .from('user_2fa_backup_codes')
        .insert(
          backupCodeRecords.map((record) => ({
            user_id: user.id,
            code_hash: record.code_hash,
            used: false,
            created_at: record.created_at.toISOString(),
          }))
        )

      if (codesInsertError) {
        console.error('Failed to store backup codes:', codesInsertError)
        return NextResponse.json(
          { success: false, error: 'Failed to generate backup codes' },
          { status: 500 }
        )
      }

      // Enable 2FA
      const { error: updateError } = await supabase
        .from('user_2fa_settings')
        .update({
          enabled: true,
          totp_verified: true,
          enabled_at: new Date().toISOString(),
          last_used_at: new Date().toISOString(),
          backup_codes_generated_at: new Date().toISOString(),
          backup_codes_count: backupCodesResult.codes.length,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)

      if (updateError) {
        console.error('Failed to enable 2FA:', updateError)
        return NextResponse.json(
          { success: false, error: 'Failed to enable 2FA' },
          { status: 500 }
        )
      }

      // Log successful setup
      await supabase.rpc('log_2fa_event', {
        p_user_id: user.id,
        p_event_type: '2fa_enabled',
        p_ip_address: request.headers.get('x-forwarded-for') || null,
        p_user_agent: request.headers.get('user-agent') || null,
        p_metadata: { backup_codes_count: backupCodesResult.codes.length },
      })

      return NextResponse.json({
        success: true,
        message: '2FA enabled successfully',
        backupCodes: backupCodesResult.codes,
      })
    } else if (purpose === 'login') {
      // Verify during login
      // Update last used timestamp
      await supabase
        .from('user_2fa_settings')
        .update({
          last_used_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)

      // Log successful verification
      await supabase.rpc('log_2fa_event', {
        p_user_id: user.id,
        p_event_type: '2fa_verified_success',
        p_ip_address: request.headers.get('x-forwarded-for') || null,
        p_user_agent: request.headers.get('user-agent') || null,
        p_metadata: { purpose: 'login' },
      })

      return NextResponse.json({
        success: true,
        message: '2FA verified successfully',
      })
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid purpose' },
        { status: 400 }
      )
    }
  } catch (error: any) {
    console.error('2FA verification error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to verify token' },
      { status: 500 }
    )
  }
}
