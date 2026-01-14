/**
 * Readability Agent
 * Analyzes and optimizes content readability for target audiences
 */

import { LLMProvider, AgentResult } from './types';
import { createOpenAIProvider } from './openai-provider';

export interface ReadabilityMetrics {
  fleschReadingEase: number;
  fleschKincaidGrade: number;
  avgSentenceLength: number;
  avgWordLength: number;
  paragraphCount: number;
  sentenceCount: number;
  wordCount: number;
  complexWordPercentage: number;
  passiveVoicePercentage: number;
}

export interface ReadabilityIssue {
  type: 'sentence_length' | 'complex_word' | 'passive_voice' | 'jargon' | 'clarity' | 'structure';
  originalText: string;
  suggestion: string;
  location: string;
  severity: 'high' | 'medium' | 'low';
}

export interface ReadabilityResult {
  score: number;
  grade: string;
  metrics: ReadabilityMetrics;
  targetAudienceMatch: 'good' | 'too_simple' | 'too_complex';
  issues: ReadabilityIssue[];
  optimizedContent?: string;
  improvements: string[];
  summary: string;
}

export interface ReadabilityInput {
  content: string;
  targetAudience?: string;
  targetGradeLevel?: number;
  optimize?: boolean;
}

/**
 * Calculate basic readability metrics
 */
function calculateBasicMetrics(content: string): ReadabilityMetrics {
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = content.split(/\s+/).filter(w => w.length > 0);
  const paragraphs = content.split(/\n\n+/).filter(p => p.trim().length > 0);

  const totalSyllables = words.reduce((sum, word) => sum + countSyllables(word), 0);
  const complexWords = words.filter(w => countSyllables(w) >= 3).length;
  
  const avgSentenceLength = words.length / sentences.length;
  const avgSyllablesPerWord = totalSyllables / words.length;

  // Flesch Reading Ease: 206.835 - 1.015(words/sentences) - 84.6(syllables/words)
  const fleschReadingEase = Math.max(0, Math.min(100,
    206.835 - (1.015 * avgSentenceLength) - (84.6 * avgSyllablesPerWord)
  ));

  // Flesch-Kincaid Grade Level: 0.39(words/sentences) + 11.8(syllables/words) - 15.59
  const fleschKincaidGrade = Math.max(0,
    (0.39 * avgSentenceLength) + (11.8 * avgSyllablesPerWord) - 15.59
  );

  return {
    fleschReadingEase: Math.round(fleschReadingEase * 10) / 10,
    fleschKincaidGrade: Math.round(fleschKincaidGrade * 10) / 10,
    avgSentenceLength: Math.round(avgSentenceLength * 10) / 10,
    avgWordLength: Math.round((content.replace(/\s/g, '').length / words.length) * 10) / 10,
    paragraphCount: paragraphs.length,
    sentenceCount: sentences.length,
    wordCount: words.length,
    complexWordPercentage: Math.round((complexWords / words.length) * 100 * 10) / 10,
    passiveVoicePercentage: 0 // Would need more sophisticated analysis
  };
}

function countSyllables(word: string): number {
  word = word.toLowerCase().replace(/[^a-z]/g, '');
  if (word.length <= 3) return 1;
  
  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
  word = word.replace(/^y/, '');
  
  const matches = word.match(/[aeiouy]{1,2}/g);
  return matches ? matches.length : 1;
}

/**
 * Run full readability analysis with AI
 */
export async function runReadabilityAgent(
  input: ReadabilityInput,
  provider?: LLMProvider
): Promise<AgentResult<ReadabilityResult>> {
  const llm = provider || createOpenAIProvider();

  try {
    const metrics = calculateBasicMetrics(input.content);
    const targetGrade = input.targetGradeLevel || 8;

    const systemPrompt = `You are a readability expert. Analyze content for clarity, simplicity, and audience appropriateness. ${input.optimize ? 'Also provide an optimized version of the content.' : ''}`;

    const userPrompt = `Analyze this content for readability:

TARGET AUDIENCE: ${input.targetAudience || 'General business professionals'}
TARGET GRADE LEVEL: ${targetGrade}

CURRENT METRICS:
- Flesch Reading Ease: ${metrics.fleschReadingEase} (0-100, higher is easier)
- Flesch-Kincaid Grade: ${metrics.fleschKincaidGrade}
- Average Sentence Length: ${metrics.avgSentenceLength} words
- Word Count: ${metrics.wordCount}
- Complex Words: ${metrics.complexWordPercentage}%

CONTENT:
${input.content.substring(0, 5000)}

INSTRUCTIONS:
1. Identify readability issues (long sentences, jargon, passive voice, etc.)
2. Score overall readability (0-100)
3. Determine if content matches target audience
4. Provide specific improvement suggestions
${input.optimize ? '5. Provide an optimized version of the content' : ''}

Return JSON:
{
  "score": 0-100,
  "grade": "A/B/C/D/F based on readability",
  "metrics": ${JSON.stringify(metrics)},
  "targetAudienceMatch": "good" | "too_simple" | "too_complex",
  "issues": [
    {
      "type": "sentence_length" | "complex_word" | "passive_voice" | "jargon" | "clarity" | "structure",
      "originalText": "problematic text",
      "suggestion": "improved version",
      "location": "paragraph/section identifier",
      "severity": "high" | "medium" | "low"
    }
  ],
  ${input.optimize ? '"optimizedContent": "full optimized content",' : ''}
  "improvements": ["specific improvement 1", "improvement 2"],
  "summary": "overall readability assessment"
}`;

    const response = await llm.call({
      systemPrompt,
      userPrompt,
      temperature: 0.4,
      maxTokens: input.optimize ? 6000 : 2500
    });

    const result: ReadabilityResult = JSON.parse(response);
    result.metrics = metrics; // Use calculated metrics

    return {
      success: true,
      data: result
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Readability analysis failed'
    };
  }
}

/**
 * Quick readability score (no AI, just metrics)
 */
export function quickReadabilityScore(content: string): {
  score: number;
  grade: string;
  metrics: ReadabilityMetrics;
} {
  const metrics = calculateBasicMetrics(content);
  
  // Convert Flesch Reading Ease to a 0-100 score
  const score = Math.round(metrics.fleschReadingEase);
  
  // Determine grade
  let grade: string;
  if (score >= 90) grade = 'A';
  else if (score >= 80) grade = 'B';
  else if (score >= 70) grade = 'C';
  else if (score >= 60) grade = 'D';
  else grade = 'F';

  return { score, grade, metrics };
}

/**
 * Optimize content for better readability
 */
export async function optimizeReadability(
  content: string,
  targetGradeLevel: number = 8,
  provider?: LLMProvider
): Promise<AgentResult<{ originalScore: number; optimizedScore: number; content: string }>> {
  const result = await runReadabilityAgent({
    content,
    targetGradeLevel,
    optimize: true
  }, provider);

  if (!result.success || !result.data) {
    return { success: false, error: result.error };
  }

  const originalMetrics = calculateBasicMetrics(content);
  const optimizedMetrics = result.data.optimizedContent 
    ? calculateBasicMetrics(result.data.optimizedContent)
    : originalMetrics;

  return {
    success: true,
    data: {
      originalScore: Math.round(originalMetrics.fleschReadingEase),
      optimizedScore: Math.round(optimizedMetrics.fleschReadingEase),
      content: result.data.optimizedContent || content
    }
  };
}
