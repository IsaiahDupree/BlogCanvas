import { runBlogPostPipeline, PipelineInput } from '@/lib/pipeline/orchestrator';
import { LLMProvider } from '@/lib/agents/types';
import { EVERREACH_MARKETING_CONTEXT } from '@/lib/context/marketing';

describe('Pipeline Orchestrator Integration', () => {
    let mockProvider: LLMProvider;
    let baseInput: PipelineInput;

    beforeEach(() => {
        // Mock provider that returns valid responses for all agents
        mockProvider = {
            name: 'test-provider',
            call: jest.fn(async (req) => {
                const promptToCheck = (req.systemPrompt || '') + (req.userPrompt || '');

                if (promptToCheck.includes('Content Strategist and Researcher')) {
                    return JSON.stringify({
                        painPoints: ['Pain 1', 'Pain 2', 'Pain 3'],
                        keyFacts: ['Fact 1', 'Fact 2'],
                        differentiators: ['Diff 1', 'Diff 2'],
                        relatedSubtopics: ['Topic 1'],
                        suggestedAngles: ['Angle 1', 'Angle 2']
                    });
                } else if (promptToCheck.includes('Content Strategist creating') || promptToCheck.includes('create a blog post outline')) {
                    return JSON.stringify({
                        sections: [
                            { key: 'intro', title: 'Intro', type: 'intro', keyPoints: ['p1'], estimatedWords: 300 },
                            { key: 'body1', title: 'Main', type: 'body', keyPoints: ['p2'], estimatedWords: 400 },
                            { key: 'body2', title: 'Second', type: 'body', keyPoints: ['p3'], estimatedWords: 400 },
                            { key: 'conclusion', title: 'Conclusion', type: 'conclusion', keyPoints: ['p4'], estimatedWords: 200 },
                            { key: 'cta', title: 'CTA', type: 'cta', keyPoints: ['p5'], estimatedWords: 100 }
                        ],
                        totalEstimatedWords: 1400
                    });
                } else if (promptToCheck.includes('expert Content Writer')) {
                    return JSON.stringify({
                        content: 'Lorem ipsum dolor sit amet '.repeat(50), // ~250 words
                        wordCount: 250
                    });
                } else if (promptToCheck.includes('SEO expert')) {
                    return JSON.stringify({
                        title: 'Optimized SEO Title - Perfect Length Here',
                        metaDescription: 'This is a well-optimized meta description that provides value and stays within the recommended character limit for search engines.',
                        slug: 'optimized-seo-title',
                        suggestions: [],
                        keywordDensity: 1.8,
                        readabilityScore: 'Good'
                    });
                } else if (promptToCheck.includes('Brand Voice')) {
                    return JSON.stringify({
                        alignmentScore: 88,
                        issues: [],
                        overallFeedback: 'Well-aligned',
                        passed: true
                    });
                }
                return JSON.stringify({});
            })
        };

        baseInput = {
            blogPostId: 'test-123',
            topic: 'AI CRM Benefits',
            targetKeyword: 'AI CRM',
            wordCountGoal: 1200,
            clientProfile: {
                productServiceSummary: 'AI CRM',
                targetAudience: 'Sales teams'
            },
            marketingContext: EVERREACH_MARKETING_CONTEXT
        };
    });

    it('should successfully execute complete pipeline', async () => {
        const result = await runBlogPostPipeline(mockProvider, baseInput);

        expect(result.success).toBe(true);
        expect(result.research).toBeDefined();
        expect(result.outline).toBeDefined();
        expect(result.sections).toBeDefined();
        expect(result.sections?.length).toBeGreaterThan(0);
        expect(result.seoMetadata).toBeDefined();
        expect(result.voiceToneReport).toBeDefined();
    }, 30000); // Increase timeout for full pipeline

    it('should validate all quality gates', async () => {
        const result = await runBlogPostPipeline(mockProvider, baseInput);

        expect(result.qualityGates).toBeDefined();
        expect(result.qualityGates?.outline.passed).toBe(true);
        expect(result.qualityGates?.completeness.passed).toBe(true);
        expect(result.qualityGates?.seo?.passed).toBe(true);
        expect(result.qualityGates?.voiceTone?.passed).toBe(true);
    }, 30000);

    it('should retry on quality gate failure', async () => {
        let callCount = 0;

        mockProvider.call = jest.fn(async (req) => {
            callCount++;
            const promptToCheck = (req.systemPrompt || '') + (req.userPrompt || '');

            // First outline attempt fails (too few sections)
            if (promptToCheck.includes('Content Strategist creating') && callCount <= 2) {
                return JSON.stringify({
                    sections: [
                        { key: 'intro', title: 'Intro', type: 'intro', keyPoints: [], estimatedWords: 200 }
                        // Missing required sections
                    ],
                    totalEstimatedWords: 200
                });
            }

            // Second attempt succeeds
            if (promptToCheck.includes('Content Strategist creating')) {
                return JSON.stringify({
                    sections: [
                        { key: 'intro', title: 'Intro', type: 'intro', keyPoints: ['p1'], estimatedWords: 300 },
                        { key: 'body1', title: 'Main', type: 'body', keyPoints: ['p2'], estimatedWords: 400 },
                        { key: 'body2', title: 'Second', type: 'body', keyPoints: ['p3'], estimatedWords: 400 },
                        { key: 'conclusion', title: 'Conclusion', type: 'conclusion', keyPoints: ['p4'], estimatedWords: 200 },
                        { key: 'cta', title: 'CTA', type: 'cta', keyPoints: ['p5'], estimatedWords: 100 }
                    ],
                    totalEstimatedWords: 1400
                });
            }

            // Research always succeeds
            return JSON.stringify({
                painPoints: ['P1'],
                keyFacts: ['F1'],
                differentiators: ['D1'],
                relatedSubtopics: ['T1'],
                suggestedAngles: ['A1']
            });
        });

        const result = await runBlogPostPipeline(mockProvider, baseInput);

        expect(result.retryCount).toBeGreaterThan(0);
    }, 60000);

    it('should fail after max retries', async () => {
        // Always return invalid outline
        mockProvider.call = jest.fn(async (req) => {
            const promptToCheck = (req.systemPrompt || '') + (req.userPrompt || '');
            if (promptToCheck.includes('Content Strategist creating')) {
                return JSON.stringify({
                    sections: [{ key: 'intro', title: 'Intro', type: 'intro', keyPoints: [], estimatedWords: 100 }],
                    totalEstimatedWords: 100
                });
            }
            return JSON.stringify({
                painPoints: ['P1'],
                keyFacts: ['F1'],
                differentiators: ['D1'],
                relatedSubtopics: ['T1'],
                suggestedAngles: ['A1']
            });
        });

        const result = await runBlogPostPipeline(mockProvider, baseInput);

        expect(result.success).toBe(false);
        expect(result.error).toContain('quality gate failed');
    }, 60000);

    it('should handle agent failures gracefully', async () => {
        let failCount = 0;

        mockProvider.call = jest.fn(async (req) => {
            failCount++;
            const promptToCheck = (req.systemPrompt || '') + (req.userPrompt || '');

            // Research fails
            if (promptToCheck.includes('Content Strategist and Researcher')) {
                throw new Error('LLM Connection Error');
            }

            return JSON.stringify({});
        });

        const result = await runBlogPostPipeline(mockProvider, baseInput);

        expect(result.success).toBe(false);
        expect(result.error).toContain('Research failed');
    }, 30000);
});
