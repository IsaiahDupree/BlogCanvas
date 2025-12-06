/**
 * Content Generator / Analyzer
 * Functions for AI content analysis and quality scoring
 * PRD Epic 3: Content Batch & AI Writing Pipeline
 */

interface PostConfig {
    target_keyword?: string;
    word_count_goal?: number;
    content_type?: string;
}

interface ContentMetrics {
    overall_score: number;
    seo_score: number;
    structure_score: number;
    readability_score: number;
    content_depth_score: number;
    issues: string[];
    recommendations: string[];
}

interface KeywordUsage {
    count: number;
    density: number;
    warning?: string;
}

interface StructureAnalysis {
    hasH1: boolean;
    h2Count: number;
    h3Count: number;
    hasLists: boolean;
    listCount: number;
    isHierarchyValid: boolean;
}

/**
 * Analyze content and return quality metrics
 */
export function analyzeContent(content: string, config: PostConfig): ContentMetrics {
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Analyze structure
    const structure = analyzeStructure(content);

    // Check for H1
    if (!structure.hasH1) {
        issues.push('Missing H1 heading');
        recommendations.push('Add a clear H1 heading at the top of your content');
    }

    // Check keyword usage
    const keyword = config.target_keyword || '';
    if (keyword) {
        const keywordUsage = detectKeywordUsage(content, keyword);
        if (keywordUsage.count === 0) {
            issues.push('Target keyword not found in content');
            recommendations.push(`Include the keyword "${keyword}" naturally throughout the content`);
        } else if (keywordUsage.density > 3) {
            issues.push('Keyword stuffing detected - density too high');
            recommendations.push('Reduce keyword frequency for more natural content');
        }
    }

    // Check word count
    const wordCount = content.split(/\s+/).filter(w => w.length > 0).length;
    const goal = config.word_count_goal || 1000;
    if (wordCount < goal * 0.5) {
        issues.push(`Content too short (${wordCount} words, goal: ${goal})`);
        recommendations.push(`Expand content to at least ${goal} words`);
    }

    // Calculate scores
    const structureScore = calculateStructureScore(structure);
    const seoScore = calculateSEOContentScore(content, keyword);
    const readabilityScore = checkReadability(content);
    const contentDepthScore = calculateContentDepth(content, goal);

    const overallScore = calculateQualityScore({
        seo_score: seoScore,
        structure_score: structureScore,
        readability_score: readabilityScore,
        content_depth_score: contentDepthScore
    });

    return {
        overall_score: overallScore,
        seo_score: seoScore,
        structure_score: structureScore,
        readability_score: readabilityScore,
        content_depth_score: contentDepthScore,
        issues,
        recommendations
    };
}

/**
 * Calculate overall quality score from sub-scores
 */
export function calculateQualityScore(scores: {
    seo_score: number;
    structure_score: number;
    readability_score: number;
    content_depth_score: number;
}): number {
    // Weighted average - SEO is most important
    const weights = {
        seo: 0.35,
        structure: 0.25,
        readability: 0.20,
        depth: 0.20
    };

    return Math.round(
        scores.seo_score * weights.seo +
        scores.structure_score * weights.structure +
        scores.readability_score * weights.readability +
        scores.content_depth_score * weights.depth
    );
}

/**
 * Detect keyword usage in content
 */
export function detectKeywordUsage(content: string, keyword: string): KeywordUsage {
    if (!keyword) {
        return { count: 0, density: 0 };
    }

    const lowerContent = content.toLowerCase();
    const lowerKeyword = keyword.toLowerCase();

    // Count occurrences
    let count = 0;
    let pos = 0;
    while ((pos = lowerContent.indexOf(lowerKeyword, pos)) !== -1) {
        count++;
        pos += lowerKeyword.length;
    }

    // Calculate density (percentage)
    const words = content.split(/\s+/).length;
    const keywordWords = keyword.split(/\s+/).length;
    const density = words > 0 ? (count * keywordWords / words) * 100 : 0;

    let warning: string | undefined;
    if (count === 0) {
        warning = 'Keyword not found in content';
    } else if (density > 3) {
        warning = 'Keyword stuffing detected';
    }

    return { count, density: Math.round(density * 10) / 10, warning };
}

/**
 * Analyze content structure (headings, lists, etc.)
 */
