/**
 * Integration Tests - Real Website Analysis
 * Tests against actual website: techmestuff.com
 */

import { describe, it, expect, beforeAll } from '@jest/globals';
import { ensureServerRunning, getTestUrl } from '../../setup/server-manager';

const BASE_URL = getTestUrl();
const SKIP_API_TESTS = process.env.SKIP_API_TESTS === 'true';
const TARGET_WEBSITE = 'https://techmestuff.com';

describe('Real Website Analysis - techmestuff.com', () => {
    beforeAll(async () => {
        if (SKIP_API_TESTS) return;
        await ensureServerRunning();
    }, 70000);

    it('should scrape and analyze techmestuff.com', async () => {
        if (SKIP_API_TESTS) return;

        console.log(`\n🌐 Testing against: ${TARGET_WEBSITE}\n`);

        const response = await fetch(`${BASE_URL}/api/workflow/gap-analysis`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                input: TARGET_WEBSITE,
                inputType: 'url'
            }),
            signal: AbortSignal.timeout(180000) // 3 minute timeout for real website scraping
        });

        expect(response.ok).toBe(true);
        const data = await response.json();
        
        console.log(`\n📊 Analysis Results:`);
        console.log(`   SEO Score: ${data.seoScore}`);
        console.log(`   Topic Gaps Found: ${data.topicGaps?.length || 0}`);
        console.log(`   Total Blogs Recommended: ${data.totalBlogs || 0}`);
        
        expect(data.success).toBe(true);
        expect(data.seoScore).toBeGreaterThanOrEqual(0);
        expect(data.seoScore).toBeLessThanOrEqual(100);
        expect(Array.isArray(data.topicGaps)).toBe(true);
        expect(typeof data.totalBlogs).toBe('number');
    }, 200000); // 3.3 minute test timeout

    it('should generate blog suggestions for techmestuff.com', async () => {
        if (SKIP_API_TESTS) return;

        // First get analysis
        const analysisRes = await fetch(`${BASE_URL}/api/workflow/gap-analysis`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                input: TARGET_WEBSITE,
                inputType: 'url'
            }),
            signal: AbortSignal.timeout(180000)
        });

        expect(analysisRes.ok).toBe(true);
        const analysis = await analysisRes.json();
        expect(analysis.success).toBe(true);

        // Then generate suggestions
        const suggestionsRes = await fetch(`${BASE_URL}/api/workflow/generate-suggestions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ analysis }),
            signal: AbortSignal.timeout(30000)
        });

        expect(suggestionsRes.ok).toBe(true);
        const suggestions = await suggestionsRes.json();
        
        console.log(`\n📝 Blog Suggestions Generated:`);
        console.log(`   Total Suggestions: ${suggestions.blogs?.length || 0}`);
        if (suggestions.blogs && suggestions.blogs.length > 0) {
            console.log(`   First Suggestion: ${suggestions.blogs[0].title}`);
            console.log(`   Target Keyword: ${suggestions.blogs[0].targetKeyword}`);
        }
        
        expect(suggestions.success).toBe(true);
        expect(Array.isArray(suggestions.blogs)).toBe(true);
        if (suggestions.blogs.length > 0) {
            expect(suggestions.blogs[0]).toHaveProperty('title');
            expect(suggestions.blogs[0]).toHaveProperty('angle');
            expect(suggestions.blogs[0]).toHaveProperty('targetKeyword');
        }
    }, 220000);
});

