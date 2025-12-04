import { runSEOAgent, SEOAgentInput } from '../../../lib/agents/seo';
import { LLMProvider } from '../../../lib/agents/types';

describe('SEO Agent', () => {
    let mockProvider: LLMProvider;

    beforeEach(() => {
        mockProvider = {
            name: 'test-provider',
            call: jest.fn().mockResolvedValue(JSON.stringify({
                title: 'AI CRM Guide: Transform Your Sales Process Today',
                metaDescription: 'Discover how AI-powered CRM revolutionizes sales. Learn proven strategies to boost efficiency, close more deals, and scale your business.',
                slug: 'ai-crm-guide-transform-sales',
                ogTitle: 'AI CRM Guide for Modern Sales Teams',
                ogDescription: 'The complete guide to leveraging AI in your CRM workflow',
                suggestions: ['Add internal links', 'Optimize images', 'Include FAQs'],
                keywordDensity: 1.8,
                readabilityScore: 'Good'
            }))
        };
    });

    it('should generate SEO metadata', async () => {
        const input: SEOAgentInput = {
            topic: 'AI CRM Benefits',
            targetKeyword: 'AI CRM',
            fullDraftContent: 'Lorem ipsum '.repeat(500),
            wordCount: 1500
        };

        const result = await runSEOAgent(mockProvider, input);

        expect(result.success).toBe(true);
        expect(result.data?.title).toBeDefined();
        expect(result.data?.metaDescription).toBeDefined();
        expect(result.data?.slug).toBeDefined();
        expect(result.data?.keywordDensity).toBeGreaterThan(0);
    });

    it('should create title within optimal length', async () => {
        const input: SEOAgentInput = {
            topic: 'Test',
            fullDraftContent: 'Content here',
            wordCount: 500
        };

        const result = await runSEOAgent(mockProvider, input);

        const titleLength = result.data?.title.length || 0;
        expect(titleLength).toBeGreaterThan(30);
        expect(titleLength).toBeLessThan(70);
    });

    it('should create meta description within optimal length', async () => {
        const input: SEOAgentInput = {
            topic: 'Test',
            fullDraftContent: 'Content here',
            wordCount: 500
        };

        const result = await runSEOAgent(mockProvider, input);

        const metaLength = result.data?.metaDescription.length || 0;
        expect(metaLength).toBeGreaterThan(100);
        expect(metaLength).toBeLessThan(170);
    });

    it('should generate URL-friendly slug', async () => {
        const input: SEOAgentInput = {
            topic: 'AI CRM: The Ultimate Guide!',
            fullDraftContent: 'Content here',
            wordCount: 500
        };

        const result = await runSEOAgent(mockProvider, input);

        const slug = result.data?.slug || '';

        // Should be lowercase
        expect(slug).toBe(slug.toLowerCase());

        // Should not contain spaces or special characters
        expect(slug).not.toMatch(/[\s!@#$%^&*()]/);

        // Should use hyphens
        expect(slug).toContain('-');
    });

    it('should include keyword density analysis', async () => {
        const input: SEOAgentInput = {
            topic: 'Test',
            targetKeyword: 'AI CRM',
            fullDraftContent: 'AI CRM is great. AI CRM helps. AI CRM rocks.',
            wordCount: 100
        };

        const result = await runSEOAgent(mockProvider, input);

        expect(result.data?.keywordDensity).toBeDefined();
        expect(typeof result.data?.keywordDensity).toBe('number');
    });

    it('should provide actionable suggestions', async () => {
        const input: SEOAgentInput = {
            topic: 'Test',
            fullDraftContent: 'Content here',
            wordCount: 500
        };

        const result = await runSEOAgent(mockProvider, input);

        expect(result.data?.suggestions).toBeDefined();
        expect(Array.isArray(result.data?.suggestions)).toBe(true);
    });

    it('should handle very long content by truncating preview', async () => {
        const longContent = 'Lorem ipsum '.repeat(5000); // Very long content

        const input: SEOAgentInput = {
            topic: 'Test',
            fullDraftContent: longContent,
            wordCount: 10000
        };

        await runSEOAgent(mockProvider, input);

        const callArgs = (mockProvider.call as jest.Mock).mock.calls[0][0];

        // Should truncate to 1000 chars for preview
        const preview = callArgs.userPrompt.match(/FULL DRAFT PREVIEW.*:\n([\s\S]+?)\n\n/)?.[1] || '';
        expect(preview.length).toBeLessThanOrEqual(1000);
    });

    it('should handle missing optional fields', async () => {
        const input: SEOAgentInput = {
            topic: 'Test',
            fullDraftContent: 'Content',
            wordCount: 100
            // No targetKeyword
        };

        const result = await runSEOAgent(mockProvider, input);

        expect(result.success).toBe(true);
    });

    it('should handle LLM errors', async () => {
        mockProvider.call = jest.fn().mockRejectedValue(new Error('Rate limit exceeded'));

        const input: SEOAgentInput = {
            topic: 'Test',
            fullDraftContent: 'Content',
            wordCount: 500
        };

        const result = await runSEOAgent(mockProvider, input);

        expect(result.success).toBe(false);
        expect(result.error).toBe('Rate limit exceeded');
    });
});
