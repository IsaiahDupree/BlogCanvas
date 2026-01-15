/**
 * Search Intent Types and Configuration
 *
 * Manages search intent classification for blog posts
 * Based on standard SEO search intent categories
 */

/**
 * Valid search intent types
 */
export type SearchIntent = 'informational' | 'commercial' | 'transactional' | 'navigational';

/**
 * Configuration for each search intent type
 */
export interface SearchIntentConfig {
  /** Unique identifier */
  id: SearchIntent;

  /** Display name */
  label: string;

  /** Detailed description */
  description: string;

  /** Emoji icon for visual identification */
  icon: string;

  /** Example keywords/queries */
  examples: string[];

  /** Typical content characteristics */
  contentCharacteristics: string[];

  /** Primary user goal */
  userGoal: string;

  /** SEO optimization tips */
  seoTips: string[];
}

/**
 * All available search intent configurations
 */
export const SEARCH_INTENT_OPTIONS: SearchIntentConfig[] = [
  {
    id: 'informational',
    label: 'Informational',
    description: 'User seeks knowledge, answers, or how-to guidance',
    icon: '📚',
    examples: [
      'how to create a blog',
      'what is content marketing',
      'best practices for SEO',
      'guide to email marketing'
    ],
    contentCharacteristics: [
      'Educational and comprehensive',
      'Answers questions thoroughly',
      'Includes tutorials and guides',
      'Long-form content',
      'Rich with examples and visuals'
    ],
    userGoal: 'Learn something new or understand a concept',
    seoTips: [
      'Target question-based keywords (who, what, where, when, why, how)',
      'Include FAQ sections',
      'Use clear headings and subheadings',
      'Provide actionable takeaways',
      'Link to related informational content'
    ]
  },
  {
    id: 'commercial',
    label: 'Commercial Investigation',
    description: 'User researches products/services before buying',
    icon: '🔍',
    examples: [
      'best CRM software for small business',
      'WordPress vs Webflow comparison',
      'top content marketing agencies 2026',
      'project management tool reviews'
    ],
    contentCharacteristics: [
      'Comparison and review focused',
      'Lists pros and cons',
      'Includes pricing information',
      'Feature comparisons',
      'Expert recommendations'
    ],
    userGoal: 'Research and compare options before making a purchase decision',
    seoTips: [
      'Target "best", "top", "vs", "comparison", "review" keywords',
      'Include comparison tables',
      'Provide balanced pros and cons',
      'Add pricing information',
      'Use structured data for reviews',
      'Internal links to product/service pages'
    ]
  },
  {
    id: 'transactional',
    label: 'Transactional',
    description: 'User ready to take action or make a purchase',
    icon: '💳',
    examples: [
      'buy WordPress hosting',
      'sign up for email marketing software',
      'hire content writer',
      'download SEO tool',
      'get started with CRM'
    ],
    contentCharacteristics: [
      'Action-oriented and direct',
      'Clear calls-to-action',
      'Pricing and plans prominent',
      'Benefits over features',
      'Trust signals (testimonials, guarantees)',
      'Minimal friction to conversion'
    ],
    userGoal: 'Complete a specific action, purchase, or sign-up',
    seoTips: [
      'Target "buy", "get", "hire", "download", "sign up" keywords',
      'Include strong CTAs above the fold',
      'Showcase pricing and plans',
      'Add trust badges and testimonials',
      'Optimize for conversion',
      'Minimize steps to action'
    ]
  },
  {
    id: 'navigational',
    label: 'Navigational',
    description: 'User searches for a specific brand, site, or page',
    icon: '🧭',
    examples: [
      'HubSpot login',
      'Mailchimp pricing',
      'WordPress blog',
      'Salesforce support',
      'Google Analytics dashboard'
    ],
    contentCharacteristics: [
      'Brand-specific content',
      'Clear navigation and links',
      'Product/service overviews',
      'Support and help resources',
      'Contact information prominent'
    ],
    userGoal: 'Find a specific website, page, or resource',
    seoTips: [
      'Target branded keywords',
      'Optimize site structure and navigation',
      'Use breadcrumbs',
      'Include site search',
      'Internal linking to key pages',
      'Claim and optimize business listings'
    ]
  }
];

/**
 * Get configuration for a specific search intent
 */
export function getSearchIntentConfig(intent: SearchIntent): SearchIntentConfig {
  const config = SEARCH_INTENT_OPTIONS.find(opt => opt.id === intent);
  if (!config) {
    throw new Error(`Unknown search intent: ${intent}`);
  }
  return config;
}

/**
 * Get all search intent options for UI selection
 */
export function getAllSearchIntents(): SearchIntentConfig[] {
  return SEARCH_INTENT_OPTIONS;
}

/**
 * Get AI guidance based on search intent
 * Used in content generation prompts
 */
export function getAIGuidance(intent: SearchIntent): string {
  const config = getSearchIntentConfig(intent);

  return `
SEARCH INTENT: ${config.label}

USER GOAL: ${config.userGoal}

CONTENT CHARACTERISTICS:
${config.contentCharacteristics.map(c => `- ${c}`).join('\n')}

SEO OPTIMIZATION:
${config.seoTips.map(tip => `- ${tip}`).join('\n')}

IMPORTANT: Tailor the content structure, tone, and calls-to-action to match this search intent.
`.trim();
}

/**
 * Validate if a string is a valid search intent
 */
export function isValidSearchIntent(value: unknown): value is SearchIntent {
  if (typeof value !== 'string') return false;
  return ['informational', 'commercial', 'transactional', 'navigational'].includes(value);
}

/**
 * Get search intent from string with fallback
 */
export function parseSearchIntent(value: string | null | undefined): SearchIntent | null {
  if (!value) return null;
  return isValidSearchIntent(value) ? value : null;
}
