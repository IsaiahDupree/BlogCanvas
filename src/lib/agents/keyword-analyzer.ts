/**
 * Keyword Analyzer Agent
 * Extracts and analyzes keywords from website content for SEO optimization
 */

import { LLMProvider, AgentResult } from './types';
import { createOpenAIProvider } from './openai-provider';
import { PageData } from './website-crawler';

export interface ExtractedKeyword {
  keyword: string;
  frequency: number;
  density: number;
  prominence: number; // Based on position (title, H1, H2, etc.)
  pages: string[];
  type: 'primary' | 'secondary' | 'long-tail';
  searchIntent?: 'informational' | 'transactional' | 'navigational' | 'commercial';
}

export interface KeywordCluster {
  mainKeyword: string;
  relatedKeywords: string[];
  totalFrequency: number;
  averageDensity: number;
  coverage: number; // % of pages covering this cluster
}

export interface KeywordAnalysisResult {
  websiteUrl: string;
  totalKeywordsFound: number;
  primaryKeywords: ExtractedKeyword[];
  secondaryKeywords: ExtractedKeyword[];
  longTailKeywords: ExtractedKeyword[];
  keywordClusters: KeywordCluster[];
  missingOpportunities: string[];
  keywordCanibalization: {
    keyword: string;
    competingPages: string[];
    recommendation: string;
  }[];
  recommendations: string[];
}

export interface KeywordAnalysisInput {
  pages: PageData[];
  industry: string;
  targetKeywords?: string[];
  competitors?: string[];
}

/**
 * Extract keywords from a single page
 */
export function extractPageKeywords(page: PageData): Map<string, number> {
  const keywords = new Map<string, number>();
  
  // Combine all text content
  const allText = [
    page.title,
    page.metaDescription,
    page.h1,
    ...page.headings.map(h => h.text),
    page.contentPreview
  ].filter(Boolean).join(' ').toLowerCase();

  // Tokenize and count
  const words = allText
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 3);

  // Count single words
  for (const word of words) {
    if (!isStopWord(word)) {
      keywords.set(word, (keywords.get(word) || 0) + 1);
    }
  }

  // Extract 2-word phrases
  for (let i = 0; i < words.length - 1; i++) {
    if (!isStopWord(words[i]) && !isStopWord(words[i + 1])) {
      const phrase = `${words[i]} ${words[i + 1]}`;
      keywords.set(phrase, (keywords.get(phrase) || 0) + 1);
    }
  }

  // Extract 3-word phrases
  for (let i = 0; i < words.length - 2; i++) {
    if (!isStopWord(words[i]) && !isStopWord(words[i + 2])) {
      const phrase = `${words[i]} ${words[i + 1]} ${words[i + 2]}`;
      keywords.set(phrase, (keywords.get(phrase) || 0) + 1);
    }
  }

  return keywords;
}

const STOP_WORDS = new Set([
  'the', 'and', 'for', 'that', 'this', 'with', 'are', 'from', 'have', 'has',
  'been', 'were', 'was', 'will', 'would', 'could', 'should', 'may', 'might',
  'can', 'not', 'but', 'they', 'their', 'them', 'what', 'when', 'where', 'which',
  'who', 'how', 'why', 'all', 'each', 'every', 'both', 'few', 'more', 'most',
  'other', 'some', 'such', 'than', 'too', 'very', 'just', 'also', 'now', 'only',
  'your', 'you', 'our', 'we', 'its', 'his', 'her', 'here', 'there', 'about'
]);

function isStopWord(word: string): boolean {
  return STOP_WORDS.has(word.toLowerCase());
}

/**
 * Calculate keyword prominence based on position
 */
function calculateProminence(keyword: string, page: PageData): number {
  let prominence = 0;
  const lowerKeyword = keyword.toLowerCase();

  if (page.title?.toLowerCase().includes(lowerKeyword)) prominence += 40;
  if (page.h1?.toLowerCase().includes(lowerKeyword)) prominence += 30;
  if (page.metaDescription?.toLowerCase().includes(lowerKeyword)) prominence += 20;
  
  for (const heading of page.headings) {
    if (heading.text.toLowerCase().includes(lowerKeyword)) {
      prominence += heading.level === 2 ? 15 : 10;
    }
  }

  return Math.min(100, prominence);
}

/**
 * Analyze keywords across all pages
 */
