/**
 * Content Rewriter Agent
 * AI-powered content rewriting, transformation, and enhancement
 */

import { LLMProvider, AgentResult } from './types';
import { createOpenAIProvider } from './openai-provider';

export interface RewriteOptions {
  mode: 'improve' | 'simplify' | 'expand' | 'condense' | 'paraphrase' | 'formal' | 'casual' | 'seo';
  targetKeyword?: string;
  targetWordCount?: number;
  preserveStructure?: boolean;
  targetAudience?: string;
  brandVoice?: string[];
}

export interface ParagraphRevision {
  index: number;
  original: string;
  revised: string;
  changeType: 'unchanged' | 'minor' | 'major' | 'rewritten';
  changes: string[];
}

export interface RewriteResult {
  originalContent: string;
  rewrittenContent: string;
  originalWordCount: number;
  newWordCount: number;
  changePercentage: number;
  paragraphRevisions: ParagraphRevision[];
  improvements: string[];
  summary: string;
}

/**
 * Rewrite content based on specified mode
 */
export async function rewriteContent(
  content: string,
  options: RewriteOptions,
  provider?: LLMProvider
): Promise<AgentResult<RewriteResult>> {
  const llm = provider || createOpenAIProvider();

  try {
    const modeInstructions = getModeInstructions(options.mode);
    
    const systemPrompt = `You are an expert content editor. ${modeInstructions}`;

    const userPrompt = `Rewrite the following content:

MODE: ${options.mode.toUpperCase()}
${options.targetKeyword ? `TARGET KEYWORD: ${options.targetKeyword}` : ''}
${options.targetWordCount ? `TARGET WORD COUNT: ${options.targetWordCount}` : ''}
${options.targetAudience ? `TARGET AUDIENCE: ${options.targetAudience}` : ''}
${options.brandVoice?.length ? `BRAND VOICE: ${options.brandVoice.join(', ')}` : ''}
${options.preserveStructure ? 'PRESERVE: Maintain existing headings and structure' : ''}

ORIGINAL CONTENT:
${content}

INSTRUCTIONS:
1. Apply the ${options.mode} transformation
2. Track changes per paragraph
3. Provide improvement summary

Return JSON:
{
  "rewrittenContent": "full rewritten content in markdown",
  "paragraphRevisions": [
    {
      "index": 0,
      "original": "original paragraph text",
      "revised": "revised paragraph text",
      "changeType": "unchanged" | "minor" | "major" | "rewritten",
      "changes": ["change description 1", "change description 2"]
    }
  ],
  "improvements": ["improvement 1", "improvement 2"],
  "summary": "brief summary of all changes made"
}`;

    const response = await llm.call({
      systemPrompt,
      userPrompt,
      temperature: 0.7,
      maxTokens: 6000
    });

    const result = JSON.parse(response);
    
    const originalWordCount = content.split(/\s+/).length;
    const newWordCount = result.rewrittenContent.split(/\s+/).length;
    const changePercentage = Math.round(
      (Math.abs(newWordCount - originalWordCount) / originalWordCount) * 100
    );

    return {
      success: true,
      data: {
        originalContent: content,
        rewrittenContent: result.rewrittenContent,
        originalWordCount,
        newWordCount,
        changePercentage,
        paragraphRevisions: result.paragraphRevisions || [],
        improvements: result.improvements || [],
        summary: result.summary || ''
      }
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Content rewriting failed'
    };
  }
}

function getModeInstructions(mode: string): string {
  switch (mode) {
    case 'improve':
      return 'Improve clarity, flow, and engagement while preserving the core message.';
    case 'simplify':
      return 'Simplify language to make content more accessible. Use shorter sentences and simpler words.';
    case 'expand':
      return 'Expand content with more details, examples, and explanations.';
    case 'condense':
      return 'Condense content to be more concise while keeping key information.';
    case 'paraphrase':
      return 'Paraphrase content completely while maintaining the same meaning.';
    case 'formal':
      return 'Transform to a more formal, professional tone.';
    case 'casual':
      return 'Transform to a more casual, conversational tone.';
    case 'seo':
      return 'Optimize for SEO with better keyword usage, headings, and structure.';
    default:
      return 'Improve the overall quality of the content.';
  }
}

