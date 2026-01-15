/**
 * SEO Agent
 * Optimizes content for search engines
 * PRD feat-093: Includes internal link hints
 * feat-172: Enhanced to use full SharedClientContext for title guidelines
 */

import { LLMProvider, AgentResult, SEOMetadata } from './types';
import type { SharedClientContext } from '../brand/shared-context';
import { formatContextForAI } from '../brand/shared-context';

export interface SEOAgentInput {
    fullDraftContent: string;
    topic?: string;
    targetKeyword?: string;
    wordCount?: number;
    existingContent?: {
        title: string;
        targetKeyword: string;
        url?: string;
    }[];
    // feat-172: Full brand context from shared-context service
    brandContext?: SharedClientContext;
}

/**
 * Run the SEO agent to optimize content
 * Enhanced with internal link hints (feat-093)
 * feat-172: Now uses full SharedClientContext for title guidelines
 */
export async function runSEOAgent(
    provider: LLMProvider,
    input: SEOAgentInput
): Promise<AgentResult<SEOMetadata>> {
    try {
        const systemPrompt = `You are an SEO expert optimizing blog content for search engines and internal linking strategy.`;

        // Build existing content context for internal linking
        const existingContentContext = input.existingContent && input.existingContent.length > 0
            ? `\n\nEXISTING CONTENT FOR INTERNAL LINKING:
${input.existingContent.map(c => `- "${c.title}" (keyword: ${c.targetKeyword})`).join('\n')}

Analyze the content and suggest 3-5 internal link opportunities where this new content could naturally link to existing content. For each link hint, provide:
- anchorText: The exact phrase in the content to turn into a link
- suggestedTargetKeyword: The keyword of the existing post to link to
- placement: Which section/paragraph the link should appear in
- reasoning: Why this link makes sense from an SEO and user experience perspective`
            : '';

        // feat-172: Add title guidelines from brand context
        const titleGuidelinesSection = input.brandContext?.titleGuidelines ? `

TITLE GUIDELINES:
- Preferred Formats: ${input.brandContext.titleGuidelines.preferredFormats.join(', ')}
- Power Words: ${input.brandContext.titleGuidelines.powerWords.join(', ')}
- Words to Avoid: ${input.brandContext.titleGuidelines.wordsToAvoid.join(', ')}
- High-Performing Patterns: ${input.brandContext.titleGuidelines.highPerformingPatterns.join(', ')}

Use these guidelines when crafting the SEO title.` : '';

        const userPrompt = `Optimize the following content for SEO:

TOPIC: ${input.topic}
TARGET KEYWORD: ${input.targetKeyword}

CONTENT:
${input.fullDraftContent.substring(0, 3000)}... [truncated]
${existingContentContext}${titleGuidelinesSection}

Return a JSON object with:
- title: SEO-optimized title (50-60 chars, include keyword)${titleGuidelinesSection ? ' - Follow the title guidelines above' : ''}
- metaDescription: compelling meta description (120-160 chars)
- slug: URL-friendly slug
- suggestions: array of improvement suggestions
- keywordDensity: calculated keyword density percentage
- readabilityScore: "Good", "Fair", or "Needs Improvement"
${input.existingContent && input.existingContent.length > 0 ? `- internalLinkHints: array of 3-5 internal link opportunities with {anchorText, suggestedTargetKeyword, placement, reasoning}` : ''}

INTERNAL LINK BEST PRACTICES (feat-093):
- Use descriptive, natural anchor text (not "click here")
- Link to contextually relevant content
- Place links where they add value for readers
- Optimize anchor text for target keywords
- Distribute links naturally throughout the content`;

        const response = await provider.call({
            systemPrompt,
            userPrompt,
            temperature: 0.3
        });

        const result: SEOMetadata = JSON.parse(response);

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
 * Check if SEO metadata passes requirements
 */
export function validateSEOMetadata(metadata: SEOMetadata): {
    passed: boolean;
    issues: string[];
} {
    const issues: string[] = [];

    if (metadata.title.length < 30) {
        issues.push('Title too short (should be 50-60 chars)');
    }
    if (metadata.title.length > 70) {
        issues.push('Title too long (should be 50-60 chars)');
    }

    if (metadata.metaDescription.length < 100) {
        issues.push('Meta description too short (should be 120-160 chars)');
    }
    if (metadata.metaDescription.length > 170) {
        issues.push('Meta description too long (should be 120-160 chars)');
    }

    if (metadata.keywordDensity < 0.5) {
        issues.push('Keyword density too low (aim for 1-3%)');
    }
    if (metadata.keywordDensity > 4) {
        issues.push('Keyword density too high (may be seen as stuffing)');
    }

    return {
        passed: issues.length === 0,
        issues
    };
}
