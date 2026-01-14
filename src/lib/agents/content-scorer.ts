/**
 * Content Scorer Agent
 * AI-powered content quality scoring for individual pages
 */

import { LLMProvider, AgentResult } from './types';
import { createOpenAIProvider } from './openai-provider';
import { PageData } from './website-crawler';

export interface ContentScore {
  url: string;
  overallScore: number;
  scores: {
    relevance: number;
    depth: number;
    readability: number;
    structure: number;
    engagement: number;
    seo: number;
  };
  strengths: string[];
  weaknesses: string[];
  improvementSuggestions: string[];
  contentType: 'blog' | 'landing' | 'product' | 'service' | 'about' | 'other';
  estimatedReadTime: number;
  topicMatch: number;
}

export interface ContentScoringResult {
  pagesScored: number;
  averageScore: number;
  scoreDistribution: {
    excellent: number; // 80-100
    good: number;      // 60-79
    fair: number;      // 40-59
    poor: number;      // 0-39
  };
  topPerformers: ContentScore[];
  needsImprovement: ContentScore[];
  overallRecommendations: string[];
}

export interface ContentScoringInput {
  pages: PageData[];
  targetKeyword?: string;
  industry?: string;
  contentGoals?: string[];
}

/**
 * Calculate basic content metrics
 */
function calculateBasicMetrics(page: PageData): {
  readabilityScore: number;
  structureScore: number;
  seoScore: number;
  estimatedReadTime: number;
} {
  // Readability based on sentence structure (simplified)
  const avgWordsPerSentence = page.wordCount / Math.max(1, page.contentPreview.split(/[.!?]/).length);
  const readabilityScore = Math.max(0, Math.min(100, 100 - (avgWordsPerSentence - 15) * 3));

  // Structure based on headings
  const h1Present = page.h1 ? 20 : 0;
  const h2Count = page.headings.filter(h => h.level === 2).length;
  const h2Score = Math.min(40, h2Count * 10);
  const h3Count = page.headings.filter(h => h.level === 3).length;
  const h3Score = Math.min(20, h3Count * 5);
  const structureScore = h1Present + h2Score + h3Score + (page.metaDescription ? 20 : 0);

  // SEO basics
  let seoScore = 0;
  if (page.title && page.title.length >= 30 && page.title.length <= 60) seoScore += 25;
  else if (page.title) seoScore += 15;
  if (page.metaDescription && page.metaDescription.length >= 120) seoScore += 25;
  else if (page.metaDescription) seoScore += 15;
  if (page.h1) seoScore += 25;
  if (page.internalLinks.length >= 3) seoScore += 15;
  if (page.images.some(img => img.alt)) seoScore += 10;

  // Reading time (avg 200 words per minute)
  const estimatedReadTime = Math.ceil(page.wordCount / 200);

  return { readabilityScore, structureScore, seoScore, estimatedReadTime };
}

/**
 * Score a single page with AI analysis
 */
