/**
 * Website Scanner Service
 * =======================
 * Uses Puppeteer/Browserbase to scan websites and extract:
 * - Text content (headings, paragraphs, word counts)
 * - Schema markup (JSON-LD, microdata)
 * - Images (src, alt, dimensions, context)
 * - SEO elements (meta tags, headers, links)
 */

import puppeteer, { Browser, Page } from 'puppeteer';
import * as cheerio from 'cheerio';

export interface ScanConfig {
  url: string;
  maxPages?: number;
  maxDepth?: number;
  scanType?: 'full' | 'text_only' | 'schema_only' | 'images_only';
  browserbaseApiKey?: string;
}

export interface PageContent {
  url: string;
  title: string;
  headings: { level: string; text: string }[];
  paragraphs: string[];
  wordCount: number;
}

export interface SchemaMarkup {
  url: string;
  type: string;
  data: Record<string, unknown>;
}

export interface ImageData {
  url: string;
  src: string;
  alt: string;
  width?: number;
  height?: number;
  context?: string;
}

export interface SiteMetadata {
  title?: string;
  description?: string;
  keywords?: string;
  ogTags?: Record<string, string>;
  twitterCards?: Record<string, string>;
}

export interface ScanResult {
  pagesScanned: number;
  textContent: PageContent[];
  schemaMarkup: SchemaMarkup[];
  images: ImageData[];
  siteMetadata: SiteMetadata;
  internalLinks: string[];
  externalLinks: string[];
  contentAnalysis: {
    totalWords: number;
    avgWordCount: number;
    topics: string[];
  };
  seoElements: {
    metaDescriptions: { url: string; content: string }[];
    h1Tags: { url: string; content: string }[];
    h2Tags: { url: string; content: string }[];
    altTexts: { url: string; src: string; alt: string }[];
  };
  errors: { url: string; error: string; timestamp: string }[];
}

export class WebsiteScanner {
  private browser: Browser | null = null;
  private visitedUrls: Set<string> = new Set();
  private config: ScanConfig;
  private result: ScanResult;
  private baseUrl: URL;

  constructor(config: ScanConfig) {
    this.config = {
      maxPages: 50,
      maxDepth: 3,
      scanType: 'full',
      ...config,
    };
    this.baseUrl = new URL(config.url);
    this.result = {
      pagesScanned: 0,
      textContent: [],
      schemaMarkup: [],
      images: [],
      siteMetadata: {},
      internalLinks: [],
      externalLinks: [],
      contentAnalysis: { totalWords: 0, avgWordCount: 0, topics: [] },
      seoElements: { metaDescriptions: [], h1Tags: [], h2Tags: [], altTexts: [] },
      errors: [],
    };
  }

  async scan(): Promise<ScanResult> {
    try {
      // Launch browser - use Browserbase if API key provided, otherwise local Puppeteer
      if (this.config.browserbaseApiKey) {
        this.browser = await this.launchBrowserbase();
      } else {
        this.browser = await puppeteer.launch({
          headless: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox'],
        });
      }

      // Start crawling from the base URL
      await this.crawlPage(this.config.url, 0);

      // Calculate content analysis
      this.calculateContentAnalysis();

      return this.result;
    } finally {
      if (this.browser) {
        await this.browser.close();
      }
    }
  }

  private async launchBrowserbase(): Promise<Browser> {
    // Connect to Browserbase cloud browser
    const wsEndpoint = `wss://connect.browserbase.com?apiKey=${this.config.browserbaseApiKey}`;
    return puppeteer.connect({ browserWSEndpoint: wsEndpoint });
  }

