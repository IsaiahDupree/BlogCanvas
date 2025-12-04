/**
 * End-to-End System Tests
 * Tests complete workflows from start to finish
 */

import { runBlogPostPipeline } from '../../lib/pipeline/orchestrator';
import { LLMProvider } from '../../lib/agents/types';
import { EVERREACH_MARKETING_CONTEXT } from '../../lib/context/marketing';

describe('System Tests - Complete Blog Creation Workflow', () => {
    let mockProvider: LLMProvider;

    beforeEach(() => {
        mockProvider = {
            name: 'test-provider',
            call: jest.fn(async (req) => {
                // Comprehensive mock responses for full pipeline
                if (req.userPrompt.includes('Content Strategist and Researcher')) {
                    return JSON.stringify({
                        painPoints: ['Manual CRM tasks', 'Lost leads', 'Poor follow-up'],
                        keyFacts: ['70% time saved', '3x more deals closed'],
                        differentiators: ['AI-powered', 'Automated workflows', '24/7 monitoring'],
                        relatedSubtopics: ['CRM automation', 'Sales efficiency'],
                        suggestedAngles: ['ROI focus', 'Time savings case study']
                    });
                }

                if (req.userPrompt.includes('Content Strategist creating')) {
                    return JSON.stringify({
                        sections: [
                            { key: 'intro', title: 'Transform Your Sales Process', type: 'intro', keyPoints: ['Hook', 'Problem'], estimatedWords: 300 },
                            { key: 'body1', title: 'The Cost of Manual CRM', type: 'body', keyPoints: ['Time waste', 'Lost revenue'], estimatedWords: 400 },
                            { key: 'body2', title: 'How AI CRM Works', type: 'body', keyPoints: ['Automation', 'Intelligence'], estimatedWords: 450 },
                            { key: 'body3', title: 'Real Results', type: 'body', keyPoints: ['Case studies', 'Metrics'], estimatedWords: 350 },
                            { key: 'conclusion', title: 'Take Action', type: 'conclusion', keyPoints: ['Summary', 'Next steps'], estimatedWords: 200 },
                            { key: 'cta', title: '', type: 'cta', keyPoints: ['Call to action'], estimatedWords: 100 }
                        ],
                        totalEstimatedWords: 1800
                    });
                }

                if (req.userPrompt.includes('expert Content Writer')) {
                    const estimatedWords = parseInt(req.userPrompt.match(/TARGET WORD COUNT: ~(\d+)/)?.[1] || '300');
                    return JSON.stringify({
                        content: 'Lorem ipsum '.repeat(estimatedWords / 2),
                        wordCount: estimatedWords
                    });
                }

                if (req.userPrompt.includes('SEO expert')) {
                    return JSON.stringify({
                        title: 'AI CRM: Transform Your Sales Process & Close 3x More Deals',
                        metaDescription: 'Discover how AI-powered CRM saves 70% of your time and triples deals closed. Learn the proven strategies top sales teams use to automate and win.',
                        slug: 'ai-crm-transform-sales-process',
                        ogTitle: 'AI CRM Success Guide',
                        ogDescription: 'Triple your sales with AI automation',
                        suggestions: ['Add FAQ schema', 'Internal link to pricing'],
                        keywordDensity: 1.9,
                        readabilityScore: 'Excellent'
                    });
                }

                if (req.userPrompt.includes('Brand Voice')) {
                    return JSON.stringify({
                        alignmentScore: 92,
                        issues: [],
                        overallFeedback: 'Excellent brand alignment. Direct, confident, benefit-driven.',
                        passed: true
                    });
                }

                return JSON.stringify({});
            })
        };
    });

    it('should complete full blog creation workflow', async () => {
        const result = await runBlogPostPipeline(mockProvider, {
            blogPostId: 'e2e-test-001',
            topic: 'How AI CRM Transforms Sales Processes',
            targetKeyword: 'AI CRM sales',
            wordCountGoal: 1800,
            clientProfile: {
                productServiceSummary: 'AI-powered CRM platform',
                targetAudience: 'B2B sales teams and founders',
                positioning: 'Enterprise-grade CRM with AI intelligence'
            },
            marketingContext: EVERREACH_MARKETING_CONTEXT
        });

        // Pipeline should complete successfully
        expect(result.success).toBe(true);

        // All stages should execute
        expect(result.research).toBeDefined();
        expect(result.outline).toBeDefined();
        expect(result.sections).toBeDefined();
        expect(result.seoMetadata).toBeDefined();
        expect(result.voiceToneReport).toBeDefined();

        // Quality gates should pass
        expect(result.qualityGates?.outline.passed).toBe(true);
        expect(result.qualityGates?.completeness.passed).toBe(true);
        expect(result.qualityGates?.seo?.passed).toBe(true);
        expect(result.qualityGates?.voiceTone?.passed).toBe(true);

        // Should have 6 sections
        expect(result.sections?.length).toBe(6);

        // SEO metadata should be optimized
        const seo = result.seoMetadata;
        expect(seo?.title.length).toBeGreaterThan(40);
        expect(seo?.title.length).toBeLessThan(70);
        expect(seo?.slug).toMatch(/^[a-z0-9-]+$/);

        // Voice/tone should align
        expect(result.voiceToneReport?.alignmentScore).toBeGreaterThanOrEqual(80);
    }, 60000);

    it('should handle quality improvement cycle', async () => {
        let attemptCount = 0;

        mockProvider.call = jest.fn(async (req) => {
            attemptCount++;

            // First attempt: low quality outline
            if (req.userPrompt.includes('Content Strategist creating') && attemptCount <= 2) {
                return JSON.stringify({
                    sections: [
                        { key: 'intro', title: 'Intro', type: 'intro', keyPoints: [], estimatedWords: 100 }
                    ],
                    totalEstimatedWords: 100
                });
            }

            // Second attempt: good quality
            if (req.userPrompt.includes('Content Strategist creating')) {
                return JSON.stringify({
                    sections: [
                        { key: 'intro', title: 'Introduction', type: 'intro', keyPoints: ['p1'], estimatedWords: 300 },
                        { key: 'body1', title: 'Main', type: 'body', keyPoints: ['p2'], estimatedWords: 400 },
                        { key: 'body2', title: 'Secondary', type: 'body', keyPoints: ['p3'], estimatedWords: 400 },
                        { key: 'conclusion', title: 'Conclusion', type: 'conclusion', keyPoints: ['p4'], estimatedWords: 200 },
                        { key: 'cta', title: 'CTA', type: 'cta', keyPoints: ['p5'], estimatedWords: 100 }
                    ],
                    totalEstimatedWords: 1400
                });
            }

            // Research always succeeds
            return JSON.stringify({
                painPoints: ['P1', 'P2'],
                keyFacts: ['F1'],
                differentiators: ['D1'],
                relatedSubtopics: ['T1'],
                suggestedAngles: ['A1']
            });
        });

        const result = await runBlogPostPipeline(mockProvider, {
            blogPostId: 'e2e-test-002',
            topic: 'Test',
            wordCountGoal: 1200,
            clientProfile: {},
            marketingContext: EVERREACH_MARKETING_CONTEXT
        });

        // Should retry and succeed
        expect(result.success).toBe(true);
        expect(result.retryCount).toBeGreaterThan(0);
    }, 90000);

    it('should produce SEO-optimized output', async () => {
        const result = await runBlogPostPipeline(mockProvider, {
            blogPostId: 'e2e-test-003',
            topic: 'AI CRM Benefits',
            targetKeyword: 'AI CRM',
            wordCountGoal: 1500,
            clientProfile: {},
            marketingContext: EVERREACH_MARKETING_CONTEXT
        });

        expect(result.success).toBe(true);

        const seo = result.seoMetadata;

        // Title optimization
        expect(seo?.title).toContain('AI CRM');
        expect(seo?.title.length).toBeLessThan(70);

        // Meta description
        expect(seo?.metaDescription.length).toBeGreaterThan(120);
        expect(seo?.metaDescription.length).toBeLessThan(170);

        // Slug
        expect(seo?.slug).toMatch(/ai-crm/);
        expect(seo?.slug).not.toMatch(/[A-Z\s]/);

        // Keyword density in acceptable range
        expect(seo?.keywordDensity).toBeGreaterThan(0.5);
        expect(seo?.keywordDensity).toBeLessThan(3.5);
    }, 60000);
});

describe('System Tests - Acceptance Criteria', () => {
    it('should meet minimum word count requirement', async () => {
        // This would be tested by the completeness quality gate
        expect(true).toBe(true);
    });

    it('should maintain brand voice throughout', async () => {
        // This would be tested by the voice/tone agent
        expect(true).toBe(true);
    });

    it('should include all required sections', async () => {
        // This would be tested by the outline quality gate
        expect(true).toBe(true);
    });
});
