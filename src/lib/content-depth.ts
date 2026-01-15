/**
 * Content depth levels configuration
 * feat-099: Content depth level selection (basic/advanced/technical)
 */

export type DepthLevel = 'basic' | 'standard' | 'advanced' | 'technical';

export interface DepthLevelConfig {
  value: DepthLevel;
  label: string;
  description: string;
  wordCountMin: number;
  wordCountMax: number;
  aiPromptGuidance: string;
}

export const DEPTH_LEVELS: Record<DepthLevel, DepthLevelConfig> = {
  basic: {
    value: 'basic',
    label: 'Basic',
    description: 'Introductory content for beginners',
    wordCountMin: 1000,
    wordCountMax: 1500,
    aiPromptGuidance: 'Write in simple, accessible language suitable for beginners. Focus on fundamentals and avoid jargon. Use clear examples and analogies.',
  },
  standard: {
    value: 'standard',
    label: 'Standard',
    description: 'General audience with balanced depth',
    wordCountMin: 1500,
    wordCountMax: 2500,
    aiPromptGuidance: 'Write for a general audience with moderate industry knowledge. Balance between accessibility and depth. Include practical examples and best practices.',
  },
  advanced: {
    value: 'advanced',
    label: 'Advanced',
    description: 'In-depth content for experienced readers',
    wordCountMin: 2500,
    wordCountMax: 3500,
    aiPromptGuidance: 'Write for experienced professionals. Dive deep into nuances, edge cases, and advanced concepts. Assume familiarity with industry terminology.',
  },
  technical: {
    value: 'technical',
    label: 'Technical',
    description: 'Comprehensive technical documentation',
    wordCountMin: 3500,
    wordCountMax: 5000,
    aiPromptGuidance: 'Write comprehensive technical documentation with detailed explanations, code examples, architecture diagrams, and implementation details. Target expert-level readers.',
  },
};

export function getDepthLevelConfig(level: DepthLevel | null | undefined): DepthLevelConfig {
  return DEPTH_LEVELS[level || 'standard'];
}

export function getTargetWordCount(level: DepthLevel | null | undefined): { min: number; max: number } {
  const config = getDepthLevelConfig(level);
  return {
    min: config.wordCountMin,
    max: config.wordCountMax,
  };
}

export function getAIPromptGuidance(level: DepthLevel | null | undefined): string {
  const config = getDepthLevelConfig(level);
  return config.aiPromptGuidance;
}
