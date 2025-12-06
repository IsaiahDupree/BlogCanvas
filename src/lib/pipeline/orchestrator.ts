/**
 * Pipeline Orchestrator
 * Coordinates all agents to create a complete blog post
 */

import { LLMProvider, ResearchResult, OutlineResult, SEOMetadata, VoiceToneResult, QualityGates, DraftSectionResult } from '../agents/types';
import { runResearchAgent } from '../agents/research';
import { runOutlineAgent, validateOutline } from '../agents/outline';
import { runDraftAgent, combineSections } from '../agents/draft';
import { runSEOAgent, validateSEOMetadata } from '../agents/seo';
import { runVoiceToneAgent } from '../agents/voice-tone';
import { MarketingContext } from '../context/marketing';

export interface PipelineInput {
    blogPostId: string;
    topic: string;
    targetKeyword: string;
    wordCountGoal: number;
    clientProfile: {
        productServiceSummary: string;
        targetAudience: string;
    };
    marketingContext: MarketingContext;
}

export interface PipelineResult {
    success: boolean;
    error?: string;
    research?: ResearchResult;
    outline?: OutlineResult;
    sections?: { key: string; content: string }[];
    fullDraft?: string;
    seoMetadata?: SEOMetadata;
    voiceToneReport?: VoiceToneResult;
    qualityGates?: QualityGates;
    retryCount?: number;
}

const MAX_RETRIES = 3;

/**
 * Run the complete blog post generation pipeline
 */
export async function runBlogPostPipeline(
    provider: LLMProvider,
    input: PipelineInput
): Promise<PipelineResult> {
    let retryCount = 0;

    try {
        // Step 1: Research
        const researchResult = await runResearchAgent(provider, {
            topic: input.topic,
            targetKeyword: input.targetKeyword,
            clientProfile: input.clientProfile
        });

        if (!researchResult.success || !researchResult.data) {
            return {
                success: false,
                error: `Research failed: ${researchResult.error}`
            };
        }

        // Step 2: Outline (with retry)
        let outlineResult;
        let outlineValid = false;

        while (!outlineValid && retryCount < MAX_RETRIES) {
            outlineResult = await runOutlineAgent(provider, {
                topic: input.topic,
                targetKeyword: input.targetKeyword,
                wordCountGoal: input.wordCountGoal,
                research: researchResult.data,
                clientProfile: input.clientProfile
            });

            if (outlineResult.success && outlineResult.data) {
                const validation = validateOutline(outlineResult.data, input.wordCountGoal);
                outlineValid = validation.valid;

                if (!outlineValid) {
                    retryCount++;
                }
            } else {
                retryCount++;
            }
        }

        if (!outlineValid || !outlineResult?.data) {
            return {
                success: false,
                error: 'Outline quality gate failed after max retries',
                retryCount
            };
        }

        // Step 3: Write sections
        const sections: { key: string; content: string }[] = [];
        const previousContents: string[] = [];

        for (const section of outlineResult.data.sections) {
            const draftResult = await runDraftAgent(provider, {
                section,
                topic: input.topic,
                targetKeyword: input.targetKeyword,
                marketingContext: input.marketingContext,
                previousSections: previousContents
            });

            if (draftResult.success && draftResult.data) {
                sections.push({
                    key: section.key,
                    content: draftResult.data.content
                });
                previousContents.push(draftResult.data.content);
            }
        }

        const fullDraft = combineSections(sections);

        // Step 4: SEO optimization
        const seoResult = await runSEOAgent(provider, {
            fullDraftContent: fullDraft,
            topic: input.topic,
            targetKeyword: input.targetKeyword
        });

        // Step 5: Voice/Tone check
        const voiceToneResult = await runVoiceToneAgent(provider, {
            fullDraftContent: fullDraft,
            marketingContext: input.marketingContext,
            sectionContents: sections.reduce((acc, s) => ({ ...acc, [s.key]: s.content }), {})
        });

        // Build quality gates
        const qualityGates: QualityGates = {
            outline: {
                passed: true,
                reason: 'Outline meets requirements'
            },
            completeness: {
                passed: sections.length >= outlineResult.data.sections.length * 0.8,
                reason: `${sections.length}/${outlineResult.data.sections.length} sections completed`
            },
            seo: seoResult.data ? {
                passed: validateSEOMetadata(seoResult.data).passed,
                score: seoResult.data.keywordDensity
            } : undefined,
            voiceTone: voiceToneResult.data ? {
                passed: voiceToneResult.data.passed,
                score: voiceToneResult.data.alignmentScore
            } : undefined
        };

        return {
            success: true,
            research: researchResult.data,
            outline: outlineResult.data,
            sections,
            fullDraft,
            seoMetadata: seoResult.data,
            voiceToneReport: voiceToneResult.data,
            qualityGates,
            retryCount
        };

    } catch (error: any) {
        return {
            success: false,
            error: error.message,
            retryCount
        };
    }
}
