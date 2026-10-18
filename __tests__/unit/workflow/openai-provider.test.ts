/**
 * Unit Tests - OpenAI Provider
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { isOpenAIConfigured } from '@/lib/ai/openai-provider';

describe('OpenAI Provider - Unit Tests', () => {
    const originalEnv = process.env.OPENAI_API_KEY;

    beforeEach(() => {
        process.env.OPENAI_API_KEY = originalEnv;
    });

    describe('isOpenAIConfigured', () => {
        it('should return false when API key is missing', () => {
            delete process.env.OPENAI_API_KEY;
            expect(isOpenAIConfigured()).toBe(false);
        });

        it('should return true when API key is present', () => {
            process.env.OPENAI_API_KEY = 'test-key-123';
            expect(isOpenAIConfigured()).toBe(true);
        });
    });
});

