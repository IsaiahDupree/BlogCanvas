/**
 * Gap Detector Library
 * Functions for detecting content gaps and generating topic clusters
 */

interface ExistingTopic {
    topic: string;
    keyword?: string;
    covered: boolean;
}

interface CompetitorTopic {
    topic: string;
    keyword: string;
    traffic: number;
    difficulty?: number;
}

interface ContentGap {
    topic: string;
    keyword: string;
    traffic_potential: number;
    difficulty: number;
    priority: 'high' | 'medium' | 'low';
}

interface TopicCluster {
    pillar_topic: string;
    subtopics: string[];
    estimated_traffic: number;
    difficulty: number;
    recommended_articles: number;
}

/**
 * Detect content gaps between existing content and competitor topics
 */
export function detectContentGaps(
    existingContent: ExistingTopic[],
    competitorTopics: CompetitorTopic[]
): ContentGap[] {
    const coveredKeywords = new Set(
        existingContent
            .filter(c => c.covered)
            .map(c => c.keyword?.toLowerCase() || c.topic.toLowerCase())
    );

    const gaps: ContentGap[] = [];

    for (const topic of competitorTopics) {
        const keyword = topic.keyword.toLowerCase();

        if (!coveredKeywords.has(keyword)) {
            const difficulty = topic.difficulty || estimateDifficulty(topic.traffic);

            gaps.push({
                topic: topic.topic,
                keyword: topic.keyword,
                traffic_potential: topic.traffic,
                difficulty,
                priority: calculatePriority(topic.traffic, difficulty)
            });
        }
    }

    return gaps.sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
}

/**
 * Categorize gaps by priority
 */
export function categorizeGaps(gaps: ContentGap[]): {
    high: ContentGap[];
    medium: ContentGap[];
    low: ContentGap[];
} {
    return {
        high: gaps.filter(g => g.priority === 'high'),
        medium: gaps.filter(g => g.priority === 'medium'),
        low: gaps.filter(g => g.priority === 'low')
    };
}

/**
 * Estimate traffic potential for a keyword
 */
export function estimateTrafficPotential(keyword: string, locale: string = 'en-us'): number {
    // Mock implementation - in production, use API like SEMrush/Ahrefs
    const wordCount = keyword.split(' ').length;

    // Longer keywords typically have lower volume but better intent
    if (wordCount === 1) {
        return Math.floor(5000 + Math.random() * 15000);
    } else if (wordCount <= 3) {
        return Math.floor(1000 + Math.random() * 5000);
    } else {
        return Math.floor(100 + Math.random() * 1000);
    }
}

/**
 * Generate topic clusters from a list of topics
 */
export function generateTopicClusters(topics: string[]): TopicCluster[] {
    if (topics.length === 0) return [];

    // Group related topics by finding common words/themes
    const clusters: Map<string, string[]> = new Map();

    for (const topic of topics) {
        const words = topic.toLowerCase().split(' ');
        const primaryWord = words[0]; // Simple clustering by first word

        if (!clusters.has(primaryWord)) {
            clusters.set(primaryWord, []);
        }
        clusters.get(primaryWord)!.push(topic);
    }

    // Convert to TopicCluster format
    const result: TopicCluster[] = [];

    for (const [pillar, subtopics] of clusters) {
        const estimatedTraffic = subtopics.length * 2000; // Mock estimation
        const difficulty = 30 + Math.random() * 40; // Mock 30-70 range

        result.push({
            pillar_topic: pillar.charAt(0).toUpperCase() + pillar.slice(1),
            subtopics,
            estimated_traffic: estimatedTraffic,
            difficulty: Math.round(difficulty),
            recommended_articles: subtopics.length + 1 // Pillar + subtopics
        });
    }

    return result;
}

/**
 * Calculate priority based on traffic and difficulty
 */
function calculatePriority(traffic: number, difficulty: number): 'high' | 'medium' | 'low' {
    // High traffic + low difficulty = high priority
    const score = (traffic / 1000) / (difficulty / 10);

    if (score > 5) return 'high';
    if (score > 1) return 'medium';
    return 'low';
}

/**
 * Estimate keyword difficulty based on traffic
 */
function estimateDifficulty(traffic: number): number {
    // Higher traffic keywords typically have higher difficulty
    if (traffic > 10000) return 70 + Math.random() * 20;
    if (traffic > 5000) return 50 + Math.random() * 20;
    if (traffic > 1000) return 30 + Math.random() * 20;
    return 10 + Math.random() * 20;
}

/**
 * Get gap analysis summary
 */
export function getGapAnalysisSummary(gaps: ContentGap[]): {
    total_gaps: number;
    high_priority: number;
    total_traffic_potential: number;
    recommended_posts: number;
} {
    const categorized = categorizeGaps(gaps);

    return {
        total_gaps: gaps.length,
        high_priority: categorized.high.length,
        total_traffic_potential: gaps.reduce((sum, g) => sum + g.traffic_potential, 0),
        recommended_posts: Math.ceil(gaps.length * 1.2) // Some topics need multiple posts
    };
}
