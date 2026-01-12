/**
 * Fact-Check Agent
 * Extracts verifiable claims and validates them for accuracy
 */

import { LLMProvider, AgentResult } from './types';

export interface FactCheckClaim {
    claim: string;
    sectionKey?: string;
    verifiable: boolean;
    status: 'verified' | 'unverified' | 'questionable' | 'needs_source';
    reasoning: string;
    suggestedSource?: string;
    severity: 'low' | 'medium' | 'high';
}

export interface FactCheckResult {
    claims: FactCheckClaim[];
    factCheckScore: number; // 0-100
    overallFeedback: string;
    passed: boolean; // true if score >= 80
    totalClaims: number;
    verifiedClaims: number;
    unverifiedClaims: number;
}

export interface FactCheckAgentInput {
    fullDraftContent: string;
    sectionContents?: Record<string, string>;
    topic: string;
    targetKeyword: string;
}

/**
 * Run the Fact-Check agent to extract and verify claims
 */
export async function runFactCheckAgent(
    provider: LLMProvider,
    input: FactCheckAgentInput
): Promise<AgentResult<FactCheckResult>> {
    try {
        // Truncate content if too long (keep within token limits)
        const maxContentLength = 4000;
        let contentToAnalyze = input.fullDraftContent;
        if (contentToAnalyze.length > maxContentLength) {
            contentToAnalyze = contentToAnalyze.substring(0, maxContentLength);
        }

        const systemPrompt = `You are a Fact-Checking Specialist. Your role is to extract verifiable claims from content and assess their factual accuracy and need for sources.`;

        const userPrompt = `TOPIC: ${input.topic}

TARGET KEYWORD: ${input.targetKeyword}

CONTENT TO FACT-CHECK:
${contentToAnalyze}

INSTRUCTIONS:
1. Extract all verifiable claims (statistics, facts, quotes, historical events, scientific statements, etc.)
2. For each claim, determine:
   - Is it verifiable? (can it be fact-checked?)
   - Status: verified (common knowledge/obviously true), unverified (needs checking), questionable (might be wrong), needs_source (requires citation)
   - Reasoning: why you assigned this status
   - Suggested source: if a source would help (e.g., "Cite peer-reviewed study on X")
   - Severity: high (factual error risk), medium (needs citation), low (minor issue)
3. Calculate a fact-check score (0-100) where:
   - 100 = all claims verified or low-risk
   - 80-99 = mostly good, minor source needs
   - 60-79 = some questionable claims
   - <60 = significant factual concerns
4. Provide overall feedback on factual integrity

Return a JSON object with this exact structure:
{
  "claims": [
    {
      "claim": "exact text of the claim from content",
      "sectionKey": "section identifier if known (or null)",
      "verifiable": true/false,
      "status": "verified" | "unverified" | "questionable" | "needs_source",
      "reasoning": "explanation of why this status",
      "suggestedSource": "optional: what kind of source would help",
      "severity": "low" | "medium" | "high"
    }
  ],
  "factCheckScore": 0-100,
  "overallFeedback": "summary of factual integrity",
  "passed": true/false (true if score >= 80),
  "totalClaims": number,
  "verifiedClaims": number,
  "unverifiedClaims": number
}

IMPORTANT: Return ONLY valid JSON, no other text.`;

        const response = await provider.call({
            systemPrompt,
            userPrompt,
            temperature: 0.2, // Lower temperature for more factual analysis
            maxTokens: 2000
        });

        // Parse the JSON response
        const result: FactCheckResult = JSON.parse(response);

        // Validate and sanitize the result
        if (!result.claims || !Array.isArray(result.claims)) {
            result.claims = [];
        }

        // Calculate counts if not provided
        result.totalClaims = result.claims.length;
        result.verifiedClaims = result.claims.filter(c => c.status === 'verified').length;
        result.unverifiedClaims = result.claims.filter(c => c.status === 'unverified' || c.status === 'questionable' || c.status === 'needs_source').length;

        // Ensure score is valid
        if (typeof result.factCheckScore !== 'number' || result.factCheckScore < 0 || result.factCheckScore > 100) {
            result.factCheckScore = 50; // Default to medium score if invalid
        }

        // Set passed status
        result.passed = result.factCheckScore >= 80;

        return {
            success: true,
            data: result
        };
    } catch (error: any) {
        return {
            success: false,
            error: error.message || 'Fact-check agent failed'
        };
    }
}

/**
 * Check if content passes fact-check requirements
 */
export function checkFactCheckPassed(result: FactCheckResult): boolean {
    return result.factCheckScore >= 80 && result.passed;
}

/**
 * Get high severity claims that need immediate attention
 */
export function getHighSeverityClaims(result: FactCheckResult): FactCheckClaim[] {
    return result.claims.filter(c => c.severity === 'high');
}

/**
 * Get all claims that need sources
 */
export function getClaimsNeedingSources(result: FactCheckResult): FactCheckClaim[] {
    return result.claims.filter(c => c.status === 'needs_source' || c.status === 'questionable');
}

/**
 * Get summary statistics
 */
export function getFactCheckSummary(result: FactCheckResult): {
    totalClaims: number;
    verifiedClaims: number;
    unverifiedClaims: number;
    questionableClaims: number;
    needsSourceClaims: number;
    highSeverityCount: number;
} {
    return {
        totalClaims: result.totalClaims,
        verifiedClaims: result.verifiedClaims,
        unverifiedClaims: result.unverifiedClaims,
        questionableClaims: result.claims.filter(c => c.status === 'questionable').length,
        needsSourceClaims: result.claims.filter(c => c.status === 'needs_source').length,
        highSeverityCount: result.claims.filter(c => c.severity === 'high').length
    };
}
