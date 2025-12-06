/**
 * SEO Score Calculator Tests
 * Tests the core SEO scoring algorithm against PRD requirements
 * Epic 1: SEO Audit & Topic Forecast
 */

import { calculateSEOScore, calculateAggregateScore, getSEOGrade } from '@/lib/analysis/seo-score';

describe('SEO Score Calculator', () => {
    describe('calculateSEOScore', () => {
        it('should calculate high score for well-optimized page', () => {
            const page = {
                title: 'Complete Guide to SEO Optimization - Best Practices 2024',
                meta_description: 'Learn everything about SEO optimization in this comprehensive guide covering best practices, tools, and strategies for better search rankings.',
                headings: {
                    h1: ['Complete Guide to SEO Optimization'],
                    h2: ['Understanding SEO', 'On-Page SEO', 'Technical SEO', 'Link Building'],
                    h3: ['Keyword Research', 'Content Optimization', 'Site Speed']
                },
                word_count: 2500,
                images: 8,
                images_with_alt: 8,
                internal_links: 15,
                external_links: 5,
                url: '/seo-guide',
                load_time: 1.5
            };

            const score = calculateSEOScore(page);

            expect(score).toBeGreaterThanOrEqual(80);
            expect(score).toBeLessThanOrEqual(100);
        });

        it('should calculate low score for poorly optimized page', () => {
            const page = {
                title: '',
                meta_description: '',
                headings: { h1: [], h2: [], h3: [] },
                word_count: 100,
                images: 0,
                images_with_alt: 0,
                internal_links: 0,
                external_links: 0,
                url: '/page',
                load_time: 5
            };

            const score = calculateSEOScore(page);

            expect(score).toBeGreaterThanOrEqual(0);
            expect(score).toBeLessThan(30);
        });

        it('should penalize missing title', () => {
            const withTitle = {
                title: 'Good Title for SEO',
                meta_description: 'Good description',
                headings: { h1: ['Heading'], h2: ['Section'], h3: [] },
                word_count: 1000,
                images: 2,
                images_with_alt: 2,
                internal_links: 5,
                external_links: 2
            };

            const withoutTitle = { ...withTitle, title: '' };

            const scoreWith = calculateSEOScore(withTitle);
            const scoreWithout = calculateSEOScore(withoutTitle);

            expect(scoreWith).toBeGreaterThan(scoreWithout);
            expect(scoreWith - scoreWithout).toBeGreaterThanOrEqual(5);
        });

        it('should penalize missing meta description', () => {
            const withMeta = {
                title: 'Good Title',
                meta_description: 'This is a good meta description between 120-160 characters for optimal SEO performance and click-through rates.',
                headings: { h1: ['Heading'], h2: [], h3: [] },
                word_count: 1000,
                images: 0,
                images_with_alt: 0,
                internal_links: 3,
                external_links: 1
            };

            const withoutMeta = { ...withMeta, meta_description: '' };

            expect(calculateSEOScore(withMeta)).toBeGreaterThan(calculateSEOScore(withoutMeta));
        });

        it('should penalize thin content (low word count)', () => {
            const longContent = {
                title: 'Article',
                meta_description: 'Description here',
                headings: { h1: ['Title'], h2: ['Section'], h3: [] },
                word_count: 2000,
                images: 3,
                images_with_alt: 3,
                internal_links: 5,
                external_links: 2
            };

            const thinContent = { ...longContent, word_count: 200 };

            expect(calculateSEOScore(longContent)).toBeGreaterThan(calculateSEOScore(thinContent));
        });

        it('should reward good heading structure', () => {
            const goodStructure = {
                title: 'Article Title',
                meta_description: 'Description',
                headings: {
                    h1: ['Main Title'],
                    h2: ['Section 1', 'Section 2', 'Section 3', 'Conclusion'],
                    h3: ['Subsection 1.1', 'Subsection 1.2', 'Subsection 2.1']
                },
                word_count: 1500,
                images: 4,
                images_with_alt: 4,
                internal_links: 8,
                external_links: 3
            };

            const poorStructure = {
                ...goodStructure,
                headings: { h1: [], h2: [], h3: [] }
            };

            expect(calculateSEOScore(goodStructure)).toBeGreaterThan(calculateSEOScore(poorStructure));
        });

        it('should penalize images without alt text', () => {
            const withAlts = {
                title: 'Image Article',
                meta_description: 'Description',
                headings: { h1: ['Title'], h2: ['Intro'], h3: [] },
                word_count: 1000,
                images: 5,
                images_with_alt: 5,
                internal_links: 3,
                external_links: 1
            };

            const withoutAlts = { ...withAlts, images_with_alt: 0 };

            expect(calculateSEOScore(withAlts)).toBeGreaterThan(calculateSEOScore(withoutAlts));
        });

        it('should reward internal links', () => {
            const manyLinks = {
                title: 'Article',
                meta_description: 'Description',
                headings: { h1: ['Title'], h2: [], h3: [] },
                word_count: 1000,
                images: 0,
                images_with_alt: 0,
                internal_links: 15,
                external_links: 3
            };

            const fewLinks = { ...manyLinks, internal_links: 0 };

            expect(calculateSEOScore(manyLinks)).toBeGreaterThan(calculateSEOScore(fewLinks));
        });

        it('should return score between 0 and 100', () => {
            // Test with extreme values
            const extremePage = {
                title: 'x'.repeat(1000),
                meta_description: 'y'.repeat(500),
                headings: {
                    h1: Array(10).fill('H1'),
                    h2: Array(50).fill('H2'),
                    h3: Array(100).fill('H3')
                },
                word_count: 50000,
                images: 1000,
                images_with_alt: 999,
                internal_links: 500,
                external_links: 200
            };

            const score = calculateSEOScore(extremePage);

            expect(score).toBeGreaterThanOrEqual(0);
            expect(score).toBeLessThanOrEqual(100);
        });
    });

    describe('calculateAggregateScore', () => {
        it('should calculate average of multiple pages', () => {
            const pages = [
                { score: 80 },
                { score: 60 },
                { score: 70 }
            ];

            const aggregate = calculateAggregateScore(pages.map(p => p.score));

            expect(aggregate).toBe(70);
        });

        it('should handle single page', () => {
            const score = calculateAggregateScore([85]);
            expect(score).toBe(85);
        });

        it('should handle empty array', () => {
            const score = calculateAggregateScore([]);
            expect(score).toBe(0);
        });
    });

    describe('getSEOGrade', () => {
        it('should return A for 90+', () => {
            expect(getSEOGrade(95)).toBe('A');
            expect(getSEOGrade(90)).toBe('A');
        });

        it('should return B for 80-89', () => {
            expect(getSEOGrade(85)).toBe('B');
            expect(getSEOGrade(80)).toBe('B');
        });

        it('should return C for 70-79', () => {
            expect(getSEOGrade(75)).toBe('C');
            expect(getSEOGrade(70)).toBe('C');
        });

        it('should return D for 60-69', () => {
            expect(getSEOGrade(65)).toBe('D');
            expect(getSEOGrade(60)).toBe('D');
        });

        it('should return F for below 60', () => {
            expect(getSEOGrade(50)).toBe('F');
            expect(getSEOGrade(0)).toBe('F');
        });
    });
});

describe('PRD Requirement: SEO Score Audit', () => {
    it('should provide baseline SEO score as per PRD Epic 1', () => {
        // PRD: "CSM can enter a client's URL and hit Run Audit to get a baseline SEO score"
        const websitePages = [
            { title: 'Home', word_count: 500, headings: { h1: ['Welcome'], h2: [], h3: [] } },
            { title: 'About', word_count: 300, headings: { h1: ['About Us'], h2: [], h3: [] } },
            { title: 'Services', word_count: 800, headings: { h1: ['Services'], h2: ['Web', 'Mobile'], h3: [] } }
        ];

        const scores = websitePages.map(page => calculateSEOScore({
            ...page,
            meta_description: '',
            images: 0,
            images_with_alt: 0,
            internal_links: 2,
            external_links: 0
        }));

        const baselineScore = calculateAggregateScore(scores);

        // Should produce a real baseline score between 0-100
        expect(baselineScore).toBeGreaterThanOrEqual(0);
        expect(baselineScore).toBeLessThanOrEqual(100);
        expect(typeof baselineScore).toBe('number');
    });
});
