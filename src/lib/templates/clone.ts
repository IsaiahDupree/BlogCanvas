/**
 * Template Cloning Utilities
 * Clone and customize templates for reuse
 */

import type { OfferPageTemplateConfig, PageBlock } from '@/types/offer-page';
import type { OnboardingTemplateConfig, OnboardingStepTemplate } from './onboarding';
import type { EmailTemplate } from './emails';

// ============================================================================
// OFFER PAGE TEMPLATE CLONING
// ============================================================================

/**
 * Clone an offer page template with optional customizations
 */
export function cloneOfferPageTemplate(
  template: OfferPageTemplateConfig,
  customizations?: {
    name?: string;
    description?: string;
    blocks?: Partial<PageBlock>[];
  }
): OfferPageTemplateConfig {
  // Deep clone the template
  const cloned: OfferPageTemplateConfig = {
    ...template,
    id: `${template.id}-${Date.now()}`,
    name: customizations?.name || `${template.name} (Copy)`,
    description: customizations?.description || template.description,
    blocks: template.blocks.map(block => ({
      ...block,
      id: crypto.randomUUID(), // Generate new IDs for all blocks
      data: JSON.parse(JSON.stringify(block.data)) // Deep clone data
    }))
  };

  // Apply block customizations if provided
  if (customizations?.blocks) {
    customizations.blocks.forEach((blockCustomization, index) => {
      if (cloned.blocks[index]) {
        cloned.blocks[index] = {
          ...cloned.blocks[index],
          ...blockCustomization
        };
      }
    });
  }

  return cloned;
}

/**
 * Merge two offer page templates
 */
export function mergeOfferPageTemplates(
  template1: OfferPageTemplateConfig,
  template2: OfferPageTemplateConfig,
  options?: {
    name?: string;
    description?: string;
    strategy?: 'append' | 'prepend' | 'interleave';
  }
): OfferPageTemplateConfig {
  const strategy = options?.strategy || 'append';

  let mergedBlocks: PageBlock[] = [];

  if (strategy === 'append') {
    mergedBlocks = [
      ...template1.blocks.map((b, i) => ({ ...b, order: i, id: crypto.randomUUID() })),
      ...template2.blocks.map((b, i) => ({
        ...b,
        order: template1.blocks.length + i,
        id: crypto.randomUUID()
      }))
    ];
  } else if (strategy === 'prepend') {
    mergedBlocks = [
      ...template2.blocks.map((b, i) => ({ ...b, order: i, id: crypto.randomUUID() })),
      ...template1.blocks.map((b, i) => ({
        ...b,
        order: template2.blocks.length + i,
        id: crypto.randomUUID()
      }))
    ];
  } else if (strategy === 'interleave') {
    const maxLength = Math.max(template1.blocks.length, template2.blocks.length);
    for (let i = 0; i < maxLength; i++) {
      if (template1.blocks[i]) {
        mergedBlocks.push({
          ...template1.blocks[i],
          order: mergedBlocks.length,
          id: crypto.randomUUID()
        });
      }
      if (template2.blocks[i]) {
        mergedBlocks.push({
          ...template2.blocks[i],
          order: mergedBlocks.length,
          id: crypto.randomUUID()
        });
      }
    }
  }

  return {
    id: `merged-${Date.now()}`,
    name: options?.name || `${template1.name} + ${template2.name}`,
    description: options?.description || `Merged template combining ${template1.name} and ${template2.name}`,
    blocks: mergedBlocks
  };
}

/**
 * Extract specific blocks from a template
 */
export function extractBlocksFromTemplate(
  template: OfferPageTemplateConfig,
  blockTypes: string[]
): PageBlock[] {
  return template.blocks
    .filter(block => blockTypes.includes(block.type))
    .map(block => ({
      ...block,
      id: crypto.randomUUID() // New ID for the extracted block
    }));
}

// ============================================================================
// ONBOARDING TEMPLATE CLONING
// ============================================================================

/**
 * Clone an onboarding template with optional customizations
 */
export function cloneOnboardingTemplate(
  template: OnboardingTemplateConfig,
  customizations?: {
    name?: string;
    description?: string;
    category?: string;
    steps?: Partial<OnboardingStepTemplate>[];
  }
): OnboardingTemplateConfig {
  const cloned: OnboardingTemplateConfig = {
    ...template,
    id: `${template.id}-${Date.now()}`,
    name: customizations?.name || `${template.name} (Copy)`,
    description: customizations?.description || template.description,
    category: customizations?.category || template.category,
    steps: JSON.parse(JSON.stringify(template.steps)) // Deep clone steps
  };

  // Apply step customizations if provided
  if (customizations?.steps) {
    customizations.steps.forEach((stepCustomization, index) => {
      if (cloned.steps[index]) {
        cloned.steps[index] = {
          ...cloned.steps[index],
          ...stepCustomization
        };
      }
    });
  }

  return cloned;
}

