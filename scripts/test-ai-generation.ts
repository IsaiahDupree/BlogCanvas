#!/usr/bin/env npx tsx
/**
 * AI Blog Generation Test Suite
 * Tests OpenAI integration and blog generation pipeline
 * Run with: npx tsx scripts/test-ai-generation.ts
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import OpenAI from 'openai';

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  duration: number;
}

const results: TestResult[] = [];

async function runTest(name: string, fn: () => Promise<void>): Promise<void> {
  const start = Date.now();
  try {
    await fn();
    results.push({ name, passed: true, message: '', duration: Date.now() - start });
    console.log(`  ✅ ${name} (${Date.now() - start}ms)`);
  } catch (error: any) {
    results.push({ name, passed: false, message: error.message, duration: Date.now() - start });
    console.log(`  ❌ ${name}: ${error.message}`);
  }
}

async function main() {
  console.log('\n🤖 AI Blog Generation Test Suite\n');

  // Check environment
  console.log('📋 Checking Environment...');
  const apiKey = process.env.OPENAI_API_KEY;
  
  await runTest('OPENAI_API_KEY is set', async () => {
    if (!apiKey) throw new Error('Missing OPENAI_API_KEY in .env.local');
  });

  await runTest('OPENAI_API_KEY format is valid', async () => {
    if (!apiKey?.startsWith('sk-')) throw new Error('API key should start with sk-');
  });

  if (!apiKey) {
    console.log('\n❌ Cannot continue without OpenAI API key\n');
    process.exit(1);
  }

  // Initialize OpenAI client
  const openai = new OpenAI({ apiKey });

  // Test OpenAI connection
  console.log('\n🔌 Testing OpenAI Connection...');
  
  await runTest('OpenAI API is reachable', async () => {
    const models = await openai.models.list();
    if (!models.data.length) throw new Error('No models returned');
  });

  await runTest('GPT-4 model is available', async () => {
    const models = await openai.models.list();
    const hasGPT4 = models.data.some(m => m.id.includes('gpt-4'));
    if (!hasGPT4) throw new Error('GPT-4 model not found');
  });

  // Test simple completion
  console.log('\n📝 Testing Text Generation...');

  await runTest('Simple completion works', async () => {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: 'Say "test passed" in exactly two words.' }],
      max_tokens: 10,
    });
    
    if (!response.choices[0]?.message?.content) {
      throw new Error('No response content');
    }
  });

  // Test blog outline generation
  console.log('\n📑 Testing Blog Outline Generation...');

  await runTest('Generate blog outline', async () => {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a content strategist. Generate a brief blog outline in JSON format with title and 3 sections.'
        },
        {
          role: 'user',
          content: 'Create an outline for a blog post about "Benefits of AI in Content Marketing"'
        }
      ],
      response_format: { type: 'json_object' },
      max_tokens: 500,
    });
    
    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('No outline generated');
    
    const outline = JSON.parse(content);
    if (!outline.title && !outline.sections) {
      throw new Error('Invalid outline format');
    }
  });

  // Test blog content generation
  console.log('\n✍️  Testing Blog Content Generation...');

  await runTest('Generate blog paragraph', async () => {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert blog writer. Write engaging, SEO-optimized content.'
        },
        {
          role: 'user',
          content: 'Write a single paragraph (50-100 words) introducing the topic of AI in content marketing.'
        }
      ],
      max_tokens: 200,
    });
    
    const content = response.choices[0]?.message?.content;
    if (!content || content.length < 50) {
      throw new Error('Paragraph too short or empty');
    }
  });

  // Test SEO optimization
  console.log('\n🔍 Testing SEO Analysis...');

  await runTest('Generate SEO suggestions', async () => {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an SEO expert. Analyze content and provide SEO suggestions in JSON format.'
        },
        {
          role: 'user',
          content: `Analyze this title for SEO: "Why AI Content Marketing is Important"
          
          Return JSON with: { keywords: string[], score: number, suggestions: string[] }`
        }
      ],
      response_format: { type: 'json_object' },
      max_tokens: 300,
    });
    
    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('No SEO analysis generated');
    
    const analysis = JSON.parse(content);
    if (!analysis.keywords || !analysis.suggestions) {
      throw new Error('Invalid SEO analysis format');
    }
  });

  // Summary
  console.log('\n' + '='.repeat(50));
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const totalTime = results.reduce((sum, r) => sum + r.duration, 0);

  console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);
  console.log(`⏱️  Total time: ${totalTime}ms\n`);

  if (failed > 0) {
    console.log('❌ Failed tests:');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`   - ${r.name}: ${r.message}`);
    });
    process.exit(1);
  } else {
    console.log('✅ All AI generation tests passed!\n');
    console.log('📝 Your OpenAI integration is working correctly.');
    console.log('   You can now generate blog posts using the AI pipeline.\n');
    process.exit(0);
  }
}

main().catch(console.error);
