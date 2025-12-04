import { runDraftAgent, DraftAgentInput } from '../../../lib/agents/draft';
import { LLMProvider } from '../../../lib/agents/types';
import { EVERREACH_MARKETING_CONTEXT } from '../../../lib/context/marketing';

describe('Draft Agent', () => {
    let mockProvider: LLMProvider;

    beforeEach(() => {
        mockProvider = {
            name: 'test-provider',
            call: jest.fn().mockResolvedValue(JSON.stringify({
                content: '## Introduction\n\nThis is a well-crafted introduction that hooks the reader with a compelling narrative about AI-powered CRM solutions.',
                wordCount: 250
            }))
        };
    });

    it('should generate content for a section', async () => {
        const input: DraftAgentInput = {
            topic: 'AI CRM Guide',
            section: {
                key: 'intro',
                title: 'Introduction',
                type: 'intro',
                keyPoints: ['Hook reader', 'Introduce problem'],
                estimatedWords: 250
            },
            researchData: {
                painPoints: ['Manual processes'],
                keyFacts: ['70% time savings'],
                differentiators: ['AI-powered'],
                relatedSubtopics: ['Automation'],
                suggestedAngles: ['ROI focus']
            },
            clientProfile: {
                targetAudience: 'Sales professionals'
            },
            marketingContext: EVERREACH_MARKETING_CONTEXT
        };

        const result = await runDraftAgent(mockProvider, input);

        expect(result.success).toBe(true);
        expect(result.data?.content).toBeDefined();
        expect(result.data?.wordCount).toBeGreaterThan(0);
        expect(result.data?.sectionKey).toBe('intro');
    });

    it('should inject brand voice and tone into prompt', async () => {
        const input: DraftAgentInput = {
            topic: 'Test',
            section: {
                key: 's1',
                title: 'Test Section',
                type: 'body',
                keyPoints: ['Point 1'],
                estimatedWords: 200
            },
            researchData: {
                painPoints: ['P1'],
                keyFacts: ['F1'],
                differentiators: ['D1'],
                relatedSubtopics: ['T1'],
                suggestedAngles: ['A1']
            },
            clientProfile: {},
            marketingContext: EVERREACH_MARKETING_CONTEXT
        };

        await runDraftAgent(mockProvider, input);

        const callArgs = (mockProvider.call as jest.Mock).mock.calls[0][0];

        // Should include brand voice traits
        expect(callArgs.userPrompt).toContain('Direct, Confident, Helpful');

        // Should include brand don'ts
        expect(callArgs.userPrompt).toContain('buzzwords');
    });

    it('should include key points in the prompt', async () => {
        const input: DraftAgentInput = {
            topic: 'Test',
            section: {
                key: 's1',
                title: 'Section',
                type: 'body',
                keyPoints: ['Unique Key Point A', 'Unique Key Point B'],
                estimatedWords: 200
            },
            researchData: {
                painPoints: ['P1'],
                keyFacts: ['F1'],
                differentiators: ['D1'],
                relatedSubtopics: ['T1'],
                suggestedAngles: ['A1']
            },
            clientProfile: {}
        };

        await runDraftAgent(mockProvider, input);

        const callArgs = (mockProvider.call as jest.Mock).mock.calls[0][0];
        expect(callArgs.userPrompt).toContain('Unique Key Point A');
        expect(callArgs.userPrompt).toContain('Unique Key Point B');
    });

    it('should handle different section types appropriately', async () => {
        const sectionTypes = ['intro', 'body', 'conclusion', 'cta'];

        for (const type of sectionTypes) {
            const input: DraftAgentInput = {
                topic: 'Test',
                section: {
                    key: type,
                    title: `${type} section`,
                    type,
                    keyPoints: ['Point 1'],
                    estimatedWords: 200
                },
                researchData: {
                    painPoints: ['P1'],
                    keyFacts: ['F1'],
                    differentiators: ['D1'],
                    relatedSubtopics: ['T1'],
                    suggestedAngles: ['A1']
                },
                clientProfile: {}
            };

            const result = await runDraftAgent(mockProvider, input);
            expect(result.success).toBe(true);
        }
    });

    it('should handle LLM errors gracefully', async () => {
        mockProvider.call = jest.fn().mockRejectedValue(new Error('API timeout'));

        const input: DraftAgentInput = {
            topic: 'Test',
            section: {
                key: 's1',
                title: 'Test',
                type: 'body',
                keyPoints: ['P1'],
                estimatedWords: 200
            },
            researchData: {
                painPoints: ['P1'],
                keyFacts: ['F1'],
                differentiators: ['D1'],
                relatedSubtopics: ['T1'],
                suggestedAngles: ['A1']
            },
            clientProfile: {}
        };

        const result = await runDraftAgent(mockProvider, input);

        expect(result.success).toBe(false);
        expect(result.error).toBe('API timeout');
    });

    it('should use fallback values when marketing context is missing', async () => {
        const input: DraftAgentInput = {
            topic: 'Test',
            section: {
                key: 's1',
                title: 'Test',
                type: 'body',
                keyPoints: ['P1'],
                estimatedWords: 200
            },
            researchData: {
                painPoints: ['P1'],
                keyFacts: ['F1'],
                differentiators: ['D1'],
                relatedSubtopics: ['T1'],
                suggestedAngles: ['A1']
            },
            clientProfile: {}
            // No marketingContext
        };

        await runDraftAgent(mockProvider, input);

        const callArgs = (mockProvider.call as jest.Mock).mock.calls[0][0];

        // Should use fallback values
        expect(callArgs.userPrompt).toContain('Professional');
    });
});
