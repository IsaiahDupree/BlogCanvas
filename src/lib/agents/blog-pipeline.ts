/**
 * Blog Generation Pipeline
 * Orchestrates all agents to produce a complete blog post
 * Based on PRD: Research → Outline → Draft → SEO → Fact-Check → Enhancement
 */

import { LLMProvider, ResearchResult, OutlineResult, SEOMetadata, FactCheckResult, VoiceToneResult } from './types';
import { createOpenAIProvider, createPremiumProvider } from './openai-provider';
import { runResearchAgent, ResearchAgentInput } from './research';
import { runOutlineAgent, runOutlineAgentWithOptions, OutlineAgentInput } from './outline';
import { runDraftAgent, DraftAgentInput, combineSections } from './draft';
import { runSEOAgent, SEOAgentInput } from './seo';
import { runFactCheckAgent, FactCheckAgentInput, FactCheckResult as FCResult } from './fact-check';
import { runEnhancementAgent, EnhancementAgentInput, EnhancementResult } from './enhancement';
import { runVoiceToneAgent, VoiceToneAgentInput } from './voice-tone';

export interface BlogGenerationInput {
  topic: string;
  targetKeyword: string;
  wordCountGoal: number;
  clientProfile: {
    // Basic Info
    clientName?: string;
    industry?: string;
    
    // Brand Snapshot - Core
    productServiceSummary?: string;
    targetAudience?: string;
    positioning?: string;
    
    // Tone & Voice
    brandVoice?: string[];
    brandTone?: string;
    formalityLevel?: number;
    playfulnessLevel?: number;
    
    // Brand Messaging
    tagline?: string;
    keyMessages?: string[];
    valuePropositions?: string[];
    
    // Competitive Context
    competitors?: string[];
    keyDifferentiators?: string[];
    
    // Content Guidelines
    keywordsToInclude?: string[];
    keywordsToAvoid?: string[];
    topicsToAvoid?: string[];
    styleNotes?: string;
  };
  options?: {
    generateMultipleOutlines?: boolean;
    skipFactCheck?: boolean;
    skipEnhancement?: boolean;
    usePremiumModel?: boolean;
  };
}

export interface PipelineStep {
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startTime?: number;
  endTime?: number;
  error?: string;
}

export interface BlogGenerationResult {
  success: boolean;
  blogPost?: {
    title: string;
    slug: string;
    metaDescription: string;
    content: string;
    wordCount: number;
    seoScore: number;
    factCheckScore: number;
    enhancementScore: number;
  };
  research?: ResearchResult;
  outline?: OutlineResult;
  outlineOptions?: OutlineResult[];
  seoMetadata?: SEOMetadata;
  factCheck?: FCResult;
  enhancements?: EnhancementResult;
  voiceTone?: VoiceToneResult;
  steps: PipelineStep[];
  totalDuration: number;
  error?: string;
}

export interface PipelineProgress {
  currentStep: string;
  completedSteps: number;
  totalSteps: number;
  percentComplete: number;
}

export type ProgressCallback = (progress: PipelineProgress) => void;

/**
 * Run the complete blog generation pipeline
 */
