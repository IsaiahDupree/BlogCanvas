/**
 * Integration Tests - Blog Generation API
 */

import { describe, it, expect, beforeAll } from '@jest/globals';
import { ensureServerRunning, getTestUrl } from '../../setup/server-manager';

const BASE_URL = getTestUrl();
const SKIP_API_TESTS = process.env.SKIP_API_TESTS === 'true';

describe('Blog Generation API - Integration', () => {
    beforeAll(async () => {
        if (SKIP_API_TESTS) return;
        await ensureServerRunning();
    }, 70000);

    it('should generate blog suggestions', async () => {
        if (SKIP_API_TESTS) return;

        const mockAnalysis = {
            seoScore: 65,
            clusters: [{
                id: '1',
                name: 'Test Cluster',
                primary_keyword: 'test',
                estimated_traffic: 1000,
                difficulty: 50,
                recommended_article_count: 3
            }]
        };

        const response = await fetch(`${BASE_URL}/api/workflow/generate-suggestions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ analysis: mockAnalysis })
        });

        expect(response.ok).toBe(true);
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(Array.isArray(data.blogs)).toBe(true);
    }, 30000);

    it('should generate blog content with OpenAI', async () => {
        if (SKIP_API_TESTS || !process.env.OPENAI_API_KEY) {
            console.log('⏭️ Skipping - no OpenAI API key');
            return;
        }

        const blogs = [{
            id: 'test-1',
            title: 'Test Blog',
            angle: 'Educational',
            targetKeyword: 'test keyword',
            estimatedTraffic: 1000,
            difficulty: 50
        }];

        const response = await fetch(`${BASE_URL}/api/workflow/generate-blogs`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                blogs,
                includeImages: true,
                humanTone: true
            })
        });

        expect(response.ok).toBe(true);
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.blogs[0].content).toBeTruthy();
    }, 120000);
});

