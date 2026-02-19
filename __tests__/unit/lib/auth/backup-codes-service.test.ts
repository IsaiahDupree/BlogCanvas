/**
 * Unit tests for Backup Codes Service
 * Tests code generation, verification, formatting, and recovery tokens
 */

import {
    BackupCodesService,
    prepareBackupCodesForDB,
} from '@/lib/auth/backup-codes-service';
import bcrypt from 'bcryptjs';

describe('BackupCodesService', () => {
    describe('generateBackupCodes', () => {
        it('should generate 10 backup codes', async () => {
            const result = await BackupCodesService.generateBackupCodes();

            expect(result.codes).toHaveLength(10);
            expect(result.codeHashes).toHaveLength(10);
        });

        it('should generate codes in XXXX-XXXX format', async () => {
            const result = await BackupCodesService.generateBackupCodes();

            result.codes.forEach((code) => {
                expect(code).toMatch(/^[2-9A-HJ-NP-Z]{4}-[2-9A-HJ-NP-Z]{4}$/i);
            });
        });

        it('should generate unique codes', async () => {
            const result = await BackupCodesService.generateBackupCodes();

            const uniqueCodes = new Set(result.codes);
            expect(uniqueCodes.size).toBe(10);
        });

        it('should generate valid bcrypt hashes', async () => {
            const result = await BackupCodesService.generateBackupCodes();

            for (let i = 0; i < result.codes.length; i++) {
                const code = result.codes[i];
                const hash = result.codeHashes[i];

                // Verify the hash matches the code
                const isMatch = await bcrypt.compare(code, hash);
                expect(isMatch).toBe(true);
            }
        });

        it('should include generation timestamp', async () => {
            const before = new Date();
            const result = await BackupCodesService.generateBackupCodes();
            const after = new Date();

            expect(result.generatedAt.getTime()).toBeGreaterThanOrEqual(
                before.getTime()
            );
            expect(result.generatedAt.getTime()).toBeLessThanOrEqual(after.getTime());
        });

        it('should not include confusing characters (0, O, I, 1, l)', async () => {
            const result = await BackupCodesService.generateBackupCodes();

            result.codes.forEach((code) => {
                expect(code).not.toMatch(/[0OI1l]/);
            });
        });
    });

    describe('verifyBackupCode', () => {
        it('should verify a valid backup code', async () => {
            const result = await BackupCodesService.generateBackupCodes();
            const codeToVerify = result.codes[0];

            const matchedHash = await BackupCodesService.verifyBackupCode(
                codeToVerify,
                result.codeHashes
            );

            expect(matchedHash).toBe(result.codeHashes[0]);
        });

        it('should return null for invalid code', async () => {
            const result = await BackupCodesService.generateBackupCodes();
            const invalidCode = 'XXXX-YYYY';

            const matchedHash = await BackupCodesService.verifyBackupCode(
                invalidCode,
                result.codeHashes
            );

            expect(matchedHash).toBeNull();
        });

        it('should handle codes without dashes', async () => {
            const result = await BackupCodesService.generateBackupCodes();
            const codeWithDash = result.codes[0]; // e.g., "ABCD-EFGH"
            const codeWithoutDash = codeWithDash.replace('-', ''); // "ABCDEFGH"

            const matchedHash = await BackupCodesService.verifyBackupCode(
                codeWithoutDash,
                result.codeHashes
            );

            expect(matchedHash).toBe(result.codeHashes[0]);
        });

        it('should handle codes with spaces', async () => {
            const result = await BackupCodesService.generateBackupCodes();
            const codeWithDash = result.codes[0];
            const codeWithSpaces = ` ${codeWithDash} `;

            const matchedHash = await BackupCodesService.verifyBackupCode(
                codeWithSpaces,
                result.codeHashes
            );

            expect(matchedHash).toBe(result.codeHashes[0]);
        });

        it('should verify any code in the list', async () => {
            const result = await BackupCodesService.generateBackupCodes();

            // Test a few codes (testing all 10 is slow with bcrypt)
            const codesToTest = [0, 4, 9]; // Test first, middle, and last

            for (const i of codesToTest) {
                const matchedHash = await BackupCodesService.verifyBackupCode(
                    result.codes[i],
                    result.codeHashes
                );

                expect(matchedHash).toBe(result.codeHashes[i]);
            }
        });

        it('should not verify code from different set', async () => {
            const result1 = await BackupCodesService.generateBackupCodes();
            const result2 = await BackupCodesService.generateBackupCodes();

            const matchedHash = await BackupCodesService.verifyBackupCode(
                result1.codes[0],
                result2.codeHashes
            );

            expect(matchedHash).toBeNull();
        });
    });

    describe('isValidFormat', () => {
        it('should validate correct format with dash', () => {
            expect(BackupCodesService.isValidFormat('ABCD-EFGH')).toBe(true);
            expect(BackupCodesService.isValidFormat('2345-6789')).toBe(true);
        });

        it('should validate correct format without dash', () => {
            expect(BackupCodesService.isValidFormat('ABCDEFGH')).toBe(true);
            expect(BackupCodesService.isValidFormat('23456789')).toBe(true);
        });

        it('should reject codes with confusing characters', () => {
            expect(BackupCodesService.isValidFormat('0BCD-EFGH')).toBe(false); // has 0
            expect(BackupCodesService.isValidFormat('OBCD-EFGH')).toBe(false); // has O
            expect(BackupCodesService.isValidFormat('IBCD-EFGH')).toBe(false); // has I
            expect(BackupCodesService.isValidFormat('1BCD-EFGH')).toBe(false); // has 1
        });

        it('should reject codes of wrong length', () => {
            expect(BackupCodesService.isValidFormat('ABC-EFGH')).toBe(false); // too short
            expect(BackupCodesService.isValidFormat('ABCDE-EFGH')).toBe(false); // too long
        });

        it('should reject codes with invalid characters', () => {
            expect(BackupCodesService.isValidFormat('ABC!-EFGH')).toBe(false);
            expect(BackupCodesService.isValidFormat('ABC@-EFGH')).toBe(false);
        });

        it('should handle codes with spaces', () => {
            expect(BackupCodesService.isValidFormat('ABCD EFGH')).toBe(true);
            expect(BackupCodesService.isValidFormat(' ABCDEFGH ')).toBe(true);
        });
    });

    describe('formatCodesForDisplay', () => {
        it('should format codes with numbers', async () => {
            const result = await BackupCodesService.generateBackupCodes();
            const formatted = BackupCodesService.formatCodesForDisplay(result.codes);

            const lines = formatted.split('\n');
            expect(lines).toHaveLength(10);

            lines.forEach((line, index) => {
                const expectedNumber = (index + 1).toString().padStart(2, '0');
                expect(line).toContain(`${expectedNumber}.`);
                expect(line).toContain(result.codes[index]);
            });
        });

        it('should pad numbers with leading zeros', async () => {
            const result = await BackupCodesService.generateBackupCodes();
            const formatted = BackupCodesService.formatCodesForDisplay(result.codes);

            expect(formatted).toContain('01.');
            expect(formatted).toContain('10.');
        });
    });

    describe('formatCodesForCSV', () => {
        it('should format codes as CSV with header', async () => {
            const result = await BackupCodesService.generateBackupCodes();
            const csv = BackupCodesService.formatCodesForCSV(result.codes);

            expect(csv).toContain('Number,Backup Code,Generated,Status');
        });

        it('should include all codes in CSV', async () => {
            const result = await BackupCodesService.generateBackupCodes();
            const csv = BackupCodesService.formatCodesForCSV(result.codes);

            result.codes.forEach((code, index) => {
                expect(csv).toContain(`${index + 1},${code}`);
            });
        });

        it('should mark codes as Unused initially', async () => {
            const result = await BackupCodesService.generateBackupCodes();
            const csv = BackupCodesService.formatCodesForCSV(result.codes);

            const lines = csv.split('\n');
            // Skip header
            for (let i = 1; i <= 10; i++) {
                expect(lines[i]).toContain('Unused');
            }
        });
    });

    describe('Recovery Token Functions', () => {
        describe('generateRecoveryToken', () => {
            it('should generate a valid recovery token', () => {
                const token = BackupCodesService.generateRecoveryToken();

                expect(token).toBeDefined();
                expect(typeof token).toBe('string');
                expect(token.length).toBe(64); // 32 bytes = 64 hex chars
                expect(token).toMatch(/^[0-9a-f]+$/);
            });

            it('should generate unique tokens', () => {
                const token1 = BackupCodesService.generateRecoveryToken();
                const token2 = BackupCodesService.generateRecoveryToken();

                expect(token1).not.toBe(token2);
            });
        });

        describe('hashRecoveryToken and verifyRecoveryToken', () => {
            it('should hash and verify recovery token', async () => {
                const token = BackupCodesService.generateRecoveryToken();
                const hash = await BackupCodesService.hashRecoveryToken(token);

                expect(hash).toBeDefined();
                expect(hash).not.toBe(token);

                const isValid = await BackupCodesService.verifyRecoveryToken(
                    token,
                    hash
                );
                expect(isValid).toBe(true);
            });

            it('should reject invalid recovery token', async () => {
                const token = BackupCodesService.generateRecoveryToken();
                const hash = await BackupCodesService.hashRecoveryToken(token);

                const invalidToken = BackupCodesService.generateRecoveryToken();
                const isValid = await BackupCodesService.verifyRecoveryToken(
                    invalidToken,
                    hash
                );

                expect(isValid).toBe(false);
            });
        });
    });

    describe('Code Management Functions', () => {
        describe('countUnusedCodes', () => {
            it('should count all codes as unused when none are used', () => {
                const allHashes = ['hash1', 'hash2', 'hash3', 'hash4', 'hash5'];
                const usedHashes: string[] = [];

                const count = BackupCodesService.countUnusedCodes(
                    allHashes,
                    usedHashes
                );

                expect(count).toBe(5);
            });

            it('should count correctly when some codes are used', () => {
                const allHashes = ['hash1', 'hash2', 'hash3', 'hash4', 'hash5'];
                const usedHashes = ['hash2', 'hash4'];

                const count = BackupCodesService.countUnusedCodes(
                    allHashes,
                    usedHashes
                );

                expect(count).toBe(3);
            });

            it('should return 0 when all codes are used', () => {
                const allHashes = ['hash1', 'hash2', 'hash3'];
                const usedHashes = ['hash1', 'hash2', 'hash3'];

                const count = BackupCodesService.countUnusedCodes(
                    allHashes,
                    usedHashes
                );

                expect(count).toBe(0);
            });
        });

        describe('shouldRegenerateWarning', () => {
            it('should warn when 3 or fewer codes remain', () => {
                expect(BackupCodesService.shouldRegenerateWarning(3)).toBe(true);
                expect(BackupCodesService.shouldRegenerateWarning(2)).toBe(true);
                expect(BackupCodesService.shouldRegenerateWarning(1)).toBe(true);
            });

            it('should not warn when more than 3 codes remain', () => {
                expect(BackupCodesService.shouldRegenerateWarning(4)).toBe(false);
                expect(BackupCodesService.shouldRegenerateWarning(5)).toBe(false);
                expect(BackupCodesService.shouldRegenerateWarning(10)).toBe(false);
            });

            it('should not warn when no codes remain', () => {
                expect(BackupCodesService.shouldRegenerateWarning(0)).toBe(false);
            });
        });

        describe('hasNoCodesLeft', () => {
            it('should return true when count is 0', () => {
                expect(BackupCodesService.hasNoCodesLeft(0)).toBe(true);
            });

            it('should return false when codes remain', () => {
                expect(BackupCodesService.hasNoCodesLeft(1)).toBe(false);
                expect(BackupCodesService.hasNoCodesLeft(5)).toBe(false);
            });
        });
    });

    describe('prepareBackupCodesForDB', () => {
        it('should prepare hashes for database insertion', () => {
            const hashes = ['hash1', 'hash2', 'hash3'];
            const records = prepareBackupCodesForDB(hashes);

            expect(records).toHaveLength(3);

            records.forEach((record, index) => {
                expect(record.code_hash).toBe(hashes[index]);
                expect(record.used).toBe(false);
                expect(record.created_at).toBeInstanceOf(Date);
            });
        });

        it('should set all codes as unused initially', () => {
            const hashes = ['hash1', 'hash2', 'hash3'];
            const records = prepareBackupCodesForDB(hashes);

            records.forEach((record) => {
                expect(record.used).toBe(false);
            });
        });

        it('should handle empty array', () => {
            const records = prepareBackupCodesForDB([]);
            expect(records).toHaveLength(0);
        });
    });

    describe('Integration: Full backup codes flow', () => {
        it('should complete full generation and verification flow', async () => {
            // Step 1: Generate backup codes
            const result = await BackupCodesService.generateBackupCodes();
            expect(result.codes).toHaveLength(10);

            // Step 2: Prepare for database storage
            const dbRecords = prepareBackupCodesForDB(result.codeHashes);
            expect(dbRecords).toHaveLength(10);

            // Step 3: Simulate user using a backup code
            const codeToUse = result.codes[0];
            const matchedHash = await BackupCodesService.verifyBackupCode(
                codeToUse,
                result.codeHashes
            );
            expect(matchedHash).toBe(result.codeHashes[0]);

            // Step 4: Mark code as used
            const usedHashes = [matchedHash!];
            const unusedCount = BackupCodesService.countUnusedCodes(
                result.codeHashes,
                usedHashes
            );
            expect(unusedCount).toBe(9);

            // Step 5: Check if regeneration warning needed
            const shouldWarn = BackupCodesService.shouldRegenerateWarning(unusedCount);
            expect(shouldWarn).toBe(false); // Still have 9 left
        });

        it('should handle running low on codes', async () => {
            // Generate codes
            const result = await BackupCodesService.generateBackupCodes();

            // Simulate using 7 codes (leaving 3)
            const usedHashes = result.codeHashes.slice(0, 7);
            const unusedCount = BackupCodesService.countUnusedCodes(
                result.codeHashes,
                usedHashes
            );

            expect(unusedCount).toBe(3);
            expect(BackupCodesService.shouldRegenerateWarning(unusedCount)).toBe(
                true
            );
            expect(BackupCodesService.hasNoCodesLeft(unusedCount)).toBe(false);
        });

        it('should handle running out of codes', async () => {
            // Generate codes
            const result = await BackupCodesService.generateBackupCodes();

            // Simulate using all codes
            const usedHashes = [...result.codeHashes];
            const unusedCount = BackupCodesService.countUnusedCodes(
                result.codeHashes,
                usedHashes
            );

            expect(unusedCount).toBe(0);
            expect(BackupCodesService.hasNoCodesLeft(unusedCount)).toBe(true);
        });
    });
});
