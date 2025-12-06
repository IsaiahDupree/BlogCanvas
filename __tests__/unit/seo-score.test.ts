import { calculateSEOScore } from '@/lib/analysis/seo-score'

describe('SEO Score Calculator', () => {
    describe('calculateSEOScore', () => {
        it('should calculate perfect score for ideal page', () => {
            const page = {
                title: 'Perfect SEO Page Title',
                meta_description: 'This is a perfect meta description that is between 120 and 160 characters long for optimal SEO performance.',
                headings: {
                    h1: ['Main Heading'],
                    h2: ['Section 1', 'Section 2', 'Section 3'],
                    h3: ['Subsection 1.1', 'Subsection 1.2'],
                },
                word_count: 1500,
                images: 5,
                images_with_alt: 5,
                internal_links: 10,
                external_links: 3,
            }

            const score = calculateSEOScore(page)

            expect(score).toBeGreaterThanOrEqual(90)
            expect(score).toBeLessThanOrEqual(100)
        })

        it('should penalize missing title', () => {
            const page = {
                title: '',
                meta_description: 'Good description',
                headings: { h1: ['Heading'], h2: [], h3: [] },
                word_count: 1000,
                images: 0,
                images_with_alt: 0,
                internal_links: 5,
                external_links: 2,
            }

            const score = calculateSEOScore(page)

            expect(score).toBeLessThan(70)
        })

        it('should penalize missing meta description', () => {
            const page = {
                title: 'Good Title',
                meta_description: '',
                headings: { h1: ['Heading'], h2: [], h3: [] },
                word_count: 1000,
                images: 0,
                images_with_alt: 0,
                internal_links: 5,
                external_links: 2,
            }

            const score = calculateSEOScore(page)

            expect(score).toBeLessThan(70)
        })

        it('should penalize thin content (low word count)', () => {
            const page = {
                title: 'Title',
                meta_description: 'Description that is long enough for SEO purposes',
                headings: { h1: ['Heading'], h2: [], h3: [] },
                word_count: 100,
                images: 0,
                images_with_alt: 0,
                internal_links: 1,
                external_links: 0,
            }

            const score = calculateSEOScore(page)

            expect(score).toBeLessThan(60)
        })

        it('should handle edge case: empty page', () => {
            const page = {
                title: '',
                meta_description: '',
                headings: { h1: [], h2: [], h3: [] },
                word_count: 0,
                images: 0,
                images_with_alt: 0,
                internal_links: 0,
                external_links: 0,
            }

            const score = calculateSEOScore(page)

            expect(score).toBeGreaterThanOrEqual(0)
            expect(score).toBeLessThanOrEqual(20)
        })

        it('should reward good heading structure', () => {
            const pageWithGoodHeadings = {
                title: 'Title',
                meta_description: 'Good meta description that is long enough',
                headings: {
                    h1: ['Main Title'],
                    h2: ['Section 1', 'Section 2', 'Section 3'],
                    h3: ['Sub 1', 'Sub 2'],
                },
                word_count: 1000,
                images: 3,
                images_with_alt: 3,
                internal_links: 5,
                external_links: 2,
            }

            const pageWithPoorHeadings = {
                ...pageWithGoodHeadings,
                headings: { h1: [], h2: [], h3: [] },
            }

            const goodScore = calculateSEOScore(pageWithGoodHeadings)
            const poorScore = calculateSEOScore(pageWithPoorHeadings)

            expect(goodScore).toBeGreaterThan(poorScore)
        })
    })
})
