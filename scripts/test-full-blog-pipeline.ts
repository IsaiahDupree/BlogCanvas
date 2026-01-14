#!/usr/bin/env npx tsx
/**
 * Full Blog Generation Pipeline Test
 * Tests the complete AI blog generation pipeline end-to-end
 * Run with: npx tsx scripts/test-full-blog-pipeline.ts
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

import { runBlogGenerationPipeline, BlogGenerationInput, PipelineProgress } from '../src/lib/agents/blog-pipeline';

async function main() {
  console.log('\n🚀 Full Blog Generation Pipeline Test\n');
  console.log('=' .repeat(60));

  // Check environment
  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY not set in .env.local');
    process.exit(1);
  }
  console.log('✅ OpenAI API key configured\n');

  // Define test input
  const testInput: BlogGenerationInput = {
    topic: 'How AI is Transforming Content Marketing in 2026',
    targetKeyword: 'AI content marketing',
    wordCountGoal: 1500,
    clientProfile: {
      productServiceSummary: 'Digital marketing agency specializing in SEO and content strategy',
      targetAudience: 'Marketing managers and business owners looking to scale their content',
      brandVoice: ['Professional', 'Innovative', 'Helpful'],
      brandTone: 'Authoritative yet approachable'
    },
    options: {
      generateMultipleOutlines: false,
      skipFactCheck: false,
      skipEnhancement: false,
      usePremiumModel: false // Use gpt-4o-mini for speed
    }
  };

  console.log('📝 Test Configuration:');
  console.log(`   Topic: ${testInput.topic}`);
  console.log(`   Keyword: ${testInput.targetKeyword}`);
  console.log(`   Word Goal: ${testInput.wordCountGoal}`);
  console.log(`   Model: ${testInput.options?.usePremiumModel ? 'GPT-4o (Premium)' : 'GPT-4o-mini (Fast)'}`);
  console.log('');

  // Progress callback
  const onProgress = (progress: PipelineProgress) => {
    const bar = '█'.repeat(Math.floor(progress.percentComplete / 5)) + 
                '░'.repeat(20 - Math.floor(progress.percentComplete / 5));
    console.log(`   [${bar}] ${progress.percentComplete}% - ${progress.currentStep}`);
  };

  console.log('🔄 Running Pipeline...\n');
  const startTime = Date.now();

  try {
    const result = await runBlogGenerationPipeline(testInput, onProgress);

    console.log('\n' + '=' .repeat(60));

    if (!result.success) {
      console.log('\n❌ Pipeline Failed');
      console.log(`   Error: ${result.error}`);
      console.log('\n   Step Results:');
      result.steps.forEach(step => {
        const icon = step.status === 'completed' ? '✅' : step.status === 'failed' ? '❌' : '⏳';
        const duration = step.endTime && step.startTime ? `(${step.endTime - step.startTime}ms)` : '';
        console.log(`   ${icon} ${step.name} ${duration}`);
      });
      process.exit(1);
    }

    console.log('\n✅ Pipeline Completed Successfully!\n');

    // Step Results
    console.log('📊 Step Results:');
    result.steps.forEach(step => {
      const duration = step.endTime && step.startTime ? step.endTime - step.startTime : 0;
      console.log(`   ✅ ${step.name}: ${duration}ms`);
    });

    // Blog Post Summary
    if (result.blogPost) {
      console.log('\n📄 Generated Blog Post:');
      console.log(`   Title: ${result.blogPost.title}`);
      console.log(`   Slug: ${result.blogPost.slug}`);
      console.log(`   Word Count: ${result.blogPost.wordCount}`);
      console.log(`   SEO Score: ${result.blogPost.seoScore}/100`);
      console.log(`   Fact-Check Score: ${result.blogPost.factCheckScore}/100`);
      console.log(`   Enhancement Score: ${result.blogPost.enhancementScore}/100`);
    }

    // Research Insights
    if (result.research) {
      console.log('\n🔍 Research Insights:');
      console.log(`   Pain Points: ${result.research.painPoints?.length || 0}`);
      console.log(`   Key Facts: ${result.research.keyFacts?.length || 0}`);
      console.log(`   Suggested Angles: ${result.research.suggestedAngles?.length || 0}`);
    }

    // Outline Details
    if (result.outline) {
      console.log('\n📑 Outline:');
      console.log(`   Sections: ${result.outline.sections.length}`);
      console.log(`   Estimated Words: ${result.outline.totalEstimatedWords}`);
      result.outline.sections.forEach((section, i) => {
        console.log(`   ${i + 1}. ${section.title} (${section.type}, ~${section.estimatedWords} words)`);
      });
    }

    // SEO Metadata
    if (result.seoMetadata) {
      console.log('\n🔎 SEO Metadata:');
      console.log(`   Title: ${result.seoMetadata.title}`);
      console.log(`   Meta Description: ${result.seoMetadata.metaDescription?.substring(0, 100)}...`);
      console.log(`   Keyword Density: ${result.seoMetadata.keywordDensity}%`);
      console.log(`   Readability: ${result.seoMetadata.readabilityScore}`);
    }

    // Fact Check Results
    if (result.factCheck) {
      console.log('\n✓ Fact Check:');
      console.log(`   Score: ${result.factCheck.factCheckScore}/100`);
      console.log(`   Total Claims: ${result.factCheck.totalClaims}`);
      console.log(`   Verified: ${result.factCheck.verifiedClaims}`);
      console.log(`   Needs Attention: ${result.factCheck.unverifiedClaims}`);
      console.log(`   Passed: ${result.factCheck.passed ? 'Yes' : 'No'}`);
    }

    // Enhancements
    if (result.enhancements) {
      console.log('\n✨ Enhancements:');
      console.log(`   Score: ${result.enhancements.overallScore}/100`);
      console.log(`   Tables Suggested: ${result.enhancements.tables?.length || 0}`);
      console.log(`   Images Suggested: ${result.enhancements.images?.length || 0}`);
      console.log(`   Bullet Lists: ${result.enhancements.bulletLists?.length || 0}`);
    }

    // Voice & Tone
    if (result.voiceTone) {
      console.log('\n🎤 Voice & Tone:');
      console.log(`   Alignment Score: ${result.voiceTone.alignmentScore}/100`);
      console.log(`   Issues Found: ${result.voiceTone.issues?.length || 0}`);
      console.log(`   Passed: ${result.voiceTone.passed ? 'Yes' : 'No'}`);
    }

    // Performance
    console.log('\n⏱️  Performance:');
    console.log(`   Total Duration: ${(result.totalDuration / 1000).toFixed(2)} seconds`);
    console.log(`   Average Per Step: ${(result.totalDuration / result.steps.length / 1000).toFixed(2)} seconds`);

    // Content Preview
    if (result.blogPost?.content) {
      console.log('\n📖 Content Preview (first 500 chars):');
      console.log('   ' + '-'.repeat(56));
      const preview = result.blogPost.content.substring(0, 500).split('\n').map(l => '   ' + l).join('\n');
      console.log(preview);
      console.log('   ...');
      console.log('   ' + '-'.repeat(56));
    }

    console.log('\n✅ Full blog generation pipeline test PASSED!\n');
    console.log(`Total test time: ${((Date.now() - startTime) / 1000).toFixed(2)} seconds\n`);

  } catch (error: any) {
    console.error('\n❌ Test Failed with Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main().catch(console.error);
