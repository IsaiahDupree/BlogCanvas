/**
 * Shared Client Context Service
 *
 * This service aggregates all brand guidelines and settings for a client
 * into a unified context object that can be used by AI agents throughout
 * the system (Pipeline, Topics, Blogs, Images, etc.)
 *
 * @feat-164 PRD Brand: getSharedClientContext() unified function
 */

import { createClient } from '@/lib/supabase/server';

/**
 * Unified client context object containing all brand guidelines
 */
export interface SharedClientContext {
  // Client identification
  clientId: string;
  clientName: string;

  // Brand basics
  brandGuide: {
    id: string | null;
    brandName: string | null;
    tagline: string | null;
    source: string | null;
  };

  // Voice and tone
  voiceAndTone: {
    voiceTraits: string[];
    toneGuidelines: Record<string, any>;
    messagingHierarchy: Record<string, any>;
  };

  // Styles to avoid
  stylesToAvoid: {
    wordPatterns: string[];
    structuralRules: {
      maxPassiveVoicePercent: number | null;
      maxSentenceLength: number | null;
      avoidAllCaps: boolean;
    };
    dataBacking: Array<{
      rule: string;
      evidence: string;
      impact: string;
    }>;
  };

  // Styles to keep
  stylesToKeep: {
    preferredPatterns: string[];
    successfulExamples: Array<{
      text: string;
      voiceType: 'good' | 'bad';
      context: string;
      engagementScore?: number;
    }>;
    engagementMetrics: {
      avgTimeOnPage?: number;
      avgEngagementRate?: number;
      topPerformingStyle?: string;
    };
  };

  // Image guidelines
  imageGuidelines: {
    featuredImageSpecs: {
      aspectRatio: string;
      minWidth: number;
      minHeight: number;
      preferredFormat: string;
    };
    aiGenerationSettings: {
      provider: string;
      style: string;
      bannedElements: string[];
    };
    altTextRules: {
      maxLength: number;
      includeKeywords: boolean;
      avoidPhrases: string[];
    };
  };

  // Title guidelines
  titleGuidelines: {
    preferredFormats: string[];
    powerWords: string[];
    wordsToAvoid: string[];
    highPerformingPatterns: string[];
  };

  // Additional context
  valuePropositions: string[];
  targetAudiences: Array<Record<string, any>>;
  donts: string[];
  productsServices: Array<Record<string, any>>;
}

/**
 * Default values for empty brand guide fields
 */
const DEFAULT_STYLES_TO_AVOID = {
  wordPatterns: [],
  structuralRules: {
    maxPassiveVoicePercent: null,
    maxSentenceLength: null,
    avoidAllCaps: true
  },
  dataBacking: []
};

const DEFAULT_STYLES_TO_KEEP = {
  preferredPatterns: [],
  successfulExamples: [],
  engagementMetrics: {}
};

const DEFAULT_IMAGE_GUIDELINES = {
  featuredImageSpecs: {
    aspectRatio: '16:9',
    minWidth: 1200,
    minHeight: 630,
    preferredFormat: 'jpg'
  },
  aiGenerationSettings: {
    provider: 'dalle',
    style: 'photorealistic',
    bannedElements: []
  },
  altTextRules: {
    maxLength: 125,
    includeKeywords: true,
    avoidPhrases: ['image of', 'picture of']
  }
};

const DEFAULT_TITLE_GUIDELINES = {
  preferredFormats: ['How to [X]', '[Number] Ways to [X]', '[X]: A Complete Guide'],
  powerWords: [],
  wordsToAvoid: [],
  highPerformingPatterns: []
};

/**
 * Fetches and aggregates all brand guidelines for a client
 *
 * @param clientId - The UUID of the client
 * @returns Complete shared client context object
 * @throws Error if client not found or database query fails
 */
