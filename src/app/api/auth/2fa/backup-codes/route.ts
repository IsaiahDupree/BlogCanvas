/**
 * GET /api/auth/2fa/backup-codes
 * Get backup codes count and status
 *
 * POST /api/auth/2fa/backup-codes
 * Regenerate backup codes
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  BackupCodesService,
  prepareBackupCodesForDB,
} from '@/lib/auth/backup-codes-service'
import { TOTPService, getTOTPEncryptionKey } from '@/lib/auth/totp-service'

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

    // Get backup codes status
    const { data: allCodes, error: codesError } = await supabase
      .from('user_2fa_backup_codes')
      .select('id, used, used_at, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (codesError) {
      console.error('Failed to fetch backup codes:', codesError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch backup codes' },
        { status: 500 }
      )
    }

    const unusedCount = allCodes?.filter((code) => !code.used).length || 0
    const usedCount = allCodes?.filter((code) => code.used).length || 0

    return NextResponse.json({
      success: true,
      data: {
        total: allCodes?.length || 0,
        unused: unusedCount,
        used: usedCount,
        shouldRegenerate: BackupCodesService.shouldRegenerateWarning(unusedCount),
        hasNoCodesLeft: BackupCodesService.hasNoCodesLeft(unusedCount),
        generatedAt: allCodes?.[0]?.created_at || null,
      },
    })
  } catch (error: any) {
    console.error('Backup codes fetch error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch backup codes' },
      { status: 500 }
    )
  }
}

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
      .select('totp_secret, enabled')
      .eq('user_id', user.id)
      .single()

    if (settingsError || !settings || !settings.enabled) {
      return NextResponse.json(
        { success: false, error: '2FA must be enabled to regenerate codes' },
        { status: 400 }
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

    // Delete old backup codes
    const { error: deleteError } = await supabase
      .from('user_2fa_backup_codes')
      .delete()
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('Failed to delete old backup codes:', deleteError)
      return NextResponse.json(
        { success: false, error: 'Failed to regenerate backup codes' },
        { status: 500 }
      )
    }

    // Generate new backup codes
    const backupCodesResult = await BackupCodesService.generateBackupCodes()

    // Store new backup codes in database
    const backupCodeRecords = prepareBackupCodesForDB(
      backupCodesResult.codeHashes
    )

    const { error: insertError } = await supabase
      .from('user_2fa_backup_codes')
      .insert(
        backupCodeRecords.map((record) => ({
          user_id: user.id,
          code_hash: record.code_hash,
          used: false,
          created_at: record.created_at.toISOString(),
        }))
      )

    if (insertError) {
      console.error('Failed to store new backup codes:', insertError)
      return NextResponse.json(
        { success: false, error: 'Failed to regenerate backup codes' },
        { status: 500 }
      )
    }

    // Update 2FA settings with new backup codes info
    await supabase
      .from('user_2fa_settings')
      .update({
        backup_codes_generated_at: new Date().toISOString(),
        backup_codes_count: backupCodesResult.codes.length,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)

    // Log the event
    await supabase.rpc('log_2fa_event', {
      p_user_id: user.id,
      p_event_type: 'backup_codes_regenerated',
      p_ip_address: request.headers.get('x-forwarded-for') || null,
      p_user_agent: request.headers.get('user-agent') || null,
      p_metadata: { count: backupCodesResult.codes.length },
    })

    return NextResponse.json({
      success: true,
      message: 'Backup codes regenerated successfully',
      backupCodes: backupCodesResult.codes,
    })
  } catch (error: any) {
    console.error('Backup codes regeneration error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to regenerate backup codes',
      },
      { status: 500 }
    )
  }
}
