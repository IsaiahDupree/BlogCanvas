/**
 * Integration Tests - Gap Analysis API
 * Tests API endpoint with real server
 */

import { describe, it, expect, beforeAll } from '@jest/globals';
import { ensureServerRunning, getTestUrl } from '../../setup/server-manager';

const BASE_URL = getTestUrl();
const SKIP_API_TESTS = process.env.SKIP_API_TESTS === 'true';

describe('Gap Analysis API - Integration', () => {
    beforeAll(async () => {
        if (SKIP_API_TESTS) return;
        await ensureServerRunning();
    }, 70000);

    it('should analyze URL and return SEO gaps', async () => {
        if (SKIP_API_TESTS) return;

        const response = await fetch(`${BASE_URL}/api/workflow/gap-analysis`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                input: 'https://example.com',
                inputType: 'url'
            }),
            signal: AbortSignal.timeout(120000) // 2 minute timeout for scraping
        });

        expect(response.ok).toBe(true);
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.seoScore).toBeGreaterThanOrEqual(0);
        expect(Array.isArray(data.topicGaps)).toBe(true);
    }, 150000); // 2.5 minute test timeout

    it('should analyze PRD and return gaps', async () => {
        if (SKIP_API_TESTS) return;

        const response = await fetch(`${BASE_URL}/api/workflow/gap-analysis`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                input: 'Product: Test\nGoals: Increase traffic',
                inputType: 'prd'
            }),
            signal: AbortSignal.timeout(30000) // 30 second timeout
        });

        expect(response.ok).toBe(true);
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.seoScore).toBeGreaterThanOrEqual(0);
    }, 60000);
});

