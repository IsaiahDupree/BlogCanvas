/**
 * Draft Agent
 * Writes content sections based on outline
 */

import { LLMProvider, AgentResult, DraftSectionResult, OutlineSection } from './types';
import { MarketingContext } from '../context/marketing';

export interface DraftAgentInput {
    section: OutlineSection;
    topic: string;
    targetKeyword?: string;
    marketingContext?: MarketingContext;
    previousSections?: string[];
    researchData?: any;
    clientProfile?: {
        productServiceSummary?: string;
        targetAudience?: string;
    };
}

/**
 * Run the Draft agent to write a section
 */
export async function runDraftAgent(
    provider: LLMProvider,
    input: DraftAgentInput
): Promise<AgentResult<DraftSectionResult>> {
    try {
        const systemPrompt = `You are an expert Content Writer creating blog post sections.`;

        const userPrompt = `Write the following section of a blog post:

SECTION: ${input.section.title} (${input.section.type})
KEY POINTS TO COVER:
${input.section.keyPoints.map(p => `- ${p}`).join('\n')}

TARGET WORD COUNT: ${input.section.estimatedWords} words
TARGET KEYWORD: ${input.targetKeyword}
TOPIC: ${input.topic}

BRAND VOICE: ${input.marketingContext?.brandVoice?.join(', ') || 'Professional, Clear'}
BRAND TONE: ${input.marketingContext?.brandTone || 'Professional'}
BRAND DON'TS: ${input.marketingContext?.contentDonts?.join(', ') || 'Jargon, Passive Voice'}

${input.previousSections && input.previousSections.length > 0 ?
                `PREVIOUS SECTIONS FOR CONTEXT:
${input.previousSections.slice(-2).join('\n\n---\n\n')}` : ''}

Return a JSON object with:
- content: the written section content (markdown format)
- wordCount: actual word count`;

        const response = await provider.call({
            systemPrompt,
            userPrompt,
            temperature: 0.7
        });

        const result: DraftSectionResult = JSON.parse(response);
        result.sectionKey = input.section.key;

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
 * Combine multiple sections into a full draft
 */
export function combineSections(sections: { key: string; content: string }[]): string {
    return sections.map(s => s.content).join('\n\n');
}
