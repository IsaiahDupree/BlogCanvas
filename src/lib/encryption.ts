import crypto from 'crypto'

/**
 * Encryption Service for PII and Sensitive Data
 * feat-038: Secure token storage/rotation
 * feat-042: Encrypt PII at rest
 *
 * Uses AES-256-GCM for authenticated encryption.
 * Ensures all PII (emails, phone numbers, addresses) and tokens are encrypted at rest.
 */

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY
const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16
const SALT_LENGTH = 64
const TAG_LENGTH = 16
const KEY_LENGTH = 32

/**
 * Validates that encryption key is properly configured
 */
export function validateEncryptionKey(): void {
  if (!ENCRYPTION_KEY) {
    throw new Error(
      'ENCRYPTION_KEY environment variable is required. Generate with: openssl rand -hex 32'
    )
  }

  if (ENCRYPTION_KEY.length < 64) {
    throw new Error('ENCRYPTION_KEY must be at least 64 characters (32 bytes hex)')
  }
}

/**
 * Derives a 256-bit key from the master key using PBKDF2
 */
function deriveKey(salt: Buffer): Buffer {
  if (!ENCRYPTION_KEY) {
    throw new Error('ENCRYPTION_KEY not configured')
  }

  return crypto.pbkdf2Sync(ENCRYPTION_KEY, salt, 100000, KEY_LENGTH, 'sha256')
}

/**
 * Encrypts a string value using AES-256-GCM
 *
 * @param plaintext - The text to encrypt
 * @returns Base64-encoded encrypted value with format: salt:iv:tag:ciphertext
 */
export function encrypt(plaintext: string): string {
  validateEncryptionKey()

  // Generate random salt and IV
  const salt = crypto.randomBytes(SALT_LENGTH)
  const iv = crypto.randomBytes(IV_LENGTH)

  // Derive key from master key and salt
  const key = deriveKey(salt)

  // Create cipher
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)

  // Encrypt the plaintext
  let encrypted = cipher.update(plaintext, 'utf8', 'hex')
  encrypted += cipher.final('hex')

  // Get authentication tag
  const tag = cipher.getAuthTag()

  // Combine salt, iv, tag, and encrypted data
  const result = Buffer.concat([salt, iv, tag, Buffer.from(encrypted, 'hex')])

  // Return as base64 for storage
  return result.toString('base64')
}

/**
 * Decrypts a value encrypted with encrypt()
 *
 * @param encryptedData - Base64-encoded encrypted value
 * @returns Decrypted plaintext
 */
export function decrypt(encryptedData: string): string {
  validateEncryptionKey()

  // Decode from base64
  const buffer = Buffer.from(encryptedData, 'base64')

  // Extract components
  const salt = buffer.subarray(0, SALT_LENGTH)
  const iv = buffer.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH)
  const tag = buffer.subarray(
    SALT_LENGTH + IV_LENGTH,
    SALT_LENGTH + IV_LENGTH + TAG_LENGTH
  )
  const encrypted = buffer.subarray(SALT_LENGTH + IV_LENGTH + TAG_LENGTH)

  // Derive the same key
  const key = deriveKey(salt)

  // Create decipher
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(tag)

  // Decrypt
  let decrypted = decipher.update(encrypted.toString('hex'), 'hex', 'utf8')
  decrypted += decipher.final('utf8')

  return decrypted
}

/**
 * Encrypts PII data (email, phone, address)
 */
export function encryptPII(data: string): string {
  return encrypt(data)
}

/**
 * Decrypts PII data
 */
export function decryptPII(encryptedData: string): string {
  return decrypt(encryptedData)
}

/**
 * Encrypts API tokens and refresh tokens
 */
export function encryptToken(token: string): string {
  return encrypt(token)
}

/**
 * Decrypts API tokens and refresh tokens
 */
export function decryptToken(encryptedToken: string): string {
  return decrypt(encryptedToken)
}

/**
 * Hashes a value using SHA-256 (one-way, for comparison)
 * Use this for values that don't need to be decrypted
 */
export function hash(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex')
}

/**
 * Securely compares two strings in constant time
 * Use this to prevent timing attacks when comparing hashes or tokens
 */
export function secureCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false
  }

  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b))
}

/**
 * Generates a cryptographically secure random token
 */
export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex')
}

/**
 * Masks sensitive data for logging
 * Shows first and last 4 characters, masks the middle
 */
export function maskSensitiveData(data: string): string {
  if (data.length <= 8) {
    return '****'
  }

  const start = data.substring(0, 4)
  const end = data.substring(data.length - 4)
  const middle = '*'.repeat(Math.min(data.length - 8, 20))

  return `${start}${middle}${end}`
}
