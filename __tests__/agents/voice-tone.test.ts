import { runVoiceToneAgent, VoiceToneAgentInput } from '../../../lib/agents/voice-tone';
import { LLMProvider } from '../../../lib/agents/types';
import { EVERREACH_MARKETING_CONTEXT } from '../../../lib/context/marketing';

describe('Voice/Tone Agent', () => {
    let mockProvider: LLMProvider;

    beforeEach(() => {
        mockProvider = {
            name: 'test-provider',
            call: jest.fn().mockResolvedValue(JSON.stringify({
                alignmentScore: 88,
                issues: [
                    {
                        sectionKey: 'intro',
                        issue: 'Use of passive voice',
                        suggestion: 'Rewrite in active voice',
                        severity: 'medium'
                    }
                ],
                overallFeedback: 'The content is well-aligned with brand voice. Minor improvements needed.',
                passed: true
            }))
        };
    });

    it('should analyze brand voice alignment', async () => {
        const input: VoiceToneAgentInput = {
            fullDraftContent: 'AI CRM helps sales teams work smarter. Direct benefits include time savings and better relationships.',
            marketingContext: EVERREACH_MARKETING_CONTEXT,
            sectionContents: {
                'intro': 'AI CRM helps sales teams work smarter.',
                'body': 'Direct benefits include time savings.'
            }
        };

        const result = await runVoiceToneAgent(mockProvider, input);

        expect(result.success).toBe(true);
        expect(result.data?.alignmentScore).toBeDefined();
        expect(result.data?.alignmentScore).toBeGreaterThanOrEqual(0);
        expect(result.data?.alignmentScore).toBeLessThanOrEqual(100);
    });

    it('should identify tone violations', async () => {
        mockProvider.call = jest.fn().mockResolvedValue(JSON.stringify({
            alignmentScore: 65,
            issues: [
                {
                    issue: 'Buzzword "revolutionary" used',
                    suggestion: 'Use concrete benefits instead',
                    severity: 'high'
                },
                {
                    issue: 'Passive voice in conclusion',
                    suggestion: 'Use active voice',
                    severity: 'medium'
                }
            ],
            overallFeedback: 'Several brand voice violations detected',
            passed: false
        }));

        const input: VoiceToneAgentInput = {
            fullDraftContent: 'Our revolutionary AI solution...',
            marketingContext: EVERREACH_MARKETING_CONTEXT,
            sectionContents: {}
        };

        const result = await runVoiceToneAgent(mockProvider, input);

        expect(result.data?.issues).toBeDefined();
        expect(result.data?.issues.length).toBeGreaterThan(0);
    });

    it('should categorize issues by severity', async () => {
        const input: VoiceToneAgentInput = {
            fullDraftContent: 'Content here',
            marketingContext: EVERREACH_MARKETING_CONTEXT,
            sectionContents: {}
        };

        const result = await runVoiceToneAgent(mockProvider, input);

        const issues = result.data?.issues || [];

        issues.forEach(issue => {
            expect(['low', 'medium', 'high']).toContain(issue.severity);
        });
    });

    it('should provide specific suggestions for fixes', async () => {
        const input: VoiceToneAgentInput = {
            fullDraftContent: 'Content here',
            marketingContext: EVERREACH_MARKETING_CONTEXT,
            sectionContents: {}
        };

        const result = await runVoiceToneAgent(mockProvider, input);

        const issues = result.data?.issues || [];

        issues.forEach(issue => {
            expect(issue.suggestion).toBeDefined();
            expect(issue.suggestion.length).toBeGreaterThan(0);
        });
    });

    it('should include brand voice traits in analysis', async () => {
        const input: VoiceToneAgentInput = {
            fullDraftContent: 'Test content',
            marketingContext: EVERREACH_MARKETING_CONTEXT,
            sectionContents: {}
        };

        await runVoiceToneAgent(mockProvider, input);

        const callArgs = (mockProvider.call as jest.Mock).mock.calls[0][0];

        // Should include brand voice traits
        expect(callArgs.userPrompt).toContain('Direct, Confident, Helpful');
    });

    it('should reference brand donts in evaluation', async () => {
        const input: VoiceToneAgentInput = {
            fullDraftContent: 'Test content',
            marketingContext: EVERREACH_MARKETING_CONTEXT,
            sectionContents: {}
        };

        await runVoiceToneAgent(mockProvider, input);

        const callArgs = (mockProvider.call as jest.Mock).mock.calls[0][0];

        // Should include brand don'ts
        expect(callArgs.userPrompt).toContain('buzzwords');
    });

    it('should truncate very long content for efficiency', async () => {
        const longContent = 'Lorem ipsum '.repeat(5000);

        const input: VoiceToneAgentInput = {
            fullDraftContent: longContent,
            marketingContext: EVERREACH_MARKETING_CONTEXT,
            sectionContents: {}
        };

        await runVoiceToneAgent(mockProvider, input);

        const callArgs = (mockProvider.call as jest.Mock).mock.calls[0][0];

        // Should truncate to 3000 chars
        const contentInPrompt = callArgs.userPrompt.match(/DRAFT CONTENT TO REVIEW:\n([\s\S]+?)(?=\n\nINSTRUCTIONS)/)?.[1] || '';
        expect(contentInPrompt.length).toBeLessThanOrEqual(3000);
    });

    it('should return passed status based on score', async () => {
        mockProvider.call = jest.fn().mockResolvedValue(JSON.stringify({
            alignmentScore: 90,
            issues: [],
            overallFeedback: 'Excellent',
            passed: true
        }));

        const input: VoiceToneAgentInput = {
            fullDraftContent: 'Content',
            marketingContext: EVERREACH_MARKETING_CONTEXT,
            sectionContents: {}
        };

        const result = await runVoiceToneAgent(mockProvider, input);

        expect(result.data?.passed).toBe(true);
        expect(result.data?.alignmentScore).toBeGreaterThanOrEqual(80);
    });

    it('should fail for low alignment scores', async () => {
        mockProvider.call = jest.fn().mockResolvedValue(JSON.stringify({
            alignmentScore: 60,
            issues: [
                { issue: 'Major tone issue', suggestion: 'Fix it', severity: 'high' }
            ],
            overallFeedback: 'Needs work',
            passed: false
        }));

        const input: VoiceToneAgentInput = {
            fullDraftContent: 'Content',
            marketingContext: EVERREACH_MARKETING_CONTEXT,
            sectionContents: {}
        };

        const result = await runVoiceToneAgent(mockProvider, input);

        expect(result.data?.passed).toBe(false);
        expect(result.data?.alignmentScore).toBeLessThan(80);
    });

    it('should handle LLM errors gracefully', async () => {
        mockProvider.call = jest.fn().mockRejectedValue(new Error('Service unavailable'));

        const input: VoiceToneAgentInput = {
            fullDraftContent: 'Content',
            marketingContext: EVERREACH_MARKETING_CONTEXT,
            sectionContents: {}
        };

        const result = await runVoiceToneAgent(mockProvider, input);

        expect(result.success).toBe(false);
        expect(result.error).toBe('Service unavailable');
    });
});
