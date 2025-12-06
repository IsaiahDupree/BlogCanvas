import * as cheerio from 'cheerio';
import { supabaseAdmin } from '@/lib/supabase';

export interface ScrapedPage {
    url: string;
    title: string | null;
    description: string | null;
    content: string | null;
    html: string | null;
    headings: {
        h1: string[];
        h2: string[];
        h3: string[];
    };
    images: {
        src: string;
        alt: string;
    }[];
    links: {
        href: string;
        text: string;
        isInternal: boolean;
    }[];
    wordCount: number;
    metadata: {
        ogTitle?: string;
        ogDescription?: string;
        keywords?: string;
        author?: string;
    };
}

export interface ScrapeResult {
    success: boolean;
    pages: ScrapedPage[];
    totalPages: number;
    errors: string[];
}

/**
 * Scrape a single URL and extract all relevant content
 */
export async function scrapePage(url: string, baseDomain: string): Promise<ScrapedPage | null> {
    try {
        // Fetch the page
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'BlogCanvas SEO Analyzer Bot/1.0'
            }
        });

        if (!response.ok) {
            console.error(`Failed to fetch ${url}: ${response.status}`);
            return null;
        }

        const html = await response.text();
        const $ = cheerio.load(html);

        // Remove script and style tags
        $('script, style, noscript').remove();

        // Extract title
        const title = $('title').text().trim() ||
            $('meta[property="og:title"]').attr('content') ||
            $('h1').first().text().trim() ||
            null;

        // Extract description
        const description = $('meta[name="description"]').attr('content') ||
            $('meta[property="og:description"]').attr('content') ||
            null;

        // Extract headings
        const headings = {
            h1: $('h1').map((_, el) => $(el).text().trim()).get(),
            h2: $('h2').map((_, el) => $(el).text().trim()).get(),
            h3: $('h3').map((_, el) => $(el).text().trim()).get()
        };

        // Extract main content (prefer article, main, or body)
        const contentSelectors = ['article', 'main', '[role="main"]', 'body'];
        let contentElement = null;
        for (const selector of contentSelectors) {
            contentElement = $(selector).first();
            if (contentElement.length > 0) break;
        }

        const content = contentElement ? contentElement.text()
            .replace(/\s+/g, ' ')
            .trim() : $('body').text().replace(/\s+/g, ' ').trim();

        // Extract images
        const images = $('img').map((_, el) => ({
            src: $(el).attr('src') || '',
            alt: $(el).attr('alt') || ''
        })).get().filter(img => img.src);

        // Extract links
        const links = $('a[href]').map((_, el) => {
            const href = $(el).attr('href') || '';
            const text = $(el).text().trim();
            const isInternal = href.startsWith('/') || href.includes(baseDomain);
            return { href, text, isInternal };
        }).get().filter(link => link.href);

        // Calculate word count
        const wordCount = content.split(/\s+/).filter(word => word.length > 0).length;

        // Extract metadata
        const metadata = {
            ogTitle: $('meta[property="og:title"]').attr('content'),
            ogDescription: $('meta[property="og:description"]').attr('content'),
            keywords: $('meta[name="keywords"]').attr('content'),
            author: $('meta[name="author"]').attr('content')
        };

        return {
            url,
            title,
            description,
            content,
            html,
            headings,
            images,
            links,
            wordCount,
            metadata
        };

    } catch (error) {
        console.error(`Error scraping ${url}:`, error);
        return null;
    }
}

/**
 * Scrape a website starting from the homepage
 * Crawls up to maxPages
 */
