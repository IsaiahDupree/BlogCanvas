/**
 * Content Gap Analysis Agent
 * Analyzes website content to identify gaps and opportunities
 */

import { LLMProvider, AgentResult } from './types';
import { createOpenAIProvider } from './openai-provider';
import { PageData, CrawlResult } from './website-crawler';

export interface ContentGap {
  topic: string;
  category: string;
  searchIntent: 'informational' | 'transactional' | 'navigational' | 'commercial';
  priority: 'high' | 'medium' | 'low';
  estimatedSearchVolume: number;
  competitorsCovering: number;
  suggestedArticles: string[];
  reasoning: string;
}

export interface TopicCoverage {
  topic: string;
  currentPages: number;
  coverageScore: number;
  contentDepth: 'shallow' | 'moderate' | 'deep';
  lastUpdated?: string;
  pageUrls: string[];
}

export interface GapAnalysisResult {
  websiteUrl: string;
  totalPagesAnalyzed: number;
  contentScore: number;
  topicCoverage: TopicCoverage[];
  contentGaps: ContentGap[];
  strengths: string[];
  weaknesses: string[];
  recommendations: {
    priority: 'high' | 'medium' | 'low';
    action: string;
    expectedImpact: string;
  }[];
  suggestedContentPlan: {
    topic: string;
    articleCount: number;
    estimatedTrafficGain: number;
  }[];
}

export interface GapAnalysisInput {
  crawlResult: CrawlResult;
  industry: string;
  targetAudience: string;
  competitors?: string[];
  currentKeywords?: string[];
}

/**
 * Analyze website content for gaps and opportunities
 */
export async function runContentGapAnalysis(
  input: GapAnalysisInput,
  provider?: LLMProvider
): Promise<AgentResult<GapAnalysisResult>> {
  const llm = provider || createOpenAIProvider();

  try {
    // Prepare page summaries for analysis
    const pageSummaries = input.crawlResult.pages.map(page => ({
      url: page.url,
      title: page.title,
      h1: page.h1,
      headings: page.headings.slice(0, 5).map(h => h.text),
      wordCount: page.wordCount,
      preview: page.contentPreview.substring(0, 200)
    }));

    const systemPrompt = `You are an expert content strategist and SEO analyst. Analyze website content to identify gaps, opportunities, and provide actionable recommendations.`;

    const userPrompt = `Analyze this website's content for gaps and opportunities:

WEBSITE: ${input.crawlResult.baseUrl}
INDUSTRY: ${input.industry}
TARGET AUDIENCE: ${input.targetAudience}
TOTAL PAGES CRAWLED: ${input.crawlResult.pagesCrawled}

PAGE CONTENT SUMMARY:
${JSON.stringify(pageSummaries.slice(0, 30), null, 2)}

${input.competitors?.length ? `COMPETITORS TO CONSIDER: ${input.competitors.join(', ')}` : ''}
${input.currentKeywords?.length ? `CURRENT FOCUS KEYWORDS: ${input.currentKeywords.join(', ')}` : ''}

ANALYSIS TASKS:
1. Evaluate current topic coverage and depth
2. Identify content gaps (topics not covered that should be)
3. Assess content strengths and weaknesses
4. Provide prioritized recommendations
5. Suggest a content plan to fill gaps

Return a JSON object:
{
  "websiteUrl": "${input.crawlResult.baseUrl}",
  "totalPagesAnalyzed": ${input.crawlResult.pagesCrawled},
  "contentScore": 0-100,
  "topicCoverage": [
    {
      "topic": "Topic name",
      "currentPages": number,
      "coverageScore": 0-100,
      "contentDepth": "shallow" | "moderate" | "deep",
      "pageUrls": ["url1", "url2"]
    }
  ],
  "contentGaps": [
    {
      "topic": "Missing topic",
      "category": "Category/cluster",
      "searchIntent": "informational" | "transactional" | "navigational" | "commercial",
      "priority": "high" | "medium" | "low",
      "estimatedSearchVolume": number,
      "competitorsCovering": number,
      "suggestedArticles": ["Article idea 1", "Article idea 2"],
      "reasoning": "Why this is a gap"
    }
  ],
  "strengths": ["strength 1", "strength 2"],
  "weaknesses": ["weakness 1", "weakness 2"],
  "recommendations": [
    {
      "priority": "high" | "medium" | "low",
      "action": "What to do",
      "expectedImpact": "Expected result"
    }
  ],
  "suggestedContentPlan": [
    {
      "topic": "Topic cluster",
      "articleCount": number,
      "estimatedTrafficGain": number
    }
  ]
}

IMPORTANT: Be specific and actionable. Focus on the ${input.industry} industry.`;

    const response = await llm.call({
      systemPrompt,
      userPrompt,
      temperature: 0.5,
      maxTokens: 4000
    });

    const result: GapAnalysisResult = JSON.parse(response);

    return {
      success: true,
      data: result
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Content gap analysis failed'
    };
  }
}

