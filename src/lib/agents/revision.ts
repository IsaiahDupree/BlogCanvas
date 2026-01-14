/**
 * Revision Agent
 * AI-powered content revision and improvement
 * Analyzes existing content and suggests/applies improvements
 */

import { LLMProvider, AgentResult } from './types';
import { createOpenAIProvider } from './openai-provider';

export interface RevisionSuggestion {
  type: 'grammar' | 'clarity' | 'seo' | 'engagement' | 'structure' | 'tone';
  originalText: string;
  suggestedText: string;
  reasoning: string;
  priority: 'high' | 'medium' | 'low';
  location?: string;
}

export interface RevisionResult {
  originalWordCount: number;
  revisedWordCount: number;
  revisedContent: string;
  suggestions: RevisionSuggestion[];
  improvementScore: number;
  changes: {
    grammarFixes: number;
    clarityImprovements: number;
    seoEnhancements: number;
    engagementBoosts: number;
    structureChanges: number;
    toneAdjustments: number;
  };
  summary: string;
}

export interface RevisionInput {
  content: string;
  targetKeyword?: string;
  revisionGoals: ('grammar' | 'clarity' | 'seo' | 'engagement' | 'structure' | 'tone')[];
  brandVoice?: string[];
  targetAudience?: string;
  preserveStructure?: boolean;
}

/**
 * Run the Revision agent to improve content
 */
export async function runRevisionAgent(
  input: RevisionInput,
  provider?: LLMProvider
): Promise<AgentResult<RevisionResult>> {
  const llm = provider || createOpenAIProvider();

  try {
    const goalsDescription = input.revisionGoals.map(g => {
      switch (g) {
        case 'grammar': return 'Fix grammar, spelling, and punctuation errors';
        case 'clarity': return 'Improve clarity and readability';
        case 'seo': return 'Enhance SEO with better keyword usage and structure';
        case 'engagement': return 'Make content more engaging and compelling';
        case 'structure': return 'Improve content structure and flow';
        case 'tone': return 'Adjust tone to match brand voice';
        default: return g;
      }
    }).join('\n- ');

    const systemPrompt = `You are an expert content editor and SEO specialist. Your role is to revise and improve content while maintaining the author's intent and message.`;

    const userPrompt = `Revise the following content based on these goals:

REVISION GOALS:
- ${goalsDescription}

${input.targetKeyword ? `TARGET KEYWORD: ${input.targetKeyword}` : ''}
${input.brandVoice?.length ? `BRAND VOICE: ${input.brandVoice.join(', ')}` : ''}
${input.targetAudience ? `TARGET AUDIENCE: ${input.targetAudience}` : ''}
${input.preserveStructure ? 'NOTE: Preserve the overall structure (headings, sections)' : ''}

ORIGINAL CONTENT:
${input.content.substring(0, 8000)}

INSTRUCTIONS:
1. Apply improvements based on the revision goals
2. Track all significant changes made
3. Provide the fully revised content
4. List specific suggestions with before/after examples
5. Calculate an improvement score (0-100)

Return a JSON object:
{
  "originalWordCount": number,
  "revisedWordCount": number,
  "revisedContent": "full revised content in markdown",
  "suggestions": [
    {
      "type": "grammar" | "clarity" | "seo" | "engagement" | "structure" | "tone",
      "originalText": "original text snippet",
      "suggestedText": "improved text",
      "reasoning": "why this change improves the content",
      "priority": "high" | "medium" | "low",
      "location": "section or paragraph identifier"
    }
  ],
  "improvementScore": 0-100,
  "changes": {
    "grammarFixes": number,
    "clarityImprovements": number,
    "seoEnhancements": number,
    "engagementBoosts": number,
    "structureChanges": number,
    "toneAdjustments": number
  },
  "summary": "Brief summary of all improvements made"
}

IMPORTANT: Return ONLY valid JSON.`;

    const response = await llm.call({
      systemPrompt,
      userPrompt,
      temperature: 0.5,
      maxTokens: 6000
    });

    const result: RevisionResult = JSON.parse(response);

    return {
      success: true,
      data: result
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Revision agent failed'
    };
  }
}

/**
 * Quick grammar and clarity check
 */
export async function quickProofread(
  content: string,
  provider?: LLMProvider
): Promise<AgentResult<RevisionResult>> {
  return runRevisionAgent({
    content,
    revisionGoals: ['grammar', 'clarity'],
    preserveStructure: true
  }, provider);
}

/**
 * SEO-focused revision
 */
export async function seoRevision(
  content: string,
  targetKeyword: string,
  provider?: LLMProvider
): Promise<AgentResult<RevisionResult>> {
  return runRevisionAgent({
    content,
    targetKeyword,
    revisionGoals: ['seo', 'structure'],
    preserveStructure: false
  }, provider);
}

/**
 * Full content optimization
 */
export async function fullOptimization(
  content: string,
  targetKeyword: string,
  brandVoice: string[],
  targetAudience: string,
  provider?: LLMProvider
): Promise<AgentResult<RevisionResult>> {
  return runRevisionAgent({
    content,
    targetKeyword,
    brandVoice,
    targetAudience,
    revisionGoals: ['grammar', 'clarity', 'seo', 'engagement', 'structure', 'tone'],
    preserveStructure: false
  }, provider);
}

/**
 * Compare two versions of content
 */
export interface ContentComparison {
  originalWordCount: number;
  revisedWordCount: number;
  wordCountChange: number;
  readabilityChange: 'improved' | 'same' | 'decreased';
  keywordDensityChange: number;
  majorChanges: string[];
  minorChanges: number;
}

export function compareVersions(
  original: string,
  revised: string,
  keyword?: string
): ContentComparison {
  const originalWords = original.split(/\s+/).length;
  const revisedWords = revised.split(/\s+/).length;
  
  let keywordDensityChange = 0;
  if (keyword) {
    const originalKeywordCount = (original.toLowerCase().match(new RegExp(keyword.toLowerCase(), 'g')) || []).length;
    const revisedKeywordCount = (revised.toLowerCase().match(new RegExp(keyword.toLowerCase(), 'g')) || []).length;
    const originalDensity = (originalKeywordCount / originalWords) * 100;
    const revisedDensity = (revisedKeywordCount / revisedWords) * 100;
    keywordDensityChange = revisedDensity - originalDensity;
  }

  return {
    originalWordCount: originalWords,
    revisedWordCount: revisedWords,
    wordCountChange: revisedWords - originalWords,
    readabilityChange: 'improved', // Would need more sophisticated analysis
    keywordDensityChange,
    majorChanges: [],
    minorChanges: 0
  };
}
