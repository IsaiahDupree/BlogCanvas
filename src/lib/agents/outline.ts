/**
 * Outline Agent
 * Creates structured content outlines with multiple options
 */

import { LLMProvider, AgentResult, OutlineResult, OutlineSection, ResearchResult } from './types';

export interface OutlineAgentInput {
    topic: string;
    targetKeyword: string;
    wordCountGoal: number;
    research?: ResearchResult;
    researchData?: ResearchResult;
    clientProfile: {
        productServiceSummary?: string;
        targetAudience?: string;
    };
}

export interface OutlineOptionsResult {
    options: OutlineResult[];
    totalGenerated: number;
}

/**
 * Run the Outline agent to create content structure (single outline - legacy)
 */
export async function runOutlineAgent(
    provider: LLMProvider,
    input: OutlineAgentInput
): Promise<AgentResult<OutlineResult>> {
    try {
        const systemPrompt = `You are a Content Strategist creating blog post outlines.`;

        const userPrompt = `Create a detailed outline for a blog post:

TOPIC: ${input.topic}
TARGET KEYWORD: ${input.targetKeyword}
WORD COUNT GOAL: ${input.wordCountGoal}
PRODUCT/SERVICE: ${input.clientProfile.productServiceSummary}
TARGET AUDIENCE: ${input.clientProfile.targetAudience}

INSTRUCTIONS:
Analyze the provided research and create a blog post outline.

RESEARCH INSIGHTS:
- Pain Points: ${(input.research || input.researchData)?.painPoints?.join(', ') || ''}
- Key Facts: ${(input.research || input.researchData)?.keyFacts?.join(', ') || ''}
- Differentiators: ${(input.research || input.researchData)?.differentiators?.join(', ') || ''}
- Related Subtopics: ${(input.research || input.researchData)?.relatedSubtopics?.join(', ') || ''}
- Suggested Angles: ${(input.research || input.researchData)?.suggestedAngles?.join(', ') || ''}

Return a JSON object with:
- sections: array of {key, title, type, keyPoints, estimatedWords}
  - key: unique identifier (e.g., 'intro', 'body1', 'conclusion')
  - title: section heading
  - type: one of 'intro', 'body', 'conclusion', 'cta', 'faq'
  - keyPoints: array of key points to cover
  - estimatedWords: word count for this section
- totalEstimatedWords: sum of all section word counts
- faqs: array of 3-5 frequently asked questions with {question, suggestedAnswer}
  - Questions should be relevant to the topic and address common concerns
  - Answers should be concise (50-100 words each)
- tableSuggestions: array of 1-3 table ideas with {title, description, suggestedColumns, suggestedRows, placement}
  - Tables should help visualize comparisons, features, or data
  - placement: which section key to place the table after

Requirements:
- Must have at least 4 sections minimum
- Must include intro, at least 2 body sections, conclusion, and CTA
- Total words should be close to word count goal
- Include 3-5 relevant FAQs
- Suggest 1-3 helpful tables if applicable to the topic`;

        const response = await provider.call({
            systemPrompt,
            userPrompt,
            temperature: 0.5
        });

        const result: OutlineResult = JSON.parse(response);

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
 * Run the Outline agent to create 3 distinct outline options
 */
export async function runOutlineAgentWithOptions(
    provider: LLMProvider,
    input: OutlineAgentInput
): Promise<AgentResult<OutlineOptionsResult>> {
    try {
        const systemPrompt = `You are a Content Strategist creating blog post outlines.`;

        const userPrompt = `Create 3 DISTINCT outline options for a blog post:

TOPIC: ${input.topic}
TARGET KEYWORD: ${input.targetKeyword}
WORD COUNT GOAL: ${input.wordCountGoal}
PRODUCT/SERVICE: ${input.clientProfile.productServiceSummary}
TARGET AUDIENCE: ${input.clientProfile.targetAudience}

INSTRUCTIONS:
Analyze the provided research and create 3 DIFFERENT outline approaches. Each outline should take a unique angle or structure.

RESEARCH INSIGHTS:
- Pain Points: ${(input.research || input.researchData)?.painPoints?.join(', ') || ''}
- Key Facts: ${(input.research || input.researchData)?.keyFacts?.join(', ') || ''}
- Differentiators: ${(input.research || input.researchData)?.differentiators?.join(', ') || ''}
- Related Subtopics: ${(input.research || input.researchData)?.relatedSubtopics?.join(', ') || ''}
- Suggested Angles: ${(input.research || input.researchData)?.suggestedAngles?.join(', ') || ''}

VARIATION STRATEGY:
Option 1: Problem-Solution approach (focus on pain points, then solutions)
Option 2: Educational/How-To approach (step-by-step guide structure)
Option 3: Comprehensive Guide approach (broad overview with deep dives)

Return a JSON object with:
- options: array of 3 outline objects, each with:
  - sections: array of {key, title, type, keyPoints, estimatedWords}
    - key: unique identifier (e.g., 'intro', 'body1', 'conclusion')
    - title: section heading
    - type: one of 'intro', 'body', 'conclusion', 'cta', 'faq'
    - keyPoints: array of key points to cover
    - estimatedWords: word count for this section
  - totalEstimatedWords: sum of all section word counts
  - faqs: array of 3-5 frequently asked questions with {question, suggestedAnswer}
    - Questions should be relevant to the topic and address common concerns
    - Answers should be concise (50-100 words each)
  - tableSuggestions: array of 1-3 table ideas with {title, description, suggestedColumns, suggestedRows, placement}
    - Tables should help visualize comparisons, features, or data
    - placement: which section key to place the table after
- totalGenerated: 3

Requirements for EACH outline:
- Must have at least 4 sections minimum
- Must include intro, at least 2 body sections, conclusion, and CTA
- Total words should be close to word count goal
- Each outline must be structurally different from the others
- Include 3-5 relevant FAQs per outline
- Suggest 1-3 helpful tables if applicable to the topic`;

        const response = await provider.call({
            systemPrompt,
            userPrompt,
            temperature: 0.8 // Higher temperature for more variation
        });

        const result: OutlineOptionsResult = JSON.parse(response);

        // Validate we got 3 options
        if (!result.options || result.options.length !== 3) {
            return {
                success: false,
                error: `Expected 3 outline options, got ${result.options?.length || 0}`
            };
        }

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
 * Validate outline meets requirements
 */
export function validateOutline(outline: OutlineResult, wordCountGoal: number): {
    valid: boolean;
    issues: string[];
} {
    const issues: string[] = [];

    if (outline.sections.length < 4) {
        issues.push(`Too few sections: ${outline.sections.length} (minimum 4 required)`);
    }

    const hasIntro = outline.sections.some(s => s.type === 'intro');
    const hasConclusion = outline.sections.some(s => s.type === 'conclusion');
    const hasCta = outline.sections.some(s => s.type === 'cta');
    const bodyCount = outline.sections.filter(s => s.type === 'body').length;

    if (!hasIntro) issues.push('Missing introduction section');
    if (!hasConclusion) issues.push('Missing conclusion section');
    if (!hasCta) issues.push('Missing CTA section');
    if (bodyCount < 2) issues.push(`Need at least 2 body sections, found ${bodyCount}`);

    const wordRatio = outline.totalEstimatedWords / wordCountGoal;
    if (wordRatio < 0.8) {
        issues.push(`Word count too low: ${outline.totalEstimatedWords} (goal: ${wordCountGoal})`);
    }

    return {
        valid: issues.length === 0,
        issues
    };
}
