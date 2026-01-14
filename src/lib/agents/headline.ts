/**
 * Headline Agent
 * Generates multiple headline/title variations optimized for CTR and SEO
 */

import { LLMProvider, AgentResult } from './types';
import { createOpenAIProvider } from './openai-provider';

export interface HeadlineVariation {
  headline: string;
  type: 'question' | 'how-to' | 'listicle' | 'benefit' | 'curiosity' | 'comparison' | 'news';
  emotionalTrigger?: string;
  estimatedCTR: 'high' | 'medium' | 'low';
  seoScore: number;
  characterCount: number;
  reasoning: string;
}

export interface HeadlineResult {
  variations: HeadlineVariation[];
  recommended: HeadlineVariation;
  targetKeywordIncluded: boolean;
  bestForSEO: HeadlineVariation;
  bestForCTR: HeadlineVariation;
  tips: string[];
}

export interface HeadlineInput {
  topic: string;
  targetKeyword: string;
  contentType?: 'blog' | 'newsletter' | 'social' | 'email';
  tone?: string;
  targetAudience?: string;
  currentHeadline?: string;
  variationCount?: number;
}

/**
 * Generate headline variations for content
 */
export async function runHeadlineAgent(
  input: HeadlineInput,
  provider?: LLMProvider
): Promise<AgentResult<HeadlineResult>> {
  const llm = provider || createOpenAIProvider();

  try {
    const variationCount = input.variationCount || 10;

    const systemPrompt = `You are an expert copywriter and SEO specialist. Generate compelling headlines that maximize both click-through rate and search engine visibility.`;

    const userPrompt = `Generate ${variationCount} headline variations for this content:

TOPIC: ${input.topic}
TARGET KEYWORD: ${input.targetKeyword}
CONTENT TYPE: ${input.contentType || 'blog'}
TONE: ${input.tone || 'Professional'}
TARGET AUDIENCE: ${input.targetAudience || 'Business professionals'}
${input.currentHeadline ? `CURRENT HEADLINE: ${input.currentHeadline}` : ''}

HEADLINE FORMULAS TO USE:
1. Question format ("Why X?" "How X?")
2. How-to format ("How to X in Y Steps")
3. Listicle format ("X Ways to Y" "Top X Z")
4. Benefit-focused ("Get X Without Y")
5. Curiosity gap ("The Secret to X" "What X Reveals About Y")
6. Comparison ("X vs Y: Which is Better?")
7. News/timely ("New Study Shows X" "X in 2026")

Return a JSON object:
{
  "variations": [
    {
      "headline": "The headline text",
      "type": "question" | "how-to" | "listicle" | "benefit" | "curiosity" | "comparison" | "news",
      "emotionalTrigger": "curiosity/fear/excitement/etc",
      "estimatedCTR": "high" | "medium" | "low",
      "seoScore": 0-100,
      "characterCount": number,
      "reasoning": "Why this headline works"
    }
  ],
  "recommended": {best overall variation},
  "targetKeywordIncluded": true/false,
  "bestForSEO": {variation with highest SEO score},
  "bestForCTR": {variation with highest estimated CTR},
  "tips": ["improvement tip 1", "tip 2"]
}

REQUIREMENTS:
- Include the target keyword in at least 70% of headlines
- Keep headlines under 60 characters for SEO when possible
- Use power words and emotional triggers
- Make each variation distinctly different
- Ensure readability and clarity`;

    const response = await llm.call({
      systemPrompt,
      userPrompt,
      temperature: 0.8,
      maxTokens: 2500
    });

    const result: HeadlineResult = JSON.parse(response);

    return {
      success: true,
      data: result
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Headline generation failed'
    };
  }
}

/**
 * A/B test headline comparison
 */
export interface ABTestResult {
  winner: 'A' | 'B' | 'tie';
  headlineA: {
    headline: string;
    score: number;
    strengths: string[];
    weaknesses: string[];
  };
  headlineB: {
    headline: string;
    score: number;
    strengths: string[];
    weaknesses: string[];
  };
  recommendation: string;
}

export async function compareHeadlines(
  headlineA: string,
  headlineB: string,
  targetKeyword: string,
  provider?: LLMProvider
): Promise<AgentResult<ABTestResult>> {
  const llm = provider || createOpenAIProvider();

  try {
    const systemPrompt = `You are a headline optimization expert. Compare headlines and determine which will perform better.`;

    const userPrompt = `Compare these two headlines:

HEADLINE A: ${headlineA}
HEADLINE B: ${headlineB}
TARGET KEYWORD: ${targetKeyword}

Analyze each for:
- SEO optimization
- Click-through potential
- Clarity and readability
- Emotional impact
- Keyword placement

Return JSON:
{
  "winner": "A" | "B" | "tie",
  "headlineA": {
    "headline": "${headlineA}",
    "score": 0-100,
    "strengths": ["strength 1", "strength 2"],
    "weaknesses": ["weakness 1"]
  },
  "headlineB": {
    "headline": "${headlineB}",
    "score": 0-100,
    "strengths": ["strength 1", "strength 2"],
    "weaknesses": ["weakness 1"]
  },
  "recommendation": "explanation of which to use and why"
}`;

    const response = await llm.call({
      systemPrompt,
      userPrompt,
      temperature: 0.3,
      maxTokens: 1000
    });

    const result: ABTestResult = JSON.parse(response);

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
