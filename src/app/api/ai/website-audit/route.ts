import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { crawlWebsite, fetchPage, extractBlogPages, extractTopics } from '@/lib/agents/website-crawler';
import { runContentGapAnalysis, quickContentAudit } from '@/lib/agents/content-gap-analysis';
import { runSEOAudit, generateSEORoadmap, calculatePageSEOScore } from '@/lib/agents/seo-audit';

export const maxDuration = 300; // 5 minutes for crawling

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      action = 'full', // 'crawl' | 'audit' | 'gaps' | 'full' | 'quick'
      websiteUrl,
      websiteId,
      industry,
      targetAudience,
      targetKeywords,
      maxPages = 50,
      saveResults = true
    } = body;

    if (!websiteUrl) {
      return NextResponse.json({ error: 'Website URL is required' }, { status: 400 });
    }

    // Crawl website
    console.log(`Starting crawl of ${websiteUrl}...`);
    const crawlResult = await crawlWebsite(websiteUrl, { maxPages });

    if (!crawlResult.success || !crawlResult.data) {
      return NextResponse.json({ 
        success: false, 
        error: crawlResult.error || 'Crawl failed'
      }, { status: 500 });
    }

    const crawlData = crawlResult.data;
    console.log(`Crawled ${crawlData.pagesCrawled} pages in ${crawlData.crawlDuration}ms`);

    // Quick audit only
    if (action === 'quick') {
      const quickAudit = quickContentAudit(crawlData.pages);
      return NextResponse.json({
        success: true,
        action: 'quick',
        crawl: {
          pagesFound: crawlData.pagesFound,
          pagesCrawled: crawlData.pagesCrawled,
          sitemapFound: crawlData.sitemapFound,
          duration: crawlData.crawlDuration
        },
        audit: quickAudit
      });
    }

    // Crawl only
    if (action === 'crawl') {
      const blogPages = extractBlogPages(crawlData.pages);
      const topics = extractTopics(crawlData.pages);

      return NextResponse.json({
        success: true,
        action: 'crawl',
        crawl: {
          baseUrl: crawlData.baseUrl,
          pagesFound: crawlData.pagesFound,
          pagesCrawled: crawlData.pagesCrawled,
          sitemapFound: crawlData.sitemapFound,
          robotsTxtFound: crawlData.robotsTxtFound,
          duration: crawlData.crawlDuration,
          errors: crawlData.errors.slice(0, 10)
        },
        pages: crawlData.pages.map(p => ({
          url: p.url,
          title: p.title,
          metaDescription: p.metaDescription,
          h1: p.h1,
          wordCount: p.wordCount,
          internalLinks: p.internalLinks.length,
          externalLinks: p.externalLinks.length
        })),
        blogPages: blogPages.length,
        topics: topics.slice(0, 50)
      });
    }

    // SEO audit only
    if (action === 'audit') {
      const auditResult = await runSEOAudit({
        crawlResult: crawlData,
        industry,
        targetKeywords
      });

      if (!auditResult.success) {
        return NextResponse.json({ 
          success: false, 
          error: auditResult.error 
        }, { status: 500 });
      }

      // Generate roadmap
      const roadmapResult = await generateSEORoadmap(auditResult.data!);

      // Save to database
      if (saveResults && websiteId) {
        await supabase.from('seo_audits').insert({
          website_id: websiteId,
          baseline_score: auditResult.data!.overallScore,
          pages_indexed: crawlData.pagesCrawled,
          audit_date: new Date().toISOString(),
          raw_metrics_json: {
            grades: auditResult.data!.grades,
            scores: auditResult.data!.scores,
            issues: auditResult.data!.issues,
            topPriorities: auditResult.data!.topPriorities
          }
        });
      }

      return NextResponse.json({
        success: true,
        action: 'audit',
        audit: auditResult.data,
        roadmap: roadmapResult.data
      });
    }

    // Content gap analysis only
    if (action === 'gaps') {
      const gapResult = await runContentGapAnalysis({
        crawlResult: crawlData,
        industry: industry || 'General',
        targetAudience: targetAudience || 'Business professionals'
      });

      if (!gapResult.success) {
        return NextResponse.json({ 
          success: false, 
          error: gapResult.error 
        }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        action: 'gaps',
        analysis: gapResult.data
      });
    }

    // Full analysis (default)
    if (action === 'full') {
      // Run both SEO audit and gap analysis
      const [auditResult, gapResult] = await Promise.all([
        runSEOAudit({
          crawlResult: crawlData,
          industry,
          targetKeywords
        }),
        runContentGapAnalysis({
          crawlResult: crawlData,
          industry: industry || 'General',
          targetAudience: targetAudience || 'Business professionals'
        })
      ]);

      // Generate roadmap
      let roadmap = null;
      if (auditResult.success && auditResult.data) {
        const roadmapResult = await generateSEORoadmap(auditResult.data);
        if (roadmapResult.success) {
          roadmap = roadmapResult.data;
        }
      }

      // Save to database
      if (saveResults && websiteId && auditResult.data) {
        await supabase.from('seo_audits').insert({
          website_id: websiteId,
          baseline_score: auditResult.data.overallScore,
          pages_indexed: crawlData.pagesCrawled,
          audit_date: new Date().toISOString(),
          raw_metrics_json: {
            grades: auditResult.data.grades,
            scores: auditResult.data.scores,
            issues: auditResult.data.issues,
            contentGaps: gapResult.data?.contentGaps?.slice(0, 10)
          }
        });

        // Save topic clusters from gaps
        if (gapResult.data?.suggestedContentPlan) {
          for (const plan of gapResult.data.suggestedContentPlan) {
            await supabase.from('topic_clusters').upsert({
              website_id: websiteId,
              name: plan.topic,
              estimated_traffic: plan.estimatedTrafficGain,
              currently_covered: false
            }, {
              onConflict: 'website_id,name'
            });
          }
        }
      }

      return NextResponse.json({
        success: true,
        action: 'full',
        crawl: {
          baseUrl: crawlData.baseUrl,
          pagesCrawled: crawlData.pagesCrawled,
          sitemapFound: crawlData.sitemapFound,
          duration: crawlData.crawlDuration
        },
        audit: auditResult.data,
        gaps: gapResult.data,
        roadmap
      });
    }

    return NextResponse.json({ 
      error: 'Invalid action. Use: crawl, audit, gaps, full, or quick' 
    }, { status: 400 });

  } catch (error: any) {
    console.error('Website audit error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
