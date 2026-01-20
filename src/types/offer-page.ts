// Offer Page Types

// ============================================================================
// BLOCK TYPES
// ============================================================================

export type BlockType =
  | 'hero'
  | 'vsl'
  | 'problem_solution'
  | 'features'
  | 'testimonials'
  | 'offer_stack'
  | 'pricing'
  | 'faq'
  | 'cta';

export interface BaseBlock {
  id: string;
  type: BlockType;
  order: number;
}

// Hero Block
export interface HeroBlock extends BaseBlock {
  type: 'hero';
  data: {
    headline: string;
    subheadline?: string;
    ctaText: string;
    ctaLink?: string;
    backgroundImage?: string;
    alignment?: 'left' | 'center' | 'right';
  };
}

// VSL (Video Sales Letter) Block
export interface VSLBlock extends BaseBlock {
  type: 'vsl';
  data: {
    videoUrl: string; // YouTube, Vimeo, or direct URL
    videoProvider?: 'youtube' | 'vimeo' | 'custom';
    thumbnailUrl?: string;
    ctaText?: string;
    ctaLink?: string;
    autoplay?: boolean;
  };
}

// Problem-Solution Block
export interface ProblemSolutionBlock extends BaseBlock {
  type: 'problem_solution';
  data: {
    problemHeadline: string;
    problemDescription: string;
    solutionHeadline: string;
    solutionDescription: string;
    imageUrl?: string;
  };
}

// Features/What's Included Block
export interface FeaturesBlock extends BaseBlock {
  type: 'features';
  data: {
    headline: string;
    description?: string;
    features: Array<{
      id: string;
      icon?: string;
      title: string;
      description: string;
    }>;
    layout?: 'grid' | 'list';
  };
}

// Testimonials Block
export interface TestimonialsBlock extends BaseBlock {
  type: 'testimonials';
  data: {
    headline: string;
    testimonials: Array<{
      id: string;
      quote: string;
      author: string;
      authorTitle?: string;
      authorImage?: string;
      rating?: number;
    }>;
    layout?: 'carousel' | 'grid';
  };
}

// Offer Stack Block
export interface OfferStackBlock extends BaseBlock {
  type: 'offer_stack';
  data: {
    headline: string;
    description?: string;
    items: Array<{
      id: string;
      name: string;
      value: string;
      description?: string;
    }>;
    totalValue?: string;
    ctaText?: string;
  };
}

// Pricing Block
export interface PricingBlock extends BaseBlock {
  type: 'pricing';
  data: {
    headline: string;
    description?: string;
    offerId: string; // Reference to the offer
    showAddons?: boolean;
    ctaText: string;
  };
}

// FAQ Block
export interface FAQBlock extends BaseBlock {
  type: 'faq';
  data: {
    headline: string;
    faqs: Array<{
      id: string;
      question: string;
      answer: string;
    }>;
  };
}

// CTA Block
export interface CTABlock extends BaseBlock {
  type: 'cta';
  data: {
    headline: string;
    description?: string;
    ctaText: string;
    ctaLink?: string;
    urgency?: string;
    backgroundColor?: string;
  };
}

// Union type of all blocks
export type PageBlock =
  | HeroBlock
  | VSLBlock
  | ProblemSolutionBlock
  | FeaturesBlock
  | TestimonialsBlock
  | OfferStackBlock
  | PricingBlock
  | FAQBlock
  | CTABlock;

// ============================================================================
// OFFER PAGE
// ============================================================================

export interface OfferPage {
  id: string;
  vendor_id: string;

  // Page details
  title: string;
  slug: string;
  description?: string;

  // Content
  blocks: PageBlock[];

  // SEO
  meta_title?: string;
  meta_description?: string;
  og_image_url?: string;

  // Publishing
  is_published: boolean;
  published_at?: string;

  // Analytics
  view_count: number;

  // Metadata
  created_at: string;
  updated_at: string;
}

export interface OfferPageCreateInput {
  vendor_id: string;
  title: string;
  slug: string;
  description?: string;
  blocks?: PageBlock[];
  meta_title?: string;
  meta_description?: string;
  og_image_url?: string;
}

export interface OfferPageUpdateInput {
  title?: string;
  slug?: string;
  description?: string;
  blocks?: PageBlock[];
  meta_title?: string;
  meta_description?: string;
  og_image_url?: string;
  is_published?: boolean;
}

// ============================================================================
// OFFER PAGE TEMPLATES
// ============================================================================

export type OfferPageTemplate =
  | 'audit'
  | 'retainer'
  | 'dfy' // Done-for-you
  | 'coaching'
  | 'productized';

export interface OfferPageTemplateConfig {
  id: OfferPageTemplate;
  name: string;
  description: string;
  thumbnail?: string;
  blocks: PageBlock[];
}
