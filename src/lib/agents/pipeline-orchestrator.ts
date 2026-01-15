/**
 * Pipeline Orchestrator with Quality Gates
 * PRD Epic 3: feat-116 and feat-117
 *
 * This orchestrator wraps the blog generation pipeline with:
 * - Quality gates between agents
 * - Minimum score thresholds
 * - Blocking for failed quality checks
 * - Manual override support
 * - Retry logic for failed steps
 */

import {
  runBlogGenerationPipeline,
  BlogGenerationInput,
  BlogGenerationResult,
  PipelineStep
} from './blog-pipeline';

export interface QualityGate {
  stepName: string;
  minScore: number;
  enabled: boolean;
}

export interface PipelineOrchestratorOptions {
  // Quality gate thresholds (0-100)
  qualityGates?: {
    research?: number;
    outline?: number;
    draft?: number;
    seo?: number;
    factCheck?: number;
    enhancement?: number;
  };
  // Manual overrides for specific gates
  overrides?: {
    skipQualityGates?: boolean;
    skipResearchGate?: boolean;
    skipOutlineGate?: boolean;
    skipDraftGate?: boolean;
    skipSEOGate?: boolean;
    skipFactCheckGate?: boolean;
    skipEnhancementGate?: boolean;
  };
  // Retry configuration
  maxRetries?: number;
  retryFailedSteps?: boolean;
}

export interface OrchestratorResult extends BlogGenerationResult {
  qualityGates: {
    stepName: string;
    passed: boolean;
    score: number;
    threshold: number;
    overridden: boolean;
  }[];
  retries: {
    stepName: string;
    attemptNumber: number;
    success: boolean;
  }[];
}

const DEFAULT_QUALITY_GATES: Required<PipelineOrchestratorOptions['qualityGates']> = {
  research: 70,
  outline: 75,
  draft: 70,
  seo: 75,
  factCheck: 80,
  enhancement: 70
};

/**
 * Run the blog generation pipeline with quality gates and orchestration
 */
export async function runPipelineWithQualityGates(
  input: BlogGenerationInput,
  options: PipelineOrchestratorOptions = {}
): Promise<OrchestratorResult> {
  const {
    qualityGates = DEFAULT_QUALITY_GATES,
    overrides = {},
    maxRetries = 2,
    retryFailedSteps = true
  } = options;

  const qualityGateResults: OrchestratorResult['qualityGates'] = [];
  const retryLog: OrchestratorResult['retries'] = [];

  // Run the pipeline
  let pipelineResult: BlogGenerationResult;
  let attempts = 0;
  let lastError: string | undefined;

  while (attempts <= maxRetries) {
    attempts++;

    try {
      pipelineResult = await runBlogGenerationPipeline(input);

      // If pipeline succeeded, check quality gates
      if (pipelineResult.success) {
        // Validate each step with quality gates
        const gateChecks = evaluateQualityGates(
          pipelineResult,
          qualityGates,
          overrides
        );

        qualityGateResults.push(...gateChecks);

        // Check if any gates failed (and weren't overridden)
        const failedGates = gateChecks.filter(g => !g.passed && !g.overridden);

        if (failedGates.length > 0 && !overrides.skipQualityGates) {
          lastError = `Quality gates failed: ${failedGates.map(g => g.stepName).join(', ')}`;

          if (retryFailedSteps && attempts <= maxRetries) {
            retryLog.push({
              stepName: 'pipeline',
              attemptNumber: attempts,
              success: false
            });
            continue; // Retry
          } else {
            // Return failed result
            return {
              ...pipelineResult,
              success: false,
              error: lastError,
              qualityGates: qualityGateResults,
              retries: retryLog
            };
          }
        }

        // All gates passed
        retryLog.push({
          stepName: 'pipeline',
          attemptNumber: attempts,
          success: true
        });

        return {
          ...pipelineResult,
          qualityGates: qualityGateResults,
          retries: retryLog
        };
      } else {
        // Pipeline failed
        lastError = pipelineResult.error;

        if (retryFailedSteps && attempts <= maxRetries) {
          retryLog.push({
            stepName: 'pipeline',
            attemptNumber: attempts,
            success: false
          });
          continue; // Retry
        } else {
          // Return failed result
          return {
            ...pipelineResult,
            qualityGates: qualityGateResults,
            retries: retryLog
          };
        }
      }
    } catch (error: any) {
      lastError = error.message;

      if (retryFailedSteps && attempts <= maxRetries) {
        retryLog.push({
          stepName: 'pipeline',
          attemptNumber: attempts,
          success: false
        });
        continue; // Retry
      }
    }
  }

  // All retries exhausted
  return {
    success: false,
    steps: [],
    totalDuration: 0,
    error: lastError || 'Pipeline failed after all retries',
    qualityGates: qualityGateResults,
    retries: retryLog
  };
}

