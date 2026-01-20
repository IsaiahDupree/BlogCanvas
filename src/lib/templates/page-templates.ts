/**
 * Offer Page Templates
 * Pre-built templates for common offer types
 */

import type { OfferPageTemplateConfig, PageBlock } from '@/types/offer-page';

// Helper to generate block IDs
const generateBlockId = () => crypto.randomUUID();

// ============================================================================
// AUDIT TEMPLATE
// ============================================================================

export const auditTemplate: OfferPageTemplateConfig = {
  id: 'audit',
  name: 'Audit Offer',
  description: 'Perfect for SEO audits, newsletter audits, or strategy reviews',
  blocks: [
    {
      id: generateBlockId(),
      type: 'hero',
      order: 0,
      data: {
        headline: 'Get a Professional [Type] Audit in 48 Hours',
        subheadline: 'Discover exactly what\'s holding you back and get a custom roadmap to fix it',
        ctaText: 'Get Your Audit Now',
        alignment: 'center'
      }
    },
    {
      id: generateBlockId(),
      type: 'problem_solution',
      order: 1,
      data: {
        problemHeadline: 'Spinning Your Wheels Without Results?',
        problemDescription: 'You\'ve been working hard, but something isn\'t clicking. Traffic isn\'t converting. Rankings aren\'t improving. You need an expert to show you what\'s broken.',
        solutionHeadline: 'Get a Clear, Actionable Plan',
        solutionDescription: 'I\'ll analyze your setup from top to bottom and give you a prioritized action plan you can implement immediately.'
      }
    },
    {
      id: generateBlockId(),
      type: 'features',
      order: 2,
      data: {
        headline: 'What\'s Included in Your Audit',
        features: [
          {
            id: generateBlockId(),
            title: 'Deep-Dive Analysis',
            description: 'Comprehensive review of your current setup'
          },
          {
            id: generateBlockId(),
            title: 'Video Walkthrough',
            description: 'Screen recording explaining every finding'
          },
          {
            id: generateBlockId(),
            title: 'Action Plan',
            description: 'Prioritized checklist of what to fix first'
          },
          {
            id: generateBlockId(),
            title: '30-Min Strategy Call',
            description: 'Q&A session to discuss the audit'
          }
        ],
        layout: 'grid'
      }
    },
    {
      id: generateBlockId(),
      type: 'pricing',
      order: 3,
      data: {
        headline: 'Investment',
        description: 'One-time audit with actionable insights',
        offerId: '', // To be filled in later
        ctaText: 'Get Your Audit'
      }
    },
    {
      id: generateBlockId(),
      type: 'faq',
      order: 4,
      data: {
        headline: 'Common Questions',
        faqs: [
          {
            id: generateBlockId(),
            question: 'How long does the audit take?',
            answer: 'You\'ll receive your complete audit within 48 hours of purchase.'
          },
          {
            id: generateBlockId(),
            question: 'What if I need help implementing the changes?',
            answer: 'I offer ongoing retainer services if you need hands-on support.'
          },
          {
            id: generateBlockId(),
            question: 'Do you offer refunds?',
            answer: 'Yes! If you\'re not satisfied with the audit, I\'ll refund your payment within 7 days.'
          }
        ]
      }
    },
    {
      id: generateBlockId(),
      type: 'cta',
      order: 5,
      data: {
        headline: 'Ready to See What\'s Broken?',
        description: 'Get your audit in 48 hours and start fixing what\'s holding you back',
        ctaText: 'Get Started Now',
        urgency: 'Limited spots available this month'
      }
    }
  ]
};

// ============================================================================
// RETAINER TEMPLATE
// ============================================================================

