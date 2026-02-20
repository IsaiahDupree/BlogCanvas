import { createClient } from '@supabase/supabase-js'
import { encryptToken, decryptToken, generateSecureToken } from '@/lib/encryption'

/**
 * Token Rotation Service
 * feat-038: Secure token storage/rotation
 *
 * Manages automatic rotation of API tokens and refresh tokens
 * to minimize the impact of token compromise.
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export interface TokenRecord {
  id: string
  user_id: string
  token_type: 'api_key' | 'refresh_token' | 'access_token' | 'oauth_token'
  encrypted_token: string
  expires_at?: string
  last_rotated_at: string
  rotation_count: number
  is_active: boolean
}

/**
 * Stores a token securely with encryption
 */
export async function storeToken(
  userId: string,
  tokenType: TokenRecord['token_type'],
  token: string,
  expiresAt?: Date
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const encryptedToken = encryptToken(token)

    const { data, error } = await supabase
      .from('secure_tokens')
      .insert({
        user_id: userId,
        token_type: tokenType,
        encrypted_token: encryptedToken,
        expires_at: expiresAt?.toISOString(),
        last_rotated_at: new Date().toISOString(),
        rotation_count: 0,
        is_active: true,
      })
      .select()
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, id: data.id }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to store token',
    }
  }
}

/**
 * Retrieves and decrypts a token
 */
export async function getToken(
  userId: string,
  tokenType: TokenRecord['token_type']
): Promise<{ success: boolean; token?: string; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('secure_tokens')
      .select('*')
      .eq('user_id', userId)
      .eq('token_type', tokenType)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    if (!data) {
      return { success: false, error: 'Token not found' }
    }

    // Check expiration
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      await revokeToken(data.id)
      return { success: false, error: 'Token expired' }
    }

    const decryptedToken = decryptToken(data.encrypted_token)

    return { success: true, token: decryptedToken }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to retrieve token',
    }
  }
}

/**
 * Rotates a token - generates a new token and invalidates the old one
 */
export async function rotateToken(
  userId: string,
  tokenType: TokenRecord['token_type'],
  expiresAt?: Date
): Promise<{ success: boolean; newToken?: string; error?: string }> {
  try {
    // Get the current token record
    const { data: oldTokenRecord, error: fetchError } = await supabase
      .from('secure_tokens')
      .select('*')
      .eq('user_id', userId)
      .eq('token_type', tokenType)
      .eq('is_active', true)
      .single()

    if (fetchError) {
      return { success: false, error: fetchError.message }
    }

    // Generate new token
    const newToken = generateSecureToken(32)
    const encryptedToken = encryptToken(newToken)

    // Update the old record to inactive
    await supabase
      .from('secure_tokens')
      .update({ is_active: false })
      .eq('id', oldTokenRecord.id)

    // Insert new token record
    const { error: insertError } = await supabase
      .from('secure_tokens')
      .insert({
        user_id: userId,
        token_type: tokenType,
        encrypted_token: encryptedToken,
        expires_at: expiresAt?.toISOString(),
        last_rotated_at: new Date().toISOString(),
        rotation_count: (oldTokenRecord.rotation_count || 0) + 1,
        is_active: true,
      })

    if (insertError) {
      return { success: false, error: insertError.message }
    }

    return { success: true, newToken }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to rotate token',
    }
  }
}

/**
 * Revokes a token by marking it as inactive
 */
export async function revokeToken(
  tokenId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('secure_tokens')
      .update({ is_active: false })
      .eq('id', tokenId)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to revoke token',
    }
  }
}

/**
 * Revokes all tokens for a user
 */
export async function revokeAllUserTokens(
  userId: string
): Promise<{ success: boolean; count?: number; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('secure_tokens')
      .update({ is_active: false })
      .eq('user_id', userId)
      .eq('is_active', true)
      .select()

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, count: data?.length || 0 }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to revoke tokens',
    }
  }
}

/**
 * Auto-rotates tokens that are older than the specified days
 */
export async function autoRotateExpiredTokens(
  daysOld: number = 90
): Promise<{ success: boolean; rotatedCount?: number; error?: string }> {
  try {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysOld)

    const { data: oldTokens, error: fetchError } = await supabase
      .from('secure_tokens')
      .select('*')
      .eq('is_active', true)
      .lt('last_rotated_at', cutoffDate.toISOString())

    if (fetchError) {
      return { success: false, error: fetchError.message }
    }

    if (!oldTokens || oldTokens.length === 0) {
      return { success: true, rotatedCount: 0 }
    }

    let rotatedCount = 0

    for (const token of oldTokens) {
      const result = await rotateToken(
        token.user_id,
        token.token_type,
        token.expires_at ? new Date(token.expires_at) : undefined
      )

      if (result.success) {
        rotatedCount++
      }
    }

    return { success: true, rotatedCount }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to auto-rotate tokens',
    }
  }
}
