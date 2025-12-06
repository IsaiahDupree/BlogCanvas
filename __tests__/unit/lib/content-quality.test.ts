/**
 * Content Quality Analyzer Tests
 * Tests AI-generated content quality scoring
 * PRD Epic 3: Content Batch & AI Writing Pipeline
 */

import {
    analyzeContent,
    calculateQualityScore,
    detectKeywordUsage,
    analyzeStructure,
    checkReadability
} from '@/lib/ai/content-generator';

describe('Content Quality Analyzer', () => {
    const mockPostConfig = {
        target_keyword: 'SEO optimization',
        word_count_goal: 1500,
        content_type: 'how-to'
    };

    describe('analyzeContent', () => {
        it('should give high score to well-structured content', () => {
            const content = `# Ultimate Guide to SEO Optimization

<!-- Meta: Learn everything about SEO optimization in this comprehensive guide. -->

SEO optimization is essential for online visibility. This guide covers the fundamentals and advanced techniques.

## Understanding SEO Optimization

SEO optimization involves multiple strategies to improve search rankings. Here's what you need to know.

### On-Page Factors

1. Title tags
2. Meta descriptions
3. Header hierarchy

### Technical SEO

- Site speed
- Mobile responsiveness
- XML sitemaps

## Best Practices for SEO Optimization

Follow these proven techniques for better results.

### Content Quality

Great content is the foundation of SEO optimization.

### Link Building

Quality backlinks remain important for SEO.

## Conclusion

SEO optimization is an ongoing process. Keep learning and adapting.`;

            const metrics = analyzeContent(content, mockPostConfig);

            expect(metrics.overall_score).toBeGreaterThanOrEqual(70);
            expect(metrics.seo_score).toBeGreaterThan(60);
            expect(metrics.structure_score).toBeGreaterThan(60);
            expect(metrics.issues.length).toBeLessThan(5);
        });

        it('should penalize missing H1 heading', () => {
            const content = `## Just H2 Heading

This content has no H1 heading which is bad for SEO.

## Another Section

More content here without proper structure.`;

            const metrics = analyzeContent(content, mockPostConfig);

            expect(metrics.issues).toContainEqual(
                expect.stringMatching(/h1|heading/i)
            );
            expect(metrics.structure_score).toBeLessThan(80);
        });

        it('should penalize keyword stuffing', () => {
            const stuffedContent = `# SEO optimization SEO optimization guide

SEO optimization SEO optimization SEO optimization SEO optimization.
SEO optimization SEO optimization SEO optimization SEO optimization.
SEO optimization SEO optimization SEO optimization SEO optimization.
SEO optimization is important for SEO optimization success.`;

            const metrics = analyzeContent(stuffedContent, mockPostConfig);

            expect(metrics.issues).toContainEqual(
                expect.stringMatching(/keyword|stuffing|density/i)
            );
            expect(metrics.seo_score).toBeLessThan(70);
        });

        it('should penalize insufficient keyword usage', () => {
            const noKeywordContent = `# Great Content

This is excellent content but it never mentions the target term at all.

## More Content

Even more great content without the important phrase.`;

            const metrics = analyzeContent(noKeywordContent, mockPostConfig);

            expect(metrics.issues).toContainEqual(
                expect.stringMatching(/keyword/i)
            );
        });

        it('should penalize thin content below word count goal', () => {
            const thinContent = `# Short Post

This post is too short to be useful.`;

            const metrics = analyzeContent(thinContent, mockPostConfig);

            expect(metrics.issues).toContainEqual(
                expect.stringMatching(/word count|short|thin/i)
            );
            expect(metrics.content_depth_score).toBeLessThan(50);
        });

        it('should reward good use of lists and formatting', () => {
            const wellFormatted = `# SEO Optimization Guide

This guide covers SEO optimization techniques.

## Key Points

- First important point
- Second important point
- Third important point

### Detailed Steps

1. Step one
2. Step two
3. Step three

## Summary

SEO optimization is essential.`;

            const plainContent = `# SEO Optimization Guide

This guide covers SEO optimization techniques. First important point. Second important point. Third important point. Step one. Step two. Step three. SEO optimization is essential.`;

            const formattedMetrics = analyzeContent(wellFormatted, mockPostConfig);
            const plainMetrics = analyzeContent(plainContent, mockPostConfig);

            expect(formattedMetrics.structure_score).toBeGreaterThan(plainMetrics.structure_score);
        });
    });

    describe('calculateQualityScore', () => {
        it('should combine sub-scores correctly', () => {
            const scores = {
                seo_score: 80,
                structure_score: 75,
                readability_score: 85,
                content_depth_score: 70
            };

            const overall = calculateQualityScore(scores);

            // Should be weighted average
            expect(overall).toBeGreaterThanOrEqual(70);
            expect(overall).toBeLessThanOrEqual(85);
        });

        it('should weight SEO score heavily', () => {
            const highSEO = {
                seo_score: 95,
                structure_score: 50,
                readability_score: 50,
                content_depth_score: 50
            };

            const lowSEO = {
                seo_score: 30,
                structure_score: 90,
                readability_score: 90,
                content_depth_score: 90
            };

            // SEO should have significant impact
            expect(calculateQualityScore(highSEO)).toBeGreaterThan(calculateQualityScore(lowSEO));
        });
    });

    describe('detectKeywordUsage', () => {
        it('should detect correct keyword density', () => {
            const content = `SEO optimization is important. SEO optimization helps rankings. Good SEO optimization practices.`;
            const keyword = 'SEO optimization';

            const usage = detectKeywordUsage(content, keyword);

            expect(usage.count).toBe(3);
            expect(usage.density).toBeGreaterThan(0);
            expect(usage.density).toBeLessThan(10);
        });

        it('should flag low keyword usage', () => {
            const content = `This is a long article about marketing and branding and customer acquisition.`;

            const usage = detectKeywordUsage(content, 'SEO optimization');

            expect(usage.count).toBe(0);
            expect(usage.warning).toBeDefined();
        });

        it('should flag keyword stuffing', () => {
            const content = `SEO SEO SEO SEO SEO SEO SEO SEO SEO SEO`;

            const usage = detectKeywordUsage(content, 'SEO');

            expect(usage.density).toBeGreaterThan(20);
            expect(usage.warning).toContain('stuffing');
        });
    });

    describe('analyzeStructure', () => {
        it('should detect heading hierarchy', () => {
            const content = `# H1
## H2
### H3
## Another H2
### H3 under second H2`;

            const structure = analyzeStructure(content);

            expect(structure.hasH1).toBe(true);
            expect(structure.h2Count).toBe(2);
            expect(structure.h3Count).toBe(2);
            expect(structure.isHierarchyValid).toBe(true);
        });

        it('should detect broken hierarchy (H3 before H2)', () => {
            const content = `# Title
### Skipped to H3
## Then H2`;

            const structure = analyzeStructure(content);

            expect(structure.isHierarchyValid).toBe(false);
        });

        it('should detect lists', () => {
            const content = `# Title
- Item 1
- Item 2

1. Numbered item
2. Another numbered item`;

            const structure = analyzeStructure(content);

            expect(structure.hasLists).toBe(true);
            expect(structure.listCount).toBeGreaterThanOrEqual(2);
        });
    });

    describe('checkReadability', () => {
        it('should score simple content higher', () => {
            const simpleContent = `Dogs are pets. Cats are pets. Fish swim in water.`;
            const complexContent = `The anthropomorphization of domesticated canines presents sociological implications regarding contemporary human-animal relationships.`;

            const simpleScore = checkReadability(simpleContent);
            const complexScore = checkReadability(complexContent);

            expect(simpleScore).toBeGreaterThan(complexScore);
        });

        it('should penalize very long sentences', () => {
            const longSentences = `This is a very long sentence that goes on and on and on and keeps talking about things and more things and even more things without ever stopping or using proper punctuation to break up ideas.`;
            const shortSentences = `This is short. So is this. Clear and concise.`;

            const longScore = checkReadability(longSentences);
            const shortScore = checkReadability(shortSentences);

            expect(shortScore).toBeGreaterThan(longScore);
        });
    });
});

describe('PRD Epic 3: AI Pipeline Quality Requirements', () => {
    it('should track SEO quality score per post (PRD requirement)', () => {
        const content = `# Complete Guide

SEO-optimized content with good structure and keywords.

## Section 1

Detailed information here.

## Section 2

More great content.`;

        const metrics = analyzeContent(content, {
            target_keyword: 'complete guide',
            word_count_goal: 500
        });

        // PRD: "SEO quality score" should be trackable
        expect(typeof metrics.overall_score).toBe('number');
        expect(metrics.overall_score).toBeGreaterThanOrEqual(0);
        expect(metrics.overall_score).toBeLessThanOrEqual(100);
    });

    it('should identify issues for revision (PRD: fact-check, SEO improvements)', () => {
        const contentWithIssues = `# post title

this post has problems. no keyword usage. poor formatting.`;

        const metrics = analyzeContent(contentWithIssues, {
            target_keyword: 'SEO optimization',
            word_count_goal: 1000
        });

        // PRD: System should identify issues for AI revision pipeline
        expect(metrics.issues.length).toBeGreaterThan(0);
        expect(Array.isArray(metrics.issues)).toBe(true);
    });
});
