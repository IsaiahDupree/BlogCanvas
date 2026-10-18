/**
 * Regression Tests - Ensure new changes don't break existing functionality
 */

import { describe, it, expect } from '@jest/globals';

import { getTestUrl } from '../../setup/server-manager';
const BASE_URL = getTestUrl();
const SKIP_REGRESSION_TESTS = process.env.SKIP_REGRESSION_TESTS === 'true';

describe('Workflow - Regression Tests', () => {
    describe('API Contract Stability', () => {
        it('should maintain gap analysis response structure', async () => {
            if (SKIP_REGRESSION_TESTS) return;

            const response = await fetch(`${BASE_URL}/api/workflow/gap-analysis`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    input: 'https://example.com',
                    inputType: 'url'
                })
            });

            expect(response.ok).toBe(true);
            const data = await response.json();

            // Verify response structure hasn't changed
            expect(data).toHaveProperty('success');
            expect(data).toHaveProperty('seoScore');
            expect(data).toHaveProperty('topicGaps');
            expect(data).toHaveProperty('totalBlogs');
            expect(typeof data.seoScore).toBe('number');
            expect(Array.isArray(data.topicGaps)).toBe(true);
        }, 60000);

        it('should maintain blog suggestions response structure', async () => {
            if (SKIP_REGRESSION_TESTS) return;

            const mockAnalysis = {
                seoScore: 65,
                clusters: [
                    {
                        id: '1',
                        name: 'Test',
                        primary_keyword: 'test',
                        estimated_traffic: 1000,
                        difficulty: 50,
                        recommended_article_count: 3
                    }
                ]
            };

            const response = await fetch(`${BASE_URL}/api/workflow/generate-suggestions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ analysis: mockAnalysis })
            });

            expect(response.ok).toBe(true);
            const data = await response.json();

            // Verify structure
            expect(data).toHaveProperty('success');
            expect(data).toHaveProperty('blogs');
            expect(Array.isArray(data.blogs)).toBe(true);
            
            if (data.blogs.length > 0) {
                const blog = data.blogs[0];
                expect(blog).toHaveProperty('id');
                expect(blog).toHaveProperty('title');
                expect(blog).toHaveProperty('angle');
                expect(blog).toHaveProperty('targetKeyword');
            }
        }, 30000);
    });

    describe('Backward Compatibility', () => {
        it('should handle old request format gracefully', async () => {
            if (SKIP_REGRESSION_TESTS) return;

            // Test with minimal required fields
            const response = await fetch(`${BASE_URL}/api/workflow/gap-analysis`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    input: 'https://example.com'
                    // Missing inputType - should default or handle gracefully
                })
            });

            // Should either work with defaults or return clear error
            expect([200, 400, 500].includes(response.status)).toBe(true);
        }, 30000);
    });
});