/**
 * Evaluate quality gates for each pipeline step
 */
function evaluateQualityGates(
  result: BlogGenerationResult,
  thresholds: Required<PipelineOrchestratorOptions['qualityGates']>,
  overrides: PipelineOrchestratorOptions['overrides'] = {}
): OrchestratorResult['qualityGates'] {
  const gates: OrchestratorResult['qualityGates'] = [];

  // Research gate
  if (result.research) {
    const score = calculateResearchScore(result.research);
    gates.push({
      stepName: 'Research',
      passed: score >= thresholds.research,
      score,
      threshold: thresholds.research,
      overridden: overrides.skipResearchGate || false
    });
  }

  // Outline gate
  if (result.outline) {
    const score = calculateOutlineScore(result.outline);
    gates.push({
      stepName: 'Outline',
      passed: score >= thresholds.outline,
      score,
      threshold: thresholds.outline,
      overridden: overrides.skipOutlineGate || false
    });
  }

  // Draft gate
  if (result.blogPost) {
    const score = calculateDraftScore(result.blogPost);
    gates.push({
      stepName: 'Draft',
      passed: score >= thresholds.draft,
      score,
      threshold: thresholds.draft,
      overridden: overrides.skipDraftGate || false
    });
  }

  // SEO gate
  if (result.blogPost) {
    const score = result.blogPost.seoScore;
    gates.push({
      stepName: 'SEO',
      passed: score >= thresholds.seo,
      score,
      threshold: thresholds.seo,
      overridden: overrides.skipSEOGate || false
    });
  }

  // Fact-check gate
  if (result.blogPost) {
    const score = result.blogPost.factCheckScore;
    gates.push({
      stepName: 'Fact Check',
      passed: score >= thresholds.factCheck,
      score,
      threshold: thresholds.factCheck,
      overridden: overrides.skipFactCheckGate || false
    });
  }

  // Enhancement gate
  if (result.blogPost) {
    const score = result.blogPost.enhancementScore;
    gates.push({
      stepName: 'Enhancement',
      passed: score >= thresholds.enhancement,
      score,
      threshold: thresholds.enhancement,
      overridden: overrides.skipEnhancementGate || false
    });
  }

  return gates;
}

/**
 * Calculate quality score for research step
 */
function calculateResearchScore(research: any): number {
  let score = 70; // Base score

  // Check if research has key components
  if (research.keyPoints && research.keyPoints.length >= 5) score += 10;
  if (research.statistics && research.statistics.length >= 3) score += 10;
  if (research.sources && research.sources.length >= 3) score += 10;

  return Math.min(100, score);
}

/**
 * Calculate quality score for outline step
 */
function calculateOutlineScore(outline: any): number {
  let score = 70; // Base score

  // Check outline structure
  if (outline.sections && outline.sections.length >= 5) score += 10;
  if (outline.sections && outline.sections.some((s: any) => s.subsections?.length > 0)) score += 10;
  if (outline.faqs && outline.faqs.length >= 3) score += 10;

  return Math.min(100, score);
}

/**
 * Calculate quality score for draft step
 */
function calculateDraftScore(blogPost: any): number {
  let score = 70; // Base score

  // Word count check
  const wordCount = blogPost.wordCount;
  if (wordCount >= 1200) score += 10;
  if (wordCount >= 1500) score += 5;

  // Structure check
  if (blogPost.content) {
    const hasH1 = blogPost.content.includes('# ');
    const hasH2 = blogPost.content.includes('## ');
    const hasList = blogPost.content.includes('- ') || blogPost.content.includes('* ');

    if (hasH1) score += 5;
    if (hasH2) score += 5;
    if (hasList) score += 5;
  }

  return Math.min(100, score);
}

/**
 * Get default quality gate thresholds
 */
export function getDefaultQualityGates(): Required<PipelineOrchestratorOptions['qualityGates']> {
  return { ...DEFAULT_QUALITY_GATES };
}

/**
 * Validate quality gate configuration
 */
export function validateQualityGates(
  gates: Partial<PipelineOrchestratorOptions['qualityGates']>
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  for (const [key, value] of Object.entries(gates)) {
    if (typeof value !== 'number') {
      errors.push(`${key} must be a number`);
    } else if (value < 0 || value > 100) {
      errors.push(`${key} must be between 0 and 100`);
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
