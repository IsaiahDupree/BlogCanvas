import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { analyzeContentGaps } from '@/lib/analysis/gap-analyzer';
import { generateTopicClusters, prioritizeClusters } from '@/lib/analysis/topic-clusters';
import { scrapeWebsite, saveScrapedPages, calculateSEOScore } from '@/lib/scraper/website-scraper';
import { emitLog, emitProgress, emitComplete, emitError } from '../logs/[jobId]/route';

/**
 * Generate blog title suggestions from topic gaps
 */
function generateBlogSuggestionsFromGaps(gaps: any[]): any[] {
    const suggestions: any[] = [];
    const titleTemplates = [
        'Complete Guide to {keyword}',
        'How to Master {keyword} in 2024',
        '{keyword}: Everything You Need to Know',
        'The Ultimate {keyword} Guide for Beginners',
        '{keyword} Best Practices: Expert Tips',
        '10 Essential {keyword} Strategies',
        '{keyword} Explained: A Comprehensive Overview',
        'Getting Started with {keyword}',
        '{keyword} Tips and Tricks',
        'Advanced {keyword} Techniques'
    ];

    const angleTemplates = [
        'Educational approach: Teach readers the fundamentals and build their knowledge step-by-step',
        'Problem-solving angle: Address common pain points and provide actionable solutions',
        'Comparison perspective: Compare different approaches, tools, or methods',
        'Case study format: Share real-world examples and success stories',
        'Trend analysis: Explore current trends and future predictions'
    ];

    for (const gap of gaps) {
        const keyword = gap.keyword || gap.cluster.toLowerCase();
        const count = gap.recommendedCount || 3;
        
        for (let i = 0; i < Math.min(count, 5); i++) {
            const template = titleTemplates[i % titleTemplates.length];
            const title = template.replace('{keyword}', keyword);
            const angle = angleTemplates[i % angleTemplates.length];

            suggestions.push({
                id: `${gap.cluster}-${i}`,
                title,
                angle,
                targetKeyword: keyword,
                estimatedTraffic: Math.floor((gap.estimatedTraffic || 1000) / count),
                difficulty: gap.difficulty || 50,
                cluster: gap.cluster,
                priority: gap.priority
            });
        }
    }

    // Sort by priority and traffic potential
    return suggestions
        .sort((a, b) => {
            const priorityOrder = { high: 0, medium: 1, low: 2 };
            const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
            if (priorityDiff !== 0) return priorityDiff;
            return (b.estimatedTraffic / (b.difficulty + 1)) - (a.estimatedTraffic / (a.difficulty + 1));
        })
        .slice(0, 30); // Limit to top 30
}

