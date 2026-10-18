/**
 * Performance Tests - Load Testing
 * Test system behavior under normal and high load
 */

import { describe, it, expect, beforeAll } from '@jest/globals';

import { getTestUrl } from '../../setup/server-manager';
const BASE_URL = getTestUrl();
const SKIP_PERFORMANCE_TESTS = process.env.SKIP_PERFORMANCE_TESTS === 'true';

describe('Workflow - Performance Tests', () => {
    beforeAll(() => {
        if (SKIP_PERFORMANCE_TESTS) {
            console.log('⚠️ Skipping performance tests');
        }
    });

    describe('Load Testing', () => {
        it('should handle multiple concurrent gap analysis requests', async () => {
            if (SKIP_PERFORMANCE_TESTS) return;

            const requests = Array(5).fill(null).map(() =>
                fetch(`${BASE_URL}/api/workflow/gap-analysis`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        input: 'https://example.com',
                        inputType: 'url'
                    })
                })
            );

            const startTime = Date.now();
            const responses = await Promise.all(requests);
            const duration = Date.now() - startTime;

            // All requests should succeed
            responses.forEach(response => {
                expect(response.ok).toBe(true);
            });

            // Should complete within reasonable time (30 seconds for 5 requests)
            expect(duration).toBeLessThan(30000);
        }, 60000);

        it('should handle batch blog generation efficiently', async () => {
            if (SKIP_PERFORMANCE_TESTS || !process.env.OPENAI_API_KEY) {
                return;
            }

            const blogs = Array(3).fill(null).map((_, i) => ({
                id: `test-${i}`,
                title: `Test Blog ${i}`,
                angle: 'Test angle',
                targetKeyword: 'test keyword',
                estimatedTraffic: 1000,
                difficulty: 50
            }));

            const startTime = Date.now();
            const response = await fetch(`${BASE_URL}/api/workflow/generate-blogs`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    blogs,
                    includeImages: true,
                    humanTone: true
                })
            });

            const duration = Date.now() - startTime;

            expect(response.ok).toBe(true);
            const data = await response.json();
            expect(data.blogs.length).toBe(3);

            // Should generate 3 blogs within reasonable time (3 minutes)
            expect(duration).toBeLessThan(180000);
        }, 240000);
    });

    describe('Response Time Testing', () => {
        it('should respond to gap analysis within 60 seconds', async () => {
            if (SKIP_PERFORMANCE_TESTS) return;

            const startTime = Date.now();
            const response = await fetch(`${BASE_URL}/api/workflow/gap-analysis`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    input: 'https://example.com',
                    inputType: 'url'
                })
            });

            const duration = Date.now() - startTime;

            expect(response.ok).toBe(true);
            expect(duration).toBeLessThan(60000);
        }, 90000);

        it('should respond to suggestions generation within 5 seconds', async () => {
            if (SKIP_PERFORMANCE_TESTS) return;

            const mockAnalysis = {
                seoScore: 65,
                clusters: [
                    {
                        id: '1',
                        name: 'Test Cluster',
                        primary_keyword: 'test',
                        estimated_traffic: 1000,
                        difficulty: 50,
                        recommended_article_count: 3
                    }
                ]
            };

            const startTime = Date.now();
            const response = await fetch(`${BASE_URL}/api/workflow/generate-suggestions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ analysis: mockAnalysis })
            });

            const duration = Date.now() - startTime;

            expect(response.ok).toBe(true);
            expect(duration).toBeLessThan(5000);
        }, 10000);
    });
});

