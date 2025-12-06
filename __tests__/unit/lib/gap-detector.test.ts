/**
 * Gap Detector Tests
 * Tests content gap analysis functionality
 * PRD Epic 1: SEO Audit & Topic Forecast - Gap & Opportunity Analysis
 */

import {
    detectContentGaps,
    categorizeGaps,
    estimateTrafficPotential,
    generateTopicClusters
} from '@/lib/analysis/gap-detector';

describe('Gap Detector', () => {
    const mockExistingContent = [
        { topic: 'SEO Basics', keyword: 'seo basics', covered: true },
        { topic: 'Keyword Research', keyword: 'keyword research', covered: true },
        { topic: 'Link Building', keyword: 'link building', covered: false }
    ];

    const mockCompetitorTopics = [
        { topic: 'SEO Basics', keyword: 'seo basics', traffic: 5000 },
        { topic: 'Technical SEO', keyword: 'technical seo', traffic: 8000 },
        { topic: 'Local SEO', keyword: 'local seo', traffic: 12000 },
        { topic: 'Mobile SEO', keyword: 'mobile seo', traffic: 6000 }
    ];

    describe('detectContentGaps', () => {
        it('should identify missing topics vs competitors', () => {
            const gaps = detectContentGaps(mockExistingContent, mockCompetitorTopics);

            expect(gaps).toContainEqual(
                expect.objectContaining({ keyword: 'technical seo' })
            );
            expect(gaps).toContainEqual(
                expect.objectContaining({ keyword: 'local seo' })
            );
            expect(gaps).toContainEqual(
                expect.objectContaining({ keyword: 'mobile seo' })
            );
        });

        it('should not include already covered topics', () => {
            const gaps = detectContentGaps(mockExistingContent, mockCompetitorTopics);

            const coveredTopics = gaps.filter(g => g.keyword === 'seo basics');
            expect(coveredTopics.length).toBe(0);
        });

        it('should include traffic potential for each gap', () => {
            const gaps = detectContentGaps(mockExistingContent, mockCompetitorTopics);

            gaps.forEach(gap => {
                expect(gap).toHaveProperty('traffic_potential');
                expect(gap.traffic_potential).toBeGreaterThanOrEqual(0);
            });
        });

        it('should handle empty existing content', () => {
            const gaps = detectContentGaps([], mockCompetitorTopics);

            expect(gaps.length).toBe(mockCompetitorTopics.length);
        });

        it('should handle empty competitor topics', () => {
            const gaps = detectContentGaps(mockExistingContent, []);

            expect(gaps.length).toBe(0);
        });
    });

    describe('categorizeGaps', () => {
        it('should categorize gaps by priority', () => {
            const gaps = [
                { keyword: 'high traffic topic', traffic_potential: 15000, difficulty: 40 },
                { keyword: 'low traffic topic', traffic_potential: 500, difficulty: 80 },
                { keyword: 'medium topic', traffic_potential: 5000, difficulty: 50 }
            ];

            const categorized = categorizeGaps(gaps);

            expect(categorized.high).toBeDefined();
            expect(categorized.medium).toBeDefined();
            expect(categorized.low).toBeDefined();
        });

        it('should prioritize high traffic, low difficulty', () => {
            const gaps = [
                { keyword: 'ideal', traffic_potential: 20000, difficulty: 20 },
                { keyword: 'bad', traffic_potential: 100, difficulty: 90 }
            ];

            const categorized = categorizeGaps(gaps);

            expect(categorized.high).toContainEqual(
                expect.objectContaining({ keyword: 'ideal' })
            );
            expect(categorized.low).toContainEqual(
                expect.objectContaining({ keyword: 'bad' })
            );
        });

        it('should return empty arrays if no gaps', () => {
            const categorized = categorizeGaps([]);

            expect(categorized.high).toEqual([]);
            expect(categorized.medium).toEqual([]);
            expect(categorized.low).toEqual([]);
        });
    });

    describe('estimateTrafficPotential', () => {
        it('should estimate monthly traffic for keyword', () => {
            const traffic = estimateTrafficPotential('seo optimization', 'en-us');

            expect(traffic).toBeGreaterThan(0);
            expect(typeof traffic).toBe('number');
        });

        it('should return higher traffic for broad keywords', () => {
            const broadTraffic = estimateTrafficPotential('seo', 'en-us');
            const narrowTraffic = estimateTrafficPotential('seo for small dentist offices in montana', 'en-us');

            expect(broadTraffic).toBeGreaterThan(narrowTraffic);
        });

        it('should handle unknown keywords gracefully', () => {
            const traffic = estimateTrafficPotential('xyzabc123nonsense', 'en-us');

            expect(traffic).toBeGreaterThanOrEqual(0);
        });
    });

    describe('generateTopicClusters', () => {
        it('should group related topics into clusters', () => {
            const topics = [
                'SEO basics',
                'SEO for beginners',
                'Advanced SEO',
                'Local SEO',
                'Technical SEO',
                'Content marketing',
                'Content strategy'
            ];

            const clusters = generateTopicClusters(topics);

            expect(clusters.length).toBeGreaterThan(0);
            expect(clusters.length).toBeLessThan(topics.length); // Should consolidate
        });

        it('should create pillar topics for each cluster', () => {
            const topics = ['SEO guide', 'SEO tutorial', 'SEO tips'];

            const clusters = generateTopicClusters(topics);

            clusters.forEach(cluster => {
                expect(cluster).toHaveProperty('pillar_topic');
                expect(cluster).toHaveProperty('subtopics');
                expect(cluster.subtopics.length).toBeGreaterThan(0);
            });
        });

        it('should identify estimated impact per cluster', () => {
            const topics = ['keyword research', 'long-tail keywords', 'keyword tools'];

            const clusters = generateTopicClusters(topics);

            clusters.forEach(cluster => {
                expect(cluster).toHaveProperty('estimated_traffic');
                expect(cluster).toHaveProperty('difficulty');
            });
        });
    });
});

