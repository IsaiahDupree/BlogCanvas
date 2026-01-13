/**
 * POST /api/auth/2fa/recovery
 * Use a backup code to verify identity when TOTP is unavailable
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { BackupCodesService } from '@/lib/auth/backup-codes-service'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { backupCode, purpose = 'login' } = await request.json()

    if (!backupCode) {
      return NextResponse.json(
        { success: false, error: 'Backup code is required' },
        { status: 400 }
      )
    }

    // Validate format
    if (!BackupCodesService.isValidFormat(backupCode)) {
      return NextResponse.json(
        { success: false, error: 'Invalid backup code format' },
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
      .select('enabled')
      .eq('user_id', user.id)
      .single()

    if (settingsError || !settings || !settings.enabled) {
      return NextResponse.json(
        { success: false, error: '2FA is not enabled' },
        { status: 400 }
      )
    }

    // Get all unused backup codes for this user
    const { data: backupCodes, error: codesError } = await supabase
      .from('user_2fa_backup_codes')
      .select('id, code_hash')
      .eq('user_id', user.id)
      .eq('used', false)

    if (codesError) {
      console.error('Failed to fetch backup codes:', codesError)
      return NextResponse.json(
        { success: false, error: 'Failed to verify backup code' },
        { status: 500 }
      )
    }

    if (!backupCodes || backupCodes.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'No unused backup codes available. Contact support for help.',
        },
        { status: 400 }
      )
    }

    // Verify the backup code against stored hashes
    const storedHashes = backupCodes.map((code) => code.code_hash)
    const matchedHash = await BackupCodesService.verifyBackupCode(
      backupCode,
      storedHashes
    )

    if (!matchedHash) {
      // Log failed attempt
      await supabase.rpc('log_2fa_event', {
        p_user_id: user.id,
        p_event_type: 'backup_code_failed',
        p_ip_address: request.headers.get('x-forwarded-for') || null,
        p_user_agent: request.headers.get('user-agent') || null,
        p_metadata: { purpose },
      })

      return NextResponse.json(
        { success: false, error: 'Invalid backup code' },
        { status: 400 }
      )
    }

    // Find the code record that matched
    const matchedCode = backupCodes.find((code) => code.code_hash === matchedHash)

    if (!matchedCode) {
      return NextResponse.json(
        { success: false, error: 'Failed to verify backup code' },
        { status: 500 }
      )
    }

    // Mark the code as used
    const { error: updateError } = await supabase
      .from('user_2fa_backup_codes')
      .update({
        used: true,
        used_at: new Date().toISOString(),
      })
      .eq('id', matchedCode.id)

    if (updateError) {
      console.error('Failed to mark backup code as used:', updateError)
      return NextResponse.json(
        { success: false, error: 'Failed to verify backup code' },
        { status: 500 }
      )
    }

    // Update last used timestamp
    await supabase
      .from('user_2fa_settings')
      .update({
        last_used_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)

    // Count remaining backup codes
    const remainingCodes = backupCodes.length - 1

    // Log successful use
    await supabase.rpc('log_2fa_event', {
      p_user_id: user.id,
      p_event_type: 'backup_code_used',
      p_ip_address: request.headers.get('x-forwarded-for') || null,
      p_user_agent: request.headers.get('user-agent') || null,
      p_metadata: {
        purpose,
        remaining_codes: remainingCodes,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Backup code verified successfully',
      remainingCodes,
      shouldRegenerate:
        BackupCodesService.shouldRegenerateWarning(remainingCodes),
    })
  } catch (error: any) {
    console.error('Backup code recovery error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to verify backup code',
      },
      { status: 500 }
    )
  }
}
