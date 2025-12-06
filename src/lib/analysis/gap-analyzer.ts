import { supabaseAdmin } from '@/lib/supabase';

export interface ContentGap {
    id?: string;
    website_id: string;
    title: string;
    description: string;
    gap_type: 'missing_topic' | 'thin_content' | 'poor_seo' | 'broken_structure' | 'weak_keywords';
    severity: 'high' | 'medium' | 'low';
    affected_pages: string[];
    suggested_action: string;
    metadata?: {
        current_score?: number;
        potential_score?: number;
        keyword_gaps?: string[];
        competitor_coverage?: number;
    };
}

/**
 * Analyze scraped pages and identify content gaps
 */
export async function analyzeContentGaps(websiteId: string): Promise<ContentGap[]> {
    const gaps: ContentGap[] = [];

    // Fetch scraped pages for this website
    const { data: pages, error } = await supabaseAdmin
        .from('scraped_pages')
        .select('*')
        .eq('website_id', websiteId);

    if (error || !pages || pages.length === 0) {
        return gaps;
    }

    // Gap 1: Identify pages with thin content
    const thinContentPages = pages.filter(page => page.word_count && page.word_count < 300);
    if (thinContentPages.length > 0) {
        gaps.push({
            website_id: websiteId,
            title: 'Thin Content Pages',
            description: `${thinContentPages.length} pages have less than 300 words, which is too short for good SEO.`,
            gap_type: 'thin_content',
            severity: thinContentPages.length > 5 ? 'high' : 'medium',
            affected_pages: thinContentPages.map(p => p.url).slice(0, 10),
            suggested_action: 'Expand these pages to at least 500-800 words with valuable content.',
            metadata: {
                current_score: 40,
                potential_score: 75
            }
        });
    }

    // Gap 2: Pages missing meta descriptions
    const missingDescriptions = pages.filter(page => !page.description || page.description.length < 50);
    if (missingDescriptions.length > 0) {
        gaps.push({
            website_id: websiteId,
            title: 'Missing Meta Descriptions',
            description: `${missingDescriptions.length} pages lack proper meta descriptions (120-160 characters).`,
            gap_type: 'poor_seo',
            severity: missingDescriptions.length > 10 ? 'high' : 'medium',
            affected_pages: missingDescriptions.map(p => p.url).slice(0, 10),
            suggested_action: 'Add compelling meta descriptions to improve click-through rates from search.',
            metadata: {
                current_score: 50,
                potential_score: 80
            }
        });
    }

    // Gap 3: Poor heading structure
    const poorHeadings = pages.filter(page => {
        const h = page.headings as any;
        return !h || h.h1?.length !== 1 || h.h2?.length < 2;
    });
    if (poorHeadings.length > 0) {
        gaps.push({
            website_id: websiteId,
            title: 'Weak Heading Structure',
            description: `${poorHeadings.length} pages have poor heading hierarchy (should have 1 H1, 2+ H2s).`,
            gap_type: 'broken_structure',
            severity: poorHeadings.length > 8 ? 'high' : 'medium',
            affected_pages: poorHeadings.map(p => p.url).slice(0, 10),
            suggested_action: 'Restructure content with proper heading hierarchy for better readability and SEO.',
            metadata: {
                current_score: 55,
                potential_score: 85
            }
        });
    }

    // Gap 4: Images without alt text
    const imagesWithoutAlt = pages.filter(page => {
        const images = page.images as any[];
        if (!images || images.length === 0) return false;
        const withoutAlt = images.filter(img => !img.alt || img.alt.trim().length === 0);
        return withoutAlt.length > 0;
    });
    if (imagesWithoutAlt.length > 0) {
        gaps.push({
            website_id: websiteId,
            title: 'Missing Image Alt Text',
            description: `Multiple pages have images without descriptive alt text, hurting accessibility and SEO.`,
            gap_type: 'poor_seo',
            severity: 'medium',
            affected_pages: imagesWithoutAlt.map(p => p.url).slice(0, 10),
            suggested_action: 'Add descriptive alt text to all images for accessibility and SEO benefits.',
            metadata: {
                current_score: 60,
                potential_score: 80
            }
        });
    }

    // Gap 5: Weak internal linking
    const weakLinking = pages.filter(page => {
        const links = page.links as any[];
        if (!links) return true;
        const internalLinks = links.filter(l => l.isInternal);
        return internalLinks.length < 3;
    });
    if (weakLinking.length > 0) {
        gaps.push({
            website_id: websiteId,
            title: 'Insufficient Internal Linking',
            description: `${weakLinking.length} pages have fewer than 3 internal links, limiting site navigation and SEO.`,
            gap_type: 'broken_structure',
            severity: 'low',
            affected_pages: weakLinking.map(p => p.url).slice(0, 10),
            suggested_action: 'Add relevant internal links to improve site structure and distribute page authority.',
            metadata: {
                current_score: 65,
                potential_score: 80
            }
        });
    }

    // Gap 6: Missing topic coverage (analyze based on industry benchmarks)
    const blogPages = pages.filter(page =>
        page.url.includes('/blog') ||
        page.url.includes('/articles') ||
        page.url.includes('/news')
    );

    if (blogPages.length < 10) {
        gaps.push({
            website_id: websiteId,
            title: 'Limited Blog Content',
            description: `Only ${blogPages.length} blog posts found. Competitors typically have 20-50+ posts.`,
            gap_type: 'missing_topic',
            severity: 'high',
            affected_pages: ['/blog'],
            suggested_action: 'Develop a content strategy to publish 1-2 high-quality blog posts per week.',
            metadata: {
                current_score: 30,
                potential_score: 85,
                competitor_coverage: 75
            }
        });
    }

    return gaps;
}

/**
 * Save content gaps to database
 */
export async function saveContentGaps(gaps: ContentGap[]): Promise<void> {
    for (const gap of gaps) {
        await supabaseAdmin
            .from('content_gaps')
            .upsert({
                website_id: gap.website_id,
                title: gap.title,
                description: gap.description,
                gap_type: gap.gap_type,
                severity: gap.severity,
                affected_pages: gap.affected_pages,
                suggested_action: gap.suggested_action,
                metadata: gap.metadata,
                status: 'open'
            }, {
                onConflict: 'website_id,title'
            });
    }
}

/**
 * Generate content suggestions based on gaps
 */
export async function generateContentSuggestions(
    websiteId: string,
    gaps: ContentGap[]
): Promise<any[]> {
    const suggestions = [];

    // For missing topic gaps, suggest new blog posts
    const topicGaps = gaps.filter(g => g.gap_type === 'missing_topic');
    for (const gap of topicGaps) {
        suggestions.push({
            website_id: websiteId,
            gap_id: gap.id,
            title: `How to Get Started with ${gap.title}`,
            suggestion_type: 'new_content',
            description: 'Create comprehensive guide to fill knowledge gap',
            estimated_word_count: 1500,
            estimated_impact: 'high',
            priority: gap.severity === 'high' ? 1 : 2,
            status: 'suggested'
        });
    }

    // For thin content, suggest expansions
    const thinContentGaps = gaps.filter(g => g.gap_type === 'thin_content');
    for (const gap of thinContentGaps.slice(0, 5)) {
        suggestions.push({
            website_id: websiteId,
            gap_id: gap.id,
            title: `Expand: ${gap.affected_pages[0]}`,
            suggestion_type: 'content_expansion',
            description: 'Add detailed sections, examples, and FAQs',
            estimated_word_count: 500,
            estimated_impact: 'medium',
            priority: 3,
            status: 'suggested'
        });
    }

    return suggestions;
}