export async function runBlogGenerationPipeline(
  input: BlogGenerationInput,
  onProgress?: ProgressCallback
): Promise<BlogGenerationResult> {
  const startTime = Date.now();
  const steps: PipelineStep[] = [
    { name: 'Research', status: 'pending' },
    { name: 'Outline', status: 'pending' },
    { name: 'Draft', status: 'pending' },
    { name: 'SEO Optimization', status: 'pending' },
    { name: 'Fact Check', status: 'pending' },
    { name: 'Enhancement', status: 'pending' },
    { name: 'Voice & Tone Check', status: 'pending' },
  ];

  const provider = input.options?.usePremiumModel 
    ? createPremiumProvider() 
    : createOpenAIProvider();

  const updateProgress = (stepIndex: number, status: 'running' | 'completed' | 'failed') => {
    steps[stepIndex].status = status;
    if (status === 'running') {
      steps[stepIndex].startTime = Date.now();
    } else {
      steps[stepIndex].endTime = Date.now();
    }
    
    if (onProgress) {
      const completedSteps = steps.filter(s => s.status === 'completed').length;
      onProgress({
        currentStep: steps[stepIndex].name,
        completedSteps,
        totalSteps: steps.length,
        percentComplete: Math.round((completedSteps / steps.length) * 100)
      });
    }
  };

  let research: ResearchResult | undefined;
  let outline: OutlineResult | undefined;
  let outlineOptions: OutlineResult[] | undefined;
  let fullDraftContent = '';
  let seoMetadata: SEOMetadata | undefined;
  let factCheck: FCResult | undefined;
  let enhancements: EnhancementResult | undefined;
  let voiceTone: VoiceToneResult | undefined;

  try {
    // Step 1: Research
    updateProgress(0, 'running');
    const researchInput: ResearchAgentInput = {
      topic: input.topic,
      targetKeyword: input.targetKeyword,
      clientProfile: input.clientProfile,
      marketingContext: {
        brandVoice: input.clientProfile.brandVoice,
        brandTone: input.clientProfile.brandTone
      }
    };
    
    const researchResult = await runResearchAgent(provider, researchInput);
    if (!researchResult.success) {
      throw new Error(`Research failed: ${researchResult.error}`);
    }
    research = researchResult.data!;
    updateProgress(0, 'completed');

    // Step 2: Outline
    updateProgress(1, 'running');
    const outlineInput: OutlineAgentInput = {
      topic: input.topic,
      targetKeyword: input.targetKeyword,
      wordCountGoal: input.wordCountGoal,
      research,
      clientProfile: input.clientProfile
    };

    if (input.options?.generateMultipleOutlines) {
      const outlineOptionsResult = await runOutlineAgentWithOptions(provider, outlineInput);
      if (!outlineOptionsResult.success) {
        throw new Error(`Outline generation failed: ${outlineOptionsResult.error}`);
      }
      outlineOptions = outlineOptionsResult.data!.options;
      outline = outlineOptions[0]; // Use first option by default
    } else {
      const outlineResult = await runOutlineAgent(provider, outlineInput);
      if (!outlineResult.success) {
        throw new Error(`Outline generation failed: ${outlineResult.error}`);
      }
      outline = outlineResult.data!;
    }
    updateProgress(1, 'completed');

    // Step 3: Draft (section by section)
    updateProgress(2, 'running');
    const sectionContents: { key: string; content: string }[] = [];
    
    for (const section of outline.sections) {
      const draftInput: DraftAgentInput = {
        section,
        topic: input.topic,
        targetKeyword: input.targetKeyword,
        previousSections: sectionContents.map(s => s.content),
        clientProfile: input.clientProfile,
        marketingContext: {
          brandName: 'Client',
          brandVoice: input.clientProfile.brandVoice || ['Professional', 'Helpful'],
          brandTone: input.clientProfile.brandTone || 'Professional',
          targetAudience: input.clientProfile.targetAudience || 'Business professionals',
          valueProposition: input.clientProfile.productServiceSummary || '',
          keyMessages: [],
          competitorDifferentiators: [],
          contentDonts: []
        }
      };

      const draftResult = await runDraftAgent(provider, draftInput);
      if (draftResult.success && draftResult.data) {
        sectionContents.push({
          key: section.key,
          content: draftResult.data.content
        });
      }
    }

    fullDraftContent = combineSections(sectionContents);
    updateProgress(2, 'completed');

    // Step 4: SEO Optimization
    updateProgress(3, 'running');
    const seoInput: SEOAgentInput = {
      fullDraftContent,
      topic: input.topic,
      targetKeyword: input.targetKeyword,
      wordCount: fullDraftContent.split(/\s+/).length
    };

    const seoResult = await runSEOAgent(provider, seoInput);
    if (seoResult.success) {
      seoMetadata = seoResult.data!;
    }
    updateProgress(3, 'completed');

    // Step 5: Fact Check
    if (!input.options?.skipFactCheck) {
      updateProgress(4, 'running');
      const factCheckInput: FactCheckAgentInput = {
        fullDraftContent,
        topic: input.topic,
        targetKeyword: input.targetKeyword
      };

      const factCheckResult = await runFactCheckAgent(provider, factCheckInput);
      if (factCheckResult.success) {
        factCheck = factCheckResult.data!;
      }
      updateProgress(4, 'completed');
    } else {
      steps[4].status = 'completed';
    }

    // Step 6: Enhancement
    if (!input.options?.skipEnhancement) {
      updateProgress(5, 'running');
      const enhancementInput: EnhancementAgentInput = {
        fullDraftContent,
        topic: input.topic,
        targetKeyword: input.targetKeyword,
        sectionKeys: outline.sections.map(s => s.key),
        wordCount: fullDraftContent.split(/\s+/).length
      };

      const enhancementResult = await runEnhancementAgent(provider, enhancementInput);
      if (enhancementResult.success) {
        enhancements = enhancementResult.data!;
      }
      updateProgress(5, 'completed');
    } else {
      steps[5].status = 'completed';
    }

    // Step 7: Voice & Tone Check
    updateProgress(6, 'running');
    const sectionContentsMap: Record<string, string> = {};
    sectionContents.forEach(s => { sectionContentsMap[s.key] = s.content; });
    
    const voiceToneInput: VoiceToneAgentInput = {
      fullDraftContent,
      sectionContents: sectionContentsMap,
      marketingContext: {
        brandName: 'Client',
        brandVoice: input.clientProfile.brandVoice || ['Professional', 'Helpful'],
        brandTone: input.clientProfile.brandTone || 'Professional',
        targetAudience: input.clientProfile.targetAudience || 'Business professionals',
        valueProposition: input.clientProfile.productServiceSummary || '',
        keyMessages: [],
        competitorDifferentiators: [],
        contentDonts: []
      }
    };

    const voiceToneResult = await runVoiceToneAgent(provider, voiceToneInput);
    if (voiceToneResult.success) {
      voiceTone = voiceToneResult.data!;
    }
    updateProgress(6, 'completed');

    // Calculate scores
    const wordCount = fullDraftContent.split(/\s+/).length;
    const seoScore = seoMetadata ? calculateSEOScore(seoMetadata) : 70;
    const factCheckScore = factCheck?.factCheckScore || 80;
    const enhancementScore = enhancements?.overallScore || 70;

    return {
      success: true,
      blogPost: {
        title: seoMetadata?.title || input.topic,
        slug: seoMetadata?.slug || input.topic.toLowerCase().replace(/\s+/g, '-'),
        metaDescription: seoMetadata?.metaDescription || '',
        content: fullDraftContent,
        wordCount,
        seoScore,
        factCheckScore,
        enhancementScore
      },
      research,
      outline,
      outlineOptions,
      seoMetadata,
      factCheck,
      enhancements,
      voiceTone,
      steps,
      totalDuration: Date.now() - startTime
    };

  } catch (error: any) {
    return {
      success: false,
      steps,
      totalDuration: Date.now() - startTime,
      error: error.message
    };
  }
}

