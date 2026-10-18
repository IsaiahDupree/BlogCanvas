/**
 * E2E Tests - Complete Workflow
 * Full user journey from input to export
 */

import { describe, it, expect, beforeAll } from '@jest/globals';
import { ensureServerRunning, getTestUrl } from '../../setup/server-manager';

const BASE_URL = getTestUrl();
const SKIP_E2E_TESTS = process.env.SKIP_E2E_TESTS === 'true';

describe('Complete Workflow - E2E', () => {
    beforeAll(async () => {
        if (SKIP_E2E_TESTS) return;
        await ensureServerRunning();
    }, 70000);

    it('should complete full workflow: URL → Analysis → Suggestions → Generation', async () => {
        if (SKIP_E2E_TESTS || !process.env.OPENAI_API_KEY) {
            console.log('⏭️ Skipping - no OpenAI API key');
            return;
        }

        // Step 1: Gap Analysis
        const analysisRes = await fetch(`${BASE_URL}/api/workflow/gap-analysis`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                input: 'https://example.com',
                inputType: 'url'
            })
        });
        expect(analysisRes.ok).toBe(true);
        const analysis = await analysisRes.json();
        expect(analysis.success).toBe(true);

        // Step 2: Generate Suggestions
        const suggestionsRes = await fetch(`${BASE_URL}/api/workflow/generate-suggestions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ analysis })
        });
        expect(suggestionsRes.ok).toBe(true);
        const suggestions = await suggestionsRes.json();
        expect(suggestions.blogs.length).toBeGreaterThan(0);

        // Step 3: Generate Content (1 blog for speed)
        const generateRes = await fetch(`${BASE_URL}/api/workflow/generate-blogs`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                blogs: suggestions.blogs.slice(0, 1),
                includeImages: true,
                humanTone: true
            })
        });
        expect(generateRes.ok).toBe(true);
        const generated = await generateRes.json();
        expect(generated.blogs[0].content).toBeTruthy();
    }, 300000);
});