/**
 * Transform content tone/style
 */
export interface ToneTransformation {
  originalTone: string;
  targetTone: string;
  transformedContent: string;
  toneShiftExamples: {
    before: string;
    after: string;
    explanation: string;
  }[];
  confidenceScore: number;
}

export async function transformTone(
  content: string,
  targetTone: 'professional' | 'casual' | 'friendly' | 'authoritative' | 'empathetic' | 'humorous' | 'urgent',
  provider?: LLMProvider
): Promise<AgentResult<ToneTransformation>> {
  const llm = provider || createOpenAIProvider();

  try {
    const systemPrompt = `You are a tone transformation expert. Convert content to the specified tone while preserving meaning.`;

    const userPrompt = `Transform this content to a ${targetTone.toUpperCase()} tone:

CONTENT:
${content}

Return JSON:
{
  "originalTone": "detected original tone",
  "targetTone": "${targetTone}",
  "transformedContent": "full transformed content",
  "toneShiftExamples": [
    {
      "before": "original phrase",
      "after": "transformed phrase",
      "explanation": "why this change creates the ${targetTone} tone"
    }
  ],
  "confidenceScore": 0-100
}`;

    const response = await llm.call({
      systemPrompt,
      userPrompt,
      temperature: 0.7,
      maxTokens: 4000
    });

    const result: ToneTransformation = JSON.parse(response);

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
 * Summarize or expand content
 */
export interface ContentTransformation {
  originalContent: string;
  transformedContent: string;
  originalWordCount: number;
  newWordCount: number;
  ratio: number;
  keyPointsPreserved: string[];
  addedDetails?: string[];
  removedDetails?: string[];
}

export async function summarizeContent(
  content: string,
  targetLength: 'brief' | 'medium' | 'detailed' = 'medium',
  provider?: LLMProvider
): Promise<AgentResult<ContentTransformation>> {
  const llm = provider || createOpenAIProvider();

  try {
    const lengthGuide = {
      brief: '25% of original length, key points only',
      medium: '50% of original length, main ideas with some detail',
      detailed: '75% of original length, preserve most information'
    };

    const systemPrompt = `You are a content summarization expert.`;

    const userPrompt = `Summarize this content to ${lengthGuide[targetLength]}:

CONTENT:
${content}

Return JSON:
{
  "transformedContent": "summarized content",
  "keyPointsPreserved": ["key point 1", "key point 2"],
  "removedDetails": ["removed detail 1", "removed detail 2"]
}`;

    const response = await llm.call({
      systemPrompt,
      userPrompt,
      temperature: 0.5,
      maxTokens: 2000
    });

    const result = JSON.parse(response);
    const originalWordCount = content.split(/\s+/).length;
    const newWordCount = result.transformedContent.split(/\s+/).length;

    return {
      success: true,
      data: {
        originalContent: content,
        transformedContent: result.transformedContent,
        originalWordCount,
        newWordCount,
        ratio: newWordCount / originalWordCount,
        keyPointsPreserved: result.keyPointsPreserved || [],
        removedDetails: result.removedDetails || []
      }
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
}

export async function expandContent(
  content: string,
  expansionFactor: number = 2,
  focusAreas?: string[],
  provider?: LLMProvider
): Promise<AgentResult<ContentTransformation>> {
  const llm = provider || createOpenAIProvider();

  try {
    const systemPrompt = `You are a content expansion expert. Add valuable details, examples, and explanations.`;

    const userPrompt = `Expand this content by approximately ${expansionFactor}x:

CONTENT:
${content}

${focusAreas?.length ? `FOCUS AREAS TO EXPAND: ${focusAreas.join(', ')}` : ''}

Return JSON:
{
  "transformedContent": "expanded content with more details",
  "keyPointsPreserved": ["original point 1", "original point 2"],
  "addedDetails": ["added detail 1", "added example 2"]
}`;

    const response = await llm.call({
      systemPrompt,
      userPrompt,
      temperature: 0.7,
      maxTokens: 6000
    });

    const result = JSON.parse(response);
    const originalWordCount = content.split(/\s+/).length;
    const newWordCount = result.transformedContent.split(/\s+/).length;

    return {
      success: true,
      data: {
        originalContent: content,
        transformedContent: result.transformedContent,
        originalWordCount,
        newWordCount,
        ratio: newWordCount / originalWordCount,
        keyPointsPreserved: result.keyPointsPreserved || [],
        addedDetails: result.addedDetails || []
      }
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Generate content diff
 */
export interface ContentDiff {
  additions: { text: string; position: number }[];
  deletions: { text: string; position: number }[];
  modifications: { original: string; revised: string; position: number }[];
  totalChanges: number;
  similarityScore: number;
}

export function generateContentDiff(original: string, revised: string): ContentDiff {
  const originalParagraphs = original.split(/\n\n+/);
  const revisedParagraphs = revised.split(/\n\n+/);

  const additions: { text: string; position: number }[] = [];
  const deletions: { text: string; position: number }[] = [];
  const modifications: { original: string; revised: string; position: number }[] = [];

  const maxLen = Math.max(originalParagraphs.length, revisedParagraphs.length);

  for (let i = 0; i < maxLen; i++) {
    const orig = originalParagraphs[i] || '';
    const rev = revisedParagraphs[i] || '';

    if (!orig && rev) {
      additions.push({ text: rev, position: i });
    } else if (orig && !rev) {
      deletions.push({ text: orig, position: i });
    } else if (orig !== rev) {
      modifications.push({ original: orig, revised: rev, position: i });
    }
  }

  // Calculate similarity
  const originalWords = new Set(original.toLowerCase().split(/\s+/));
  const revisedWords = new Set(revised.toLowerCase().split(/\s+/));
  const intersection = [...originalWords].filter(w => revisedWords.has(w));
  const union = new Set([...originalWords, ...revisedWords]);
  const similarityScore = Math.round((intersection.length / union.size) * 100);

  return {
    additions,
    deletions,
    modifications,
    totalChanges: additions.length + deletions.length + modifications.length,
    similarityScore
  };
}

/**
 * Section-by-section revision with human-in-the-loop support
 */
export interface SectionRevision {
  sectionIndex: number;
  sectionTitle?: string;
  originalContent: string;
  suggestedRevision: string;
  revisionType: 'grammar' | 'clarity' | 'seo' | 'engagement' | 'structure';
  confidence: number;
  reasoning: string;
  status: 'pending' | 'accepted' | 'rejected' | 'modified';
}

export async function generateSectionRevisions(
  content: string,
  revisionTypes: ('grammar' | 'clarity' | 'seo' | 'engagement' | 'structure')[],
  provider?: LLMProvider
): Promise<AgentResult<SectionRevision[]>> {
  const llm = provider || createOpenAIProvider();

  try {
    const sections = content.split(/\n## |\n# /).filter(s => s.trim());

    const systemPrompt = `You are a content editor. Analyze each section and suggest specific revisions.`;

    const userPrompt = `Analyze these content sections and suggest revisions:

REVISION TYPES TO FOCUS ON: ${revisionTypes.join(', ')}

SECTIONS:
${sections.map((s, i) => `[SECTION ${i}]\n${s.substring(0, 500)}`).join('\n\n')}

For each section that needs improvement, return JSON:
{
  "revisions": [
    {
      "sectionIndex": 0,
      "sectionTitle": "extracted title if any",
      "originalContent": "original text snippet",
      "suggestedRevision": "improved version",
      "revisionType": "grammar" | "clarity" | "seo" | "engagement" | "structure",
      "confidence": 0-100,
      "reasoning": "why this change improves the content"
    }
  ]
}

Only include sections that genuinely need improvement.`;

    const response = await llm.call({
      systemPrompt,
      userPrompt,
      temperature: 0.4,
      maxTokens: 3000
    });

    const result = JSON.parse(response);
    const revisions = (result.revisions || []).map((r: any) => ({
      ...r,
      status: 'pending'
    }));

    return {
      success: true,
      data: revisions
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
}
