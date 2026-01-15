/**
 * Research Agent
 * Gathers background research for content creation
 */

import { LLMProvider, AgentResult, ResearchResult } from './types';

export interface ResearchAgentInput {
    topic?: string;
    targetKeyword?: string;
    clientProfile: {
        clientName?: string;
        productServiceSummary?: string;
        targetAudience?: string;
        positioning?: string;
        valuePropositions?: string[];
        keyDifferentiators?: string[];
        competitors?: string[];
    };
    marketingContext?: any;
}

/**
 * Run the Research agent to gather topic insights
 * Enhanced with full brand context for better content alignment
 */
export async function runResearchAgent(
    provider: LLMProvider,
    input: ResearchAgentInput
): Promise<AgentResult<ResearchResult>> {
    try {
        const systemPrompt = `You are a Content Strategist and Researcher. Gather insights for content creation that aligns with the brand's positioning and differentiates from competitors.`;

        const userPrompt = `Research the following topic for a blog post:

TOPIC: ${input.topic}
TARGET KEYWORD: ${input.targetKeyword}

--- BRAND CONTEXT ---
CLIENT: ${input.clientProfile.clientName || 'Client'}
PRODUCT/SERVICE: ${input.clientProfile.productServiceSummary || 'General business'}
TARGET AUDIENCE: ${input.clientProfile.targetAudience || 'Business professionals'}
POSITIONING: ${input.clientProfile.positioning || 'Not specified'}

${input.clientProfile.valuePropositions?.length ? `VALUE PROPOSITIONS:
${input.clientProfile.valuePropositions.map(vp => `- ${vp}`).join('\n')}` : ''}

${input.clientProfile.keyDifferentiators?.length ? `KEY DIFFERENTIATORS:
${input.clientProfile.keyDifferentiators.map(d => `- ${d}`).join('\n')}` : ''}

${input.clientProfile.competitors?.length ? `COMPETITORS TO DIFFERENTIATE FROM: ${input.clientProfile.competitors.join(', ')}` : ''}
--- END BRAND CONTEXT ---

BRAND VOICE: ${input.marketingContext?.brandVoice?.join(', ') || 'Professional, Helpful'}
BRAND TONE: ${input.marketingContext?.brandTone || 'Professional'}

Return a JSON object with:
- painPoints: array of audience pain points this content addresses (aligned with target audience)
- keyFacts: array of key facts/statistics to include
- differentiators: array of unique angles vs competitors (use brand positioning)
- relatedSubtopics: array of related topics to consider
- suggestedAngles: array of content angle ideas (leverage value propositions)`;

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
