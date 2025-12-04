import { runResearchAgent, ResearchAgentInput } from '../../../lib/agents/research';
import { LLMProvider } from '../../../lib/agents/types';
import { EVERREACH_MARKETING_CONTEXT } from '../../../lib/context/marketing';

describe('Research Agent', () => {
    let mockProvider: LLMProvider;

    beforeEach(() => {
        mockProvider = {
            name: 'test-provider',
            call: jest.fn().mockResolvedValue(JSON.stringify({
                painPoints: ['Point 1', 'Point 2', 'Point 3'],
                keyFacts: ['Fact 1', 'Fact 2'],
                differentiators: ['Diff 1', 'Diff 2'],
                relatedSubtopics: ['Topic 1'],
                suggestedAngles: ['Angle 1', 'Angle 2']
            }))
        };
    });

    it('should successfully execute with valid input', async () => {
        const input: ResearchAgentInput = {
            topic: 'AI CRM for Sales',
            targetKeyword: 'AI CRM',
            clientProfile: {
                productServiceSummary: 'AI CRM tool',
                targetAudience: 'Sales teams'
            },
            marketingContext: EVERREACH_MARKETING_CONTEXT
        };

        const result = await runResearchAgent(mockProvider, input);

        expect(result.success).toBe(true);
        expect(result.data).toBeDefined();
        expect(result.data?.painPoints).toHaveLength(3);
        expect(result.data?.keyFacts).toHaveLength(2);
    });

    it('should inject marketing context into prompt', async () => {
        const input: ResearchAgentInput = {
            topic: 'Test Topic',
            clientProfile: {},
            marketingContext: EVERREACH_MARKETING_CONTEXT
        };

        await runResearchAgent(mockProvider, input);

        expect(mockProvider.call).toHaveBeenCalled();
        const callArgs = (mockProvider.call as jest.Mock).mock.calls[0][0];

        // Verify brand voice traits are in the prompt
        expect(callArgs.userPrompt).toContain('Direct, Confident, Helpful');
    });

    it('should handle LLM errors gracefully', async () => {
        mockProvider.call = jest.fn().mockRejectedValue(new Error('LLM Error'));

        const input: ResearchAgentInput = {
            topic: 'Test',
            clientProfile: {}
        };

        const result = await runResearchAgent(mockProvider, input);

        expect(result.success).toBe(false);
        expect(result.error).toBe('LLM Error');
    });

    it('should validate required output fields', async () => {
        mockProvider.call = jest.fn().mockResolvedValue(JSON.stringify({
            painPoints: [],
            keyFacts: [],
            // Missing required fields
        }));

        const input: ResearchAgentInput = {
            topic: 'Test',
            clientProfile: {}
        };

        const result = await runResearchAgent(mockProvider, input);

        // Should parse successfully even with minimal data
        expect(result.success).toBe(true);
        expect(result.data?.painPoints).toEqual([]);
    });

    it('should use default values when marketing context is missing', async () => {
        const input: ResearchAgentInput = {
            topic: 'Test Topic',
            clientProfile: {}
            // No marketingContext
        };

        await runResearchAgent(mockProvider, input);

        const callArgs = (mockProvider.call as jest.Mock).mock.calls[0][0];

        // Should use fallback values
        expect(callArgs.userPrompt).toContain('Professional, Helpful');
    });
});