export async function scorePageContent(
  page: PageData,
  targetKeyword?: string,
  provider?: LLMProvider
): Promise<AgentResult<ContentScore>> {
  const llm = provider || createOpenAIProvider();

  try {
    const basicMetrics = calculateBasicMetrics(page);

    const systemPrompt = `You are a content quality expert. Score content based on relevance, depth, engagement, and SEO effectiveness.`;

    const userPrompt = `Score this webpage content:

URL: ${page.url}
TITLE: ${page.title}
H1: ${page.h1 || 'None'}
META: ${page.metaDescription || 'None'}
WORD COUNT: ${page.wordCount}
HEADINGS: ${page.headings.length}
${targetKeyword ? `TARGET KEYWORD: ${targetKeyword}` : ''}

CONTENT PREVIEW:
${page.contentPreview}

HEADINGS STRUCTURE:
${page.headings.slice(0, 10).map(h => `${'  '.repeat(h.level - 1)}H${h.level}: ${h.text}`).join('\n')}

Score each dimension 0-100 and provide analysis.

Return JSON:
{
  "overallScore": 0-100,
  "scores": {
    "relevance": 0-100,
    "depth": 0-100,
    "readability": ${basicMetrics.readabilityScore},
    "structure": ${basicMetrics.structureScore},
    "engagement": 0-100,
    "seo": ${basicMetrics.seoScore}
  },
  "strengths": ["strength 1", "strength 2"],
  "weaknesses": ["weakness 1", "weakness 2"],
  "improvementSuggestions": ["suggestion 1", "suggestion 2"],
  "contentType": "blog" | "landing" | "product" | "service" | "about" | "other",
  "topicMatch": 0-100
}`;

    const response = await llm.call({
      systemPrompt,
      userPrompt,
      temperature: 0.3,
      maxTokens: 1000
    });

    const aiScore = JSON.parse(response);

    return {
      success: true,
      data: {
        url: page.url,
        overallScore: aiScore.overallScore,
        scores: {
          ...aiScore.scores,
          readability: basicMetrics.readabilityScore,
          structure: basicMetrics.structureScore,
          seo: basicMetrics.seoScore
        },
        strengths: aiScore.strengths || [],
        weaknesses: aiScore.weaknesses || [],
        improvementSuggestions: aiScore.improvementSuggestions || [],
        contentType: aiScore.contentType || 'other',
        estimatedReadTime: basicMetrics.estimatedReadTime,
        topicMatch: aiScore.topicMatch || 0
      }
    };
  } catch (error: any) {
    // Return basic score if AI fails
    const basicMetrics = calculateBasicMetrics(page);
    const basicScore = Math.round(
      (basicMetrics.readabilityScore + basicMetrics.structureScore + basicMetrics.seoScore) / 3
    );

    return {
      success: true,
      data: {
        url: page.url,
        overallScore: basicScore,
        scores: {
          relevance: 50,
          depth: page.wordCount > 1000 ? 70 : page.wordCount > 500 ? 50 : 30,
          readability: basicMetrics.readabilityScore,
          structure: basicMetrics.structureScore,
          engagement: 50,
          seo: basicMetrics.seoScore
        },
        strengths: [],
        weaknesses: [],
        improvementSuggestions: [],
        contentType: 'other',
        estimatedReadTime: basicMetrics.estimatedReadTime,
        topicMatch: 50
      }
    };
  }
}

/**
 * Score multiple pages and generate report
 */
export async function scoreAllContent(
  input: ContentScoringInput,
  provider?: LLMProvider
): Promise<AgentResult<ContentScoringResult>> {
  const llm = provider || createOpenAIProvider();

  try {
    const scores: ContentScore[] = [];

    // Score each page (limit to avoid timeout)
    const pagesToScore = input.pages.slice(0, 20);
    
    for (const page of pagesToScore) {
      const result = await scorePageContent(page, input.targetKeyword, provider);
      if (result.success && result.data) {
        scores.push(result.data);
      }
    }

    // Calculate statistics
    const avgScore = scores.reduce((sum, s) => sum + s.overallScore, 0) / scores.length;
    
    const distribution = {
      excellent: scores.filter(s => s.overallScore >= 80).length,
      good: scores.filter(s => s.overallScore >= 60 && s.overallScore < 80).length,
      fair: scores.filter(s => s.overallScore >= 40 && s.overallScore < 60).length,
      poor: scores.filter(s => s.overallScore < 40).length
    };

    const sortedScores = [...scores].sort((a, b) => b.overallScore - a.overallScore);

    // Generate overall recommendations
    const systemPrompt = `You are a content strategist. Provide high-level recommendations.`;

    const userPrompt = `Based on content scoring of ${scores.length} pages:

AVERAGE SCORE: ${avgScore.toFixed(1)}/100
DISTRIBUTION:
- Excellent (80+): ${distribution.excellent}
- Good (60-79): ${distribution.good}
- Fair (40-59): ${distribution.fair}
- Poor (<40): ${distribution.poor}

COMMON WEAKNESSES:
${scores.flatMap(s => s.weaknesses).slice(0, 10).join('\n')}

Provide 5 strategic recommendations to improve content quality.

Return JSON: { "recommendations": ["rec1", "rec2", "rec3", "rec4", "rec5"] }`;

    const response = await llm.call({
      systemPrompt,
      userPrompt,
      temperature: 0.5,
      maxTokens: 500
    });

    const aiRecs = JSON.parse(response);

    return {
      success: true,
      data: {
        pagesScored: scores.length,
        averageScore: Math.round(avgScore),
        scoreDistribution: distribution,
        topPerformers: sortedScores.slice(0, 5),
        needsImprovement: sortedScores.slice(-5).reverse(),
        overallRecommendations: aiRecs.recommendations || []
      }
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Content scoring failed'
    };
  }
}