  private async crawlPage(url: string, depth: number): Promise<void> {
    // Check limits
    if (this.visitedUrls.has(url)) return;
    if (this.result.pagesScanned >= (this.config.maxPages || 50)) return;
    if (depth > (this.config.maxDepth || 3)) return;

    // Normalize and validate URL
    let normalizedUrl: URL;
    try {
      normalizedUrl = new URL(url);
      if (normalizedUrl.hostname !== this.baseUrl.hostname) return;
    } catch {
      return;
    }

    this.visitedUrls.add(url);

    const page = await this.browser!.newPage();
    try {
      await page.setUserAgent(
        'Mozilla/5.0 (compatible; BlogCanvasBot/1.0; +https://blogcanvas.io)'
      );
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

      const html = await page.content();
      const $ = cheerio.load(html);

      this.result.pagesScanned++;

      // Extract content based on scan type
      if (this.config.scanType === 'full' || this.config.scanType === 'text_only') {
        await this.extractTextContent($, url);
      }

      if (this.config.scanType === 'full' || this.config.scanType === 'schema_only') {
        this.extractSchemaMarkup($, url);
      }

      if (this.config.scanType === 'full' || this.config.scanType === 'images_only') {
        await this.extractImages($, url, page);
      }

      // Always extract metadata and links on first page
      if (this.result.pagesScanned === 1) {
        this.extractSiteMetadata($);
      }

      // Extract and follow links
      const links = this.extractLinks($, url);
      
      // Recursively crawl internal links
      for (const link of links.internal.slice(0, 10)) {
        await this.crawlPage(link, depth + 1);
      }
    } catch (error) {
      this.result.errors.push({
        url,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      });
    } finally {
      await page.close();
    }
  }

  private async extractTextContent($: cheerio.CheerioAPI, url: string): Promise<void> {
    const headings: { level: string; text: string }[] = [];
    const paragraphs: string[] = [];

    // Extract headings
    $('h1, h2, h3, h4, h5, h6').each((_, el) => {
      const $el = $(el);
      const text = $el.text().trim();
      if (text) {
        headings.push({ level: el.tagName.toLowerCase(), text });
        
        // Track H1 and H2 for SEO
        if (el.tagName.toLowerCase() === 'h1') {
          this.result.seoElements.h1Tags.push({ url, content: text });
        } else if (el.tagName.toLowerCase() === 'h2') {
          this.result.seoElements.h2Tags.push({ url, content: text });
        }
      }
    });

    // Extract paragraphs
    $('p').each((_, el) => {
      const text = $(el).text().trim();
      if (text && text.length > 20) {
        paragraphs.push(text);
      }
    });

    const allText = paragraphs.join(' ');
    const wordCount = allText.split(/\s+/).filter(w => w.length > 0).length;

    this.result.textContent.push({
      url,
      title: $('title').text().trim() || '',
      headings,
      paragraphs,
      wordCount,
    });
  }

