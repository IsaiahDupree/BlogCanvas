/**
 * Website Crawler Agent
 * Crawls websites to extract content, pages, and SEO data for analysis
 */

import { LLMProvider, AgentResult } from './types';
import { createOpenAIProvider } from './openai-provider';

export interface PageData {
  url: string;
  title: string;
  metaDescription?: string;
  h1?: string;
  headings: { level: number; text: string }[];
  wordCount: number;
  contentPreview: string;
  internalLinks: string[];
  externalLinks: string[];
  images: { src: string; alt: string }[];
  lastModified?: string;
  canonicalUrl?: string;
  ogTags?: Record<string, string>;
}

export interface CrawlResult {
  baseUrl: string;
  pagesFound: number;
  pagesCrawled: number;
  pages: PageData[];
  sitemapFound: boolean;
  robotsTxtFound: boolean;
  errors: string[];
  crawlDuration: number;
}

export interface CrawlOptions {
  maxPages?: number;
  includeSubdomains?: boolean;
  respectRobotsTxt?: boolean;
  timeout?: number;
}

/**
 * Fetch and parse a single page
 */
export async function fetchPage(url: string): Promise<AgentResult<PageData>> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'BlogCanvas SEO Crawler/1.0',
        'Accept': 'text/html,application/xhtml+xml'
      }
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    const pageData = parseHTML(url, html);

    return {
      success: true,
      data: pageData
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to fetch page'
    };
  }
}

/**
 * Parse HTML content and extract SEO-relevant data
 */
function parseHTML(url: string, html: string): PageData {
  // Extract title
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : '';

  // Extract meta description
  const metaDescMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i) ||
                        html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["']/i);
  const metaDescription = metaDescMatch ? metaDescMatch[1].trim() : undefined;

  // Extract H1
  const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
  const h1 = h1Match ? h1Match[1].trim().replace(/<[^>]+>/g, '') : undefined;

  // Extract all headings
  const headings: { level: number; text: string }[] = [];
  const headingRegex = /<h([1-6])[^>]*>([^<]+)<\/h[1-6]>/gi;
  let headingMatch;
  while ((headingMatch = headingRegex.exec(html)) !== null) {
    headings.push({
      level: parseInt(headingMatch[1]),
      text: headingMatch[2].trim().replace(/<[^>]+>/g, '')
    });
  }

  // Extract body content for word count
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  const bodyContent = bodyMatch ? bodyMatch[1] : html;
  const textContent = bodyContent
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const wordCount = textContent.split(/\s+/).filter(w => w.length > 0).length;

  // Extract links
  const baseUrl = new URL(url);
  const internalLinks: string[] = [];
  const externalLinks: string[] = [];
  const linkRegex = /<a[^>]*href=["']([^"']+)["']/gi;
  let linkMatch;
  while ((linkMatch = linkRegex.exec(html)) !== null) {
    try {
      const linkUrl = new URL(linkMatch[1], url);
      if (linkUrl.hostname === baseUrl.hostname) {
        internalLinks.push(linkUrl.pathname);
      } else if (linkUrl.protocol.startsWith('http')) {
        externalLinks.push(linkUrl.href);
      }
    } catch {
      // Invalid URL, skip
    }
  }

  // Extract images
  const images: { src: string; alt: string }[] = [];
  const imgRegex = /<img[^>]*src=["']([^"']+)["'][^>]*alt=["']([^"']*)["']/gi;
  let imgMatch;
  while ((imgMatch = imgRegex.exec(html)) !== null) {
    images.push({ src: imgMatch[1], alt: imgMatch[2] });
  }

  // Extract canonical URL
  const canonicalMatch = html.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/i);
  const canonicalUrl = canonicalMatch ? canonicalMatch[1] : undefined;

  // Extract OG tags
  const ogTags: Record<string, string> = {};
  const ogRegex = /<meta[^>]*property=["']og:([^"']+)["'][^>]*content=["']([^"']+)["']/gi;
  let ogMatch;
  while ((ogMatch = ogRegex.exec(html)) !== null) {
    ogTags[ogMatch[1]] = ogMatch[2];
  }

  return {
    url,
    title,
    metaDescription,
    h1,
    headings,
    wordCount,
    contentPreview: textContent.substring(0, 500),
    internalLinks: [...new Set(internalLinks)],
    externalLinks: [...new Set(externalLinks)].slice(0, 20),
    images: images.slice(0, 20),
    canonicalUrl,
    ogTags: Object.keys(ogTags).length > 0 ? ogTags : undefined
  };
}