export async function getSharedClientContext(clientId: string): Promise<SharedClientContext> {
  const supabase = await createClient();

  // Get client information
  const { data: client, error: clientError } = await supabase
    .from('clients')
    .select('id, name')
    .eq('id', clientId)
    .single();

  if (clientError || !client) {
    throw new Error(`Client not found: ${clientId}`);
  }

  // Get brand guide for the client
  // Note: Currently using client.name to match brand_name
  // TODO: Add client_id foreign key to brand_guides table for direct relationship
  const { data: brandGuide, error: brandGuideError } = await supabase
    .from('brand_guides')
    .select('*')
    .eq('brand_name', client.name)
    .single();

  // If no brand guide exists, return context with defaults
  if (brandGuideError || !brandGuide) {
    return {
      clientId: client.id,
      clientName: client.name,
      brandGuide: {
        id: null,
        brandName: client.name,
        tagline: null,
        source: null
      },
      voiceAndTone: {
        voiceTraits: [],
        toneGuidelines: {},
        messagingHierarchy: {}
      },
      stylesToAvoid: DEFAULT_STYLES_TO_AVOID,
      stylesToKeep: DEFAULT_STYLES_TO_KEEP,
      imageGuidelines: DEFAULT_IMAGE_GUIDELINES,
      titleGuidelines: DEFAULT_TITLE_GUIDELINES,
      valuePropositions: [],
      targetAudiences: [],
      donts: [],
      productsServices: []
    };
  }

  // Parse JSONB fields with defaults
  const stylesToAvoid = (brandGuide.styles_to_avoid as any) || DEFAULT_STYLES_TO_AVOID;
  const stylesToKeep = (brandGuide.styles_to_keep as any) || DEFAULT_STYLES_TO_KEEP;
  const imageGuidelines = (brandGuide.image_guidelines as any) || DEFAULT_IMAGE_GUIDELINES;
  const titleGuidelines = (brandGuide.title_guidelines as any) || DEFAULT_TITLE_GUIDELINES;

  // Construct unified context object
  const context: SharedClientContext = {
    clientId: client.id,
    clientName: client.name,

    brandGuide: {
      id: brandGuide.id,
      brandName: brandGuide.brand_name,
      tagline: brandGuide.tagline,
      source: brandGuide.source
    },

    voiceAndTone: {
      voiceTraits: Array.isArray(brandGuide.voice_traits)
        ? (brandGuide.voice_traits as any[])
        : [],
      toneGuidelines: (brandGuide.tone_guidelines as any) || {},
      messagingHierarchy: (brandGuide.messaging_hierarchy as any) || {}
    },

    stylesToAvoid: {
      wordPatterns: stylesToAvoid.word_patterns || stylesToAvoid.wordPatterns || [],
      structuralRules: {
        maxPassiveVoicePercent: stylesToAvoid.structural_rules?.max_passive_voice_percent
          ?? stylesToAvoid.structuralRules?.maxPassiveVoicePercent
          ?? null,
        maxSentenceLength: stylesToAvoid.structural_rules?.max_sentence_length
          ?? stylesToAvoid.structuralRules?.maxSentenceLength
          ?? null,
        avoidAllCaps: stylesToAvoid.structural_rules?.avoid_all_caps
          ?? stylesToAvoid.structuralRules?.avoidAllCaps
          ?? true
      },
      dataBacking: stylesToAvoid.data_backing || stylesToAvoid.dataBacking || []
    },

    stylesToKeep: {
      preferredPatterns: stylesToKeep.preferred_patterns || stylesToKeep.preferredPatterns || [],
      successfulExamples: (stylesToKeep.successful_examples || stylesToKeep.successfulExamples || []).map((ex: any) => ({
        text: ex.text || '',
        voiceType: ex.voice_type || ex.voiceType || 'good',
        context: ex.context || '',
        engagementScore: ex.engagement_score ?? ex.engagementScore
      })),
      engagementMetrics: {
        avgTimeOnPage: stylesToKeep.engagement_metrics?.avg_time_on_page
          ?? stylesToKeep.engagementMetrics?.avgTimeOnPage,
        avgEngagementRate: stylesToKeep.engagement_metrics?.avg_engagement_rate
          ?? stylesToKeep.engagementMetrics?.avgEngagementRate,
        topPerformingStyle: stylesToKeep.engagement_metrics?.top_performing_style
          ?? stylesToKeep.engagementMetrics?.topPerformingStyle
      }
    },

    imageGuidelines: {
      featuredImageSpecs: {
        aspectRatio: imageGuidelines.featured_image_specs?.aspect_ratio
          ?? imageGuidelines.featuredImageSpecs?.aspectRatio
          ?? DEFAULT_IMAGE_GUIDELINES.featuredImageSpecs.aspectRatio,
        minWidth: imageGuidelines.featured_image_specs?.min_width
          ?? imageGuidelines.featuredImageSpecs?.minWidth
          ?? DEFAULT_IMAGE_GUIDELINES.featuredImageSpecs.minWidth,
        minHeight: imageGuidelines.featured_image_specs?.min_height
          ?? imageGuidelines.featuredImageSpecs?.minHeight
          ?? DEFAULT_IMAGE_GUIDELINES.featuredImageSpecs.minHeight,
        preferredFormat: imageGuidelines.featured_image_specs?.preferred_format
          ?? imageGuidelines.featuredImageSpecs?.preferredFormat
          ?? DEFAULT_IMAGE_GUIDELINES.featuredImageSpecs.preferredFormat
      },
      aiGenerationSettings: {
        provider: imageGuidelines.ai_generation_settings?.provider
          ?? imageGuidelines.aiGenerationSettings?.provider
          ?? DEFAULT_IMAGE_GUIDELINES.aiGenerationSettings.provider,
        style: imageGuidelines.ai_generation_settings?.style
          ?? imageGuidelines.aiGenerationSettings?.style
          ?? DEFAULT_IMAGE_GUIDELINES.aiGenerationSettings.style,
        bannedElements: imageGuidelines.ai_generation_settings?.banned_elements
          ?? imageGuidelines.aiGenerationSettings?.bannedElements
          ?? DEFAULT_IMAGE_GUIDELINES.aiGenerationSettings.bannedElements
      },
      altTextRules: {
        maxLength: imageGuidelines.alt_text_rules?.max_length
          ?? imageGuidelines.altTextRules?.maxLength
          ?? DEFAULT_IMAGE_GUIDELINES.altTextRules.maxLength,
        includeKeywords: imageGuidelines.alt_text_rules?.include_keywords
          ?? imageGuidelines.altTextRules?.includeKeywords
          ?? DEFAULT_IMAGE_GUIDELINES.altTextRules.includeKeywords,
        avoidPhrases: imageGuidelines.alt_text_rules?.avoid_phrases
          ?? imageGuidelines.altTextRules?.avoidPhrases
          ?? DEFAULT_IMAGE_GUIDELINES.altTextRules.avoidPhrases
      }
    },

    titleGuidelines: {
      preferredFormats: titleGuidelines.preferred_formats
        ?? titleGuidelines.preferredFormats
        ?? DEFAULT_TITLE_GUIDELINES.preferredFormats,
      powerWords: titleGuidelines.power_words
        ?? titleGuidelines.powerWords
        ?? DEFAULT_TITLE_GUIDELINES.powerWords,
      wordsToAvoid: titleGuidelines.words_to_avoid
        ?? titleGuidelines.wordsToAvoid
        ?? DEFAULT_TITLE_GUIDELINES.wordsToAvoid,
      highPerformingPatterns: titleGuidelines.high_performing_patterns
        ?? titleGuidelines.highPerformingPatterns
        ?? DEFAULT_TITLE_GUIDELINES.highPerformingPatterns
    },

    valuePropositions: Array.isArray(brandGuide.value_propositions)
      ? (brandGuide.value_propositions as any[])
      : [],
    targetAudiences: Array.isArray(brandGuide.target_audiences)
      ? (brandGuide.target_audiences as any[])
      : [],
    donts: Array.isArray(brandGuide.donts)
      ? (brandGuide.donts as any[])
      : [],
    productsServices: Array.isArray(brandGuide.products_services)
      ? (brandGuide.products_services as any[])
      : []
  };

  return context;
}