  private extractSchemaMarkup($: cheerio.CheerioAPI, url: string): void {
    // Extract JSON-LD
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const data = JSON.parse($(el).html() || '{}');
        this.result.schemaMarkup.push({
          url,
          type: 'json-ld',
          data,
        });
      } catch {
        // Invalid JSON, skip
      }
    });

    // Extract microdata
    $('[itemscope]').each((_, el) => {
      const $el = $(el);
      const itemtype = $el.attr('itemtype') || 'unknown';
      const props: Record<string, string> = {};
      
      $el.find('[itemprop]').each((_, prop) => {
        const $prop = $(prop);
        const name = $prop.attr('itemprop') || '';
        const value = $prop.attr('content') || $prop.text().trim();
        if (name && value) {
          props[name] = value;
        }
      });

      if (Object.keys(props).length > 0) {
        this.result.schemaMarkup.push({
          url,
          type: itemtype,
          data: props,
        });
      }
    });
  }

  private async extractImages(
    $: cheerio.CheerioAPI,
    url: string,
    page: Page
  ): Promise<void> {
    const images: ImageData[] = [];

    $('img').each((_, el) => {
      const $el = $(el);
      const src = $el.attr('src') || $el.attr('data-src') || '';
      const alt = $el.attr('alt') || '';
      const width = parseInt($el.attr('width') || '0', 10) || undefined;
      const height = parseInt($el.attr('height') || '0', 10) || undefined;
      
      // Get context (surrounding text)
      const parent = $el.parent();
      const context = parent.text().trim().slice(0, 100);

      if (src) {
        // Resolve relative URLs
        let absoluteSrc = src;
        try {
          absoluteSrc = new URL(src, url).href;
        } catch {
          // Keep original if invalid
        }

        images.push({
          url,
          src: absoluteSrc,
          alt,
          width,
          height,
          context,
        });

        // Track alt texts for SEO
        this.result.seoElements.altTexts.push({
          url,
          src: absoluteSrc,
          alt,
        });
      }
    });

    this.result.images.push(...images);
  }

  private extractSiteMetadata($: cheerio.CheerioAPI): void {
    const ogTags: Record<string, string> = {};
    const twitterCards: Record<string, string> = {};

    // Basic meta tags
    this.result.siteMetadata = {
      title: $('title').text().trim(),
      description: $('meta[name="description"]').attr('content') || '',
      keywords: $('meta[name="keywords"]').attr('content') || '',
    };

    // Track meta description for SEO
    if (this.result.siteMetadata.description) {
      this.result.seoElements.metaDescriptions.push({
        url: this.config.url,
        content: this.result.siteMetadata.description,
      });
    }

    // Open Graph tags
    $('meta[property^="og:"]').each((_, el) => {
      const property = $(el).attr('property')?.replace('og:', '') || '';
      const content = $(el).attr('content') || '';
      if (property && content) {
        ogTags[property] = content;
      }
    });
    this.result.siteMetadata.ogTags = ogTags;

    // Twitter Card tags
    $('meta[name^="twitter:"]').each((_, el) => {
      const name = $(el).attr('name')?.replace('twitter:', '') || '';
      const content = $(el).attr('content') || '';
      if (name && content) {
        twitterCards[name] = content;
      }
    });
    this.result.siteMetadata.twitterCards = twitterCards;
  }

  private extractLinks($: cheerio.CheerioAPI, currentUrl: string): { internal: string[]; external: string[] } {
    const internal: string[] = [];
    const external: string[] = [];

    $('a[href]').each((_, el) => {
      const href = $(el).attr('href') || '';
      if (!href || href.startsWith('#') || href.startsWith('javascript:')) return;

      try {
        const linkUrl = new URL(href, currentUrl);
        const linkHref = linkUrl.href;

        if (linkUrl.hostname === this.baseUrl.hostname) {
          if (!this.result.internalLinks.includes(linkHref)) {
            this.result.internalLinks.push(linkHref);
            internal.push(linkHref);
          }
        } else {
          if (!this.result.externalLinks.includes(linkHref)) {
            this.result.externalLinks.push(linkHref);
            external.push(linkHref);
          }
        }
      } catch {
        // Invalid URL, skip
      }
    });

    return { internal, external };
  }

  private calculateContentAnalysis(): void {
    const totalWords = this.result.textContent.reduce((sum, page) => sum + page.wordCount, 0);
    const avgWordCount = this.result.pagesScanned > 0 
      ? Math.round(totalWords / this.result.pagesScanned) 
      : 0;

    // Extract common topics from headings
    const allHeadings = this.result.textContent.flatMap(page => 
      page.headings.map(h => h.text.toLowerCase())
    );
    const wordFreq: Record<string, number> = {};
    allHeadings.forEach(heading => {
      heading.split(/\s+/).forEach(word => {
        if (word.length > 4) {
          wordFreq[word] = (wordFreq[word] || 0) + 1;
        }
      });
    });
    const topics = Object.entries(wordFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word);

    this.result.contentAnalysis = {
      totalWords,
      avgWordCount,
      topics,
    };
  }
}

export async function scanWebsite(config: ScanConfig): Promise<ScanResult> {
  const scanner = new WebsiteScanner(config);
  return scanner.scan();
}
