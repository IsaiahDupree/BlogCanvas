import {
    validateOutline,
    validateSEO,
    validateVoiceTone,
    validateCompleteness
} from '../../lib/pipeline/quality-gates';

describe('Quality Gates', () => {
    describe('validateOutline', () => {
        it('should pass for a valid outline', () => {
            const outline = {
                sections: [
                    { key: 'intro', title: 'Introduction', type: 'intro', keyPoints: ['point1'], estimatedWords: 200 },
                    { key: 'body1', title: 'Main Point', type: 'body', keyPoints: ['point1'], estimatedWords: 300 },
                    { key: 'body2', title: 'Second Point', type: 'body', keyPoints: ['point1'], estimatedWords: 300 },
                    { key: 'conclusion', title: 'Conclusion', type: 'conclusion', keyPoints: ['point1'], estimatedWords: 200 },
                    { key: 'cta', title: 'CTA', type: 'cta', keyPoints: ['point1'], estimatedWords: 100 }
                ],
                totalEstimatedWords: 1100
            };

            const result = validateOutline(outline);

            expect(result.passed).toBe(true);
            expect(result.score).toBeGreaterThanOrEqual(70);
            expect(result.issues).toHaveLength(0);
        });

        it('should fail for missing intro', () => {
            const outline = {
                sections: [
                    { key: 'body1', title: 'Body', type: 'body', keyPoints: ['point1'], estimatedWords: 300 },
                    { key: 'conclusion', title: 'Conclusion', type: 'conclusion', keyPoints: ['point1'], estimatedWords: 200 }
                ],
                totalEstimatedWords: 500
            };

            const result = validateOutline(outline);

            expect(result.passed).toBe(false);
            expect(result.issues).toContain('Missing intro section');
        });

        it('should penalize sections without key points', () => {
            const outline = {
                sections: [
                    { key: 'intro', title: 'Intro', type: 'intro', keyPoints: [], estimatedWords: 200 },
                    { key: 'body', title: 'Body', type: 'body', keyPoints: [], estimatedWords: 300 },
                    { key: 'conclusion', title: 'Conclusion', type: 'conclusion', keyPoints: [], estimatedWords: 200 }
                ],
                totalEstimatedWords: 700
            };

            const result = validateOutline(outline);

            expect(result.passed).toBe(false);
            expect(result.issues).toContain(expect.stringContaining('sections missing key points'));
        });
    });

    describe('validateSEO', () => {
        it('should pass for optimal SEO metadata', () => {
            const seo = {
                title: 'Perfect SEO Title Here - 55 Characters Long Example',
                metaDescription: 'This is a perfectly optimized meta description that falls within the ideal character range of 150 to 160 characters for best search results.',
                slug: 'perfect-seo-title',
                keywordDensity: 1.8,
                suggestions: []
            };

            const result = validateSEO(seo);

            expect(result.passed).toBe(true);
            expect(result.score).toBeGreaterThanOrEqual(75);
        });

        it('should fail for title too short', () => {
            const seo = {
                title: 'Too Short',
                metaDescription: 'This is a perfectly optimized meta description that falls within the ideal character range of 150 to 160 characters for best search results.',
                slug: 'slug',
                keywordDensity: 1.5,
                suggestions: []
            };

            const result = validateSEO(seo);

            expect(result.issues).toContain(expect.stringContaining('SEO title length'));
        });

        it('should warn about keyword stuffing', () => {
            const seo = {
                title: 'SEO Title Within Range - Example Here for Testing',
                metaDescription: 'Meta description with proper length for testing purposes and validation of SEO quality gates in our comprehensive testing suite framework.',
                slug: 'seo-title',
                keywordDensity: 4.5, // Too high
                suggestions: []
            };

            const result = validateSEO(seo);

            expect(result.issues).toContain(expect.stringContaining('keyword stuffing'));
        });
    });

    describe('validateVoiceTone', () => {
        it('should pass for high alignment score', () => {
            const voiceTone = {
                alignmentScore: 90,
                issues: [],
                overallFeedback: 'Excellent alignment',
                passed: true
            };

            const result = validateVoiceTone(voiceTone);

            expect(result.passed).toBe(true);
            expect(result.score).toBe(90);
        });

        it('should fail for low alignment score', () => {
            const voiceTone = {
                alignmentScore: 65,
                issues: [
                    { issue: 'Passive voice used', suggestion: 'Use active voice', severity: 'high' as const },
                    { issue: 'Buzzword detected', suggestion: 'Use concrete language', severity: 'high' as const }
                ],
                overallFeedback: 'Needs improvement',
                passed: false
            };

            const result = validateVoiceTone(voiceTone);

            expect(result.passed).toBe(false);
            expect(result.issues).toContain('2 high-severity brand voice violations');
        });

        it('should respect custom threshold', () => {
            const voiceTone = {
                alignmentScore: 75,
                issues: [],
                overallFeedback: 'Good',
                passed: true
            };

            const resultDefault = validateVoiceTone(voiceTone); // threshold 80
            const resultCustom = validateVoiceTone(voiceTone, 70); // threshold 70

            expect(resultDefault.passed).toBe(false);
            expect(resultCustom.passed).toBe(true);
        });
    });

    describe('validateCompleteness', () => {
        it('should pass for adequate word count', () => {
            const sections = [
                { key: 's1', content: 'Lorem ipsum '.repeat(200) }, // ~400 words
                { key: 's2', content: 'Dolor sit amet '.repeat(200) }, // ~600 words
                { key: 's3', content: 'Consectetur adipiscing '.repeat(100) } // ~200 words
            ];

            const result = validateCompleteness(sections, 1000);

            expect(result.passed).toBe(true);
            expect(result.issues).toHaveLength(0);
        });

        it('should fail for insufficient word count', () => {
            const sections = [
                { key: 's1', content: 'Short content here' }
            ];

            const result = validateCompleteness(sections, 1500);

            expect(result.passed).toBe(false);
            expect(result.issues).toContain(expect.stringContaining('below goal'));
        });

        it('should detect empty sections', () => {
            const sections = [
                { key: 's1', content: 'Good content here '.repeat(100) },
                { key: 's2', content: '' }, // Empty
                { key: 's3', content: 'Hi' } // Too short
            ];

            const result = validateCompleteness(sections, 500);

            expect(result.passed).toBe(false);
            expect(result.issues).toContain(expect.stringContaining('empty or too short'));
        });
    });
});