/**
 * Helper function to format context for AI prompts
 * Converts the context object into a human-readable string
 */
export function formatContextForAI(context: SharedClientContext): string {
  const sections: string[] = [];

  sections.push(`# Brand Context for ${context.clientName}`);
  sections.push('');

  if (context.brandGuide.tagline) {
    sections.push(`**Tagline:** ${context.brandGuide.tagline}`);
    sections.push('');
  }

  // Voice and Tone
  if (context.voiceAndTone.voiceTraits.length > 0) {
    sections.push('## Voice Traits');
    context.voiceAndTone.voiceTraits.forEach(trait => {
      sections.push(`- ${trait}`);
    });
    sections.push('');
  }

  // Styles to Avoid
  if (context.stylesToAvoid.wordPatterns.length > 0) {
    sections.push('## Words/Phrases to Avoid');
    context.stylesToAvoid.wordPatterns.forEach(pattern => {
      sections.push(`- ${pattern}`);
    });
    sections.push('');
  }

  // Structural Rules
  const rules = context.stylesToAvoid.structuralRules;
  if (rules.maxPassiveVoicePercent || rules.maxSentenceLength || rules.avoidAllCaps) {
    sections.push('## Writing Rules');
    if (rules.maxPassiveVoicePercent) {
      sections.push(`- Keep passive voice under ${rules.maxPassiveVoicePercent}%`);
    }
    if (rules.maxSentenceLength) {
      sections.push(`- Keep sentences under ${rules.maxSentenceLength} words`);
    }
    if (rules.avoidAllCaps) {
      sections.push(`- Avoid writing in ALL CAPS`);
    }
    sections.push('');
  }

  // Styles to Keep
  if (context.stylesToKeep.preferredPatterns.length > 0) {
    sections.push('## Preferred Writing Patterns');
    context.stylesToKeep.preferredPatterns.forEach(pattern => {
      sections.push(`- ${pattern}`);
    });
    sections.push('');
  }

  // Good Examples
  const goodExamples = context.stylesToKeep.successfulExamples.filter(ex => ex.voiceType === 'good');
  if (goodExamples.length > 0) {
    sections.push('## Good Voice Examples');
    goodExamples.forEach(ex => {
      sections.push(`- "${ex.text}" (${ex.context})`);
    });
    sections.push('');
  }

  // Title Guidelines
  if (context.titleGuidelines.preferredFormats.length > 0) {
    sections.push('## Preferred Title Formats');
    context.titleGuidelines.preferredFormats.forEach(format => {
      sections.push(`- ${format}`);
    });
    sections.push('');
  }

  if (context.titleGuidelines.powerWords.length > 0) {
    sections.push('## Power Words for Titles');
    sections.push(context.titleGuidelines.powerWords.join(', '));
    sections.push('');
  }

  // Don'ts
  if (context.donts.length > 0) {
    sections.push('## Things to Avoid');
    context.donts.forEach(dont => {
      sections.push(`- ${dont}`);
    });
    sections.push('');
  }

  return sections.join('\n');
}
