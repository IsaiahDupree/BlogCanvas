import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { scrapeWebsite, saveScrapedPages, calculateSEOScore } from '@/lib/scraper/website-scraper';

// POST /api/websites/scrape - Start website scrape
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { url, clientId, maxPages = 50 } = body;

        if (!url) {
            return NextResponse.json(
                { success: false, error: 'URL is required' },
                { status: 400 }
            );
        }

        // Validate URL
        let websiteUrl: URL;
        try {
            websiteUrl = new URL(url);
        } catch (e) {
            return NextResponse.json(
                { success: false, error: 'Invalid URL format' },
                { status: 400 }
            );
        }

        // Create or update website record
        const { data: website, error: websiteError } = await supabaseAdmin
            .from('websites')
            .upsert({
                url: websiteUrl.origin,
                domain: websiteUrl.hostname,
                scrape_status: 'scraping',
                last_scraped_at: new Date().toISOString()
            }, {
                onConflict: 'url'
            })
            .select()
            .single();

        if (websiteError) {
            return NextResponse.json(
                { success: false, error: 'Failed to create website record' },
                { status: 500 }
            );
        }

        // Start scraping (this should be a background job in production)
        const scrapeResult = await scrapeWebsite(url, maxPages);

        if (!scrapeResult.success) {
            // Update website status to failed
            await supabaseAdmin
                .from('websites')
                .update({
                    scrape_status: 'failed',
                    metadata: { errors: scrapeResult.errors }
                })
                .eq('id', website.id);

            return NextResponse.json({
                success: false,
                error: 'Scraping failed',
                errors: scrapeResult.errors
            }, { status: 500 });
        }

        // Save scraped pages to database
        await saveScrapedPages(website.id, scrapeResult.pages);

        // Calculate baseline SEO score
        const seoScore = calculateSEOScore(scrapeResult.pages);

        // Create SEO audit record
        await supabaseAdmin
            .from('seo_audits')
            .insert({
                website_id: website.id,
                baseline_score: seoScore,
                pages_indexed: scrapeResult.totalPages,
                audit_date: new Date().toISOString(),
                raw_metrics: {
                    totalPages: scrapeResult.totalPages,
                    errors: scrapeResult.errors
                }
            });

        // Update website record
        await supabaseAdmin
            .from('websites')
            .update({
                scrape_status: 'completed',
                pages_scraped: scrapeResult.totalPages,
                total_pages_found: scrapeResult.totalPages,
                title: scrapeResult.pages[0]?.title,
                description: scrapeResult.pages[0]?.description
            })
            .eq('id', website.id);

        return NextResponse.json({
            success: true,
            website: {
                id: website.id,
                url: website.url,
                domain: website.domain
            },
            audit: {
                seoScore,
                pagesScraped: scrapeResult.totalPages,
                errors: scrapeResult.errors
            }
        });

    } catch (error) {
        console.error('Error in website scrape:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