export function analyzeStructure(content: string): StructureAnalysis {
    const h1Matches = content.match(/^#\s+.+$/gm) || [];
    const h2Matches = content.match(/^##\s+.+$/gm) || [];
    const h3Matches = content.match(/^###\s+.+$/gm) || [];
    const unorderedLists = content.match(/^[-*]\s+.+$/gm) || [];
    const orderedLists = content.match(/^\d+\.\s+.+$/gm) || [];

    const hasH1 = h1Matches.length > 0;
    const h2Count = h2Matches.length;
    const h3Count = h3Matches.length;
    const listCount = unorderedLists.length + orderedLists.length;

    // Check heading hierarchy - H3 should come after H2
    let isHierarchyValid = true;
    if (h3Count > 0 && h2Count === 0) {
        isHierarchyValid = false;
    }

    return {
        hasH1,
        h2Count,
        h3Count,
        hasLists: listCount > 0,
        listCount,
        isHierarchyValid
    };
}

/**
 * Check content readability
 */
export function checkReadability(content: string): number {
    // Simple readability score based on sentence length and word complexity
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = content.split(/\s+/).filter(w => w.length > 0);

    if (sentences.length === 0 || words.length === 0) {
        return 50;
    }

    const avgSentenceLength = words.length / sentences.length;
    const avgWordLength = words.reduce((sum, w) => sum + w.length, 0) / words.length;

    // Score penalties for long sentences and complex words
    let score = 100;

    // Penalize long sentences (ideal: 15-20 words)
    if (avgSentenceLength > 25) {
        score -= 20;
    } else if (avgSentenceLength > 20) {
        score -= 10;
    } else if (avgSentenceLength < 8) {
        score -= 5; // Too choppy
    }

    // Penalize complex words (avg word length > 6)
    if (avgWordLength > 7) {
        score -= 15;
    } else if (avgWordLength > 6) {
        score -= 10;
    }

    return Math.max(0, Math.min(100, score));
}

/**
 * Calculate structure score from analysis
 */
function calculateStructureScore(structure: StructureAnalysis): number {
    let score = 50; // Base score

    if (structure.hasH1) score += 15;
    if (structure.h2Count >= 2) score += 15;
    if (structure.h3Count >= 1) score += 5;
    if (structure.hasLists) score += 10;
    if (structure.isHierarchyValid) score += 5;

    return Math.min(100, score);
}

/**
 * Calculate SEO-specific content score
 */
function calculateSEOContentScore(content: string, keyword: string): number {
    let score = 50;

    if (keyword) {
        const usage = detectKeywordUsage(content, keyword);

        // Ideal: 1-3% density
        if (usage.density >= 1 && usage.density <= 3) {
            score += 30;
        } else if (usage.density > 0 && usage.density < 5) {
            score += 15;
        }

        // Keyword in first paragraph
        const firstPara = content.split('\n\n')[0] || '';
        if (firstPara.toLowerCase().includes(keyword.toLowerCase())) {
            score += 10;
        }
    }

    // Has meta description comment
    if (content.includes('<!-- Meta:') || content.includes('Meta:')) {
        score += 10;
    }

    return Math.min(100, score);
}

/**
 * Calculate content depth score based on word count
 */
function calculateContentDepth(content: string, goal: number): number {
    const wordCount = content.split(/\s+/).filter(w => w.length > 0).length;
    const ratio = wordCount / goal;

    if (ratio >= 1) return 100;
    if (ratio >= 0.8) return 80;
    if (ratio >= 0.6) return 60;
    if (ratio >= 0.4) return 40;
    return 20;
}

/**
 * Generate AI content (mock for testing)
 */
export async function generateContent(
    topic: string,
    keyword: string,
    wordCount: number = 1500,
    style: string = 'professional'
): Promise<{ content: string; metadata: any }> {
    // Mock implementation - in production, calls AI API
    const content = `# ${topic}

This comprehensive guide covers everything you need to know about ${keyword}.

## Introduction to ${keyword}

Understanding ${keyword} is essential for modern businesses. This guide will walk you through the key concepts and best practices.

## Key Benefits

- Improved efficiency
- Better results
- Cost savings
- Enhanced performance

## Best Practices for ${keyword}

### 1. Start with Research

Before implementing ${keyword} strategies, conduct thorough research.

### 2. Create a Plan

Develop a comprehensive plan that outlines your goals and timelines.

### 3. Execute and Measure

Implement your plan and track key metrics to measure success.

## Conclusion

By following these guidelines for ${keyword}, you can achieve significant improvements in your outcomes.
`;

    return {
        content,
        metadata: {
            topic,
            keyword,
            targetWordCount: wordCount,
            actualWordCount: content.split(/\s+/).length,
            generatedAt: new Date().toISOString()
        }
    };
}

/**
 * Generate a blog post with AI (alias for generateContent)
 */
export async function generateBlogPost(
    topic: string,
    keyword: string,
    options: {
        wordCount?: number;
        style?: string;
        outline?: string[];
    } = {}
): Promise<{ content: string; qualityScore: number }> {
    const result = await generateContent(
        topic,
        keyword,
        options.wordCount || 1500,
        options.style || 'professional'
    );

    // Analyze generated content for quality score
    const metrics = analyzeContent(result.content, {
        target_keyword: keyword,
        word_count_goal: options.wordCount || 1500
    });

    return {
        content: result.content,
        qualityScore: metrics.overall_score
    };
}

/**
 * Save generated content to the database
 */
export async function saveGeneratedContent(
    postId: string,
    content: string,
    qualityScore: number
): Promise<void> {
    // Import dynamically to avoid circular dependencies
    const { supabaseAdmin } = await import('@/lib/supabase');

    await supabaseAdmin
        .from('blog_posts')
        .update({
            content,
            seo_quality_score: qualityScore,
            updated_at: new Date().toISOString(),
            generated_at: new Date().toISOString()
        })
        .eq('id', postId);

    // Also save to revisions for history
    await supabaseAdmin
        .from('blog_post_revisions')
        .insert({
            blog_post_id: postId,
            revision_type: 'ai_generated',
            content,
            created_at: new Date().toISOString()
        });
}
