/**
 * SEO Agent
 * Optimizes content for search engines
 */

import { LLMProvider, AgentResult, SEOMetadata } from './types';

export interface SEOAgentInput {
    fullDraftContent: string;
    topic?: string;
    targetKeyword?: string;
    wordCount?: number;
}

/**
 * Run the SEO agent to optimize content
 */
export async function runSEOAgent(
    provider: LLMProvider,
    input: SEOAgentInput
): Promise<AgentResult<SEOMetadata>> {
    try {
        const systemPrompt = `You are an SEO expert optimizing blog content for search engines.`;

        const userPrompt = `Optimize the following content for SEO:

TOPIC: ${input.topic}
TARGET KEYWORD: ${input.targetKeyword}

CONTENT:
${input.fullDraftContent.substring(0, 2000)}... [truncated]

Return a JSON object with:
- title: SEO-optimized title (50-60 chars, include keyword)
- metaDescription: compelling meta description (120-160 chars)
- slug: URL-friendly slug
- suggestions: array of improvement suggestions
- keywordDensity: calculated keyword density percentage
- readabilityScore: "Good", "Fair", or "Needs Improvement"`;

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
