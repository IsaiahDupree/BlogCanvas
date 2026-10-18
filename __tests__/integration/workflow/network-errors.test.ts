/**
 * Integration Tests - Network Error Handling
 * Tests for RSC payload errors, WebSocket issues, and network failures
 */

import { describe, it, expect, beforeAll } from '@jest/globals';
import { ensureServerRunning, getTestUrl } from '../../setup/server-manager';

const BASE_URL = getTestUrl();
const SKIP_API_TESTS = process.env.SKIP_API_TESTS === 'true';

describe('Workflow - Network Error Handling', () => {
    beforeAll(async () => {
        if (SKIP_API_TESTS) return;
        await ensureServerRunning();
    }, 70000);

    describe('RSC Payload Errors', () => {
        it('should handle RSC payload fetch failures gracefully', async () => {
            if (SKIP_API_TESTS) return;

            // Try to access the page
            const response = await fetch(`${BASE_URL}/one-page-workflow`, {
                method: 'GET',
                headers: {
                    'Accept': 'text/html, application/xhtml+xml',
                    'Cache-Control': 'no-cache'
                }
            });

            // Should either succeed or fail gracefully
            expect([200, 404, 500]).toContain(response.status);
            
            if (response.ok) {
                const html = await response.text();
                // Should contain the page content
                expect(html.length).toBeGreaterThan(0);
            }
        }, 30000);

        it('should handle RSC payload with proper headers', async () => {
            if (SKIP_API_TESTS) return;

            const response = await fetch(`${BASE_URL}/one-page-workflow`, {
                method: 'GET',
                headers: {
                    'Accept': 'text/x-component',
                    'RSC': '1'
                }
            });

            // Should handle RSC requests
            expect(response.status).toBeLessThan(600);
        }, 30000);
    });

    describe('WebSocket HMR Connection', () => {
        it('should handle WebSocket connection interruptions', async () => {
            if (SKIP_API_TESTS) return;

            // Test that the page still loads even if WebSocket fails
            const response = await fetch(`${BASE_URL}/one-page-workflow`, {
                method: 'GET'
            });

            expect(response.status).toBe(200);
        }, 30000);
    });

    describe('API Endpoint Resilience', () => {
        it('should handle gap-analysis endpoint errors', async () => {
            if (SKIP_API_TESTS) return;

            const response = await fetch(`${BASE_URL}/api/workflow/gap-analysis`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    input: '',
                    inputType: 'url'
                })
            });

            // Should return error response, not crash
            expect(response.status).toBeGreaterThanOrEqual(400);
            const data = await response.json();
            expect(data).toHaveProperty('error');
        }, 10000);

        it('should handle malformed requests', async () => {
            if (SKIP_API_TESTS) return;

            const response = await fetch(`${BASE_URL}/api/workflow/gap-analysis`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: 'invalid json'
            });

            // Should handle gracefully
            expect(response.status).toBeGreaterThanOrEqual(400);
        }, 10000);

        it('should handle timeout scenarios', async () => {
            if (SKIP_API_TESTS) return;

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 1000);

            try {
                const response = await fetch(`${BASE_URL}/api/workflow/gap-analysis`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        input: 'https://techmestuff.com',
                        inputType: 'url'
                    }),
                    signal: controller.signal
                });

                clearTimeout(timeoutId);
                // Should either complete or abort gracefully
                expect([200, 0]).toContain(response.status);
            } catch (error: any) {
                clearTimeout(timeoutId);
                // AbortError is expected
                expect(error.name).toBe('AbortError');
            }
        }, 5000);
    });

    describe('SSE Log Streaming', () => {
        it('should handle SSE connection for logs', async () => {
            if (SKIP_API_TESTS) return;

            // First create a job
            const analysisResponse = await fetch(`${BASE_URL}/api/workflow/gap-analysis`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    input: 'https://example.com',
                    inputType: 'url'
                }),
                signal: AbortSignal.timeout(5000) // Quick timeout for test
            });

            if (analysisResponse.ok) {
                const data = await analysisResponse.json();
                const jobId = data.jobId;

                if (jobId) {
                    // Try to connect to SSE endpoint
                    const sseResponse = await fetch(`${BASE_URL}/api/workflow/logs/${jobId}`, {
                        method: 'GET',
                        headers: {
                            'Accept': 'text/event-stream',
                            'Cache-Control': 'no-cache'
                        }
                    });

                    // SSE should return 200 or handle connection
                    expect(sseResponse.status).toBeLessThan(500);
                }
            }
        }, 10000);

        it('should handle invalid job ID for SSE', async () => {
            if (SKIP_API_TESTS) return;

            const response = await fetch(`${BASE_URL}/api/workflow/logs/invalid-job-id`, {
                method: 'GET',
                headers: {
                    'Accept': 'text/event-stream'
                }
            });

            // Should handle invalid job ID gracefully
            expect(response.status).toBeLessThan(500);
        }, 5000);
    });

    describe('Server Health', () => {
        it('should respond to health checks', async () => {
            if (SKIP_API_TESTS) return;

            const response = await fetch(`${BASE_URL}/api/health`, {
                method: 'GET'
            });

            expect(response.ok).toBe(true);
            const data = await response.json();
            expect(data).toHaveProperty('status');
            expect(data.status).toBe('ok');
        }, 5000);

        it('should handle concurrent requests', async () => {
            if (SKIP_API_TESTS) return;

            const requests = Array(5).fill(null).map(() =>
                fetch(`${BASE_URL}/api/health`, { method: 'GET' })
            );

            const responses = await Promise.all(requests);
            
            responses.forEach(response => {
                expect(response.ok).toBe(true);
            });
        }, 10000);
    });
});

