/**
 * Voice/Tone Agent
 * Analyzes content for brand voice alignment
 */

import { LLMProvider, AgentResult, VoiceToneResult, VoiceToneIssue } from './types';
import { MarketingContext } from '../context/marketing';

export interface VoiceToneAgentInput {
    fullDraftContent: string;
    marketingContext: MarketingContext;
    sectionContents: Record<string, string>;
}

/**
 * Run the Voice/Tone agent to analyze brand alignment
 */
export async function runVoiceToneAgent(
    provider: LLMProvider,
    input: VoiceToneAgentInput
): Promise<AgentResult<VoiceToneResult>> {
    try {
        // Truncate content if too long
        const maxContentLength = 3000;
        let contentToAnalyze = input.fullDraftContent;
        if (contentToAnalyze.length > maxContentLength) {
            contentToAnalyze = contentToAnalyze.substring(0, maxContentLength);
        }

        const systemPrompt = `You are a Brand Voice Analyst. Analyze content for brand voice alignment.`;

        const userPrompt = `BRAND VOICE TRAITS: ${input.marketingContext.brandVoice.join(', ')}

BRAND TONE: ${input.marketingContext.brandTone}

CONTENT DON'TS (things to avoid):
${input.marketingContext.contentDonts.map(d => `- ${d}`).join('\n')}
- Avoid buzzwords like "revolutionary", "game-changing", etc.

DRAFT CONTENT TO REVIEW:
${contentToAnalyze}

INSTRUCTIONS:
Analyze the content for brand voice alignment. Return a JSON object with:
- alignmentScore: 0-100 (how well content matches brand voice)
- issues: array of {sectionKey, issue, suggestion, severity}
- overallFeedback: summary of alignment
- passed: true if score >= 80`;

        const response = await provider.call({
            systemPrompt,
            userPrompt,
            temperature: 0.3
        });

        const result: VoiceToneResult = JSON.parse(response);

        return {
            success: true,
            data: result
        };
    } catch (error: any) {
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Check if content passes voice/tone requirements
 */
export function checkVoiceTonePassed(result: VoiceToneResult): boolean {
    return result.alignmentScore >= 80 && result.passed;
}

/**
 * Get high severity issues
 */
export function getHighSeverityIssues(issues: VoiceToneIssue[]): VoiceToneIssue[] {
    return issues.filter(i => i.severity === 'high');
}
