/**
 * Content Repurposing Agent
 * Transforms blog content into various formats (social, newsletter, video scripts, etc.)
 */

import { LLMProvider, AgentResult } from './types';
import { createOpenAIProvider } from './openai-provider';

export interface SocialPost {
  platform: 'twitter' | 'linkedin' | 'facebook' | 'instagram';
  content: string;
  characterCount: number;
  hashtags: string[];
  callToAction?: string;
  imagePrompt?: string;
}

export interface NewsletterSection {
  subject: string;
  preheader: string;
  headline: string;
  summary: string;
  bodyContent: string;
  callToAction: {
    text: string;
    url: string;
  };
}

export interface VideoScript {
  title: string;
  duration: string;
  hook: string;
  intro: string;
  mainPoints: {
    point: string;
    script: string;
    visualSuggestion: string;
  }[];
  conclusion: string;
  callToAction: string;
}

export interface ThreadContent {
  platform: 'twitter' | 'linkedin';
  threadPosts: {
    number: number;
    content: string;
    characterCount: number;
  }[];
  totalPosts: number;
}

export interface RepurposeResult {
  socialPosts: SocialPost[];
  newsletter: NewsletterSection;
  videoScript: VideoScript;
  thread: ThreadContent;
  emailTeaser: string;
  metaDescription: string;
  excerpts: {
    short: string;
    medium: string;
    long: string;
  };
}

export interface RepurposeInput {
  title: string;
  content: string;
  targetKeyword: string;
  blogUrl?: string;
  brandVoice?: string[];
  targetAudience?: string;
  formats?: ('social' | 'newsletter' | 'video' | 'thread' | 'email')[];
}

/**
 * Repurpose blog content into multiple formats
 */
export async function runRepurposeAgent(
  input: RepurposeInput,
  provider?: LLMProvider
): Promise<AgentResult<RepurposeResult>> {
  const llm = provider || createOpenAIProvider();

  try {
    const formats = input.formats || ['social', 'newsletter', 'video', 'thread', 'email'];

    const systemPrompt = `You are a content repurposing expert. Transform blog content into engaging formats for different platforms while maintaining the core message and brand voice.`;

    const userPrompt = `Repurpose this blog content into multiple formats:

BLOG TITLE: ${input.title}
TARGET KEYWORD: ${input.targetKeyword}
BLOG URL: ${input.blogUrl || '[BLOG_URL]'}
BRAND VOICE: ${input.brandVoice?.join(', ') || 'Professional, Helpful'}
TARGET AUDIENCE: ${input.targetAudience || 'Business professionals'}

BLOG CONTENT:
${input.content.substring(0, 6000)}

FORMATS NEEDED: ${formats.join(', ')}

Return a JSON object:
{
  "socialPosts": [
    {
      "platform": "twitter",
      "content": "Tweet text under 280 chars",
      "characterCount": number,
      "hashtags": ["#tag1", "#tag2"],
      "callToAction": "Read more: [link]",
      "imagePrompt": "image suggestion"
    },
    {
      "platform": "linkedin",
      "content": "LinkedIn post (can be longer, more professional)",
      "characterCount": number,
      "hashtags": ["#tag1"],
      "callToAction": "Link in comments"
    },
    {
      "platform": "facebook",
      "content": "Facebook post",
      "characterCount": number,
      "hashtags": [],
      "callToAction": "Click to read"
    }
  ],
  "newsletter": {
    "subject": "Email subject line",
    "preheader": "Preview text",
    "headline": "Newsletter headline",
    "summary": "2-3 sentence summary",
    "bodyContent": "Newsletter body with key takeaways",
    "callToAction": {
      "text": "Read the Full Article",
      "url": "${input.blogUrl || '[BLOG_URL]'}"
    }
  },
  "videoScript": {
    "title": "Video title",
    "duration": "3-5 minutes",
    "hook": "Opening hook (first 5 seconds)",
    "intro": "Introduction",
    "mainPoints": [
      {
        "point": "Main point 1",
        "script": "What to say",
        "visualSuggestion": "What to show"
      }
    ],
    "conclusion": "Wrap up",
    "callToAction": "Subscribe and check out the blog"
  },
  "thread": {
    "platform": "twitter",
    "threadPosts": [
      { "number": 1, "content": "Thread opener", "characterCount": number },
      { "number": 2, "content": "Point 1", "characterCount": number }
    ],
    "totalPosts": number
  },
  "emailTeaser": "Short email teaser paragraph",
  "metaDescription": "SEO meta description under 160 chars",
  "excerpts": {
    "short": "50 word excerpt",
    "medium": "100 word excerpt",
    "long": "200 word excerpt"
  }
}`;

    const response = await llm.call({
      systemPrompt,
      userPrompt,
      temperature: 0.7,
      maxTokens: 4000
    });

    const result: RepurposeResult = JSON.parse(response);

    return {
      success: true,
      data: result
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Content repurposing failed'
    };
  }
}

/**
 * Generate just social posts
 */
export async function generateSocialPosts(
  title: string,
  content: string,
  blogUrl: string,
  provider?: LLMProvider
): Promise<AgentResult<SocialPost[]>> {
  const result = await runRepurposeAgent({
    title,
    content,
    targetKeyword: title,
    blogUrl,
    formats: ['social']
  }, provider);

  if (result.success && result.data) {
    return {
      success: true,
      data: result.data.socialPosts
    };
  }

  return {
    success: false,
    error: result.error
  };
}

/**
 * Generate newsletter content
 */
export async function generateNewsletter(
  title: string,
  content: string,
  blogUrl: string,
  provider?: LLMProvider
): Promise<AgentResult<NewsletterSection>> {
  const result = await runRepurposeAgent({
    title,
    content,
    targetKeyword: title,
    blogUrl,
    formats: ['newsletter']
  }, provider);

  if (result.success && result.data) {
    return {
      success: true,
      data: result.data.newsletter
    };
  }

  return {
    success: false,
    error: result.error
  };
}

/**
 * Generate Twitter/X thread
 */
export async function generateThread(
  title: string,
  content: string,
  platform: 'twitter' | 'linkedin' = 'twitter',
  provider?: LLMProvider
): Promise<AgentResult<ThreadContent>> {
  const result = await runRepurposeAgent({
    title,
    content,
    targetKeyword: title,
    formats: ['thread']
  }, provider);

  if (result.success && result.data) {
    return {
      success: true,
      data: { ...result.data.thread, platform }
    };
  }

  return {
    success: false,
    error: result.error
  };
}
