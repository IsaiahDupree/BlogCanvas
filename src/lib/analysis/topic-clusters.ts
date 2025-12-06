import { supabaseAdmin } from '@/lib/supabase';

export interface TopicCluster {
    id?: string;
    website_id: string;
    name: string;
    primary_keyword: string;
    search_intent: 'informational' | 'navigational' | 'transactional' | 'commercial';
    difficulty: number; // 0-100 scale
    estimated_traffic: number; // monthly searches
    currently_covered: boolean;
    recommended_article_count: number;
}

/**
 * Industry-standard topic clusters by niche
 * In production, this would come from keyword research APIs
 */
const INDUSTRY_CLUSTERS: Record<string, Partial<TopicCluster>[]> = {
    'default': [
        { name: 'Getting Started Guides', primary_keyword: 'how to get started', search_intent: 'informational', difficulty: 40, estimated_traffic: 5000, recommended_article_count: 5 },
        { name: 'Best Practices', primary_keyword: 'best practices for', search_intent: 'informational', difficulty: 50, estimated_traffic: 3000, recommended_article_count: 8 },
        { name: 'Comparisons', primary_keyword: 'vs comparison', search_intent: 'commercial', difficulty: 60, estimated_traffic: 4000, recommended_article_count: 6 },
        { name: 'Tutorials', primary_keyword: 'step by step tutorial', search_intent: 'informational', difficulty: 45, estimated_traffic: 6000, recommended_article_count: 10 },
        { name: 'Common Problems', primary_keyword: 'how to fix', search_intent: 'informational', difficulty: 35, estimated_traffic: 4500, recommended_article_count: 7 },
        { name: 'Tools & Resources', primary_keyword: 'best tools for', search_intent: 'commercial', difficulty: 55, estimated_traffic: 3500, recommended_article_count: 5 },
        { name: 'Industry Trends', primary_keyword: 'trends in', search_intent: 'informational', difficulty: 50, estimated_traffic: 2500, recommended_article_count: 4 },
        { name: 'Case Studies', primary_keyword: 'success stories', search_intent: 'informational', difficulty: 40, estimated_traffic: 2000, recommended_article_count: 6 },
    ],
    'saas': [
        { name: 'Product Features', primary_keyword: 'features and benefits', search_intent: 'commercial', difficulty: 55, estimated_traffic: 8000, recommended_article_count: 8 },
        { name: 'Integration Guides', primary_keyword: 'how to integrate', search_intent: 'informational', difficulty: 50, estimated_traffic: 4000, recommended_article_count: 10 },
        { name: 'Pricing Comparisons', primary_keyword: 'pricing comparison', search_intent: 'commercial', difficulty: 65, estimated_traffic: 5000, recommended_article_count: 5 },
        { name: 'Use Cases', primary_keyword: 'use cases for', search_intent: 'commercial', difficulty: 45, estimated_traffic: 6000, recommended_article_count: 12 },
    ],
    'ecommerce': [
        { name: 'Product Reviews', primary_keyword: 'product review', search_intent: 'commercial', difficulty: 60, estimated_traffic: 10000, recommended_article_count: 15 },
        { name: 'Buying Guides', primary_keyword: 'buying guide', search_intent: 'commercial', difficulty: 55, estimated_traffic: 8000, recommended_article_count: 10 },
        { name: 'Product Comparisons', primary_keyword: 'vs comparison', search_intent: 'commercial', difficulty: 65, estimated_traffic: 9000, recommended_article_count: 12 },
    ]
};

/**
 * Generate topic clusters for a website based on industry and existing content
 */
export async function generateTopicClusters(websiteId: string): Promise<TopicCluster[]> {
    // Fetch website details
    const { data: website } = await supabaseAdmin
        .from('websites')
        .select('*')
        .eq('id', websiteId)
        .single();

    if (!website) {
        throw new Error('Website not found');
    }

    // Fetch scraped pages to analyze current coverage
    const { data: pages } = await supabaseAdmin
        .from('scraped_pages')
        .select('url, title, content, headings')
        .eq('website_id', websiteId);

    // Determine industry (simplified - in production, use NLP or user input)
    const industry = detectIndustry(website.url, pages || []);
    const baseClusters = INDUSTRY_CLUSTERS[industry] || INDUSTRY_CLUSTERS['default'];

    // Map to full topic clusters and check coverage
    const clusters: TopicCluster[] = baseClusters.map(cluster => {
        const covered = checkCoverage(cluster.primary_keyword || '', pages || []);

        return {
            website_id: websiteId,
            name: cluster.name!,
            primary_keyword: cluster.primary_keyword!,
            search_intent: cluster.search_intent!,
            difficulty: cluster.difficulty!,
            estimated_traffic: cluster.estimated_traffic!,
            currently_covered: covered,
            recommended_article_count: cluster.recommended_article_count!
        };
    });

    return clusters;
}

/**
 * Detect industry from website URL and content
 */
function detectIndustry(url: string, pages: any[]): string {
    const urlLower = url.toLowerCase();
    const allContent = pages.map(p => p.content?.toLowerCase() || '').join(' ');

    // Simple keyword matching (in production, use more sophisticated methods)
    if (urlLower.includes('shop') || urlLower.includes('store') || allContent.includes('buy now')) {
        return 'ecommerce';
    }

    if (urlLower.includes('app') || allContent.includes('software') || allContent.includes('saas')) {
        return 'saas';
    }

    return 'default';
}

/**
 * Check if a keyword/topic is already covered in existing content
 */
function checkCoverage(keyword: string, pages: any[]): boolean {
    const keywordLower = keyword.toLowerCase();
    const words = keywordLower.split(' ');

    for (const page of pages) {
        const content = (page.content || '').toLowerCase();
        const title = (page.title || '').toLowerCase();

        // Check if most keywords appear in title or content
        const matchCount = words.filter(word =>
            title.includes(word) || content.includes(word)
        ).length;

        if (matchCount >= words.length * 0.7) {
            return true;
        }
    }

    return false;
}

/**
 * Save topic clusters to database
 */
export async function saveTopicClusters(clusters: TopicCluster[]): Promise<void> {
    for (const cluster of clusters) {
        await supabaseAdmin
            .from('topic_clusters')
            .upsert({
                website_id: cluster.website_id,
                name: cluster.name,
                primary_keyword: cluster.primary_keyword,
                search_intent: cluster.search_intent,
                difficulty: cluster.difficulty,
                estimated_traffic: cluster.estimated_traffic,
                currently_covered: cluster.currently_covered,
                recommended_article_count: cluster.recommended_article_count
            }, {
                onConflict: 'website_id,primary_keyword'
            });
    }
}

/**
 * Get priority clusters (high traffic, low difficulty, not covered)
 */
export function prioritizeClusters(clusters: TopicCluster[]): TopicCluster[] {
    return clusters
        .filter(c => !c.currently_covered)
        .sort((a, b) => {
            // Score = traffic / (difficulty + 1) to favor high traffic, low difficulty
            const scoreA = a.estimated_traffic / (a.difficulty + 1);
            const scoreB = b.estimated_traffic / (b.difficulty + 1);
            return scoreB - scoreA;
        });
}
