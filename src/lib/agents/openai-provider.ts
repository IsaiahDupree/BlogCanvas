/**
 * OpenAI LLM Provider
 * Implements the LLMProvider interface using OpenAI's API
 */

import OpenAI from 'openai';
import { LLMProvider, LLMRequest } from './types';

let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is not set');
    }
    openaiClient = new OpenAI({ apiKey });
  }
  return openaiClient;
}

export interface OpenAIProviderOptions {
  model?: string;
  maxRetries?: number;
  timeout?: number;
}

/**
 * Create an OpenAI LLM Provider
 */
export function createOpenAIProvider(options: OpenAIProviderOptions = {}): LLMProvider {
  const model = options.model || 'gpt-4o-mini';
  const maxRetries = options.maxRetries || 3;

  return {
    name: `openai-${model}`,
    
    async call(request: LLMRequest): Promise<string> {
      const client = getOpenAIClient();
      
      let lastError: Error | null = null;
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];
          
          if (request.systemPrompt) {
            messages.push({ role: 'system', content: request.systemPrompt });
          }
          
          messages.push({ role: 'user', content: request.userPrompt });

          const response = await client.chat.completions.create({
            model,
            messages,
            temperature: request.temperature ?? 0.7,
            max_tokens: request.maxTokens ?? 4000,
            response_format: { type: 'json_object' },
          });

          const content = response.choices[0]?.message?.content;
          
          if (!content) {
            throw new Error('No content in OpenAI response');
          }

          return content;
        } catch (error: any) {
          lastError = error;
          
          // Don't retry on certain errors
          if (error.status === 401 || error.status === 403) {
            throw new Error(`OpenAI authentication error: ${error.message}`);
          }
          
          if (error.status === 429) {
            // Rate limited - wait before retry
            const waitTime = Math.pow(2, attempt) * 1000;
            await new Promise(resolve => setTimeout(resolve, waitTime));
            continue;
          }
          
          if (attempt === maxRetries) {
            throw error;
          }
          
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      }
      
      throw lastError || new Error('OpenAI call failed after retries');
    }
  };
}

/**
 * Create a high-quality provider for important content generation
 */
export function createPremiumProvider(): LLMProvider {
  return createOpenAIProvider({ model: 'gpt-4o' });
}

/**
 * Create a fast provider for quick tasks
 */
export function createFastProvider(): LLMProvider {
  return createOpenAIProvider({ model: 'gpt-4o-mini' });
}

/**
 * Default provider instance
 */
export const defaultProvider = createOpenAIProvider();
