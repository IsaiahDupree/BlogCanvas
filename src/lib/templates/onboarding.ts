/**
 * Onboarding Checklist Templates
 * Pre-built onboarding step templates for common service types
 */

export interface OnboardingStepTemplate {
  title: string
  description: string
  order: number
  required: boolean
  estimatedMinutes: number
}

export interface OnboardingTemplateConfig {
  id: string
  name: string
  description: string
  category: string
  steps: OnboardingStepTemplate[]
}

// ============================================================================
// SEO RETAINER ONBOARDING
// ============================================================================

export const seoRetainerOnboarding: OnboardingTemplateConfig = {
  id: 'seo-retainer',
  name: 'SEO Retainer Onboarding',
  description: 'Complete onboarding for monthly SEO clients',
  category: 'seo',
  steps: [
    {
      title: 'Complete Brand Questionnaire',
      description: 'Help us understand your brand voice, target audience, and business goals',
      order: 1,
      required: true,
      estimatedMinutes: 15
    },
    {
      title: 'Provide Website Access',
      description: 'Grant us admin access to your WordPress site or CMS',
      order: 2,
      required: true,
      estimatedMinutes: 5
    },
    {
      title: 'Connect Google Analytics',
      description: 'Add us as a user to your Google Analytics property',
      order: 3,
      required: true,
      estimatedMinutes: 5
    },
    {
      title: 'Connect Google Search Console',
      description: 'Grant permission to your Search Console property',
      order: 4,
      required: true,
      estimatedMinutes: 5
    },
    {
      title: 'Share Target Keywords',
      description: 'List the primary keywords you want to rank for',
      order: 5,
      required: true,
      estimatedMinutes: 10
    },
    {
      title: 'Review Content Calendar',
      description: 'Approve the first month\'s content topics',
      order: 6,
      required: true,
      estimatedMinutes: 10
    },
    {
      title: 'Schedule Kickoff Call',
      description: 'Book a 30-minute strategy session to align on goals',
      order: 7,
      required: true,
      estimatedMinutes: 2
    }
  ]
};

// ============================================================================
// AUDIT SERVICE ONBOARDING
// ============================================================================

export const auditOnboarding: OnboardingTemplateConfig = {
  id: 'audit-service',
  name: 'Audit Service Onboarding',
  description: 'Quick setup for one-time audit clients',
  category: 'audit',
  steps: [
    {
      title: 'Submit Your Website URL',
      description: 'Provide the URL you want us to audit',
      order: 1,
      required: true,
      estimatedMinutes: 1
    },
    {
      title: 'Grant Read-Only Access',
      description: 'Provide view-only access to Google Analytics and Search Console (if applicable)',
      order: 2,
      required: false,
      estimatedMinutes: 5
    },
    {
      title: 'Share Current Pain Points',
      description: 'Tell us about specific issues you\'ve noticed',
      order: 3,
      required: true,
      estimatedMinutes: 5
    },
    {
      title: 'List Top Competitors',
      description: 'Provide 3-5 competitor websites for comparison',
      order: 4,
      required: false,
      estimatedMinutes: 3
    },
    {
      title: 'Schedule Results Call',
      description: 'Book a time to review the audit findings together',
      order: 5,
      required: true,
      estimatedMinutes: 2
    }
  ]
};

// ============================================================================
// CONTENT CREATION ONBOARDING
// ============================================================================

export const contentCreationOnboarding: OnboardingTemplateConfig = {
  id: 'content-creation',
  name: 'Content Creation Onboarding',
  description: 'Onboarding for blog writing and content services',
  category: 'content',
  steps: [
    {
      title: 'Complete Content Brief Template',
      description: 'Fill out our content requirements form',
      order: 1,
      required: true,
      estimatedMinutes: 20
    },
    {
      title: 'Provide Brand Guidelines',
      description: 'Share your brand voice guide, style guide, or past content examples',
      order: 2,
      required: true,
      estimatedMinutes: 10
    },
    {
      title: 'Share Product/Service Details',
      description: 'Upload product documentation or service descriptions',
      order: 3,
      required: true,
      estimatedMinutes: 15
    },
    {
      title: 'Provide Target Audience Info',
      description: 'Describe your ideal reader demographics and pain points',
      order: 4,
      required: true,
      estimatedMinutes: 10
    },
    {
      title: 'Grant CMS Access',
      description: 'Add us as an author/contributor to your WordPress or CMS',
      order: 5,
      required: false,
      estimatedMinutes: 5
    },
    {
      title: 'Review First Draft Process',
      description: 'Learn how to review and approve drafts in our portal',
      order: 6,
      required: true,
      estimatedMinutes: 5
    }
  ]
};

// ============================================================================
// WEBSITE BUILD ONBOARDING
// ============================================================================