/**
 * Fetch sitemap.xml
 */
export async function fetchSitemap(baseUrl: string): Promise<string[]> {
  try {
    const sitemapUrl = new URL('/sitemap.xml', baseUrl).href;
    const response = await fetch(sitemapUrl, {
      headers: { 'User-Agent': 'BlogCanvas SEO Crawler/1.0' }
    });

    if (!response.ok) return [];

    const xml = await response.text();
    const urls: string[] = [];
    const locRegex = /<loc>([^<]+)<\/loc>/gi;
    let match;
    while ((match = locRegex.exec(xml)) !== null) {
      urls.push(match[1]);
    }

    return urls;
  } catch {
    return [];
  }
}

/**
 * Crawl a website starting from the homepage
 */
export async function crawlWebsite(
  baseUrl: string,
  options: CrawlOptions = {}
): Promise<AgentResult<CrawlResult>> {
  const startTime = Date.now();
  const maxPages = options.maxPages || 50;
  const visited = new Set<string>();
  const toVisit: string[] = [];
  const pages: PageData[] = [];
  const errors: string[] = [];

  try {
    // Normalize base URL
    const base = new URL(baseUrl);
    const normalizedBase = `${base.protocol}//${base.hostname}`;

    // Try to get sitemap first
    const sitemapUrls = await fetchSitemap(normalizedBase);
    const sitemapFound = sitemapUrls.length > 0;

    // Add sitemap URLs or start with homepage
    if (sitemapFound) {
      toVisit.push(...sitemapUrls.slice(0, maxPages));
    } else {
      toVisit.push(normalizedBase);
    }

    // Check robots.txt
    let robotsTxtFound = false;
    try {
      const robotsResponse = await fetch(`${normalizedBase}/robots.txt`);
      robotsTxtFound = robotsResponse.ok;
    } catch {
      // Ignore
    }

    // Crawl pages
    while (toVisit.length > 0 && pages.length < maxPages) {
      const url = toVisit.shift()!;
      
      // Skip if already visited
      const normalizedUrl = url.split('?')[0].split('#')[0];
      if (visited.has(normalizedUrl)) continue;
      visited.add(normalizedUrl);

      // Fetch page
      const result = await fetchPage(url);
      
      if (result.success && result.data) {
        pages.push(result.data);

        // Add internal links to queue
        if (!sitemapFound) {
          for (const link of result.data.internalLinks) {
            const fullUrl = new URL(link, normalizedBase).href;
            if (!visited.has(fullUrl.split('?')[0].split('#')[0])) {
              toVisit.push(fullUrl);
            }
          }
        }
      } else {
        errors.push(`${url}: ${result.error}`);
      }

      // Small delay to be polite
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    return {
      success: true,
      data: {
        baseUrl: normalizedBase,
        pagesFound: visited.size + toVisit.length,
        pagesCrawled: pages.length,
        pages,
        sitemapFound,
        robotsTxtFound,
        errors,
        crawlDuration: Date.now() - startTime
      }
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Crawl failed'
    };
  }
}

/**
 * Extract blog/content pages from crawl results
 */
export function extractBlogPages(pages: PageData[]): PageData[] {
  const blogPatterns = [
    /\/blog\//i,
    /\/article/i,
    /\/post/i,
    /\/news\//i,
    /\/insights\//i,
    /\/resources\//i,
    /\/learn\//i
  ];

  return pages.filter(page => 
    blogPatterns.some(pattern => pattern.test(page.url)) ||
    page.wordCount > 500
  );
}

/**
 * Get unique topics from page headings
 */
export function extractTopics(pages: PageData[]): string[] {
  const topics = new Set<string>();
  
  for (const page of pages) {
    if (page.h1) topics.add(page.h1);
    for (const heading of page.headings) {
      if (heading.level <= 2) {
        topics.add(heading.text);
      }
    }
  }

  return [...topics].filter(t => t.length > 3 && t.length < 100);
}