/**
 * Calculate SEO score from metadata
 */
function calculateSEOScore(metadata: SEOMetadata): number {
  let score = 70; // Base score

  // Title length (50-60 chars is optimal)
  if (metadata.title.length >= 50 && metadata.title.length <= 60) {
    score += 10;
  } else if (metadata.title.length >= 40 && metadata.title.length <= 70) {
    score += 5;
  }

  // Meta description length (120-160 chars is optimal)
  if (metadata.metaDescription.length >= 120 && metadata.metaDescription.length <= 160) {
    score += 10;
  } else if (metadata.metaDescription.length >= 100 && metadata.metaDescription.length <= 170) {
    score += 5;
  }

  // Keyword density (1-3% is optimal)
  if (metadata.keywordDensity >= 1 && metadata.keywordDensity <= 3) {
    score += 10;
  } else if (metadata.keywordDensity >= 0.5 && metadata.keywordDensity <= 4) {
    score += 5;
  }

  return Math.min(100, score);
}

/**
 * Quick blog generation (minimal options, faster)
 */
export async function generateBlogQuick(
  topic: string,
  targetKeyword: string,
  wordCount: number = 1500
): Promise<BlogGenerationResult> {
  return runBlogGenerationPipeline({
    topic,
    targetKeyword,
    wordCountGoal: wordCount,
    clientProfile: {
      productServiceSummary: 'General business',
      targetAudience: 'Business professionals'
    },
    options: {
      skipEnhancement: true,
      usePremiumModel: false
    }
  });
}

/**
 * Premium blog generation (all features, higher quality)
 */
export async function generateBlogPremium(
  input: BlogGenerationInput,
  onProgress?: ProgressCallback
): Promise<BlogGenerationResult> {
  return runBlogGenerationPipeline({
    ...input,
    options: {
      ...input.options,
      generateMultipleOutlines: true,
      usePremiumModel: true
    }
  }, onProgress);
}
