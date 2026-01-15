/**
 * Brand Context Validation Service
 *
 * @feat-173 PRD Brand: Context validation before generation
 *
 * Validates brand context completeness before AI content generation
 * and provides warnings, suggestions, and defaults for missing fields.
 */

import { SharedClientContext } from './shared-context';

export interface ValidationIssue {
  field: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  suggestion?: string;
  defaultValue?: any;
}

export interface ValidationResult {
  isValid: boolean;
  completeness: number; // 0-100 percentage
  issues: ValidationIssue[];
  canProceed: boolean; // True if only warnings/info, false if critical errors
  missingFields: string[];
  suggestions: Record<string, any>; // Field -> suggested default value
}

/**
 * Critical fields required for quality content generation
 */
const CRITICAL_FIELDS = [
  'clientName',
  'voiceAndTone.voiceTraits',
  'targetAudiences',
  'productsServices'
];

/**
 * Important fields that should be filled for best results
 */
const IMPORTANT_FIELDS = [
  'brandGuide.tagline',
  'valuePropositions',
  'stylesToKeep.preferredPatterns',
  'stylesToAvoid.wordPatterns'
];

/**
 * Optional fields that enhance quality but aren't required
 */
const OPTIONAL_FIELDS = [
  'titleGuidelines.preferredFormats',
  'titleGuidelines.powerWords',
  'imageGuidelines.featuredImageSpecs',
  'stylesToKeep.engagementMetrics'
];

/**
 * Default values for missing fields
 */
const DEFAULT_VALUES: Record<string, any> = {
  'voiceAndTone.voiceTraits': ['Professional', 'Clear', 'Informative'],
  'brandGuide.tagline': 'Quality solutions for your business',
  'targetAudiences': [{ name: 'Business professionals', description: 'General business audience' }],
  'productsServices': [{ name: 'Business services', description: 'Professional services' }],
  'valuePropositions': ['Quality service', 'Expert team', 'Proven results'],
  'stylesToKeep.preferredPatterns': ['Clear and concise', 'Data-driven', 'Actionable insights'],
  'stylesToAvoid.wordPatterns': ['jargon', 'synergy', 'revolutionary', 'disruptive'],
  'titleGuidelines.preferredFormats': ['How to [X]', '[Number] Ways to [X]', 'The Ultimate Guide to [X]'],
  'titleGuidelines.powerWords': ['Ultimate', 'Essential', 'Proven', 'Complete'],
  'donts': ['Making unsubstantiated claims', 'Using excessive jargon']
};

/**
 * Get nested property value from object using dot notation
 */
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((curr, key) => curr?.[key], obj);
}

/**
 * Check if a field is empty/missing
 */
function isFieldEmpty(value: any): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string' && value.trim() === '') return true;
  if (Array.isArray(value) && value.length === 0) return true;
  if (typeof value === 'object' && Object.keys(value).length === 0) return true;
  return false;
}

/**
 * Validate brand context completeness
 *
 * @param context - The SharedClientContext to validate
 * @returns Validation result with issues, suggestions, and defaults
 */
export function validateBrandContext(context: SharedClientContext | null): ValidationResult {
  const issues: ValidationIssue[] = [];
  const missingFields: string[] = [];
  const suggestions: Record<string, any> = {};

  if (!context) {
    return {
      isValid: false,
      completeness: 0,
      issues: [{
        field: 'context',
        severity: 'error',
        message: 'No brand context found for this client',
        suggestion: 'Create a brand guide in the Brand Guide page before generating content',
        defaultValue: null
      }],
      canProceed: false,
      missingFields: ['context'],
      suggestions: {}
    };
  }

  // Check critical fields
  CRITICAL_FIELDS.forEach(field => {
    const value = getNestedValue(context, field);
    if (isFieldEmpty(value)) {
      missingFields.push(field);
      const defaultValue = DEFAULT_VALUES[field];
      if (defaultValue) {
        suggestions[field] = defaultValue;
      }

      issues.push({
        field,
        severity: 'error',
        message: `Critical field "${field}" is missing`,
        suggestion: defaultValue
          ? `Using default: ${JSON.stringify(defaultValue).substring(0, 100)}...`
          : `Please configure "${field}" in the Brand Guide`,
        defaultValue
      });
    }
  });

  // Check important fields
  IMPORTANT_FIELDS.forEach(field => {
    const value = getNestedValue(context, field);
    if (isFieldEmpty(value)) {
      missingFields.push(field);
      const defaultValue = DEFAULT_VALUES[field];
      if (defaultValue) {
        suggestions[field] = defaultValue;
      }

      issues.push({
        field,
        severity: 'warning',
        message: `Important field "${field}" is missing`,
        suggestion: defaultValue
          ? `Recommended default: ${JSON.stringify(defaultValue).substring(0, 100)}...`
          : `Consider adding "${field}" for better content quality`,
        defaultValue
      });
    }
  });

  // Check optional fields
  OPTIONAL_FIELDS.forEach(field => {
    const value = getNestedValue(context, field);
    if (isFieldEmpty(value)) {
      const defaultValue = DEFAULT_VALUES[field];
      if (defaultValue) {
        suggestions[field] = defaultValue;
      }

      issues.push({
        field,
        severity: 'info',
        message: `Optional field "${field}" is not configured`,
        suggestion: defaultValue
          ? `Optional: ${JSON.stringify(defaultValue).substring(0, 100)}...`
          : `This field can enhance content quality but is not required`,
        defaultValue
      });
    }
  });

  // Calculate completeness percentage
  const totalFields = CRITICAL_FIELDS.length + IMPORTANT_FIELDS.length + OPTIONAL_FIELDS.length;
  const filledFields = totalFields - missingFields.length;
  const completeness = Math.round((filledFields / totalFields) * 100);

  // Determine if generation can proceed (no critical errors)
  const hasErrors = issues.some(issue => issue.severity === 'error');
  const canProceed = !hasErrors;

  return {
    isValid: issues.length === 0,
    completeness,
    issues,
    canProceed,
    missingFields,
    suggestions
  };
}

/**
 * Apply default values to a brand context for missing fields
 *
 * @param context - The original context
 * @param suggestions - Suggested default values from validation
 * @returns Updated context with defaults applied
 */
export function applyDefaults(
  context: SharedClientContext,
  suggestions: Record<string, any>
): SharedClientContext {
  const updated = { ...context };

  Object.entries(suggestions).forEach(([path, value]) => {
    const keys = path.split('.');
    let current: any = updated;

    // Navigate to the parent object
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!current[key]) {
        current[key] = {};
      }
      current = current[key];
    }

    // Set the value if it's still empty
    const lastKey = keys[keys.length - 1];
    if (isFieldEmpty(current[lastKey])) {
      current[lastKey] = value;
    }
  });

  return updated;
}

/**
 * Format validation result as user-friendly message
 *
 * @param result - Validation result
 * @returns Formatted message for display
 */
export function formatValidationMessage(result: ValidationResult): string {
  if (result.isValid) {
    return '✓ Brand context is complete and ready for content generation';
  }

  const errorCount = result.issues.filter(i => i.severity === 'error').length;
  const warningCount = result.issues.filter(i => i.severity === 'warning').length;

  if (!result.canProceed) {
    return `⚠ ${errorCount} critical field(s) missing. Please update your brand guide before generating content.`;
  }

  if (warningCount > 0) {
    return `⚠ Brand context is ${result.completeness}% complete. ${warningCount} field(s) could be improved for better quality.`;
  }

  return `ℹ Brand context is ${result.completeness}% complete. Some optional fields are missing.`;
}
