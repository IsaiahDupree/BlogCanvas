import { runOutlineAgent, OutlineAgentInput } from '@/lib/agents/outline';
import { LLMProvider } from '@/lib/agents/types';
import { EVERREACH_MARKETING_CONTEXT } from '@/lib/context/marketing';

describe('Outline Agent', () => {
    let mockProvider: LLMProvider;

    beforeEach(() => {
        mockProvider = {
            name: 'test-provider',
            call: jest.fn().mockResolvedValue(JSON.stringify({
                sections: [
                    { key: 'intro', title: 'Introduction', type: 'intro', keyPoints: ['Hook', 'Context'], estimatedWords: 200 },
                    { key: 'section_1', title: 'Main Point', type: 'body', keyPoints: ['Point A', 'Point B'], estimatedWords: 400 },
                    { key: 'section_2', title: 'Secondary Point', type: 'body', keyPoints: ['Point C'], estimatedWords: 350 },
                    { key: 'conclusion', title: 'Wrap Up', type: 'conclusion', keyPoints: ['Summary'], estimatedWords: 150 },
                    { key: 'cta', title: 'Call to Action', type: 'cta', keyPoints: ['Next steps'], estimatedWords: 100 }
                ],
                totalEstimatedWords: 1200
            }))
        };
    });

    it('should generate a structured outline with proper sections', async () => {
        const input: OutlineAgentInput = {
            topic: 'AI CRM Benefits',
            targetKeyword: 'AI CRM',
            researchData: {
                painPoints: ['Manual work', 'Lost leads'],
                keyFacts: ['70% efficiency gain'],
                differentiators: ['AI-powered', 'Automated'],
                relatedSubtopics: ['CRM automation'],
                suggestedAngles: ['ROI focus']
            },
            clientProfile: {
                targetAudience: 'Sales teams'
            },
            marketingContext: EVERREACH_MARKETING_CONTEXT,
            wordCountGoal: 1200
        };

        const result = await runOutlineAgent(mockProvider, input);

        expect(result.success).toBe(true);
        expect(result.data?.sections).toHaveLength(5);
        expect(result.data?.totalEstimatedWords).toBe(1200);
    });

    it('should include intro, body, conclusion, and CTA sections', async () => {
        const input: OutlineAgentInput = {
            topic: 'Test',
            researchData: {
                painPoints: ['P1'],
                keyFacts: ['F1'],
                differentiators: ['D1'],
                relatedSubtopics: ['T1'],
                suggestedAngles: ['A1']
            },
            clientProfile: {}
        };

        const result = await runOutlineAgent(mockProvider, input);

        const sections = result.data?.sections || [];
        const types = sections.map(s => s.type);

        expect(types).toContain('intro');
        expect(types).toContain('body');
        expect(types).toContain('conclusion');
        expect(types).toContain('cta');
    });

    it('should inject research pain points and differentiators into prompt', async () => {
        const input: OutlineAgentInput = {
            topic: 'Test Topic',
            researchData: {
                painPoints: ['Unique Pain Point'],
                keyFacts: ['Unique Fact'],
                differentiators: ['Unique Differentiator'],
                relatedSubtopics: ['Topic 1'],
                suggestedAngles: ['Angle 1']
            },
            clientProfile: {}
        };

        await runOutlineAgent(mockProvider, input);

        const callArgs = (mockProvider.call as jest.Mock).mock.calls[0][0];
        expect(callArgs.userPrompt).toContain('Unique Pain Point');
        expect(callArgs.userPrompt).toContain('Unique Differentiator');
    });

    it('should respect word count goal', async () => {
        const input: OutlineAgentInput = {
            topic: 'Test',
            researchData: {
                painPoints: ['P1'],
                keyFacts: ['F1'],
                differentiators: ['D1'],
                relatedSubtopics: ['T1'],
                suggestedAngles: ['A1']
            },
            clientProfile: {},
            wordCountGoal: 2000
        };

        await runOutlineAgent(mockProvider, input);

        const callArgs = (mockProvider.call as jest.Mock).mock.calls[0][0];
        expect(callArgs.userPrompt).toContain('2000');
    });

    it('should handle invalid JSON response', async () => {
        mockProvider.call = jest.fn().mockResolvedValue('Invalid JSON {');

        const input: OutlineAgentInput = {
            topic: 'Test',
            researchData: {
                painPoints: ['P1'],
                keyFacts: ['F1'],
                differentiators: ['D1'],
                relatedSubtopics: ['T1'],
                suggestedAngles: ['A1']
            },
            clientProfile: {}
        };

        const result = await runOutlineAgent(mockProvider, input);

        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
    });

    it('should handle missing optional fields gracefully', async () => {
        mockProvider.call = jest.fn().mockResolvedValue(JSON.stringify({
            sections: [
                { key: 'intro', title: 'Intro', type: 'intro', keyPoints: ['p1'], estimatedWords: 200 }
            ],
            totalEstimatedWords: 200
        }));

        const input: OutlineAgentInput = {
            topic: 'Test',
            researchData: {
                painPoints: ['P1'],
                keyFacts: ['F1'],
                differentiators: ['D1'],
                relatedSubtopics: ['T1'],
                suggestedAngles: ['A1']
            },
            clientProfile: {}
            // No targetKeyword, wordCountGoal, marketingContext
        };

        const result = await runOutlineAgent(mockProvider, input);

        expect(result.success).toBe(true);
    });
});
