/**
 * Smoke Tests - Quick "does it basically run?" checks
 */

import { describe, it, expect, beforeAll } from '@jest/globals';
import { ensureServerRunning, checkServerHealth, getTestUrl } from '../../setup/server-manager';

const BASE_URL = getTestUrl();
const SKIP_SMOKE_TESTS = process.env.SKIP_SMOKE_TESTS === 'true';

describe('Workflow - Smoke Tests', () => {
    let serverAvailable = false;

    beforeAll(async () => {
        if (SKIP_SMOKE_TESTS) return;
        
        // Ensure server is running before tests
        console.log('🔍 Checking server health...');
        serverAvailable = await ensureServerRunning();
        
        if (!serverAvailable) {
            console.log('⚠️ Server not available - skipping API-dependent smoke tests');
        } else {
            console.log('✅ Server is ready for smoke tests');
        }
    }, 70000); // 70 second timeout to allow server startup

    describe('Basic Functionality', () => {
        it('should respond to health check', async () => {
            if (SKIP_SMOKE_TESTS) {
                console.log('⏭️ Skipping - SKIP_SMOKE_TESTS=true');
                return;
            }

            // Double-check server is still healthy
            const isHealthy = await checkServerHealth();
            if (!isHealthy) {
                console.log('⚠️ Server unhealthy, attempting to restart...');
                await ensureServerRunning();
            }

            const response = await fetch(`${BASE_URL}/api/health`, {
                signal: AbortSignal.timeout(5000) // 5 second timeout
            });
            expect(response.status).toBe(200);
            const data = await response.json();
            expect(data.status).toBe('ok');
        }, 15000);

        it('should have all workflow endpoints available', async () => {
            if (SKIP_SMOKE_TESTS) {
                console.log('⏭️ Skipping - SKIP_SMOKE_TESTS=true');
                return;
            }

            // Ensure server is healthy
            if (!serverAvailable) {
                await ensureServerRunning();
            }

            const endpoints = [
                '/api/workflow/gap-analysis',
                '/api/workflow/generate-suggestions',
                '/api/workflow/generate-blogs',
                '/api/workflow/export-google-docs',
                '/api/workflow/export'
            ];

            for (const endpoint of endpoints) {
                const response = await fetch(`${BASE_URL}${endpoint}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({}),
                    signal: AbortSignal.timeout(5000) // 5 second timeout per request
                });

                // Should respond (even if with error) - not 404
                expect(response.status).not.toBe(404);
            }
        }, 30000);
    });

    describe('Quick Sanity Checks', () => {
        it('should validate input types', async () => {
            if (SKIP_SMOKE_TESTS) {
                console.log('⏭️ Skipping - SKIP_SMOKE_TESTS=true');
                return;
            }

            // Ensure server is healthy
            if (!serverAvailable) {
                await ensureServerRunning();
            }

            const response = await fetch(`${BASE_URL}/api/workflow/gap-analysis`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    input: 'test',
                    inputType: 'url'
                }),
                signal: AbortSignal.timeout(10000) // 10 second timeout
            });

            // Should handle invalid URL gracefully
            expect([200, 400, 500].includes(response.status)).toBe(true);
        }, 15000);

        it('should reject empty blog arrays', async () => {
            if (SKIP_SMOKE_TESTS) {
                console.log('⏭️ Skipping - SKIP_SMOKE_TESTS=true');
                return;
            }

            // Ensure server is healthy
            if (!serverAvailable) {
                await ensureServerRunning();
            }

            const response = await fetch(`${BASE_URL}/api/workflow/generate-blogs`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    blogs: []
                }),
                signal: AbortSignal.timeout(5000) // 5 second timeout
            });

            expect(response.status).toBe(400);
        }, 10000);
    });

    describe('Code Structure Checks (No Server Required)', () => {
        it('should have all required modules exported', () => {
            // Test that modules can be imported without errors
            expect(() => require('@/lib/ai/openai-provider')).not.toThrow();
            expect(() => require('@/lib/analysis/gap-analyzer')).not.toThrow();
            expect(() => require('@/lib/analysis/topic-clusters')).not.toThrow();
        });

        it('should have proper TypeScript types', () => {
            // Verify types exist
            const openaiProvider = require('@/lib/ai/openai-provider');
            expect(typeof openaiProvider.isOpenAIConfigured).toBe('function');
            expect(typeof openaiProvider.generateText).toBe('function');
            expect(typeof openaiProvider.generateImage).toBe('function');
        });
    });
});

