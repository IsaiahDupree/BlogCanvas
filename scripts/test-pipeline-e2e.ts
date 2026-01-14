/**
 * End-to-end pipeline test for isaiahdupree.com and techmestuff.com
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { crawlWebsite } from '../src/lib/agents/website-crawler';
import { runKeywordAnalysis } from '../src/lib/agents/keyword-analyzer';
import { runTopicClusterAgent } from '../src/lib/agents/topic-cluster';
import { runBlogGenerationPipeline } from '../src/lib/agents/blog-pipeline';

async function testPipeline(websiteUrl: string) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🚀 TESTING PIPELINE FOR: ${websiteUrl}`);
  console.log(`${'='.repeat(60)}\n`);

  const startTime = Date.now();

  // Step 1: Crawl Website
  console.log('📡 Step 1: Crawling website...');
  const crawlResult = await crawlWebsite(websiteUrl, { maxPages: 15 });
  
  if (!crawlResult.success || !crawlResult.data) {
    console.error('❌ Crawl failed:', crawlResult.error);
    return { success: false, error: crawlResult.error };
  }
  
  console.log(`✅ Crawled ${crawlResult.data.pagesCrawled} pages in ${crawlResult.data.crawlDuration}ms`);
  console.log(`   - Pages found: ${crawlResult.data.pagesFound}`);
  console.log(`   - Sitemap: ${crawlResult.data.sitemapFound ? 'Yes' : 'No'}`);

  // Step 2: Keyword Analysis
  console.log('\n🔍 Step 2: Analyzing keywords...');
  const keywordResult = await runKeywordAnalysis({
    pages: crawlResult.data.pages,
    industry: 'Technology'
  });

  if (!keywordResult.success) {
    console.error('❌ Keyword analysis failed:', keywordResult.error);
    return { success: false, error: keywordResult.error };
  }

  console.log(`✅ Found ${keywordResult.data?.primaryKeywords?.length || 0} primary keywords`);
  if (keywordResult.data?.primaryKeywords?.slice(0, 5)) {
    console.log('   Top keywords:', keywordResult.data.primaryKeywords.slice(0, 5).map(k => k.keyword).join(', '));
  }

  // Step 3: Topic Clusters
  console.log('\n🎯 Step 3: Generating topic clusters...');
  const topicResult = await runTopicClusterAgent({
    websiteUrl,
    industry: 'Technology',
    niche: 'Web Development & Software',
    targetAudience: 'Developers and tech enthusiasts',
    currentTopics: keywordResult.data?.primaryKeywords?.slice(0, 5).map(k => k.keyword) || [],
    businessGoals: ['Increase organic traffic', 'Establish thought leadership']
  });

  if (!topicResult.success) {
    console.error('❌ Topic generation failed:', topicResult.error);
    return { success: false, error: topicResult.error };
  }

  console.log(`✅ Generated ${topicResult.data?.clusters?.length || 0} topic clusters`);
  console.log(`   - Total articles needed: ${topicResult.data?.totalArticlesNeeded || 0}`);
  console.log(`   - Estimated traffic gain: ${topicResult.data?.estimatedTrafficGain || 0}`);
  
  if (topicResult.data?.clusters?.slice(0, 3)) {
    console.log('\n   📚 Top 3 Topic Clusters:');
    topicResult.data.clusters.slice(0, 3).forEach((cluster, i) => {
      console.log(`   ${i + 1}. ${cluster.name} (${cluster.primaryKeyword})`);
    });
  }

  // Step 4: Generate ONE blog post (as a test)
  const firstTopic = topicResult.data?.prioritizedTopics?.[0] || topicResult.data?.clusters?.[0]?.suggestedArticles?.[0];
  
  if (firstTopic) {
    console.log('\n✍️ Step 4: Generating sample blog post...');
    console.log(`   Topic: ${firstTopic.title || firstTopic.targetKeyword}`);
    
    const blogResult = await runBlogGenerationPipeline({
      topic: firstTopic.title || firstTopic.targetKeyword || 'Technology Guide',
      targetKeyword: firstTopic.targetKeyword || 'technology',
      wordCountGoal: 800, // Shorter for test
      clientProfile: {
        productServiceSummary: 'Technology and web development',
        targetAudience: 'Developers and tech enthusiasts'
      },
      options: {
        skipFactCheck: true, // Speed up test
        skipEnhancement: true
      }
    });

    if (!blogResult.success) {
      console.error('❌ Blog generation failed:', blogResult.error);
    } else {
      console.log(`✅ Blog generated: "${blogResult.blogPost?.title}"`);
      console.log(`   - Word count: ${blogResult.blogPost?.wordCount}`);
      console.log(`   - SEO score: ${blogResult.blogPost?.seoScore}`);
    }
  }

  const totalTime = Date.now() - startTime;
  console.log(`\n⏱️ Total pipeline time: ${(totalTime / 1000).toFixed(1)}s`);

  return {
    success: true,
    crawl: crawlResult.data,
    keywords: keywordResult.data,
    topics: topicResult.data,
    totalTime
  };
}

async function main() {
  console.log('🔬 BlogCanvas Pipeline E2E Test');
  console.log('================================\n');

  const websites = [
    'https://isaiahdupree.com',
    'https://techmestuff.com'
  ];

  const results: Record<string, any> = {};

  for (const url of websites) {
    try {
      results[url] = await testPipeline(url);
    } catch (error: any) {
      console.error(`\n❌ Error testing ${url}:`, error.message);
      results[url] = { success: false, error: error.message };
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 SUMMARY');
  console.log('='.repeat(60));
  
  for (const [url, result] of Object.entries(results)) {
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${url}: ${result.success ? 'Success' : result.error}`);
    if (result.success) {
      console.log(`   Pages: ${result.crawl?.pagesCrawled}, Topics: ${result.topics?.clusters?.length || 0}`);
    }
  }
}

main().catch(console.error);
