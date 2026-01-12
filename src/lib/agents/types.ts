/**
 * Agent Types
 * Shared types for all AI agents in the content pipeline
 */

export interface LLMRequest {
    systemPrompt?: string;
    userPrompt: string;
    temperature?: number;
    maxTokens?: number;
}

export interface LLMProvider {
    name: string;
    call: (request: LLMRequest) => Promise<string>;
}

export interface AgentResult<T> {
    success: boolean;
    data?: T;
    error?: string;
    duration?: number;
}

export interface VoiceToneIssue {
    sectionKey?: string;
    issue: string;
    suggestion: string;
    severity: 'low' | 'medium' | 'high';
}

export interface VoiceToneResult {
    alignmentScore: number;
    issues: VoiceToneIssue[];
    overallFeedback: string;
    passed: boolean;
}

export interface OutlineSection {
    key: string;
    title: string;
    type: 'intro' | 'body' | 'conclusion' | 'cta';
    keyPoints: string[];
    estimatedWords: number;
}

export interface OutlineResult {
    sections: OutlineSection[];
    totalEstimatedWords: number;
}

export interface ResearchResult {
    painPoints: string[];
    keyFacts: string[];
    differentiators: string[];
    relatedSubtopics: string[];
    suggestedAngles: string[];
}

export interface DraftSectionResult {
    sectionKey?: string;
    content: string;
    wordCount: number;
}

export interface SEOMetadata {
    title: string;
    metaDescription: string;
    slug: string;
    suggestions: string[];
    keywordDensity: number;
    readabilityScore: string;
}

export interface QualityGate {
    passed: boolean;
    reason?: string;
    score?: number;
}

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
    factCheckScore: number;
    overallFeedback: string;
    passed: boolean;
    totalClaims: number;
    verifiedClaims: number;
    unverifiedClaims: number;
}

export interface QualityGates {
    outline: QualityGate;
    completeness: QualityGate;
    seo?: QualityGate;
    voiceTone?: QualityGate;
    factCheck?: QualityGate;
}
