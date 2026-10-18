/**
 * OpenAI Provider
 * Integration with OpenAI API for text and image generation
 */

import OpenAI from 'openai';

if (!process.env.OPENAI_API_KEY) {
    console.warn('⚠️ OPENAI_API_KEY not found in environment variables');
}

const openai = process.env.OPENAI_API_KEY
    ? new OpenAI({
          apiKey: process.env.OPENAI_API_KEY
      })
    : null;

export interface TextGenerationOptions {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    systemPrompt?: string;
    userPrompt: string;
}

export interface ImageGenerationOptions {
    prompt: string;
    size?: '256x256' | '512x512' | '1024x1024' | '1792x1024' | '1024x1792';
    quality?: 'standard' | 'hd';
    style?: 'vivid' | 'natural';
    n?: number;
}

/**
 * Generate text using OpenAI
 */
export async function generateText(options: TextGenerationOptions): Promise<string> {
    if (!openai) {
        throw new Error('OpenAI API key not configured');
    }

    try {
        const response = await openai.chat.completions.create({
            model: options.model || 'gpt-4o',
            messages: [
                ...(options.systemPrompt
                    ? [{ role: 'system' as const, content: options.systemPrompt }]
                    : []),
                { role: 'user' as const, content: options.userPrompt }
            ],
            temperature: options.temperature ?? 0.7,
            max_tokens: options.maxTokens ?? 2000
        });

        const content = response.choices[0]?.message?.content;
        if (!content) {
            throw new Error('No content generated from OpenAI');
        }

        return content;
    } catch (error: any) {
        console.error('OpenAI text generation error:', error);
        throw new Error(`OpenAI API error: ${error.message}`);
    }
}

/**
 * Generate image using OpenAI DALL-E
 */
export async function generateImage(
    options: ImageGenerationOptions
): Promise<string> {
    if (!openai) {
        throw new Error('OpenAI API key not configured');
    }

    try {
        const response = await openai.images.generate({
            model: 'dall-e-3',
            prompt: options.prompt,
            size: options.size || '1024x1024',
            quality: options.quality || 'standard',
            style: options.style || 'natural',
            n: options.n || 1
        });

        const imageUrl = response.data[0]?.url;
        if (!imageUrl) {
            throw new Error('No image URL returned from OpenAI');
        }

        return imageUrl;
    } catch (error: any) {
        console.error('OpenAI image generation error:', error);
        throw new Error(`OpenAI DALL-E error: ${error.message}`);
    }
}

/**
 * Check if OpenAI is configured
 */
export function isOpenAIConfigured(): boolean {
    return !!process.env.OPENAI_API_KEY && !!openai;
}

