/**
 * Research Agent
 * Gathers background research for content creation
 */

import { LLMProvider, AgentResult, ResearchResult } from './types';

export interface ResearchAgentInput {
    topic?: string;
    targetKeyword?: string;
    clientProfile: {
        productServiceSummary?: string;
        targetAudience?: string;
    };
    marketingContext?: any; // Avoiding circular dependency or import
}

/**
 * Run the Research agent to gather topic insights
 */
export async function runResearchAgent(
    provider: LLMProvider,
    input: ResearchAgentInput
): Promise<AgentResult<ResearchResult>> {
    try {
        const systemPrompt = `You are a Content Strategist and Researcher. Gather insights for content creation.`;

        const userPrompt = `Research the following topic for a blog post:

TOPIC: ${input.topic}
TARGET KEYWORD: ${input.targetKeyword}
PRODUCT/SERVICE: ${input.clientProfile.productServiceSummary}
TARGET AUDIENCE: ${input.clientProfile.targetAudience}

BRAND VOICE: ${input.marketingContext?.brandVoice?.join(', ') || 'Professional, Helpful'}
BRAND TONE: ${input.marketingContext?.brandTone || 'Professional, Helpful'}

Return a JSON object with:
- painPoints: array of audience pain points this content addresses
- keyFacts: array of key facts/statistics to include
- differentiators: array of unique angles vs competitors
- relatedSubtopics: array of related topics to consider
- suggestedAngles: array of content angle ideas`;

        const response = await provider.call({
            systemPrompt,
            userPrompt,
            temperature: 0.5
        });

        const result: ResearchResult = JSON.parse(response);

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
