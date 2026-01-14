/**
 * Internal Linking Agent
 * Suggests internal links to improve SEO and user engagement
 */

import { LLMProvider, AgentResult } from './types';
import { createOpenAIProvider } from './openai-provider';

export interface InternalLink {
  anchorText: string;
  targetUrl: string;
  targetTitle: string;
  relevanceScore: number;
  insertionPoint: string;
  reasoning: string;
}

export interface LinkingResult {
  suggestedLinks: InternalLink[];
  orphanedPages: string[];
  linkingOpportunities: number;
  currentInternalLinks: number;
  recommendedLinkCount: number;
  seoImpactScore: number;
  linkingStrategy: string;
}

export interface LinkingInput {
  content: string;
  currentUrl: string;
  existingPosts: {
    url: string;
    title: string;
    targetKeyword: string;
    excerpt?: string;
  }[];
  maxLinks?: number;
}

/**
 * Generate internal linking suggestions
 */
export async function runInternalLinkingAgent(
  input: LinkingInput,
  provider?: LLMProvider
): Promise<AgentResult<LinkingResult>> {
  const llm = provider || createOpenAIProvider();

  try {
    const maxLinks = input.maxLinks || 5;

    const systemPrompt = `You are an SEO expert specializing in internal linking strategy. Analyze content and suggest relevant internal links that improve site structure and user experience.`;

    const userPrompt = `Analyze this content and suggest internal links:

CURRENT POST URL: ${input.currentUrl}

CONTENT TO ANALYZE:
${input.content.substring(0, 4000)}

EXISTING POSTS THAT CAN BE LINKED TO:
${input.existingPosts.map(p => `- ${p.title} (${p.url}) - Keyword: ${p.targetKeyword}`).join('\n')}

MAX LINKS TO SUGGEST: ${maxLinks}

INSTRUCTIONS:
1. Identify phrases/concepts in the content that relate to existing posts
2. Suggest natural anchor text for each link
3. Indicate where in the content to insert each link
4. Score relevance of each link (0-100)
5. Provide a linking strategy recommendation

Return JSON:
{
  "suggestedLinks": [
    {
      "anchorText": "text to make into link",
      "targetUrl": "URL of post to link to",
      "targetTitle": "Title of target post",
      "relevanceScore": 0-100,
      "insertionPoint": "paragraph or sentence where link should go",
      "reasoning": "why this link makes sense"
    }
  ],
  "orphanedPages": ["URLs of posts not linked from anywhere"],
  "linkingOpportunities": number,
  "currentInternalLinks": number (from content),
  "recommendedLinkCount": number,
  "seoImpactScore": 0-100,
  "linkingStrategy": "overall linking recommendation"
}

BEST PRACTICES:
- Use descriptive anchor text (not "click here")
- Link to relevant, valuable content
- Distribute links naturally throughout content
- Prioritize cornerstone content
- Avoid over-linking (3-5 per 1000 words is ideal)`;

    const response = await llm.call({
      systemPrompt,
      userPrompt,
      temperature: 0.4,
      maxTokens: 2000
    });

    const result: LinkingResult = JSON.parse(response);

    return {
      success: true,
      data: result
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Internal linking analysis failed'
    };
  }
}

/**
 * Auto-apply internal links to content
 */
export function applyInternalLinks(
  content: string,
  links: InternalLink[]
): string {
  let modifiedContent = content;

  // Sort by position in content (to avoid offset issues)
  const sortedLinks = [...links].sort((a, b) => {
    const posA = content.indexOf(a.anchorText);
    const posB = content.indexOf(b.anchorText);
    return posB - posA; // Process from end to start
  });

  for (const link of sortedLinks) {
    const anchorRegex = new RegExp(`\\b${escapeRegex(link.anchorText)}\\b`, 'i');
    const match = modifiedContent.match(anchorRegex);
    
    if (match) {
      const markdownLink = `[${match[0]}](${link.targetUrl})`;
      modifiedContent = modifiedContent.replace(anchorRegex, markdownLink);
    }
  }

  return modifiedContent;
}

function escapeRegex(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Analyze site-wide linking structure
 */
export interface SiteLinkAnalysis {
  totalPages: number;
  averageInternalLinks: number;
  orphanedPages: string[];
  mostLinkedPages: { url: string; linkCount: number }[];
  linkingIssues: string[];
  recommendations: string[];
}

export async function analyzeSiteLinking(
  pages: { url: string; title: string; internalLinkCount: number }[],
  provider?: LLMProvider
): Promise<AgentResult<SiteLinkAnalysis>> {
  const llm = provider || createOpenAIProvider();

  try {
    const totalLinks = pages.reduce((sum, p) => sum + p.internalLinkCount, 0);
    const avgLinks = totalLinks / pages.length;
    const orphaned = pages.filter(p => p.internalLinkCount === 0);

    const systemPrompt = `You are an SEO analyst. Analyze site-wide internal linking and provide recommendations.`;

    const userPrompt = `Analyze this site's internal linking structure:

TOTAL PAGES: ${pages.length}
AVERAGE LINKS PER PAGE: ${avgLinks.toFixed(1)}
ORPHANED PAGES: ${orphaned.length}

PAGE DATA:
${pages.slice(0, 20).map(p => `- ${p.title}: ${p.internalLinkCount} internal links`).join('\n')}

Return JSON:
{
  "totalPages": ${pages.length},
  "averageInternalLinks": ${avgLinks.toFixed(1)},
  "orphanedPages": [${orphaned.map(p => `"${p.url}"`).join(', ')}],
  "mostLinkedPages": [{"url": "...", "linkCount": number}],
  "linkingIssues": ["issue 1", "issue 2"],
  "recommendations": ["recommendation 1", "recommendation 2"]
}`;

    const response = await llm.call({
      systemPrompt,
      userPrompt,
      temperature: 0.3,
      maxTokens: 1500
    });

    const result: SiteLinkAnalysis = JSON.parse(response);

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