export const retainerTemplate: OfferPageTemplateConfig = {
  id: 'retainer',
  name: 'Monthly Retainer',
  description: 'For ongoing services like SEO, content creation, or consulting',
  blocks: [
    {
      id: generateBlockId(),
      type: 'hero',
      order: 0,
      data: {
        headline: 'Ongoing [Service] That Actually Delivers Results',
        subheadline: 'Stop wasting time on marketing that doesn\'t work. Get expert help every month.',
        ctaText: 'See Plans & Pricing',
        alignment: 'center'
      }
    },
    {
      id: generateBlockId(),
      type: 'features',
      order: 1,
      data: {
        headline: 'What You Get Every Month',
        features: [
          {
            id: generateBlockId(),
            title: 'Strategy & Planning',
            description: 'Monthly strategy sessions to plan your next moves'
          },
          {
            id: generateBlockId(),
            title: 'Execution',
            description: 'We handle the implementation while you focus on your business'
          },
          {
            id: generateBlockId(),
            title: 'Reporting',
            description: 'Clear monthly reports showing your progress'
          },
          {
            id: generateBlockId(),
            title: 'Direct Access',
            description: 'Slack or email support whenever you need it'
          }
        ],
        layout: 'grid'
      }
    },
    {
      id: generateBlockId(),
      type: 'pricing',
      order: 2,
      data: {
        headline: 'Simple Monthly Pricing',
        description: 'Cancel anytime, no long-term contracts',
        offerId: '', // To be filled in later
        showAddons: true,
        ctaText: 'Get Started'
      }
    },
    {
      id: generateBlockId(),
      type: 'faq',
      order: 3,
      data: {
        headline: 'FAQs',
        faqs: [
          {
            id: generateBlockId(),
            question: 'How long is the contract?',
            answer: 'Month-to-month. You can cancel anytime with 30 days notice.'
          },
          {
            id: generateBlockId(),
            question: 'What if I need more than what\'s included?',
            answer: 'We offer add-on services that you can purchase as needed.'
          }
        ]
      }
    },
    {
      id: generateBlockId(),
      type: 'cta',
      order: 4,
      data: {
        headline: 'Let\'s Grow Your Business Together',
        description: 'Join clients who are already seeing results',
        ctaText: 'Start Your Retainer'
      }
    }
  ]
};

// ============================================================================
// DONE-FOR-YOU (DFY) TEMPLATE
// ============================================================================

export const dfyTemplate: OfferPageTemplateConfig = {
  id: 'dfy',
  name: 'Done-For-You Service',
  description: 'For project-based work like funnel builds, website audits, or one-time setups',
  blocks: [
    {
      id: generateBlockId(),
      type: 'hero',
      order: 0,
      data: {
        headline: 'We\'ll Build Your [Project] In [Timeframe]',
        subheadline: 'Hands-off solution. We do everything while you focus on your business.',
        ctaText: 'Get Started',
        alignment: 'center'
      }
    },
    {
      id: generateBlockId(),
      type: 'problem_solution',
      order: 1,
      data: {
        problemHeadline: 'Don\'t Have Time to Build It Yourself?',
        problemDescription: 'You know what you need, but don\'t have the time or technical skills to make it happen.',
        solutionHeadline: 'We Handle Everything',
        solutionDescription: 'From planning to launch, we\'ll build exactly what you need—on time and on budget.'
      }
    },
    {
      id: generateBlockId(),
      type: 'offer_stack',
      order: 2,
      data: {
        headline: 'Everything Included',
        items: [
          {
            id: generateBlockId(),
            name: 'Initial Strategy Session',
            value: '$500',
            description: 'We plan every detail together'
          },
          {
            id: generateBlockId(),
            name: 'Complete Build',
            value: '$2,500',
            description: 'All setup and implementation'
          },
          {
            id: generateBlockId(),
            name: 'Launch Support',
            value: '$300',
            description: '30 days of post-launch help'
          },
          {
            id: generateBlockId(),
            name: 'Training Videos',
            value: '$200',
            description: 'Learn how to manage it yourself'
          }
        ],
        totalValue: '$3,500',
        ctaText: 'Get Started Today'
      }
    },
    {
      id: generateBlockId(),
      type: 'pricing',
      order: 3,
      data: {
        headline: 'One-Time Investment',
        description: 'Pay once, own forever',
        offerId: '', // To be filled in later
        showAddons: true,
        ctaText: 'Start Your Project'
      }
    },
    {
      id: generateBlockId(),
      type: 'cta',
      order: 4,
      data: {
        headline: 'Ready to Get This Done?',
        description: 'Book a call and we\'ll get started this week',
        ctaText: 'Book Your Project',
        urgency: 'Only 2 project slots available this month'
      }
    }
  ]
};

// ============================================================================
// COACHING TEMPLATE
// ============================================================================

