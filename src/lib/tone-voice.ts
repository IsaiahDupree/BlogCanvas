/**
 * Tone/Voice Types and Configuration
 *
 * Manages tone and voice settings for blog posts
 * Based on common content writing styles and brand personalities
 */

/**
 * Valid tone/voice types
 */
export type ToneVoice =
  | 'professional'
  | 'friendly'
  | 'authoritative'
  | 'conversational'
  | 'educational'
  | 'inspirational'
  | 'humorous'
  | 'technical'
  | 'empathetic'
  | 'bold';

/**
 * Configuration for each tone/voice type
 */
export interface ToneVoiceConfig {
  /** Unique identifier */
  id: ToneVoice;

  /** Display name */
  label: string;

  /** Detailed description */
  description: string;

  /** Emoji icon for visual identification */
  icon: string;

  /** Typical characteristics */
  characteristics: string[];

  /** Example phrases or styles */
  examples: string[];

  /** Writing tips for this tone */
  writingTips: string[];

  /** Best use cases */
  bestFor: string[];
}

/**
 * All available tone/voice configurations
 */
export const TONE_VOICE_OPTIONS: ToneVoiceConfig[] = [
  {
    id: 'professional',
    label: 'Professional',
    description: 'Polished, formal, and business-appropriate',
    icon: '💼',
    characteristics: [
      'Formal language and proper grammar',
      'Third-person perspective',
      'Objective and factual',
      'Industry-standard terminology',
      'Clear structure and organization'
    ],
    examples: [
      'The research indicates a significant correlation...',
      'Industry best practices suggest...',
      'Our analysis demonstrates...'
    ],
    writingTips: [
      'Avoid contractions and colloquialisms',
      'Use precise, specific language',
      'Maintain formal sentence structure',
      'Back claims with evidence',
      'Keep emotion neutral'
    ],
    bestFor: [
      'B2B content',
      'Corporate communications',
      'White papers and reports',
      'Professional services',
      'Technical documentation'
    ]
  },
  {
    id: 'friendly',
    label: 'Friendly',
    description: 'Warm, approachable, and relatable',
    icon: '😊',
    characteristics: [
      'Conversational but clear',
      'Inclusive and welcoming',
      'Personal pronouns (we, you)',
      'Positive and encouraging',
      'Accessible language'
    ],
    examples: [
      "We're here to help you succeed!",
      "Let's dive into how you can...",
      "You might be wondering..."
    ],
    writingTips: [
      'Use contractions naturally',
      'Address reader directly as "you"',
      'Show warmth and understanding',
      'Keep sentences varied and flowing',
      'Use simple, clear explanations'
    ],
    bestFor: [
      'Customer-facing content',
      'Welcome messages',
      'Community posts',
      'Help center articles',
      'Consumer brands'
    ]
  },
  {
    id: 'authoritative',
    label: 'Authoritative',
    description: 'Expert, credible, and commanding',
    icon: '🎯',
    characteristics: [
      'Confident and assertive',
      'Evidence-based claims',
      'Expert terminology',
      'Direct and decisive',
      'Industry leadership tone'
    ],
    examples: [
      'The data clearly shows...',
      'Based on extensive research...',
      'The optimal approach is...'
    ],
    writingTips: [
      'State facts confidently',
      'Cite credible sources',
      'Use definitive language',
      'Demonstrate expertise',
      'Avoid hedging or uncertainty'
    ],
    bestFor: [
      'Thought leadership',
      'Industry reports',
      'Expert guides',
      'Research-backed content',
      'Enterprise solutions'
    ]
  },
  {
    id: 'conversational',
    label: 'Conversational',
    description: 'Casual, relaxed, and dialogue-like',
    icon: '💬',
    characteristics: [
      'Natural speaking style',
      'Short, punchy sentences',
      'Questions to engage reader',
      'Informal vocabulary',
      'Personal anecdotes'
    ],
    examples: [
      'Ever wondered why...?',
      "Here's the thing...",
      "You know what? I used to think..."
    ],
    writingTips: [
      'Write as you speak',
      'Use rhetorical questions',
      'Include personal stories',
      'Keep it light and easy',
      'Use everyday language'
    ],
    bestFor: [
      'Blog posts',
      'Social media content',
      'Personal brands',
      'Lifestyle topics',
      'Entertainment content'
    ]
  },
  {
    id: 'educational',
    label: 'Educational',
    description: 'Teaching-focused, clear, and informative',
    icon: '📖',
    characteristics: [
      'Step-by-step explanations',
      'Clear definitions',
      'Examples and analogies',
      'Patient and thorough',
      'Structured learning flow'
    ],
    examples: [
      "Let's start with the basics...",
      'To understand this, first consider...',
      'Think of it like this...'
    ],
    writingTips: [
      'Define terms clearly',
      'Use analogies for complex concepts',
      'Break down into digestible steps',
      'Provide examples',
      'Check for understanding'
    ],
    bestFor: [
      'Tutorials and guides',
      'How-to articles',
      'Online courses',
      'Educational content',
      'Training materials'
    ]
  },
  {
    id: 'inspirational',
    label: 'Inspirational',
    description: 'Motivating, uplifting, and aspirational',
    icon: '✨',
    characteristics: [
      'Positive and empowering',
      'Future-focused language',
      'Emotional resonance',
      'Call to action',
      'Stories of transformation'
    ],
    examples: [
      'Imagine what you could achieve...',
      'Your journey starts here...',
      'Together, we can create...'
    ],
    writingTips: [
      'Paint vivid future scenarios',
      'Use emotional language',
      'Include success stories',
      'End with empowerment',
      'Focus on possibilities'
    ],
    bestFor: [
      'Mission statements',
      'Personal development',
      'Leadership content',
      'Brand stories',
      'Motivational posts'
    ]
  },
  {
    id: 'humorous',
    label: 'Humorous',
    description: 'Witty, entertaining, and light-hearted',
    icon: '😄',
    characteristics: [
      'Playful language',
      'Clever wordplay',
      'Self-deprecating humor',
      'Pop culture references',
      'Unexpected comparisons'
    ],
    examples: [
      "Spoiler alert: it's not rocket science (unless you're writing about rockets)",
      "We've all been there...",
      "Plot twist: there's actually a simple solution"
    ],
    writingTips: [
      'Know your audience humor threshold',
      'Keep it tasteful and inclusive',
      'Use humor to illustrate points',
      'Balance fun with valuable content',
      'Test jokes with diverse readers'
    ],
    bestFor: [
      'Entertainment brands',
      'Creative industries',
      'Casual blog posts',
      'Social media',
      'Young audiences'
    ]
  },
  {
    id: 'technical',
    label: 'Technical',
    description: 'Precise, detailed, and specification-focused',
    icon: '⚙️',
    characteristics: [
      'Technical terminology',
      'Precise specifications',
      'Code examples',
      'Detailed procedures',
      'Assumption of technical knowledge'
    ],
    examples: [
      'The API endpoint accepts POST requests...',
      'Configure the parameters as follows...',
      'The implementation leverages...'
    ],
    writingTips: [
      'Use accurate technical terms',
      'Include code samples',
      'Be specific and exact',
      'Document edge cases',
      'Assume technical competence'
    ],
    bestFor: [
      'Developer documentation',
      'API guides',
      'Technical specifications',
      'Engineering blogs',
      'Software tutorials'
    ]
  },
  {
    id: 'empathetic',
    label: 'Empathetic',
    description: 'Understanding, supportive, and compassionate',
    icon: '💙',
    characteristics: [
      'Acknowledges challenges',
      'Validates feelings',
      'Supportive language',
      'Problem-solving focus',
      'Reassuring tone'
    ],
    examples: [
      'We understand this can be challenging...',
      "It's completely normal to feel...",
      "You're not alone in this..."
    ],
    writingTips: [
      'Acknowledge pain points',
      'Show understanding',
      'Offer solutions gently',
      'Avoid dismissive language',
      'Focus on support'
    ],
    bestFor: [
      'Healthcare content',
      'Support documentation',
      'Crisis communication',
      'Sensitive topics',
      'Customer service'
    ]
  },
  {
    id: 'bold',
    label: 'Bold',
    description: 'Daring, confident, and attention-grabbing',
    icon: '🔥',
    characteristics: [
      'Strong statements',
      'Provocative questions',
      'Unconventional approach',
      'Challenge status quo',
      'Memorable declarations'
    ],
    examples: [
      "Let's be honest: most advice on this topic is wrong",
      "Time to break some rules...",
      "The industry doesn't want you to know..."
    ],
    writingTips: [
      'Take clear positions',
      'Challenge assumptions',
      'Use powerful language',
      'Back bold claims',
      'Create memorable moments'
    ],
    bestFor: [
      'Disruptive brands',
      'Thought leadership',
      'Controversial topics',
      'Opinion pieces',
      'Innovation-focused content'
    ]
  }
];