export async function runKeywordAnalysis(
  input: KeywordAnalysisInput,
  provider?: LLMProvider
): Promise<AgentResult<KeywordAnalysisResult>> {
  const llm = provider || createOpenAIProvider();

  try {
    // Aggregate keywords across all pages
    const globalKeywords = new Map<string, { frequency: number; pages: string[] }>();
    
    for (const page of input.pages) {
      const pageKeywords = extractPageKeywords(page);
      
      for (const [keyword, count] of pageKeywords) {
        const existing = globalKeywords.get(keyword) || { frequency: 0, pages: [] };
        existing.frequency += count;
        if (!existing.pages.includes(page.url)) {
          existing.pages.push(page.url);
        }
        globalKeywords.set(keyword, existing);
      }
    }

    // Calculate total words for density
    const totalWords = input.pages.reduce((sum, p) => sum + p.wordCount, 0);

    // Sort by frequency and filter
    const sortedKeywords = [...globalKeywords.entries()]
      .filter(([kw, data]) => data.frequency >= 3 && kw.length > 3)
      .sort((a, b) => b[1].frequency - a[1].frequency)
      .slice(0, 100);

    // Categorize keywords
    const extractedKeywords: ExtractedKeyword[] = sortedKeywords.map(([keyword, data]) => {
      const wordCount = keyword.split(' ').length;
      const avgProminence = input.pages
        .map(p => calculateProminence(keyword, p))
        .reduce((a, b) => a + b, 0) / input.pages.length;

      return {
        keyword,
        frequency: data.frequency,
        density: (data.frequency / totalWords) * 100,
        prominence: avgProminence,
        pages: data.pages,
        type: wordCount >= 3 ? 'long-tail' : wordCount === 2 ? 'secondary' : 'primary'
      };
    });

    // Detect keyword cannibalization
    const cannibalization = extractedKeywords
      .filter(kw => kw.pages.length > 1 && kw.prominence > 30)
      .map(kw => ({
        keyword: kw.keyword,
        competingPages: kw.pages,
        recommendation: `Consolidate content or differentiate focus for "${kw.keyword}"`
      }));

    // Use AI for deeper analysis
    const systemPrompt = `You are an SEO keyword analyst. Analyze extracted keywords and provide strategic recommendations.`;

    const topKeywords = extractedKeywords.slice(0, 30);
    const userPrompt = `Analyze these keywords for a ${input.industry} website:

TOP KEYWORDS FOUND:
${topKeywords.map(k => `- "${k.keyword}" (freq: ${k.frequency}, density: ${k.density.toFixed(2)}%, type: ${k.type})`).join('\n')}

${input.targetKeywords?.length ? `TARGET KEYWORDS: ${input.targetKeywords.join(', ')}` : ''}

TASKS:
1. Identify keyword clusters (group related keywords)
2. Find missing keyword opportunities
3. Assign search intent to top keywords
4. Provide optimization recommendations

Return JSON:
{
  "keywordClusters": [
    {
      "mainKeyword": "main keyword",
      "relatedKeywords": ["related1", "related2"],
      "totalFrequency": number,
      "averageDensity": number,
      "coverage": 0-100
    }
  ],
  "missingOpportunities": ["missing keyword 1", "missing keyword 2"],
  "searchIntents": {
    "keyword": "informational" | "transactional" | "navigational" | "commercial"
  },
  "recommendations": ["recommendation 1", "recommendation 2"]
}`;

    const response = await llm.call({
      systemPrompt,
      userPrompt,
      temperature: 0.4,
      maxTokens: 2000
    });

    const aiAnalysis = JSON.parse(response);

    // Apply search intents
    if (aiAnalysis.searchIntents) {
      for (const kw of extractedKeywords) {
        kw.searchIntent = aiAnalysis.searchIntents[kw.keyword];
      }
    }

    return {
      success: true,
      data: {
        websiteUrl: input.pages[0]?.url || '',
        totalKeywordsFound: extractedKeywords.length,
        primaryKeywords: extractedKeywords.filter(k => k.type === 'primary').slice(0, 20),
        secondaryKeywords: extractedKeywords.filter(k => k.type === 'secondary').slice(0, 30),
        longTailKeywords: extractedKeywords.filter(k => k.type === 'long-tail').slice(0, 30),
        keywordClusters: aiAnalysis.keywordClusters || [],
        missingOpportunities: aiAnalysis.missingOpportunities || [],
        keywordCanibalization: cannibalization.slice(0, 10),
        recommendations: aiAnalysis.recommendations || []
      }
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Keyword analysis failed'
    };
  }
}

/**
 * Find keyword gaps between website and competitors
 */
export interface KeywordGap {
  keyword: string;
  competitorRanking: string;
  ourCoverage: 'none' | 'weak' | 'moderate' | 'strong';
  priority: 'high' | 'medium' | 'low';
  suggestedAction: string;
}

export async function findKeywordGaps(
  ourKeywords: ExtractedKeyword[],
  competitorKeywords: ExtractedKeyword[],
  industry: string,
  provider?: LLMProvider
): Promise<AgentResult<KeywordGap[]>> {
  const llm = provider || createOpenAIProvider();

  try {
    const ourSet = new Set(ourKeywords.map(k => k.keyword.toLowerCase()));
    
    // Find keywords competitor has that we don't
    const gaps = competitorKeywords
      .filter(ck => !ourSet.has(ck.keyword.toLowerCase()))
      .slice(0, 50);

    const systemPrompt = `You are a competitive SEO analyst. Identify keyword gaps and priorities.`;

    const userPrompt = `Analyze keyword gaps for a ${industry} website:

COMPETITOR KEYWORDS WE DON'T HAVE:
${gaps.map(k => `- "${k.keyword}" (freq: ${k.frequency})`).join('\n')}

OUR TOP KEYWORDS:
${ourKeywords.slice(0, 20).map(k => `- "${k.keyword}"`).join('\n')}

Return JSON array of keyword gaps:
[
  {
    "keyword": "keyword",
    "competitorRanking": "high/medium/low coverage by competitor",
    "ourCoverage": "none" | "weak" | "moderate" | "strong",
    "priority": "high" | "medium" | "low",
    "suggestedAction": "Create pillar content about X"
  }
]`;

    const response = await llm.call({
      systemPrompt,
      userPrompt,
      temperature: 0.4,
      maxTokens: 2000
    });

    const result: KeywordGap[] = JSON.parse(response);

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