export const websiteBuildOnboarding: OnboardingTemplateConfig = {
  id: 'website-build',
  name: 'Website Build Onboarding',
  description: 'Comprehensive onboarding for website projects',
  category: 'web-development',
  steps: [
    {
      title: 'Complete Project Discovery Form',
      description: 'Detailed questionnaire about your business and website goals',
      order: 1,
      required: true,
      estimatedMinutes: 30
    },
    {
      title: 'Share Design Inspiration',
      description: 'Provide 3-5 websites you like and what you like about them',
      order: 2,
      required: true,
      estimatedMinutes: 15
    },
    {
      title: 'Provide All Content & Copy',
      description: 'Send all text, images, videos, and other assets',
      order: 3,
      required: true,
      estimatedMinutes: 60
    },
    {
      title: 'Provide Branding Assets',
      description: 'Upload your logo, fonts, and brand color codes',
      order: 4,
      required: true,
      estimatedMinutes: 10
    },
    {
      title: 'Review Wireframes',
      description: 'Approve the initial page layouts and structure',
      order: 5,
      required: true,
      estimatedMinutes: 20
    },
    {
      title: 'Approve Design Mockups',
      description: 'Review and approve the visual design before development',
      order: 6,
      required: true,
      estimatedMinutes: 30
    },
    {
      title: 'Provide Domain & Hosting Info',
      description: 'Share login credentials for your domain registrar and hosting',
      order: 7,
      required: true,
      estimatedMinutes: 10
    }
  ]
};

// ============================================================================
// COACHING PROGRAM ONBOARDING
// ============================================================================

export const coachingOnboarding: OnboardingTemplateConfig = {
  id: 'coaching-program',
  name: 'Coaching Program Onboarding',
  description: 'Welcome sequence for coaching clients',
  category: 'coaching',
  steps: [
    {
      title: 'Join Community Slack/Discord',
      description: 'Accept the invite and introduce yourself',
      order: 1,
      required: true,
      estimatedMinutes: 10
    },
    {
      title: 'Complete Pre-Program Assessment',
      description: 'Answer questions about your current skills and goals',
      order: 2,
      required: true,
      estimatedMinutes: 20
    },
    {
      title: 'Set Your 90-Day Goals',
      description: 'Define what success looks like for you',
      order: 3,
      required: true,
      estimatedMinutes: 15
    },
    {
      title: 'Watch Welcome Video',
      description: 'Learn about the program structure and expectations',
      order: 4,
      required: true,
      estimatedMinutes: 15
    },
    {
      title: 'Schedule Your First 1-on-1',
      description: 'Book your first coaching call',
      order: 5,
      required: true,
      estimatedMinutes: 2
    },
    {
      title: 'Access Course Materials',
      description: 'Log into the member portal and explore the resources',
      order: 6,
      required: true,
      estimatedMinutes: 10
    }
  ]
};

// ============================================================================
// SOCIAL MEDIA MANAGEMENT ONBOARDING
// ============================================================================

export const socialMediaOnboarding: OnboardingTemplateConfig = {
  id: 'social-media',
  name: 'Social Media Management Onboarding',
  description: 'Setup for social media management clients',
  category: 'social-media',
  steps: [
    {
      title: 'Grant Social Account Access',
      description: 'Add us as admin/editor to your social media accounts',
      order: 1,
      required: true,
      estimatedMinutes: 10
    },
    {
      title: 'Complete Brand Voice Guide',
      description: 'Define your social media tone and content preferences',
      order: 2,
      required: true,
      estimatedMinutes: 15
    },
    {
      title: 'Share Content Assets',
      description: 'Upload photos, logos, and other media for posts',
      order: 3,
      required: true,
      estimatedMinutes: 20
    },
    {
      title: 'Define Posting Schedule',
      description: 'Choose frequency and best posting times',
      order: 4,
      required: true,
      estimatedMinutes: 5
    },
    {
      title: 'Review First Week Content',
      description: 'Approve the initial content calendar',
      order: 5,
      required: true,
      estimatedMinutes: 15
    },
    {
      title: 'Set Up Approval Process',
      description: 'Choose how you want to review posts before publishing',
      order: 6,
      required: true,
      estimatedMinutes: 5
    }
  ]
};

// ============================================================================
// TEMPLATE REGISTRY
// ============================================================================

export const ONBOARDING_TEMPLATES: Record<string, OnboardingTemplateConfig> = {
  'seo-retainer': seoRetainerOnboarding,
  'audit-service': auditOnboarding,
  'content-creation': contentCreationOnboarding,
  'website-build': websiteBuildOnboarding,
  'coaching-program': coachingOnboarding,
  'social-media': socialMediaOnboarding
};

export const ONBOARDING_TEMPLATE_LIST: OnboardingTemplateConfig[] = [
  seoRetainerOnboarding,
  auditOnboarding,
  contentCreationOnboarding,
  websiteBuildOnboarding,
  coachingOnboarding,
  socialMediaOnboarding
];

/**
 * Get an onboarding template by ID
 */
export function getOnboardingTemplateById(templateId: string): OnboardingTemplateConfig | null {
  return ONBOARDING_TEMPLATES[templateId] || null;
}

/**
 * Get all onboarding templates
 */
export function getAllOnboardingTemplates(): OnboardingTemplateConfig[] {
  return ONBOARDING_TEMPLATE_LIST;
}

/**
 * Get onboarding templates by category
 */
export function getOnboardingTemplatesByCategory(category: string): OnboardingTemplateConfig[] {
  return ONBOARDING_TEMPLATE_LIST.filter(template => template.category === category);
}

/**
 * Create workspace onboarding steps from a template
 */
export async function createOnboardingFromTemplate(
  workspaceId: string,
  templateId: string
): Promise<any[]> {
  const template = getOnboardingTemplateById(templateId);

  if (!template) {
    throw new Error(`Template not found: ${templateId}`);
  }

  // This would integrate with your database to create actual onboarding_steps records
  // For now, return the step definitions
  return template.steps.map(step => ({
    workspace_id: workspaceId,
    title: step.title,
    description: step.description,
    order: step.order,
    required: step.required,
    completed: false,
    estimated_minutes: step.estimatedMinutes
  }));
}