describe('PRD Epic 1: Gap Analysis Requirements', () => {
    it('should build Topic Map as per PRD', () => {
        // PRD: "System builds a Topic Map: Clusters, pillar topics, long-tail ideas"
        const existingTopics = [{ topic: 'SEO Basics', covered: true }];
        const competitorTopics = [
            { topic: 'SEO Basics', keyword: 'seo basics', traffic: 5000 },
            { topic: 'Advanced SEO', keyword: 'advanced seo', traffic: 3000 },
            { topic: 'SEO Tools', keyword: 'seo tools', traffic: 8000 }
        ];

        const gaps = detectContentGaps(existingTopics, competitorTopics);
        const clusters = generateTopicClusters(gaps.map(g => g.keyword));

        // Should produce actionable topic map
        expect(gaps.length).toBeGreaterThan(0);
        expect(clusters.length).toBeGreaterThan(0);
    });

    it('should include search intent and difficulty per topic (PRD)', () => {
        // PRD: "For each: search intent, difficulty, estimated traffic & impact"
        const gaps = detectContentGaps(
            [],
            [{ topic: 'SEO Guide', keyword: 'seo guide', traffic: 10000, difficulty: 50 }]
        );

        gaps.forEach(gap => {
            expect(gap).toHaveProperty('traffic_potential');
            expect(gap).toHaveProperty('difficulty');
        });
    });

    it('should show coverage status (PRD: Covered / Not Covered)', () => {
        // PRD: "table of topic clusters with Covered / Not Covered"
        const existingTopics = [
            { topic: 'SEO', covered: true },
            { topic: 'PPC', covered: false }
        ];

        const gaps = detectContentGaps(existingTopics, [
            { topic: 'SEO', keyword: 'seo', traffic: 5000 },
            { topic: 'PPC', keyword: 'ppc', traffic: 4000 },
            { topic: 'Social', keyword: 'social media', traffic: 6000 }
        ]);

        // Uncovered topics should be in gaps
        expect(gaps.some(g => g.keyword === 'ppc')).toBe(true);
        expect(gaps.some(g => g.keyword === 'social media')).toBe(true);
    });

    it('should recommend article count per cluster (PRD)', () => {
        // PRD: "recommended article count per cluster"
        const clusters = generateTopicClusters([
            'SEO guide',
            'SEO tutorial',
            'SEO basics',
            'SEO advanced',
            'PPC guide',
            'PPC basics'
        ]);

        clusters.forEach(cluster => {
            expect(cluster).toHaveProperty('recommended_articles');
            expect(cluster.recommended_articles).toBeGreaterThan(0);
        });
    });
});
