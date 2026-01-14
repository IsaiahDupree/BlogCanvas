/**
 * Image Generator Agent
 * Creates AI image prompts and integrates with DALL-E for blog imagery
 */

import OpenAI from 'openai';
import { LLMProvider, AgentResult } from './types';
import { createOpenAIProvider } from './openai-provider';

export interface ImagePrompt {
  prompt: string;
  negativePrompt?: string;
  style: 'photorealistic' | 'illustration' | 'minimalist' | 'infographic' | 'abstract' | 'professional';
  aspectRatio: '16:9' | '1:1' | '4:3' | '3:2';
  placement: 'hero' | 'inline' | 'thumbnail' | 'social';
  altText: string;
  caption?: string;
}

export interface ImageGenerationResult {
  prompts: ImagePrompt[];
  heroImage: ImagePrompt;
  socialImage: ImagePrompt;
  inlineImages: ImagePrompt[];
  stockPhotoKeywords: string[];
  colorPalette: string[];
}

export interface ImageInput {
  topic: string;
  contentSummary: string;
  brandColors?: string[];
  imageStyle?: string;
  targetAudience?: string;
  imageCount?: number;
}

/**
 * Generate image prompts for blog content
 */
export async function runImagePromptAgent(
  input: ImageInput,
  provider?: LLMProvider
): Promise<AgentResult<ImageGenerationResult>> {
  const llm = provider || createOpenAIProvider();

  try {
    const imageCount = input.imageCount || 5;

    const systemPrompt = `You are an expert visual content strategist. Create detailed, professional image prompts for AI image generation that complement blog content.`;

    const userPrompt = `Generate ${imageCount} image prompts for this blog post:

TOPIC: ${input.topic}
CONTENT SUMMARY: ${input.contentSummary}
BRAND COLORS: ${input.brandColors?.join(', ') || 'Professional blue, white, gray'}
PREFERRED STYLE: ${input.imageStyle || 'Professional, modern'}
TARGET AUDIENCE: ${input.targetAudience || 'Business professionals'}

Create image prompts for:
1. Hero/featured image (16:9, eye-catching)
2. Social media share image (1:1)
3. 2-3 inline content images

Return JSON:
{
  "prompts": [
    {
      "prompt": "Detailed DALL-E prompt description, include style, lighting, composition",
      "negativePrompt": "things to avoid",
      "style": "photorealistic" | "illustration" | "minimalist" | "infographic" | "abstract" | "professional",
      "aspectRatio": "16:9" | "1:1" | "4:3" | "3:2",
      "placement": "hero" | "inline" | "thumbnail" | "social",
      "altText": "SEO-optimized alt text",
      "caption": "optional caption"
    }
  ],
  "heroImage": {first hero prompt},
  "socialImage": {social media prompt},
  "inlineImages": [inline prompts],
  "stockPhotoKeywords": ["keyword1", "keyword2"],
  "colorPalette": ["#hex1", "#hex2"]
}

PROMPT REQUIREMENTS:
- Be specific about composition, lighting, and mood
- Include style keywords (4k, professional, clean, modern)
- Avoid text/words in images
- Make prompts suitable for professional business content`;

    const response = await llm.call({
      systemPrompt,
      userPrompt,
      temperature: 0.7,
      maxTokens: 2000
    });

    const result: ImageGenerationResult = JSON.parse(response);

    return {
      success: true,
      data: result
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Image prompt generation failed'
    };
  }
}

/**
 * Generate actual images using DALL-E
 */
export interface GeneratedImage {
  url: string;
  prompt: string;
  revisedPrompt?: string;
  size: string;
  placement: string;
}

export async function generateImageWithDALLE(
  prompt: string,
  size: '1024x1024' | '1792x1024' | '1024x1792' = '1792x1024',
  quality: 'standard' | 'hd' = 'standard'
): Promise<AgentResult<GeneratedImage>> {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    const openai = new OpenAI({ apiKey });

    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt,
      n: 1,
      size,
      quality,
      response_format: 'url'
    });

    const imageData = response.data?.[0];
    const imageUrl = imageData?.url;
    const revisedPrompt = imageData?.revised_prompt;

    if (!imageUrl) {
      throw new Error('No image URL returned');
    }

    return {
      success: true,
      data: {
        url: imageUrl,
        prompt,
        revisedPrompt,
        size,
        placement: size === '1024x1024' ? 'social' : 'hero'
      }
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Image generation failed'
    };
  }
}

/**
 * Generate multiple images for a blog post
 */
export async function generateBlogImages(
  topic: string,
  contentSummary: string,
  options: {
    generateHero?: boolean;
    generateSocial?: boolean;
    inlineCount?: number;
    quality?: 'standard' | 'hd';
  } = {}
): Promise<AgentResult<GeneratedImage[]>> {
  try {
    // First generate prompts
    const promptResult = await runImagePromptAgent({
      topic,
      contentSummary,
      imageCount: (options.inlineCount || 0) + (options.generateHero ? 1 : 0) + (options.generateSocial ? 1 : 0)
    });

    if (!promptResult.success || !promptResult.data) {
      throw new Error(promptResult.error || 'Failed to generate prompts');
    }

    const images: GeneratedImage[] = [];

    // Generate hero image
    if (options.generateHero && promptResult.data.heroImage) {
      const heroResult = await generateImageWithDALLE(
        promptResult.data.heroImage.prompt,
        '1792x1024',
        options.quality || 'standard'
      );
      if (heroResult.success && heroResult.data) {
        images.push({ ...heroResult.data, placement: 'hero' });
      }
    }

    // Generate social image
    if (options.generateSocial && promptResult.data.socialImage) {
      const socialResult = await generateImageWithDALLE(
        promptResult.data.socialImage.prompt,
        '1024x1024',
        options.quality || 'standard'
      );
      if (socialResult.success && socialResult.data) {
        images.push({ ...socialResult.data, placement: 'social' });
      }
    }

    // Generate inline images
    if (options.inlineCount && promptResult.data.inlineImages) {
      for (let i = 0; i < Math.min(options.inlineCount, promptResult.data.inlineImages.length); i++) {
        const inlineResult = await generateImageWithDALLE(
          promptResult.data.inlineImages[i].prompt,
          '1792x1024',
          options.quality || 'standard'
        );
        if (inlineResult.success && inlineResult.data) {
          images.push({ ...inlineResult.data, placement: 'inline' });
        }
      }
    }

    return {
      success: true,
      data: images
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
}
