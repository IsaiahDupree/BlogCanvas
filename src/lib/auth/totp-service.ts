/**
 * TOTP (Time-based One-Time Password) Service
 * Handles 2FA token generation, verification, and QR code creation
 */

import * as OTPAuth from 'otpauth'
import QRCode from 'qrcode'
import crypto from 'crypto'

export interface TOTPSetupData {
  secret: string
  qrCodeDataUrl: string
  manualEntryKey: string
  issuer: string
  accountName: string
}

export interface TOTPVerifyResult {
  valid: boolean
  delta?: number // How many time steps off the token was
}

export class TOTPService {
  private static readonly ISSUER = 'BlogCanvas'
  private static readonly ALGORITHM = 'SHA1'
  private static readonly DIGITS = 6
  private static readonly PERIOD = 30 // seconds
  private static readonly WINDOW = 1 // Allow 1 time step before/after for clock skew

  /**
   * Generate a new TOTP secret for a user
   */
  static generateSecret(): string {
    // Generate a random 20-byte secret (160 bits)
    const buffer = crypto.randomBytes(20)
    // Encode as base32 for TOTP compatibility
    return this.base32Encode(buffer)
  }

  /**
   * Generate setup data for 2FA enrollment including QR code
   */
  static async generateSetupData(
    userId: string,
    email: string,
    secret?: string
  ): Promise<TOTPSetupData> {
    // Use provided secret or generate new one
    const totpSecret = secret || this.generateSecret()

    // Create TOTP instance
    const totp = new OTPAuth.TOTP({
      issuer: this.ISSUER,
      label: email,
      algorithm: this.ALGORITHM,
      digits: this.DIGITS,
      period: this.PERIOD,
      secret: totpSecret,
    })

    // Generate otpauth:// URI
    const otpauthUrl = totp.toString()

    // Generate QR code as data URL
    const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 300,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    })

    return {
      secret: totpSecret,
      qrCodeDataUrl,
      manualEntryKey: this.formatSecretForManualEntry(totpSecret),
      issuer: this.ISSUER,
      accountName: email,
    }
  }

  /**
   * Verify a TOTP token against a secret
   */
  static verifyToken(secret: string, token: string): TOTPVerifyResult {
    try {
      // Remove any spaces or formatting from token
      const cleanToken = token.replace(/\s/g, '')

      // Create TOTP instance
      const totp = new OTPAuth.TOTP({
        issuer: this.ISSUER,
        algorithm: this.ALGORITHM,
        digits: this.DIGITS,
        period: this.PERIOD,
        secret: secret,
      })

      // Verify with window for clock skew
      const delta = totp.validate({
        token: cleanToken,
        window: this.WINDOW,
      })

      // delta is null if invalid, or the time step difference if valid
      if (delta !== null) {
        return { valid: true, delta }
      }

      return { valid: false }
    } catch (error) {
      console.error('TOTP verification error:', error)
      return { valid: false }
    }
  }

  /**
   * Generate the current TOTP token (for testing)
   */
  static generateToken(secret: string): string {
    const totp = new OTPAuth.TOTP({
      issuer: this.ISSUER,
      algorithm: this.ALGORITHM,
      digits: this.DIGITS,
      period: this.PERIOD,
      secret: secret,
    })

    return totp.generate()
  }

  /**
   * Format secret for manual entry (groups of 4 characters)
   */
  private static formatSecretForManualEntry(secret: string): string {
    // Remove any existing spaces and convert to uppercase
    const clean = secret.replace(/\s/g, '').toUpperCase()
    // Insert space every 4 characters
    return clean.match(/.{1,4}/g)?.join(' ') || clean
  }

  /**
   * Base32 encoding for TOTP secrets
   */
  private static base32Encode(buffer: Buffer): string {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
    let bits = 0
    let value = 0
    let output = ''

    for (let i = 0; i < buffer.length; i++) {
      value = (value << 8) | buffer[i]
      bits += 8

      while (bits >= 5) {
        output += alphabet[(value >>> (bits - 5)) & 31]
        bits -= 5
      }
    }

    if (bits > 0) {
      output += alphabet[(value << (5 - bits)) & 31]
    }

    return output
  }

  /**
   * Encrypt TOTP secret for database storage
   * Uses AES-256-GCM encryption
   */
  static encryptSecret(secret: string, key: string): string {
    const algorithm = 'aes-256-gcm'
    const iv = crypto.randomBytes(16)
    const cipher = crypto.createCipheriv(algorithm, Buffer.from(key, 'hex'), iv)

    let encrypted = cipher.update(secret, 'utf8', 'hex')
    encrypted += cipher.final('hex')

    const authTag = cipher.getAuthTag()

    // Return format: iv:authTag:encrypted
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`
  }

  /**
   * Decrypt TOTP secret from database storage
   */
  static decryptSecret(encryptedData: string, key: string): string {
    const algorithm = 'aes-256-gcm'
    const parts = encryptedData.split(':')

    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format')
    }

    const [ivHex, authTagHex, encrypted] = parts
    const iv = Buffer.from(ivHex, 'hex')
    const authTag = Buffer.from(authTagHex, 'hex')

    const decipher = crypto.createDecipheriv(
      algorithm,
      Buffer.from(key, 'hex'),
      iv
    )
    decipher.setAuthTag(authTag)

    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')

    return decrypted
  }

  /**
   * Generate a 32-byte (256-bit) encryption key
   * Store this securely in environment variables
   */
  static generateEncryptionKey(): string {
    return crypto.randomBytes(32).toString('hex')
  }
}

/**
 * Get or generate the encryption key for TOTP secrets
 */
export function getTOTPEncryptionKey(): string {
  const key = process.env.TOTP_ENCRYPTION_KEY

  if (!key) {
    throw new Error(
      'TOTP_ENCRYPTION_KEY environment variable is not set. ' +
        'Generate one with: TOTPService.generateEncryptionKey()'
    )
  }

  if (key.length !== 64) {
    // 32 bytes = 64 hex characters
    throw new Error(
      'TOTP_ENCRYPTION_KEY must be 64 hex characters (32 bytes). ' +
        'Generate a new key with: TOTPService.generateEncryptionKey()'
    )
  }

  return key
}
