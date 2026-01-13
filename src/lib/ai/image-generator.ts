/**
 * AI Image Generation Service
 * DALL-E integration for generating relevant images for blog posts
 * PRD Epic 5: AI Pipeline - feat-039
 */

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

export interface ImageGenerationOptions {
  prompt: string;
  count?: number;
  size?: '1024x1024' | '1792x1024' | '1024x1792';
  quality?: 'standard' | 'hd';
  style?: 'vivid' | 'natural';
}

export interface GeneratedImage {
  url: string;
  revised_prompt?: string;
}

/**
 * Generate images using DALL-E 3
 */
export async function generateImages(
  options: ImageGenerationOptions
): Promise<GeneratedImage[]> {
  const {
    prompt,
    count = 1,
    size = '1024x1024',
    quality = 'standard',
    style = 'natural'
  } = options;

  try {
    // DALL-E 3 only supports n=1, so we'll generate one at a time
    const images: GeneratedImage[] = [];

    for (let i = 0; i < count; i++) {
      const response = await openai.images.generate({
        model: 'dall-e-3',
        prompt,
        n: 1,
        size,
        quality,
        style: i === 0 ? style : (style === 'vivid' ? 'natural' : 'vivid'), // Vary style for variety
      });

      if (response.data[0]) {
        images.push({
          url: response.data[0].url!,
          revised_prompt: response.data[0].revised_prompt,
        });
      }
    }

    return images;
  } catch (error: any) {
    console.error('Error generating images:', error);
    throw new Error(`Failed to generate images: ${error.message}`);
  }
}

/**
 * Create an optimized image generation prompt from blog post content
 */
export function createImagePromptFromPost(
  title: string,
  content: string,
  keywords?: string[]
): string {
  // Extract main topic from title
  const mainTopic = title.replace(/[^\w\s]/g, '').trim();

  // Get first paragraph or summary
  const contentPreview = content
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .split('\n')
    .filter(p => p.trim().length > 20)
    .slice(0, 2)
    .join(' ')
    .substring(0, 200);

  // Build prompt
  let prompt = `A professional, high-quality featured image for a blog post titled "${mainTopic}". `;

  // Add content context
  if (contentPreview) {
    prompt += `The blog post discusses: ${contentPreview}... `;
  }

  // Add keywords if available
  if (keywords && keywords.length > 0) {
    prompt += `Key themes: ${keywords.slice(0, 3).join(', ')}. `;
  }

  // Style guidelines
  prompt += 'Style: Clean, modern, professional. Avoid text or typography in the image. ';
  prompt += 'Composition: Suitable as a blog header or featured image.';

  return prompt;
}

/**
 * Generate multiple image variations with different styles
 */
export async function generateImageVariations(
  basePrompt: string,
  count: number = 3
): Promise<GeneratedImage[]> {
  const variations: GeneratedImage[] = [];

  // Generate with different styles
  const styles: Array<'vivid' | 'natural'> = ['vivid', 'natural'];
  const qualities: Array<'standard' | 'hd'> = count > 2 ? ['standard', 'hd', 'standard'] : ['standard', 'hd'];

  for (let i = 0; i < count; i++) {
    const style = styles[i % styles.length];
    const quality = qualities[i % qualities.length];

    try {
      const images = await generateImages({
        prompt: basePrompt,
        count: 1,
        style,
        quality,
      });

      if (images[0]) {
        variations.push(images[0]);
      }
    } catch (error) {
      console.error(`Failed to generate variation ${i + 1}:`, error);
    }
  }

  return variations;
}

/**
 * Download image from URL and return as buffer
 */
export async function downloadImage(url: string): Promise<Buffer> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error: any) {
    console.error('Error downloading image:', error);
    throw new Error(`Failed to download image: ${error.message}`);
  }
}