/**
 * Merge two onboarding templates
 */
export function mergeOnboardingTemplates(
  template1: OnboardingTemplateConfig,
  template2: OnboardingTemplateConfig,
  options?: {
    name?: string;
    description?: string;
    removeDuplicates?: boolean;
  }
): OnboardingTemplateConfig {
  let mergedSteps = [
    ...template1.steps,
    ...template2.steps
  ];

  // Remove duplicates based on title if requested
  if (options?.removeDuplicates) {
    const seen = new Set<string>();
    mergedSteps = mergedSteps.filter(step => {
      if (seen.has(step.title)) {
        return false;
      }
      seen.add(step.title);
      return true;
    });
  }

  // Reorder steps
  mergedSteps = mergedSteps.map((step, index) => ({
    ...step,
    order: index + 1
  }));

  return {
    id: `merged-${Date.now()}`,
    name: options?.name || `${template1.name} + ${template2.name}`,
    description: options?.description || `Merged onboarding template`,
    category: template1.category,
    steps: mergedSteps
  };
}

/**
 * Add steps to an existing onboarding template
 */
export function addStepsToOnboardingTemplate(
  template: OnboardingTemplateConfig,
  newSteps: OnboardingStepTemplate[],
  position: 'start' | 'end' | number = 'end'
): OnboardingTemplateConfig {
  const cloned = { ...template, steps: [...template.steps] };

  if (position === 'start') {
    cloned.steps = [...newSteps, ...cloned.steps];
  } else if (position === 'end') {
    cloned.steps = [...cloned.steps, ...newSteps];
  } else {
    cloned.steps.splice(position, 0, ...newSteps);
  }

  // Reorder all steps
  cloned.steps = cloned.steps.map((step, index) => ({
    ...step,
    order: index + 1
  }));

  return cloned;
}

// ============================================================================
// EMAIL TEMPLATE CLONING
// ============================================================================

/**
 * Clone an email template with optional customizations
 */
export function cloneEmailTemplate(
  template: EmailTemplate,
  customizations?: {
    name?: string;
    description?: string;
    subject?: string;
    body?: string;
    category?: string;
  }
): EmailTemplate {
  return {
    ...template,
    id: `${template.id}-${Date.now()}`,
    name: customizations?.name || `${template.name} (Copy)`,
    description: customizations?.description || template.description,
    subject: customizations?.subject || template.subject,
    body: customizations?.body || template.body,
    category: customizations?.category || template.category,
    variables: [...template.variables] // Shallow clone is fine for variables
  };
}

/**
 * Create a template from scratch based on another template's structure
 */
export function createCustomEmailFromTemplate(
  baseTemplate: EmailTemplate,
  content: {
    name: string;
    description: string;
    subject: string;
    body: string;
  }
): EmailTemplate {
  return {
    id: `custom-${Date.now()}`,
    name: content.name,
    description: content.description,
    category: baseTemplate.category,
    subject: content.subject,
    body: content.body,
    variables: extractVariablesFromText(content.subject + content.body)
  };
}

/**
 * Extract variables from text (looks for {{varName}} patterns)
 */
function extractVariablesFromText(text: string): EmailTemplate['variables'] {
  const variableRegex = /\{\{(\w+)\}\}/g;
  const matches = text.matchAll(variableRegex);
  const variables = new Map<string, { name: string; description: string; example: string }>();

  for (const match of matches) {
    const varName = match[1];
    if (!variables.has(varName)) {
      variables.set(varName, {
        name: varName,
        description: `Variable: ${varName}`,
        example: ''
      });
    }
  }

  return Array.from(variables.values());
}

// ============================================================================
// GENERIC TEMPLATE UTILITIES
// ============================================================================

/**
 * Save a template to local storage (for browser use)
 */
export function saveTemplateToLocalStorage(
  key: string,
  template: any
): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(key, JSON.stringify(template));
  }
}

/**
 * Load a template from local storage (for browser use)
 */
export function loadTemplateFromLocalStorage<T>(key: string): T | null {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : null;
  }
  return null;
}

/**
 * Export template as JSON string
 */
export function exportTemplateAsJSON(template: any): string {
  return JSON.stringify(template, null, 2);
}

/**
 * Import template from JSON string
 */
export function importTemplateFromJSON<T>(json: string): T {
  return JSON.parse(json);
}

/**
 * Validate template structure
 */
export function validateOfferPageTemplate(
  template: any
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!template.id) errors.push('Template must have an ID');
  if (!template.name) errors.push('Template must have a name');
  if (!template.blocks || !Array.isArray(template.blocks)) {
    errors.push('Template must have a blocks array');
  }

  if (template.blocks) {
    template.blocks.forEach((block: any, index: number) => {
      if (!block.id) errors.push(`Block ${index} must have an ID`);
      if (!block.type) errors.push(`Block ${index} must have a type`);
      if (block.order === undefined) errors.push(`Block ${index} must have an order`);
    });
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
