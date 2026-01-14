import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { crawlWebsite } from '@/lib/agents/website-crawler';
import { runKeywordAnalysis, findKeywordGaps } from '@/lib/agents/keyword-analyzer';
import { scoreAllContent, scorePageContent, analyzeContentFreshness, FreshnessAnalysis } from '@/lib/agents/content-scorer';

export const maxDuration = 300;

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      action = 'full', // 'keywords' | 'score' | 'freshness' | 'full'
      websiteUrl,
      websiteId,
      pages, // Optional: pre-crawled pages
      industry,
      targetKeywords,
      competitorUrl,
      maxPages = 30
    } = body;

    // Get pages either from request or by crawling
    let pagesToAnalyze = pages;
    
    if (!pagesToAnalyze && websiteUrl) {
      console.log(`Crawling ${websiteUrl}...`);
      const crawlResult = await crawlWebsite(websiteUrl, { maxPages });
      
      if (!crawlResult.success || !crawlResult.data) {
        return NextResponse.json({ 
          success: false, 
          error: crawlResult.error || 'Crawl failed'
        }, { status: 500 });
      }
      
      pagesToAnalyze = crawlResult.data.pages;
    }

    if (!pagesToAnalyze || pagesToAnalyze.length === 0) {
      return NextResponse.json({ 
        error: 'No pages to analyze. Provide websiteUrl or pages array.' 
      }, { status: 400 });
    }

    // Keyword analysis only
    if (action === 'keywords') {
      const keywordResult = await runKeywordAnalysis({
        pages: pagesToAnalyze,
        industry: industry || 'General',
        targetKeywords
      });

      if (!keywordResult.success) {
        return NextResponse.json({ 
          success: false, 
          error: keywordResult.error 
        }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        action: 'keywords',
        analysis: keywordResult.data
      });
    }

    // Content scoring only
    if (action === 'score') {
      const scoreResult = await scoreAllContent({
        pages: pagesToAnalyze,
        targetKeyword: targetKeywords?.[0],
        industry
      });

      if (!scoreResult.success) {
        return NextResponse.json({ 
          success: false, 
          error: scoreResult.error 
        }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        action: 'score',
        scoring: scoreResult.data
      });
    }

    // Freshness analysis only
    if (action === 'freshness') {
      const freshnessResults: FreshnessAnalysis[] = pagesToAnalyze.map(analyzeContentFreshness);
      
      const staleCount = freshnessResults.filter((f: FreshnessAnalysis) => f.estimatedAge === 'stale').length;
      const agingCount = freshnessResults.filter((f: FreshnessAnalysis) => f.estimatedAge === 'aging').length;
      const freshCount = freshnessResults.filter((f: FreshnessAnalysis) => f.estimatedAge === 'fresh').length;

      return NextResponse.json({
        success: true,
        action: 'freshness',
        summary: {
          totalPages: freshnessResults.length,
          fresh: freshCount,
          recent: freshnessResults.filter((f: FreshnessAnalysis) => f.estimatedAge === 'recent').length,
          aging: agingCount,
          stale: staleCount,
          needsUpdate: staleCount + agingCount
        },
        highPriority: freshnessResults.filter((f: FreshnessAnalysis) => f.priority === 'high'),
        allResults: freshnessResults
      });
    }

    // Full analysis (default)
    if (action === 'full') {
      // Run all analyses in parallel
      const [keywordResult, scoreResult] = await Promise.all([
        runKeywordAnalysis({
          pages: pagesToAnalyze,
          industry: industry || 'General',
          targetKeywords
        }),
        scoreAllContent({
          pages: pagesToAnalyze,
          targetKeyword: targetKeywords?.[0],
          industry
        })
      ]);

      const freshnessResults: FreshnessAnalysis[] = pagesToAnalyze.map(analyzeContentFreshness);

      // Competitor analysis if URL provided
      let competitorGaps = null;
      if (competitorUrl) {
        const competitorCrawl = await crawlWebsite(competitorUrl, { maxPages: 20 });
        if (competitorCrawl.success && competitorCrawl.data) {
          const competitorKeywords = await runKeywordAnalysis({
            pages: competitorCrawl.data.pages,
            industry: industry || 'General'
          });

          if (competitorKeywords.success && keywordResult.success) {
            const allOurKeywords = [
              ...(keywordResult.data?.primaryKeywords || []),
              ...(keywordResult.data?.secondaryKeywords || [])
            ];
            const allCompetitorKeywords = [
              ...(competitorKeywords.data?.primaryKeywords || []),
              ...(competitorKeywords.data?.secondaryKeywords || [])
            ];

            const gapsResult = await findKeywordGaps(
              allOurKeywords,
              allCompetitorKeywords,
              industry || 'General'
            );

            if (gapsResult.success) {
              competitorGaps = gapsResult.data;
            }
          }
        }
      }

      // Save results to database if websiteId provided
      if (websiteId && keywordResult.data) {
        // Save top keywords as topic clusters
        for (const keyword of keywordResult.data.primaryKeywords.slice(0, 10)) {
          await supabase.from('topic_clusters').upsert({
            website_id: websiteId,
            name: keyword.keyword,
            primary_keyword: keyword.keyword,
            currently_covered: true,
            metadata: {
              frequency: keyword.frequency,
              density: keyword.density,
              pages: keyword.pages
            }
          }, {
            onConflict: 'website_id,primary_keyword'
          });
        }
      }

      return NextResponse.json({
        success: true,
        action: 'full',
        keywords: keywordResult.data,
        scoring: scoreResult.data,
        freshness: {
          summary: {
            totalPages: freshnessResults.length,
            fresh: freshnessResults.filter((f: FreshnessAnalysis) => f.estimatedAge === 'fresh').length,
            stale: freshnessResults.filter((f: FreshnessAnalysis) => f.estimatedAge === 'stale').length,
            needsUpdate: freshnessResults.filter((f: FreshnessAnalysis) => f.priority !== 'low').length
          },
          highPriority: freshnessResults.filter((f: FreshnessAnalysis) => f.priority === 'high')
        },
        competitorGaps
      });
    }

    return NextResponse.json({ 
      error: 'Invalid action. Use: keywords, score, freshness, or full' 
    }, { status: 400 });

  } catch (error: any) {
    console.error('Content analysis error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