export const coachingTemplate: OfferPageTemplateConfig = {
  id: 'coaching',
  name: 'Coaching Program',
  description: 'For coaching, courses, or educational programs',
  blocks: [
    {
      id: generateBlockId(),
      type: 'hero',
      order: 0,
      data: {
        headline: 'Master [Skill] in [Timeframe]',
        subheadline: 'Get personalized coaching and support to accelerate your results',
        ctaText: 'Apply Now',
        alignment: 'center'
      }
    },
    {
      id: generateBlockId(),
      type: 'vsl',
      order: 1,
      data: {
        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        videoProvider: 'youtube',
        ctaText: 'Apply for Coaching'
      }
    },
    {
      id: generateBlockId(),
      type: 'features',
      order: 2,
      data: {
        headline: 'What\'s Included',
        features: [
          {
            id: generateBlockId(),
            title: 'Weekly 1-on-1 Calls',
            description: 'Direct access to get your questions answered'
          },
          {
            id: generateBlockId(),
            title: 'Complete Framework',
            description: 'Step-by-step system you can follow'
          },
          {
            id: generateBlockId(),
            title: 'Community Access',
            description: 'Join others on the same journey'
          },
          {
            id: generateBlockId(),
            title: 'Resources & Templates',
            description: 'Everything you need to implement'
          }
        ],
        layout: 'grid'
      }
    },
    {
      id: generateBlockId(),
      type: 'testimonials',
      order: 3,
      data: {
        headline: 'What Students Are Saying',
        testimonials: [
          {
            id: generateBlockId(),
            quote: 'This program completely changed how I approach my business.',
            author: 'Sarah Johnson',
            authorTitle: 'Founder, ABC Company',
            rating: 5
          }
        ],
        layout: 'grid'
      }
    },
    {
      id: generateBlockId(),
      type: 'pricing',
      order: 4,
      data: {
        headline: 'Program Investment',
        description: '12-week intensive program',
        offerId: '', // To be filled in later
        ctaText: 'Apply Now'
      }
    },
    {
      id: generateBlockId(),
      type: 'cta',
      order: 5,
      data: {
        headline: 'Ready to Level Up?',
        description: 'Applications are reviewed within 24 hours',
        ctaText: 'Submit Application'
      }
    }
  ]
};

// ============================================================================
// PRODUCTIZED SERVICE TEMPLATE
// ============================================================================

export const productizedTemplate: OfferPageTemplateConfig = {
  id: 'productized',
  name: 'Productized Service',
  description: 'For standardized services like blog posts, designs, or technical implementations',
  blocks: [
    {
      id: generateBlockId(),
      type: 'hero',
      order: 0,
      data: {
        headline: 'High-Quality [Service] Delivered in [Timeframe]',
        subheadline: 'Fixed price. Fast turnaround. No surprises.',
        ctaText: 'Order Now',
        alignment: 'center'
      }
    },
    {
      id: generateBlockId(),
      type: 'features',
      order: 1,
      data: {
        headline: 'How It Works',
        description: 'Simple 3-step process',
        features: [
          {
            id: generateBlockId(),
            title: '1. Order',
            description: 'Choose your package and submit your requirements'
          },
          {
            id: generateBlockId(),
            title: '2. We Deliver',
            description: 'We create and deliver within the specified timeframe'
          },
          {
            id: generateBlockId(),
            title: '3. Revisions',
            description: 'Request changes until you\'re 100% happy'
          }
        ],
        layout: 'list'
      }
    },
    {
      id: generateBlockId(),
      type: 'pricing',
      order: 2,
      data: {
        headline: 'Transparent Pricing',
        description: 'What you see is what you pay',
        offerId: '', // To be filled in later
        showAddons: true,
        ctaText: 'Get Started'
      }
    },
    {
      id: generateBlockId(),
      type: 'faq',
      order: 3,
      data: {
        headline: 'Questions?',
        faqs: [
          {
            id: generateBlockId(),
            question: 'How many revisions do I get?',
            answer: 'Two rounds of revisions are included. Additional revisions can be purchased.'
          },
          {
            id: generateBlockId(),
            question: 'What\'s your turnaround time?',
            answer: 'Standard delivery is 5-7 business days. Rush delivery available for an additional fee.'
          }
        ]
      }
    },
    {
      id: generateBlockId(),
      type: 'cta',
      order: 4,
      data: {
        headline: 'Ready to Order?',
        description: 'Get started today and receive your delivery within the week',
        ctaText: 'Place Your Order'
      }
    }
  ]
};

// ============================================================================
// TEMPLATE REGISTRY
// ============================================================================

export const PAGE_TEMPLATES: Record<string, OfferPageTemplateConfig> = {
  audit: auditTemplate,
  retainer: retainerTemplate,
  dfy: dfyTemplate,
  coaching: coachingTemplate,
  productized: productizedTemplate
};

export const TEMPLATE_LIST: OfferPageTemplateConfig[] = [
  auditTemplate,
  retainerTemplate,
  dfyTemplate,
  coachingTemplate,
  productizedTemplate
];

/**
 * Get a template by ID
 */
export function getTemplateById(templateId: string): OfferPageTemplateConfig | null {
  return PAGE_TEMPLATES[templateId] || null;
}

/**
 * Get all templates
 */
export function getAllTemplates(): OfferPageTemplateConfig[] {
  return TEMPLATE_LIST;
}
