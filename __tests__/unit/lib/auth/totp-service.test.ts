/**
 * Unit tests for TOTP Service
 * Tests token generation, verification, encryption, and QR code generation
 */

import { TOTPService, getTOTPEncryptionKey } from '@/lib/auth/totp-service';
import crypto from 'crypto';

describe('TOTPService', () => {
    describe('generateSecret', () => {
        it('should generate a valid base32 secret', () => {
            const secret = TOTPService.generateSecret();

            expect(secret).toBeDefined();
            expect(typeof secret).toBe('string');
            expect(secret.length).toBeGreaterThan(0);
            // Base32 alphabet check
            expect(secret).toMatch(/^[A-Z2-7]+$/);
        });

        it('should generate unique secrets', () => {
            const secret1 = TOTPService.generateSecret();
            const secret2 = TOTPService.generateSecret();
            const secret3 = TOTPService.generateSecret();

            expect(secret1).not.toBe(secret2);
            expect(secret1).not.toBe(secret3);
            expect(secret2).not.toBe(secret3);
        });
    });

    describe('generateSetupData', () => {
        it('should generate complete setup data', async () => {
            const userId = 'test-user-123';
            const email = 'test@example.com';

            const setupData = await TOTPService.generateSetupData(userId, email);

            expect(setupData.secret).toBeDefined();
            expect(setupData.qrCodeDataUrl).toContain('data:image/png;base64');
            expect(setupData.manualEntryKey).toContain(' '); // Should have spaces
            expect(setupData.issuer).toBe('BlogCanvas');
            expect(setupData.accountName).toBe(email);
        });

        it('should use provided secret if given', async () => {
            const userId = 'test-user-123';
            const email = 'test@example.com';
            const providedSecret = 'JBSWY3DPEHPK3PXP';

            const setupData = await TOTPService.generateSetupData(
                userId,
                email,
                providedSecret
            );

            expect(setupData.secret).toBe(providedSecret);
        });

        it('should format manual entry key with spaces', async () => {
            const userId = 'test-user-123';
            const email = 'test@example.com';

            const setupData = await TOTPService.generateSetupData(userId, email);

            // Manual entry key should have spaces every 4 characters
            const parts = setupData.manualEntryKey.split(' ');
            parts.forEach((part, index) => {
                // Last part might be shorter
                if (index < parts.length - 1) {
                    expect(part.length).toBeLessThanOrEqual(4);
                }
            });
        });
    });

    describe('generateToken and verifyToken', () => {
        it('should verify a valid token', () => {
            const secret = TOTPService.generateSecret();
            const token = TOTPService.generateToken(secret);

            const result = TOTPService.verifyToken(secret, token);

            expect(result.valid).toBe(true);
            expect(result.delta).toBeDefined();
        });

        it('should reject an invalid token', () => {
            const secret = TOTPService.generateSecret();
            const invalidToken = '000000';

            const result = TOTPService.verifyToken(secret, invalidToken);

            expect(result.valid).toBe(false);
            expect(result.delta).toBeUndefined();
        });

        it('should handle tokens with spaces', () => {
            const secret = TOTPService.generateSecret();
            const token = TOTPService.generateToken(secret);
            const tokenWithSpaces = `${token.substring(0, 3)} ${token.substring(3)}`;

            const result = TOTPService.verifyToken(secret, tokenWithSpaces);

            expect(result.valid).toBe(true);
        });

        it('should reject tokens for wrong secret', () => {
            const secret1 = TOTPService.generateSecret();
            const secret2 = TOTPService.generateSecret();
            const token = TOTPService.generateToken(secret1);

            const result = TOTPService.verifyToken(secret2, token);

            expect(result.valid).toBe(false);
        });

        it('should generate 6-digit tokens', () => {
            const secret = TOTPService.generateSecret();
            const token = TOTPService.generateToken(secret);

            expect(token).toMatch(/^\d{6}$/);
        });
    });

    describe('encryptSecret and decryptSecret', () => {
        const testKey = crypto.randomBytes(32).toString('hex');

        it('should encrypt and decrypt a secret', () => {
            const secret = 'JBSWY3DPEHPK3PXP';

            const encrypted = TOTPService.encryptSecret(secret, testKey);
            const decrypted = TOTPService.decryptSecret(encrypted, testKey);

            expect(decrypted).toBe(secret);
        });

        it('should produce different ciphertexts for same plaintext', () => {
            const secret = 'JBSWY3DPEHPK3PXP';

            const encrypted1 = TOTPService.encryptSecret(secret, testKey);
            const encrypted2 = TOTPService.encryptSecret(secret, testKey);

            // Should be different due to random IV
            expect(encrypted1).not.toBe(encrypted2);

            // But both should decrypt to the same value
            expect(TOTPService.decryptSecret(encrypted1, testKey)).toBe(secret);
            expect(TOTPService.decryptSecret(encrypted2, testKey)).toBe(secret);
        });

        it('should fail to decrypt with wrong key', () => {
            const secret = 'JBSWY3DPEHPK3PXP';
            const wrongKey = crypto.randomBytes(32).toString('hex');

            const encrypted = TOTPService.encryptSecret(secret, testKey);

            expect(() => {
                TOTPService.decryptSecret(encrypted, wrongKey);
            }).toThrow();
        });

        it('should fail to decrypt invalid format', () => {
            expect(() => {
                TOTPService.decryptSecret('invalid:format', testKey);
            }).toThrow('Invalid encrypted data format');
        });

        it('should use proper encryption format (iv:authTag:encrypted)', () => {
            const secret = 'JBSWY3DPEHPK3PXP';
            const encrypted = TOTPService.encryptSecret(secret, testKey);

            const parts = encrypted.split(':');
            expect(parts.length).toBe(3);

            // IV should be 16 bytes = 32 hex chars
            expect(parts[0].length).toBe(32);
            // Auth tag should be 16 bytes = 32 hex chars
            expect(parts[1].length).toBe(32);
            // Encrypted data length varies
            expect(parts[2].length).toBeGreaterThan(0);
        });
    });

    describe('generateEncryptionKey', () => {
        it('should generate a valid encryption key', () => {
            const key = TOTPService.generateEncryptionKey();

            expect(key).toBeDefined();
            expect(typeof key).toBe('string');
            // Should be 64 hex characters (32 bytes)
            expect(key.length).toBe(64);
            expect(key).toMatch(/^[0-9a-f]+$/);
        });

        it('should generate unique keys', () => {
            const key1 = TOTPService.generateEncryptionKey();
            const key2 = TOTPService.generateEncryptionKey();

            expect(key1).not.toBe(key2);
        });
    });

    describe('getTOTPEncryptionKey', () => {
        const originalKey = process.env.TOTP_ENCRYPTION_KEY;

        afterEach(() => {
            // Restore original key
            if (originalKey) {
                process.env.TOTP_ENCRYPTION_KEY = originalKey;
            } else {
                delete process.env.TOTP_ENCRYPTION_KEY;
            }
        });

        it('should throw if key is not set', () => {
            delete process.env.TOTP_ENCRYPTION_KEY;

            expect(() => {
                getTOTPEncryptionKey();
            }).toThrow('TOTP_ENCRYPTION_KEY environment variable is not set');
        });

        it('should throw if key is wrong length', () => {
            process.env.TOTP_ENCRYPTION_KEY = 'too-short';

            expect(() => {
                getTOTPEncryptionKey();
            }).toThrow('TOTP_ENCRYPTION_KEY must be 64 hex characters');
        });

        it('should return key if valid', () => {
            const validKey = crypto.randomBytes(32).toString('hex');
            process.env.TOTP_ENCRYPTION_KEY = validKey;

            const key = getTOTPEncryptionKey();

            expect(key).toBe(validKey);
        });
    });

    describe('Integration: Full 2FA flow', () => {
        it('should complete full enrollment and verification flow', async () => {
            const userId = 'test-user-123';
            const email = 'test@example.com';

            // Step 1: Generate setup data
            const setupData = await TOTPService.generateSetupData(userId, email);
            expect(setupData.secret).toBeDefined();
            expect(setupData.qrCodeDataUrl).toBeDefined();

            // Step 2: Encrypt secret for storage
            const encryptionKey = TOTPService.generateEncryptionKey();
            const encryptedSecret = TOTPService.encryptSecret(
                setupData.secret,
                encryptionKey
            );
            expect(encryptedSecret).toBeDefined();

            // Step 3: Verify user can generate and verify token
            const token = TOTPService.generateToken(setupData.secret);
            const verifyResult = TOTPService.verifyToken(setupData.secret, token);
            expect(verifyResult.valid).toBe(true);

            // Step 4: Decrypt secret from storage and verify again
            const decryptedSecret = TOTPService.decryptSecret(
                encryptedSecret,
                encryptionKey
            );
            expect(decryptedSecret).toBe(setupData.secret);

            const newToken = TOTPService.generateToken(decryptedSecret);
            const newVerifyResult = TOTPService.verifyToken(decryptedSecret, newToken);
            expect(newVerifyResult.valid).toBe(true);
        });
    });
});
