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
    marketingContext?: MarketingContext & {
        positioning?: string;
        keyMessages?: string[];
        valuePropositions?: string[];
        keywordsToInclude?: string[];
        keywordsToAvoid?: string[];
        formalityLevel?: number;
        playfulnessLevel?: number;
        styleNotes?: string;
    };
    previousSections?: string[];
    researchData?: any;
    clientProfile?: {
        productServiceSummary?: string;
        targetAudience?: string;
        positioning?: string;
    };
}

/**
 * Run the Draft agent to write a section
 * Enhanced with full brand context for better alignment
 * PRD feat-092: Explicit intro/teaser/body/conclusion structure
 */
export async function runDraftAgent(
    provider: LLMProvider,
    input: DraftAgentInput
): Promise<AgentResult<DraftSectionResult>> {
    try {
        const systemPrompt = `You are an expert Content Writer creating blog post sections that align perfectly with brand voice and positioning.`;

        // Build section-specific instructions based on type
        let sectionInstructions = '';
        if (input.section.type === 'intro') {
            sectionInstructions = `
INTRO STRUCTURE REQUIREMENTS (feat-092):
1. HOOK/TEASER (2-3 sentences): Start with an attention-grabbing opening that immediately hooks the reader. Use a compelling question, surprising statistic, relatable scenario, or bold statement.
2. CONTEXT PARAGRAPH (3-4 sentences): Establish relevance and connect with the reader's pain point or interest.
3. VALUE PROPOSITION (2-3 sentences): Clearly state what the reader will learn and why it matters to them.

Your intro must be COMPELLING and make readers want to continue reading.`;
        } else if (input.section.type === 'conclusion' || input.section.type === 'cta') {
            sectionInstructions = `
CONCLUSION STRUCTURE REQUIREMENTS (feat-092):
1. SUMMARY (2-3 sentences): Briefly recap the key points covered in the article.
2. ACTIONABLE TAKEAWAY (2-3 sentences): Give readers clear, practical next steps they can implement.
3. CALL TO ACTION (1-2 sentences): End with a strong CTA that encourages specific action (subscribe, try a tool, book a demo, share the article, etc.).

Your conclusion must be ACTIONABLE and provide clear next steps.`;
        } else if (input.section.type === 'body') {
            sectionInstructions = `
BODY SECTION REQUIREMENTS (feat-092):
1. Clear subheading (H2 or H3)
2. COMPREHENSIVE coverage of the topic with specific details and examples
3. Use bullet points, numbered lists, or short paragraphs for readability
4. Include concrete examples, statistics, or case studies when relevant
5. Maintain logical flow from previous sections

Your body content must be COMPREHENSIVE and valuable.`;
        }

        const userPrompt = `Write the following section of a blog post:

SECTION: ${input.section.title} (${input.section.type})
KEY POINTS TO COVER:
${input.section.keyPoints.map(p => `- ${p}`).join('\n')}

TARGET WORD COUNT: ${input.section.estimatedWords} words
TARGET KEYWORD: ${input.targetKeyword}
TOPIC: ${input.topic}
${sectionInstructions}

--- BRAND VOICE GUIDELINES ---
VOICE: ${input.marketingContext?.brandVoice?.join(', ') || 'Professional, Clear'}
TONE: ${input.marketingContext?.brandTone || 'Professional'}
FORMALITY: ${input.marketingContext?.formalityLevel || 5}/10 (1=casual, 10=very formal)
PLAYFULNESS: ${input.marketingContext?.playfulnessLevel || 3}/10 (1=serious, 10=playful)

${input.marketingContext?.positioning ? `BRAND POSITIONING: ${input.marketingContext.positioning}` : ''}

${input.marketingContext?.keyMessages?.length ? `KEY MESSAGES TO WEAVE IN:
${input.marketingContext.keyMessages.map(m => `- ${m}`).join('\n')}` : ''}

${input.marketingContext?.valuePropositions?.length ? `VALUE PROPOSITIONS:
${input.marketingContext.valuePropositions.map(v => `- ${v}`).join('\n')}` : ''}

${input.marketingContext?.keywordsToInclude?.length ? `KEYWORDS TO INCLUDE: ${input.marketingContext.keywordsToInclude.join(', ')}` : ''}
${input.marketingContext?.keywordsToAvoid?.length ? `KEYWORDS TO AVOID: ${input.marketingContext.keywordsToAvoid.join(', ')}` : ''}
${input.marketingContext?.styleNotes ? `STYLE NOTES: ${input.marketingContext.styleNotes}` : ''}

CONTENT DON'TS: ${input.marketingContext?.contentDonts?.join(', ') || 'Jargon, Passive Voice'}
--- END VOICE GUIDELINES ---

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