// POST /api/workflow/gap-analysis - Run complete SEO gap analysis
export async function POST(request: NextRequest) {
    const jobId = crypto.randomUUID();
    
    try {
        const body = await request.json();
        const { input, inputType } = body;

        if (!input) {
            emitError(jobId, 'Input is required');
            return NextResponse.json(
                { success: false, error: 'Input is required', jobId },
                { status: 400 }
            );
        }

        // Log emitter function
        const logEmitter = (level: string, message: string, metadata?: any) => {
            emitLog(jobId, level, message, metadata);
        };

        emitLog(jobId, 'info', `Starting gap analysis for ${inputType === 'url' ? 'URL' : 'PRD'}`);

        let websiteId: string;
        let seoScore: number = 0;

        if (inputType === 'url') {
            emitLog(jobId, 'info', `Scraping website: ${input}`);
            emitProgress(jobId, { current: 0, total: 100, stage: 'scraping' });

            // Scrape website if URL provided
            const url = new URL(input);
            
            // Create or get website record
            const { data: website, error: websiteError } = await supabaseAdmin
                .from('websites')
                .upsert({
                    url: url.origin,
                    domain: url.hostname,
                    scrape_status: 'scraping'
                }, {
                    onConflict: 'url'
                })
                .select()
                .single();

            if (websiteError || !website) {
                emitError(jobId, 'Failed to create website record');
                return NextResponse.json(
                    { success: false, error: 'Failed to create website record', jobId },
                    { status: 500 }
                );
            }

            websiteId = website.id;

            // Scrape website with logging
            const scrapeResult = await scrapeWebsite(input, 50, jobId, (level, message, metadata) => {
                logEmitter(level, message, metadata);
            });
            
            emitProgress(jobId, { current: 50, total: 100, stage: 'saving' });
            
            if (scrapeResult.success) {
                await saveScrapedPages(websiteId, scrapeResult.pages);
                seoScore = calculateSEOScore(scrapeResult.pages);
                
                emitLog(jobId, 'success', `Calculated SEO score: ${seoScore}`);
                
                // Create SEO audit
                await supabaseAdmin
                    .from('seo_audits')
                    .insert({
                        website_id: websiteId,
                        baseline_score: seoScore,
                        pages_indexed: scrapeResult.totalPages,
                        audit_date: new Date().toISOString(),
                        raw_metrics: {
                            totalPages: scrapeResult.totalPages
                        }
                    });
            }
        } else {
            emitLog(jobId, 'info', 'Processing PRD input');
            emitProgress(jobId, { current: 20, total: 100, stage: 'parsing' });

            // Parse PRD - create a temporary website record
            const { data: website, error: websiteError } = await supabaseAdmin
                .from('websites')
                .insert({
                    url: 'prd-input',
                    domain: 'prd-input',
                    scrape_status: 'completed',
                    metadata: { prd: input }
                })
                .select()
                .single();

            if (websiteError || !website) {
                emitError(jobId, 'Failed to process PRD');
                return NextResponse.json(
                    { success: false, error: 'Failed to process PRD', jobId },
                    { status: 500 }
                );
            }

            websiteId = website.id;
            seoScore = 50; // Default score for PRD input
            emitLog(jobId, 'success', 'PRD processed successfully');
        }

        emitProgress(jobId, { current: 60, total: 100, stage: 'analyzing' });
        emitLog(jobId, 'info', 'Running content gap analysis...');

        // Run gap analysis
        const gaps = await analyzeContentGaps(websiteId);
        emitLog(jobId, 'success', `Found ${gaps.length} content gaps`);

        emitProgress(jobId, { current: 75, total: 100, stage: 'clustering' });
        emitLog(jobId, 'info', 'Generating topic clusters...');

        // Generate topic clusters
        const clusters = await generateTopicClusters(websiteId);
        const priorityClusters = prioritizeClusters(clusters);
        emitLog(jobId, 'success', `Generated ${priorityClusters.length} priority clusters from ${clusters.length} total clusters`);

        // Format topic gaps from priority clusters
        const topicGaps = priorityClusters.map(cluster => ({
            cluster: cluster.name,
            gap: `Missing coverage for "${cluster.primary_keyword}" - ${cluster.recommended_article_count} articles recommended`,
            priority: cluster.difficulty < 40 ? 'high' : cluster.difficulty < 60 ? 'medium' : 'low' as 'high' | 'medium' | 'low',
            keyword: cluster.primary_keyword,
            estimatedTraffic: cluster.estimated_traffic,
            difficulty: cluster.difficulty,
            recommendedCount: cluster.recommended_article_count
        }));

        // Add content gaps to topic gaps
        gaps.forEach(gap => {
            topicGaps.push({
                cluster: gap.title,
                gap: gap.description,
                priority: gap.severity,
                keyword: gap.keyword || gap.title.toLowerCase(),
                estimatedTraffic: gap.traffic_potential || 1000,
                difficulty: gap.difficulty || 50,
                recommendedCount: 3 // Default for content gaps
            });
        });

        // Generate blog suggestions from gaps
        emitProgress(jobId, { current: 90, total: 100, stage: 'generating-suggestions' });
        emitLog(jobId, 'info', 'Generating blog title suggestions...');
        
        const blogSuggestions = generateBlogSuggestionsFromGaps(topicGaps);
        emitLog(jobId, 'success', `Generated ${blogSuggestions.length} blog suggestions`);

        emitProgress(jobId, { current: 100, total: 100, stage: 'complete' });
        emitLog(jobId, 'success', 'Gap analysis complete!');
        emitComplete(jobId);

        const totalBlogs = priorityClusters.reduce((sum, c) => sum + c.recommended_article_count, 0) + 
                          gaps.length * 3; // Add default count for content gaps

        return NextResponse.json({
            success: true,
            jobId,
            seoScore,
            topicGaps,
            totalBlogs,
            suggestedBlogs: blogSuggestions,
            clusters: priorityClusters,
            gaps
        });

    } catch (error: any) {
        console.error('Error in gap analysis:', error);
        emitError(jobId, error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to run gap analysis', jobId },
            { status: 500 }
        );
    }
}

