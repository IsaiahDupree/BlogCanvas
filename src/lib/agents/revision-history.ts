/**
 * Revision History Manager
 * Track, compare, and manage content revisions
 */

import { LLMProvider, AgentResult } from './types';
import { createOpenAIProvider } from './openai-provider';
import { generateContentDiff, ContentDiff } from './content-rewriter';

export interface RevisionVersion {
  id: string;
  version: number;
  content: string;
  wordCount: number;
  createdAt: string;
  createdBy: 'user' | 'ai' | 'system';
  revisionType: string;
  metadata?: Record<string, any>;
}

export interface RevisionComparison {
  versionA: RevisionVersion;
  versionB: RevisionVersion;
  diff: ContentDiff;
  qualityComparison: {
    winner: 'A' | 'B' | 'tie';
    versionAScore: number;
    versionBScore: number;
    analysis: string;
  };
  recommendations: string[];
}

export interface RevisionTimeline {
  totalVersions: number;
  wordCountHistory: { version: number; wordCount: number; date: string }[];
  majorChanges: { version: number; description: string; date: string }[];
  averageChangeSize: number;
  mostRecentChange: string;
}

/**
 * Compare two revisions with AI analysis
 */
export async function compareRevisions(
  versionA: RevisionVersion,
  versionB: RevisionVersion,
  provider?: LLMProvider
): Promise<AgentResult<RevisionComparison>> {
  const llm = provider || createOpenAIProvider();

  try {
    const diff = generateContentDiff(versionA.content, versionB.content);

    const systemPrompt = `You are a content quality analyst. Compare two versions of content and determine which is better.`;

    const userPrompt = `Compare these two content versions:

VERSION A (v${versionA.version}, ${versionA.revisionType}):
${versionA.content.substring(0, 2000)}

VERSION B (v${versionB.version}, ${versionB.revisionType}):
${versionB.content.substring(0, 2000)}

DIFF SUMMARY:
- Additions: ${diff.additions.length}
- Deletions: ${diff.deletions.length}
- Modifications: ${diff.modifications.length}
- Similarity: ${diff.similarityScore}%

Analyze quality of each version. Return JSON:
{
  "winner": "A" | "B" | "tie",
  "versionAScore": 0-100,
  "versionBScore": 0-100,
  "analysis": "explanation of which is better and why",
  "recommendations": ["recommendation 1", "recommendation 2"]
}`;

    const response = await llm.call({
      systemPrompt,
      userPrompt,
      temperature: 0.3,
      maxTokens: 1000
    });

    const result = JSON.parse(response);

    return {
      success: true,
      data: {
        versionA,
        versionB,
        diff,
        qualityComparison: {
          winner: result.winner,
          versionAScore: result.versionAScore,
          versionBScore: result.versionBScore,
          analysis: result.analysis
        },
        recommendations: result.recommendations || []
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
 * Generate revision timeline analysis
 */
export function analyzeRevisionTimeline(revisions: RevisionVersion[]): RevisionTimeline {
  const sorted = [...revisions].sort((a, b) => a.version - b.version);

  const wordCountHistory = sorted.map(r => ({
    version: r.version,
    wordCount: r.wordCount,
    date: r.createdAt
  }));

  // Calculate average change size
  let totalChange = 0;
  for (let i = 1; i < sorted.length; i++) {
    totalChange += Math.abs(sorted[i].wordCount - sorted[i - 1].wordCount);
  }
  const averageChangeSize = sorted.length > 1 ? Math.round(totalChange / (sorted.length - 1)) : 0;

  // Identify major changes (>20% word count change or specific types)
  const majorChanges: { version: number; description: string; date: string }[] = [];
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const curr = sorted[i];
    const changePercent = Math.abs(curr.wordCount - prev.wordCount) / prev.wordCount;
    
    if (changePercent > 0.2 || curr.revisionType.includes('rewrite')) {
      majorChanges.push({
        version: curr.version,
        description: `${curr.revisionType}: ${changePercent > 0 ? '+' : ''}${Math.round(changePercent * 100)}% word count`,
        date: curr.createdAt
      });
    }
  }

  return {
    totalVersions: revisions.length,
    wordCountHistory,
    majorChanges,
    averageChangeSize,
    mostRecentChange: sorted[sorted.length - 1]?.revisionType || 'none'
  };
}

/**
 * Suggest next revision action
 */
export interface RevisionSuggestion {
  suggestedAction: string;
  priority: 'high' | 'medium' | 'low';
  reasoning: string;
  estimatedImpact: string;
}

export async function suggestNextRevision(
  content: string,
  revisionHistory: RevisionVersion[],
  targetGoals?: string[],
  provider?: LLMProvider
): Promise<AgentResult<RevisionSuggestion[]>> {
  const llm = provider || createOpenAIProvider();

  try {
    const recentRevisions = revisionHistory.slice(-5).map(r => r.revisionType).join(', ');

    const systemPrompt = `You are a content strategy advisor. Suggest the most impactful next revision.`;

    const userPrompt = `Analyze this content and suggest next revision steps:

CURRENT CONTENT:
${content.substring(0, 2000)}

WORD COUNT: ${content.split(/\s+/).length}
RECENT REVISIONS: ${recentRevisions || 'None'}
${targetGoals?.length ? `TARGET GOALS: ${targetGoals.join(', ')}` : ''}

Suggest 3 potential next revision actions. Return JSON:
{
  "suggestions": [
    {
      "suggestedAction": "specific action to take",
      "priority": "high" | "medium" | "low",
      "reasoning": "why this would improve the content",
      "estimatedImpact": "expected improvement"
    }
  ]
}`;

    const response = await llm.call({
      systemPrompt,
      userPrompt,
      temperature: 0.6,
      maxTokens: 1000
    });

    const result = JSON.parse(response);

    return {
      success: true,
      data: result.suggestions || []
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Merge changes from multiple revisions
 */
export async function mergeRevisions(
  baseContent: string,
  revisions: { content: string; priority: number }[],
  provider?: LLMProvider
): Promise<AgentResult<{ mergedContent: string; changesIncorporated: string[] }>> {
  const llm = provider || createOpenAIProvider();

  try {
    const systemPrompt = `You are a content merger. Combine the best elements from multiple revisions.`;

    const userPrompt = `Merge these content revisions, prioritizing higher priority versions:

BASE CONTENT:
${baseContent.substring(0, 1500)}

REVISIONS TO INCORPORATE:
${revisions.map((r, i) => `[REVISION ${i + 1}, Priority: ${r.priority}]\n${r.content.substring(0, 500)}`).join('\n\n')}

Create a merged version that incorporates the best changes from each revision.

Return JSON:
{
  "mergedContent": "full merged content",
  "changesIncorporated": ["change from revision 1", "change from revision 2"]
}`;

    const response = await llm.call({
      systemPrompt,
      userPrompt,
      temperature: 0.5,
      maxTokens: 4000
    });

    const result = JSON.parse(response);

    return {
      success: true,
      data: {
        mergedContent: result.mergedContent,
        changesIncorporated: result.changesIncorporated || []
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
 * Rollback content to previous version with AI assistance
 */
export async function smartRollback(
  currentContent: string,
  targetVersion: RevisionVersion,
  preserveElements?: string[],
  provider?: LLMProvider
): Promise<AgentResult<{ rolledBackContent: string; preservedElements: string[] }>> {
  const llm = provider || createOpenAIProvider();

  try {
    if (!preserveElements?.length) {
      // Simple rollback
      return {
        success: true,
        data: {
          rolledBackContent: targetVersion.content,
          preservedElements: []
        }
      };
    }

    const systemPrompt = `You are a content rollback specialist. Revert to a previous version while preserving specified elements.`;

    const userPrompt = `Rollback to previous version while preserving certain elements:

CURRENT CONTENT:
${currentContent.substring(0, 1500)}

TARGET VERSION (v${targetVersion.version}):
${targetVersion.content.substring(0, 1500)}

ELEMENTS TO PRESERVE FROM CURRENT:
${preserveElements.join('\n')}

Return JSON:
{
  "rolledBackContent": "content with rollback applied but preserving specified elements",
  "preservedElements": ["what was actually preserved"]
}`;

    const response = await llm.call({
      systemPrompt,
      userPrompt,
      temperature: 0.3,
      maxTokens: 4000
    });

    const result = JSON.parse(response);

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
