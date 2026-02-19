/**
 * AI Pipeline Integration Tests
 * Tests the full AI pipeline with realistic error scenarios,
 * timeout handling, and edge cases
 */

import { runBlogPostPipeline, PipelineInput } from '@/lib/pipeline/orchestrator';
import { runResearchAgent, ResearchAgentInput } from '@/lib/agents/research';
import { runOutlineAgent, OutlineAgentInput } from '@/lib/agents/outline';
import { runDraftAgent, DraftAgentInput } from '@/lib/agents/draft';
import { runSEOAgent } from '@/lib/agents/seo';
import { runVoiceToneAgent } from '@/lib/agents/voice-tone';
import { LLMProvider, LLMRequest } from '@/lib/agents/types';
import { EVERREACH_MARKETING_CONTEXT } from '@/lib/context/marketing';

describe('AI Pipeline Integration Tests', () => {
    let mockProvider: LLMProvider;
    let baseInput: PipelineInput;

    beforeEach(() => {
        // Default mock provider
        mockProvider = {
            name: 'test-openai',
            call: jest.fn(async (req: LLMRequest) => {
                const promptToCheck = (req.systemPrompt || '') + (req.userPrompt || '');

                if (promptToCheck.includes('Content Strategist and Researcher')) {
                    return JSON.stringify({
                        painPoints: ['Pain 1', 'Pain 2', 'Pain 3'],
                        keyFacts: ['Fact 1', 'Fact 2'],
                        differentiators: ['Diff 1', 'Diff 2'],
                        relatedSubtopics: ['Topic 1'],
                        suggestedAngles: ['Angle 1', 'Angle 2']
                    });
                } else if (promptToCheck.includes('Content Strategist creating')) {
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
                        content: 'Lorem ipsum dolor sit amet '.repeat(50),
                        wordCount: 250
                    });
                } else if (promptToCheck.includes('SEO expert')) {
                    return JSON.stringify({
                        title: 'Optimized SEO Title',
                        metaDescription: 'This is a well-optimized meta description.',
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
            blogPostId: 'test-post-123',
            topic: 'AI CRM Benefits for Sales Teams',
            targetKeyword: 'AI CRM',
            wordCountGoal: 1200,
            clientProfile: {
                productServiceSummary: 'AI-powered CRM platform',
                targetAudience: 'Sales teams and managers'
            },
            marketingContext: EVERREACH_MARKETING_CONTEXT
        };
    });

    describe('Error Handling', () => {
        it('should handle invalid JSON response from LLM', async () => {
            mockProvider.call = jest.fn().mockResolvedValue('Invalid JSON {{}');

            const result = await runResearchAgent(mockProvider, {
                topic: baseInput.topic,
                targetKeyword: baseInput.targetKeyword,
                clientProfile: baseInput.clientProfile
            });

            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
            expect(result.error).toContain('Unexpected token');
        });

        it('should handle LLM timeout errors', async () => {
            const timeoutError = new Error('Request timeout after 30000ms');
            timeoutError.name = 'TimeoutError';

            mockProvider.call = jest.fn().mockRejectedValue(timeoutError);

            const result = await runResearchAgent(mockProvider, {
                topic: baseInput.topic,
                clientProfile: baseInput.clientProfile
            });

            expect(result.success).toBe(false);
            expect(result.error).toBe('Request timeout after 30000ms');
        });

        it('should handle LLM API rate limit errors', async () => {
            const rateLimitError = new Error('Rate limit exceeded. Please try again later.');
            rateLimitError.name = 'RateLimitError';

            mockProvider.call = jest.fn().mockRejectedValue(rateLimitError);

            const result = await runOutlineAgent(mockProvider, {
                topic: baseInput.topic,
                targetKeyword: baseInput.targetKeyword,
                wordCountGoal: baseInput.wordCountGoal,
                clientProfile: baseInput.clientProfile
            });

            expect(result.success).toBe(false);
            expect(result.error).toBe('Rate limit exceeded. Please try again later.');
        });

        it('should handle LLM authentication errors', async () => {
            const authError = new Error('Invalid API key provided');
            authError.name = 'AuthenticationError';

            mockProvider.call = jest.fn().mockRejectedValue(authError);

            const result = await runDraftAgent(mockProvider, {
                section: {
                    key: 'intro',
                    title: 'Introduction',
                    type: 'intro',
                    keyPoints: ['Point 1'],
                    estimatedWords: 200
                },
                topic: baseInput.topic,
                targetKeyword: baseInput.targetKeyword,
                clientProfile: baseInput.clientProfile
            });

            expect(result.success).toBe(false);
            expect(result.error).toBe('Invalid API key provided');
        });

        it('should handle network errors', async () => {
            const networkError = new Error('Network request failed');
            networkError.name = 'NetworkError';

            mockProvider.call = jest.fn().mockRejectedValue(networkError);

            const result = await runSEOAgent(mockProvider, {
                fullDraftContent: 'Test content',
                topic: baseInput.topic,
                targetKeyword: baseInput.targetKeyword
            });

            expect(result.success).toBe(false);
            expect(result.error).toBe('Network request failed');
        });
    });

    describe('Edge Cases', () => {
        it('should handle empty LLM response', async () => {
            mockProvider.call = jest.fn().mockResolvedValue('');

            const result = await runResearchAgent(mockProvider, {
                topic: baseInput.topic,
                clientProfile: baseInput.clientProfile
            });

            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
        });

        it('should handle LLM returning null fields', async () => {
            mockProvider.call = jest.fn().mockResolvedValue(JSON.stringify({
                painPoints: null,
                keyFacts: null,
                differentiators: null,
                relatedSubtopics: null,
                suggestedAngles: null
            }));

            const result = await runResearchAgent(mockProvider, {
                topic: baseInput.topic,
                clientProfile: baseInput.clientProfile
            });

            expect(result.success).toBe(true);
            expect(result.data).toBeDefined();
        });

        it('should handle extremely long prompts', async () => {
            const longTopic = 'AI CRM '.repeat(1000); // Very long topic

            mockProvider.call = jest.fn(async (req: LLMRequest) => {
                expect(req.userPrompt.length).toBeGreaterThan(5000);
                return JSON.stringify({
                    painPoints: ['P1'],
                    keyFacts: ['F1'],
                    differentiators: ['D1'],
                    relatedSubtopics: ['T1'],
                    suggestedAngles: ['A1']
                });
            });

            const result = await runResearchAgent(mockProvider, {
                topic: longTopic,
                clientProfile: baseInput.clientProfile
            });

            expect(result.success).toBe(true);
            expect(mockProvider.call).toHaveBeenCalled();
        });

        it('should handle special characters in input', async () => {
            const specialTopic = 'How to use <script>alert("XSS")</script> in CRM';
            const specialKeyword = 'CRM & Sales | Performance';

            const result = await runResearchAgent(mockProvider, {
                topic: specialTopic,
                targetKeyword: specialKeyword,
                clientProfile: baseInput.clientProfile
            });

            expect(result.success).toBe(true);
            const callArgs = (mockProvider.call as jest.Mock).mock.calls[0][0];
            expect(callArgs.userPrompt).toContain(specialTopic);
            expect(callArgs.userPrompt).toContain(specialKeyword);
        });
    });

    describe('Pipeline Orchestration with Failures', () => {
        it('should fail fast when research agent fails', async () => {
            let callCount = 0;
            mockProvider.call = jest.fn(async () => {
                callCount++;
                throw new Error('API Error');
            });

            const result = await runBlogPostPipeline(mockProvider, baseInput);

            expect(result.success).toBe(false);
            expect(result.error).toContain('Research failed');
            expect(callCount).toBe(1); // Should not continue to other agents
        }, 30000);

        it('should handle intermittent failures with retry', async () => {
            let outlineCallCount = 0;

            mockProvider.call = jest.fn(async (req: LLMRequest) => {
                const promptToCheck = (req.systemPrompt || '') + (req.userPrompt || '');

                // Research succeeds
                if (promptToCheck.includes('Content Strategist and Researcher')) {
                    return JSON.stringify({
                        painPoints: ['P1', 'P2'],
                        keyFacts: ['F1', 'F2'],
                        differentiators: ['D1'],
                        relatedSubtopics: ['T1'],
                        suggestedAngles: ['A1']
                    });
                }

                // Outline fails twice, then succeeds
                if (promptToCheck.includes('Content Strategist creating')) {
                    outlineCallCount++;

                    if (outlineCallCount <= 2) {
                        // Return invalid outline (too few sections)
                        return JSON.stringify({
                            sections: [
                                { key: 'intro', title: 'Intro', type: 'intro', keyPoints: [], estimatedWords: 100 }
                            ],
                            totalEstimatedWords: 100
                        });
                    }

                    // Third attempt succeeds
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

                // Draft succeeds
                if (promptToCheck.includes('expert Content Writer')) {
                    return JSON.stringify({
                        content: 'Test content '.repeat(50),
                        wordCount: 250
                    });
                }

                // SEO succeeds
                if (promptToCheck.includes('SEO expert')) {
                    return JSON.stringify({
                        title: 'Great Title',
                        metaDescription: 'Great description'.repeat(10),
                        slug: 'great-title',
                        suggestions: [],
                        keywordDensity: 2.0,
                        readabilityScore: 'Good'
                    });
                }

                // Voice/Tone succeeds
                return JSON.stringify({
                    alignmentScore: 85,
                    issues: [],
                    overallFeedback: 'Good',
                    passed: true
                });
            });

            const result = await runBlogPostPipeline(mockProvider, baseInput);

            expect(result.success).toBe(true);
            expect(result.retryCount).toBeGreaterThan(0);
            expect(outlineCallCount).toBe(3);
        }, 60000);

        it('should track retry count correctly', async () => {
            let callCount = 0;

            mockProvider.call = jest.fn(async (req: LLMRequest) => {
                const promptToCheck = (req.systemPrompt || '') + (req.userPrompt || '');

                // Research succeeds
                if (promptToCheck.includes('Content Strategist and Researcher')) {
                    return JSON.stringify({
                        painPoints: ['P1'],
                        keyFacts: ['F1'],
                        differentiators: ['D1'],
                        relatedSubtopics: ['T1'],
                        suggestedAngles: ['A1']
                    });
                }

                // Outline always fails
                if (promptToCheck.includes('Content Strategist creating')) {
                    callCount++;
                    return JSON.stringify({
                        sections: [
                            { key: 'intro', title: 'Intro', type: 'intro', keyPoints: [], estimatedWords: 50 }
                        ],
                        totalEstimatedWords: 50
                    });
                }

                return JSON.stringify({});
            });

            const result = await runBlogPostPipeline(mockProvider, baseInput);

            expect(result.success).toBe(false);
            expect(result.retryCount).toBe(3); // MAX_RETRIES
            expect(callCount).toBe(3);
        }, 60000);
    });

    describe('Content Quality Validation', () => {
        it('should validate outline has minimum required sections', async () => {
            mockProvider.call = jest.fn().mockResolvedValue(JSON.stringify({
                sections: [
                    { key: 'intro', title: 'Intro', type: 'intro', keyPoints: [], estimatedWords: 100 },
                    { key: 'body1', title: 'Body', type: 'body', keyPoints: [], estimatedWords: 500 }
                    // Missing conclusion and CTA
                ],
                totalEstimatedWords: 600
            }));

            const result = await runBlogPostPipeline(mockProvider, baseInput);

            expect(result.success).toBe(false);
            expect(result.error).toContain('quality gate failed');
        }, 60000);

        it('should validate word count is close to goal', async () => {
            mockProvider.call = jest.fn(async (req: LLMRequest) => {
                const promptToCheck = (req.systemPrompt || '') + (req.userPrompt || '');

                if (promptToCheck.includes('Content Strategist and Researcher')) {
                    return JSON.stringify({
                        painPoints: ['P1'],
                        keyFacts: ['F1'],
                        differentiators: ['D1'],
                        relatedSubtopics: ['T1'],
                        suggestedAngles: ['A1']
                    });
                }

                // Outline with very low word count
                if (promptToCheck.includes('Content Strategist creating')) {
                    return JSON.stringify({
                        sections: [
                            { key: 'intro', title: 'Intro', type: 'intro', keyPoints: ['p1'], estimatedWords: 50 },
                            { key: 'body1', title: 'Main', type: 'body', keyPoints: ['p2'], estimatedWords: 50 },
                            { key: 'body2', title: 'Second', type: 'body', keyPoints: ['p3'], estimatedWords: 50 },
                            { key: 'conclusion', title: 'Conclusion', type: 'conclusion', keyPoints: ['p4'], estimatedWords: 50 },
                            { key: 'cta', title: 'CTA', type: 'cta', keyPoints: ['p5'], estimatedWords: 50 }
                        ],
                        totalEstimatedWords: 250 // Way below goal of 1200
                    });
                }

                return JSON.stringify({});
            });

            const result = await runBlogPostPipeline(mockProvider, baseInput);

            expect(result.success).toBe(false);
        }, 60000);
    });

    describe('Temperature and Model Parameters', () => {
        it('should use correct temperature for different agents', async () => {
            await runResearchAgent(mockProvider, {
                topic: baseInput.topic,
                clientProfile: baseInput.clientProfile
            });

            const researchCall = (mockProvider.call as jest.Mock).mock.calls[0][0];
            expect(researchCall.temperature).toBe(0.5);

            await runDraftAgent(mockProvider, {
                section: {
                    key: 'intro',
                    title: 'Introduction',
                    type: 'intro',
                    keyPoints: ['Point 1'],
                    estimatedWords: 200
                },
                topic: baseInput.topic,
                clientProfile: baseInput.clientProfile
            });

            const draftCall = (mockProvider.call as jest.Mock).mock.calls[1][0];
            expect(draftCall.temperature).toBe(0.7);
        });

        it('should pass correct LLM request structure', async () => {
            await runResearchAgent(mockProvider, {
                topic: baseInput.topic,
                targetKeyword: baseInput.targetKeyword,
                clientProfile: baseInput.clientProfile
            });

            const callArgs = (mockProvider.call as jest.Mock).mock.calls[0][0];

            expect(callArgs).toHaveProperty('systemPrompt');
            expect(callArgs).toHaveProperty('userPrompt');
            expect(callArgs).toHaveProperty('temperature');
            expect(callArgs.systemPrompt).toBeTruthy();
            expect(callArgs.userPrompt).toBeTruthy();
        });
    });

    describe('Context and Prompt Building', () => {
        it('should include marketing context in prompts', async () => {
            await runDraftAgent(mockProvider, {
                section: {
                    key: 'intro',
                    title: 'Introduction',
                    type: 'intro',
                    keyPoints: ['Point 1'],
                    estimatedWords: 200
                },
                topic: baseInput.topic,
                marketingContext: EVERREACH_MARKETING_CONTEXT
            });

            const callArgs = (mockProvider.call as jest.Mock).mock.calls[0][0];

            expect(callArgs.userPrompt).toContain('BRAND VOICE');
            expect(callArgs.userPrompt).toContain('TONE:');
        });

        it('should include previous sections context for draft agent', async () => {
            const previousSections = [
                'This is the introduction section.',
                'This is the first body section.'
            ];

            await runDraftAgent(mockProvider, {
                section: {
                    key: 'body2',
                    title: 'Second Section',
                    type: 'body',
                    keyPoints: ['Point 1'],
                    estimatedWords: 300
                },
                topic: baseInput.topic,
                previousSections
            });

            const callArgs = (mockProvider.call as jest.Mock).mock.calls[0][0];

            expect(callArgs.userPrompt).toContain('PREVIOUS SECTIONS FOR CONTEXT');
            expect(callArgs.userPrompt).toContain('first body section');
        });

        it('should include research data in outline prompt', async () => {
            const researchData = {
                painPoints: ['Pain 1', 'Pain 2'],
                keyFacts: ['Fact 1', 'Fact 2'],
                differentiators: ['Diff 1'],
                relatedSubtopics: ['Topic 1'],
                suggestedAngles: ['Angle 1']
            };

            await runOutlineAgent(mockProvider, {
                topic: baseInput.topic,
                targetKeyword: baseInput.targetKeyword,
                wordCountGoal: baseInput.wordCountGoal,
                researchData,
                clientProfile: baseInput.clientProfile
            });

            const callArgs = (mockProvider.call as jest.Mock).mock.calls[0][0];

            expect(callArgs.userPrompt).toContain('RESEARCH INSIGHTS');
            expect(callArgs.userPrompt).toContain('Pain 1');
            expect(callArgs.userPrompt).toContain('Fact 1');
        });
    });
});