/**
 * Get configuration for a specific tone/voice
 */
export function getToneVoiceConfig(toneVoice: ToneVoice): ToneVoiceConfig | undefined {
  return TONE_VOICE_OPTIONS.find(option => option.id === toneVoice);
}

/**
 * Get all available tone/voice options
 */
export function getAllToneVoiceOptions(): ToneVoiceConfig[] {
  return TONE_VOICE_OPTIONS;
}

/**
 * Get AI-friendly guidance for a specific tone/voice
 */
export function getAIToneGuidance(toneVoice: ToneVoice): string {
  const config = getToneVoiceConfig(toneVoice);
  if (!config) {
    return '';
  }

  return `
TONE/VOICE: ${config.label}
Description: ${config.description}

Key Characteristics:
${config.characteristics.map(c => `- ${c}`).join('\n')}

Writing Tips:
${config.writingTips.map(t => `- ${t}`).join('\n')}

Example Style:
${config.examples.map(e => `"${e}"`).join('\n')}

Write in this ${config.label.toLowerCase()} tone throughout the entire piece.
`.trim();
}

/**
 * Validate if a string is a valid tone/voice type
 */
export function isValidToneVoice(value: string): value is ToneVoice {
  return TONE_VOICE_OPTIONS.some(option => option.id === value);
}

/**
 * Parse a tone/voice value, returning undefined if invalid
 */
export function parseToneVoice(value: string | null | undefined): ToneVoice | null {
  if (!value) return null;
  const normalized = value.toLowerCase().trim();
  return isValidToneVoice(normalized) ? normalized : null;
}

/**
 * Get default tone/voice from brand guide or system default
 */
export function getDefaultToneVoice(brandTone?: string | null): ToneVoice {
  // Try to parse brand guide tone
  if (brandTone) {
    const parsed = parseToneVoice(brandTone);
    if (parsed) return parsed;
  }

  // Default to professional if no brand preference
  return 'professional';
}