/**
 * Quick content audit without full AI analysis
 */
export function quickContentAudit(pages: PageData[]): {
  totalPages: number;
  avgWordCount: number;
  pagesWithMetaDescription: number;
  pagesWithH1: number;
  totalHeadings: number;
  topTopics: string[];
  contentHealth: 'good' | 'fair' | 'poor';
} {
  const totalPages = pages.length;
  const avgWordCount = pages.reduce((sum, p) => sum + p.wordCount, 0) / totalPages;
  const pagesWithMetaDescription = pages.filter(p => p.metaDescription).length;
  const pagesWithH1 = pages.filter(p => p.h1).length;
  const totalHeadings = pages.reduce((sum, p) => sum + p.headings.length, 0);

  // Extract top topics from H1s and titles
  const topicCounts = new Map<string, number>();
  for (const page of pages) {
    const topic = page.h1 || page.title;
    if (topic) {
      // Extract main keywords
      const words = topic.toLowerCase().split(/\s+/).filter(w => w.length > 4);
      for (const word of words) {
        topicCounts.set(word, (topicCounts.get(word) || 0) + 1);
      }
    }
  }
  const topTopics = [...topicCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([topic]) => topic);

  // Determine content health
  const metaScore = pagesWithMetaDescription / totalPages;
  const h1Score = pagesWithH1 / totalPages;
  const wordScore = avgWordCount > 500 ? 1 : avgWordCount > 300 ? 0.5 : 0;
  const healthScore = (metaScore + h1Score + wordScore) / 3;

  let contentHealth: 'good' | 'fair' | 'poor';
  if (healthScore >= 0.7) contentHealth = 'good';
  else if (healthScore >= 0.4) contentHealth = 'fair';
  else contentHealth = 'poor';

  return {
    totalPages,
    avgWordCount: Math.round(avgWordCount),
    pagesWithMetaDescription,
    pagesWithH1,
    totalHeadings,
    topTopics,
    contentHealth
  };
}

/**
 * Compare content with competitors
 */
export interface CompetitorComparison {
  ourTopics: string[];
  competitorTopics: string[];
  sharedTopics: string[];
  missingTopics: string[];
  uniqueTopics: string[];
  competitorAdvantages: string[];
  ourAdvantages: string[];
}

export async function compareWithCompetitor(
  ourPages: PageData[],
  competitorPages: PageData[],
  industry: string,
  provider?: LLMProvider
): Promise<AgentResult<CompetitorComparison>> {
  const llm = provider || createOpenAIProvider();

  try {
    const ourTopics = ourPages.map(p => p.h1 || p.title).filter(Boolean);
    const competitorTopics = competitorPages.map(p => p.h1 || p.title).filter(Boolean);

    const systemPrompt = `You are a competitive analysis expert. Compare website content coverage.`;

    const userPrompt = `Compare these two websites' content:

OUR CONTENT (${ourPages.length} pages):
${ourTopics.slice(0, 30).join('\n')}

COMPETITOR CONTENT (${competitorPages.length} pages):
${competitorTopics.slice(0, 30).join('\n')}

INDUSTRY: ${industry}

Return JSON:
{
  "ourTopics": ["topic1", "topic2"],
  "competitorTopics": ["topic1", "topic2"],
  "sharedTopics": ["topics both cover"],
  "missingTopics": ["topics competitor has that we don't"],
  "uniqueTopics": ["topics we have that competitor doesn't"],
  "competitorAdvantages": ["what competitor does better"],
  "ourAdvantages": ["what we do better"]
}`;

    const response = await llm.call({
      systemPrompt,
      userPrompt,
      temperature: 0.4,
      maxTokens: 2000
    });

    const result: CompetitorComparison = JSON.parse(response);

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