export async function scrapeWebsite(
    websiteUrl: string,
    maxPages: number = 50
): Promise<ScrapeResult> {
    const visited = new Set<string>();
    const toVisit = new Set([websiteUrl]);
    const pages: ScrapedPage[] = [];
    const errors: string[] = [];

    // Extract base domain for internal link detection
    const urlObj = new URL(websiteUrl);
    const baseDomain = urlObj.hostname;

    console.log(`Starting scrape of ${websiteUrl}, max ${maxPages} pages`);

    while (toVisit.size > 0 && visited.size < maxPages) {
        const url = Array.from(toVisit)[0];
        toVisit.delete(url);

        if (visited.has(url)) continue;
        visited.add(url);

        console.log(`Scraping page ${visited.size}/${maxPages}: ${url}`);

        const page = await scrapePage(url, baseDomain);

        if (page) {
            pages.push(page);

            // Add internal links to visit queue
            page.links
                .filter(link => link.isInternal && !visited.has(link.href))
                .forEach(link => {
                    try {
                        const fullUrl = new URL(link.href, url).href;
                        if (!visited.has(fullUrl)) {
                            toVisit.add(fullUrl);
                        }
                    } catch (e) {
                        // Invalid URL, skip
                    }
                });
        } else {
            errors.push(`Failed to scrape: ${url}`);
        }

        // Rate limiting: wait 500ms between requests
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log(`Scrape complete: ${pages.length} pages, ${errors.length} errors`);

    return {
        success: pages.length > 0,
        pages,
        totalPages: pages.length,
        errors
    };
}

/**
 * Save scraped pages to database
 */
export async function saveScrapedPages(
    websiteId: string,
    pages: ScrapedPage[]
): Promise<void> {
    for (const page of pages) {
        await supabaseAdmin
            .from('scraped_pages')
            .upsert({
                website_id: websiteId,
                url: page.url,
                title: page.title,
                description: page.description,
                content: page.content,
                html: page.html,
                headings: page.headings,
                images: page.images,
                links: page.links,
                word_count: page.wordCount,
                metadata: page.metadata,
                scraped_at: new Date().toISOString()
            }, {
                onConflict: 'url,website_id'
            });
    }
}

/**
 * Calculate baseline SEO score for a website
 * Composite score based on multiple factors
 */
export function calculateSEOScore(pages: ScrapedPage[]): number {
    if (pages.length === 0) return 0;

    let totalScore = 0;

    for (const page of pages) {
        let pageScore = 0;

        // Title optimization (0-15 points)
        if (page.title) {
            const titleLength = page.title.length;
            if (titleLength >= 30 && titleLength <= 60) {
                pageScore += 15;
            } else if (titleLength >= 20 && titleLength <= 70) {
                pageScore += 10;
            } else if (page.title.length > 0) {
                pageScore += 5;
            }
        }

        // Description optimization (0-15 points)
        if (page.description) {
            const descLength = page.description.length;
            if (descLength >= 120 && descLength <= 160) {
                pageScore += 15;
            } else if (descLength >= 100 && descLength <= 180) {
                pageScore += 10;
            } else if (descLength > 0) {
                pageScore += 5;
            }
        }

        // Heading structure (0-20 points)
        const hasH1 = page.headings.h1.length === 1; // Exactly one H1
        const hasH2s = page.headings.h2.length >= 2; // At least 2 H2s
        const hasH3s = page.headings.h3.length >= 1; // At least 1 H3

        if (hasH1 && hasH2s && hasH3s) {
            pageScore += 20;
        } else if (hasH1 && hasH2s) {
            pageScore += 15;
        } else if (hasH1) {
            pageScore += 10;
        }

        // Content depth (0-25 points)
        if (page.wordCount >= 1500) {
            pageScore += 25;
        } else if (page.wordCount >= 1000) {
            pageScore += 20;
        } else if (page.wordCount >= 500) {
            pageScore += 15;
        } else if (page.wordCount >= 300) {
            pageScore += 10;
        } else if (page.wordCount > 0) {
            pageScore += 5;
        }

        // Images with alt text (0-10 points)
        const imagesWithAlt = page.images.filter(img => img.alt).length;
        const imageScore = Math.min(10, (imagesWithAlt / Math.max(page.images.length, 1)) * 10);
        pageScore += imageScore;

        // Internal linking (0-15 points)
        const internalLinks = page.links.filter(l => l.isInternal).length;
        if (internalLinks >= 5) {
            pageScore += 15;
        } else if (internalLinks >= 3) {
            pageScore += 10;
        } else if (internalLinks >= 1) {
            pageScore += 5;
        }

        totalScore += pageScore;
    }

    // Average score across all pages
    const averageScore = totalScore / pages.length;

    // Return score out of 100
    return Math.round(averageScore);
}
