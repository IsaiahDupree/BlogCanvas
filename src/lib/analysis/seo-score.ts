/**
 * SEO Score Analysis Library
 * Core functions for calculating SEO scores and grades
 */

interface PageData {
    title?: string;
    meta_description?: string;
    headings?: {
        h1?: string[];
        h2?: string[];
        h3?: string[];
    };
    word_count?: number;
    images?: number;
    images_with_alt?: number;
    internal_links?: number;
    external_links?: number;
    url?: string;
    load_time?: number;
}

/**
 * Calculate SEO score for a single page
 */
export function calculateSEOScore(page: PageData): number {
    let score = 0;
    const maxScore = 100;

    // Title scoring (15 points)
    if (page.title) {
        const titleLength = page.title.length;
        if (titleLength >= 30 && titleLength <= 60) {
            score += 15;
        } else if (titleLength > 0) {
            score += 8;
        }
    }

    // Meta description scoring (15 points)
    if (page.meta_description) {
        const metaLength = page.meta_description.length;
        if (metaLength >= 120 && metaLength <= 160) {
            score += 15;
        } else if (metaLength > 0) {
            score += 7;
        }
    }

    // Heading structure scoring (15 points)
    const headings = page.headings || { h1: [], h2: [], h3: [] };
    const h1Count = headings.h1?.length || 0;
    const h2Count = headings.h2?.length || 0;
    const h3Count = headings.h3?.length || 0;

    if (h1Count === 1) score += 5;
    if (h2Count >= 2 && h2Count <= 8) score += 5;
    if (h3Count >= 1) score += 5;

    // Word count scoring (20 points)
    const wordCount = page.word_count || 0;
    if (wordCount >= 1500) {
        score += 20;
    } else if (wordCount >= 1000) {
        score += 15;
    } else if (wordCount >= 500) {
        score += 10;
    } else if (wordCount >= 300) {
        score += 5;
    }

    // Image optimization scoring (10 points)
    const images = page.images || 0;
    const imagesWithAlt = page.images_with_alt || 0;
    if (images > 0) {
        const altRatio = imagesWithAlt / images;
        score += Math.round(altRatio * 10);
    } else if (wordCount >= 500) {
        // Penalize lack of images for longer content
        score += 0;
    } else {
        score += 5; // Short content doesn't need images
    }

    // Internal links scoring (15 points)
    const internalLinks = page.internal_links || 0;
    if (internalLinks >= 5) {
        score += 15;
    } else if (internalLinks >= 3) {
        score += 10;
    } else if (internalLinks >= 1) {
        score += 5;
    }

    // External links scoring (10 points)
    const externalLinks = page.external_links || 0;
    if (externalLinks >= 2 && externalLinks <= 5) {
        score += 10;
    } else if (externalLinks >= 1) {
        score += 5;
    }

    // Ensure score is between 0 and 100
    return Math.max(0, Math.min(maxScore, score));
}

/**
 * Calculate aggregate SEO score from multiple pages
 */
export function calculateAggregateScore(scores: number[]): number {
    if (scores.length === 0) return 0;
    const sum = scores.reduce((a, b) => a + b, 0);
    return Math.round(sum / scores.length);
}

/**
 * Get SEO grade from score
 */
export function getSEOGrade(score: number): string {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
}

/**
 * Get detailed SEO analysis with issues
 */
export function analyzeSEO(page: PageData): {
    score: number;
    grade: string;
    issues: string[];
    recommendations: string[];
} {
    const score = calculateSEOScore(page);
    const grade = getSEOGrade(score);
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check for issues
    if (!page.title) {
        issues.push('Missing page title');
        recommendations.push('Add a descriptive title between 30-60 characters');
    } else if (page.title.length < 30) {
        issues.push('Title too short');
        recommendations.push('Expand title to at least 30 characters');
    } else if (page.title.length > 60) {
        issues.push('Title too long (may be truncated in search results)');
    }

    if (!page.meta_description) {
        issues.push('Missing meta description');
        recommendations.push('Add a meta description between 120-160 characters');
    } else if (page.meta_description.length < 120) {
        issues.push('Meta description too short');
    }

    const h1Count = page.headings?.h1?.length || 0;
    if (h1Count === 0) {
        issues.push('Missing H1 heading');
        recommendations.push('Add a single H1 heading to the page');
    } else if (h1Count > 1) {
        issues.push('Multiple H1 headings found');
        recommendations.push('Use only one H1 heading per page');
    }

    const wordCount = page.word_count || 0;
    if (wordCount < 300) {
        issues.push('Thin content (fewer than 300 words)');
        recommendations.push('Add more comprehensive content (aim for 1000+ words)');
    }

    const images = page.images || 0;
    const imagesWithAlt = page.images_with_alt || 0;
    if (images > 0 && imagesWithAlt < images) {
        issues.push(`${images - imagesWithAlt} images missing alt text`);
        recommendations.push('Add descriptive alt text to all images');
    }

    if ((page.internal_links || 0) < 3) {
        issues.push('Few internal links');
        recommendations.push('Add more internal links to related content');
    }

    return { score, grade, issues, recommendations };
}
