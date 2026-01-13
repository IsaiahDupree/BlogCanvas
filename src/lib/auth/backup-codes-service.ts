/**
 * Backup Codes Service
 * Handles generation, storage, and verification of 2FA backup codes
 */

import crypto from 'crypto'
import bcrypt from 'bcryptjs'

export interface BackupCode {
  code: string // Plain text code (only shown once during generation)
  codeHash: string // Hashed code for storage
}

export interface BackupCodesResult {
  codes: string[] // Array of plain text codes
  codeHashes: string[] // Array of hashed codes for storage
  generatedAt: Date
}

export class BackupCodesService {
  private static readonly CODE_LENGTH = 8 // 8 characters per code
  private static readonly CODE_COUNT = 10 // Generate 10 backup codes
  private static readonly BCRYPT_ROUNDS = 10 // bcrypt cost factor

  /**
   * Generate a set of backup codes for a user
   * Returns both plain text codes (to show user) and hashed codes (to store)
   */
  static async generateBackupCodes(): Promise<BackupCodesResult> {
    const codes: string[] = []
    const codeHashes: string[] = []

    for (let i = 0; i < this.CODE_COUNT; i++) {
      // Generate a secure random backup code
      const code = this.generateSingleCode()
      codes.push(code)

      // Hash the code for secure storage
      const hash = await bcrypt.hash(code, this.BCRYPT_ROUNDS)
      codeHashes.push(hash)
    }

    return {
      codes,
      codeHashes,
      generatedAt: new Date(),
    }
  }

  /**
   * Generate a single backup code
   * Format: XXXX-XXXX (8 alphanumeric characters with a dash for readability)
   */
  private static generateSingleCode(): string {
    // Use alphanumeric characters (uppercase) excluding similar-looking ones
    // Excludes: 0, O, I, 1, l to avoid confusion
    const charset = '234567 89ABCDEFGHJKLMNPQRSTUVWXYZ'
    let code = ''

    // Generate 8 random characters
    for (let i = 0; i < this.CODE_LENGTH; i++) {
      const randomIndex = crypto.randomInt(0, charset.length)
      code += charset[randomIndex]
    }

    // Format as XXXX-XXXX for readability
    return `${code.substring(0, 4)}-${code.substring(4, 8)}`
  }

  /**
   * Verify a backup code against stored hashes
   * Returns the hash that matched, or null if no match
   */
  static async verifyBackupCode(
    code: string,
    storedHashes: string[]
  ): Promise<string | null> {
    // Remove any spaces or dashes from input
    const cleanCode = code.replace(/[\s-]/g, '')

    // Try to match against each stored hash
    for (const hash of storedHashes) {
      const isMatch = await bcrypt.compare(cleanCode, hash)
      if (isMatch) {
        return hash
      }

      // Also try with the dash format
      const formattedCode = `${cleanCode.substring(0, 4)}-${cleanCode.substring(4, 8)}`
      const isFormattedMatch = await bcrypt.compare(formattedCode, hash)
      if (isFormattedMatch) {
        return hash
      }
    }

    return null
  }

  /**
   * Format codes for display (grouped for better readability)
   */
  static formatCodesForDisplay(codes: string[]): string {
    return codes
      .map((code, index) => `${(index + 1).toString().padStart(2, '0')}. ${code}`)
      .join('\n')
  }

  /**
   * Format codes for CSV export
   */
  static formatCodesForCSV(codes: string[]): string {
    const header = 'Number,Backup Code,Generated,Status\n'
    const timestamp = new Date().toISOString()
    const rows = codes
      .map((code, index) => `${index + 1},${code},${timestamp},Unused`)
      .join('\n')

    return header + rows
  }

  /**
   * Validate backup code format
   */
  static isValidFormat(code: string): boolean {
    // Remove spaces and dashes
    const clean = code.replace(/[\s-]/g, '')

    // Should be 8 alphanumeric characters
    return /^[2-9A-HJ-NP-Z]{8}$/i.test(clean)
  }

  /**
   * Generate a secure random token for backup code recovery
   * This can be used for account recovery if all backup codes are lost
   */
  static generateRecoveryToken(): string {
    return crypto.randomBytes(32).toString('hex')
  }

  /**
   * Hash a recovery token for storage
   */
  static async hashRecoveryToken(token: string): Promise<string> {
    return bcrypt.hash(token, this.BCRYPT_ROUNDS)
  }

  /**
   * Verify a recovery token
   */
  static async verifyRecoveryToken(
    token: string,
    hash: string
  ): Promise<boolean> {
    return bcrypt.compare(token, hash)
  }

  /**
   * Count unused backup codes for a user
   */
  static countUnusedCodes(allHashes: string[], usedHashes: string[]): number {
    return allHashes.filter((hash) => !usedHashes.includes(hash)).length
  }

  /**
   * Check if user needs to regenerate codes (running low)
   */
  static shouldRegenerateWarning(unusedCount: number): boolean {
    // Warn when 3 or fewer codes remain
    return unusedCount <= 3 && unusedCount > 0
  }

  /**
   * Check if user has no codes left
   */
  static hasNoCodesLeft(unusedCount: number): boolean {
    return unusedCount === 0
  }
}

/**
 * Helper to store backup codes in database
 * Returns formatted data ready for insertion
 */
export interface BackupCodeDBRecord {
  code_hash: string
  used: boolean
  created_at: Date
}

export function prepareBackupCodesForDB(
  codeHashes: string[]
): BackupCodeDBRecord[] {
  return codeHashes.map((hash) => ({
    code_hash: hash,
    used: false,
    created_at: new Date(),
  }))
}
