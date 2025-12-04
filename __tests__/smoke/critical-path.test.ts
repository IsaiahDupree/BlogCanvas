/**
 * Smoke Tests
 * Quick validation to ensure build is stable
 */

import { runResearchAgent } from '../../lib/agents/research';
import { runOutlineAgent } from '../../lib/agents/outline';
import { validateOutline, validateSEO } from '../../lib/pipeline/quality-gates';
import { LLMProvider } from '../../lib/agents/types';

describe('Smoke Tests - Critical Path Validation', () => {
    let mockProvider: LLMProvider;

    beforeAll(() => {
        mockProvider = {
            name: 'smoke-test-provider',
            call: jest.fn(async () => JSON.stringify({
                painPoints: ['P1'],
                keyFacts: ['F1'],
                differentiators: ['D1'],
                relatedSubtopics: ['T1'],
                suggestedAngles: ['A1']
            }))
        };
    });

    it('✓ Research Agent loads and executes', async () => {
        const result = await runResearchAgent(mockProvider, {
            topic: 'Smoke Test',
            clientProfile: {}
        });

        expect(result.success).toBe(true);
    });

    it('✓ Outline Agent loads and executes', async () => {
        mockProvider.call = jest.fn(async () => JSON.stringify({
            sections: [
                { key: 'intro', title: 'Intro', type: 'intro', keyPoints: ['p1'], estimatedWords: 200 },
                { key: 'body', title: 'Body', type: 'body', keyPoints: ['p2'], estimatedWords: 300 },
                { key: 'conclusion', title: 'Conclusion', type: 'conclusion', keyPoints: ['p3'], estimatedWords: 150 }
            ],
            totalEstimatedWords: 650
        }));

        const result = await runOutlineAgent(mockProvider, {
            topic: 'Smoke Test',
            researchData: {
                painPoints: ['P1'],
                keyFacts: ['F1'],
                differentiators: ['D1'],
                relatedSubtopics: ['T1'],
                suggestedAngles: ['A1']
            },
            clientProfile: {}
        });

        expect(result.success).toBe(true);
    });

    it('✓ Quality gates function correctly', () => {
        const outlineResult = validateOutline({
            sections: [
                { key: 'intro', title: 'Intro', type: 'intro', keyPoints: ['p1'], estimatedWords: 200 },
                { key: 'body', title: 'Body', type: 'body', keyPoints: ['p2'], estimatedWords: 400 },
                { key: 'conclusion', title: 'Conclusion', type: 'conclusion', keyPoints: ['p3'], estimatedWords: 200 },
                { key: 'cta', title: 'CTA', type: 'cta', keyPoints: ['p4'], estimatedWords: 100 }
            ],
            totalEstimatedWords: 900
        });

        expect(outlineResult).toBeDefined();
        expect(outlineResult.passed).toBe(true);
    });

    it('✓ SEO validation works', () => {
        const seoResult = validateSEO({
            title: 'Perfect SEO Title - Optimized for Search Engines',
            metaDescription: 'This is a well-optimized meta description that provides clear value and stays within the recommended character limit for search engine results.',
            slug: 'perfect-seo-title',
            keywordDensity: 1.8,
            suggestions: []
        });

        expect(seoResult).toBeDefined();
        expect(seoResult.passed).toBe(true);
    });

    it('✓ Marketing context loads', () => {
        const { EVERREACH_MARKETING_CONTEXT } = require('../../lib/context/marketing');

        expect(EVERREACH_MARKETING_CONTEXT).toBeDefined();
        expect(EVERREACH_MARKETING_CONTEXT.brand).toBeDefined();
        expect(EVERREACH_MARKETING_CONTEXT.brand.voice).toBeDefined();
    });

    it('✓ Database types are defined', () => {
        const { Database } = require('../../types/database');

        // Just check it imports without error
        expect(true).toBe(true);
    });
});

describe('Smoke Tests - Sanity Checks', () => {
    it('✓ Node modules are installed', () => {
        expect(require.resolve('jest')).toBeTruthy();
    });

    it('✓ TypeScript compiles', () => {
        // If this test runs, TS compiled successfully
        expect(true).toBe(true);
    });

    it('✓ Environment is configured', () => {
        expect(process.env.NODE_ENV).toBeDefined();
    });
});