/**
 * Analyze content freshness
 */
export interface FreshnessAnalysis {
  url: string;
  estimatedAge: 'fresh' | 'recent' | 'aging' | 'stale';
  signals: string[];
  updateRecommendation: string;
  priority: 'high' | 'medium' | 'low';
}

export function analyzeContentFreshness(page: PageData): FreshnessAnalysis {
  const signals: string[] = [];
  let freshnessScore = 50; // Start neutral

  // Check for date indicators in content
  const currentYear = new Date().getFullYear();
  const yearPattern = new RegExp(`\\b(20[0-9]{2})\\b`, 'g');
  const years: string[] = page.contentPreview.match(yearPattern) || [];
  
  if (years.includes(currentYear.toString())) {
    freshnessScore += 20;
    signals.push(`References current year (${currentYear})`);
  } else if (years.includes((currentYear - 1).toString())) {
    freshnessScore += 10;
    signals.push(`References last year (${currentYear - 1})`);
  } else if (years.some(y => parseInt(y) < currentYear - 2)) {
    freshnessScore -= 20;
    signals.push('Contains outdated year references');
  }

  // Check title for freshness indicators
  const freshIndicators: string[] = ['2024', '2025', '2026', 'new', 'latest', 'updated', 'guide'];
  const staleIndicators: string[] = ['2020', '2021', '2022', 'old', 'deprecated'];
  
  const titleLower = (page.title || '').toLowerCase();
  if (freshIndicators.some((i: string) => titleLower.includes(i))) {
    freshnessScore += 15;
    signals.push('Title suggests current content');
  }
  if (staleIndicators.some((i: string) => titleLower.includes(i))) {
    freshnessScore -= 15;
    signals.push('Title suggests dated content');
  }

  // Determine age category
  let estimatedAge: 'fresh' | 'recent' | 'aging' | 'stale';
  if (freshnessScore >= 70) estimatedAge = 'fresh';
  else if (freshnessScore >= 50) estimatedAge = 'recent';
  else if (freshnessScore >= 30) estimatedAge = 'aging';
  else estimatedAge = 'stale';

  // Generate recommendation
  let updateRecommendation: string;
  let priority: 'high' | 'medium' | 'low';
  
  if (estimatedAge === 'stale') {
    updateRecommendation = 'Requires immediate content refresh with updated information';
    priority = 'high';
  } else if (estimatedAge === 'aging') {
    updateRecommendation = 'Review and update statistics, examples, and references';
    priority = 'medium';
  } else if (estimatedAge === 'recent') {
    updateRecommendation = 'Minor updates may improve freshness signals';
    priority = 'low';
  } else {
    updateRecommendation = 'Content appears current, no immediate action needed';
    priority = 'low';
  }

  return {
    url: page.url,
    estimatedAge,
    signals,
    updateRecommendation,
    priority
  };
}
