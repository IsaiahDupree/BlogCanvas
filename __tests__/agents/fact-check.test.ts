/**
 * Fact-Check Agent Tests
 * Tests the fact-check agent with citation formatting
 */

import {
    runFactCheckAgent,
    getAllCitations,
    generateBibliography,
    getClaimsWithCitations,
    getFactCheckSummary
} from '@/lib/agents/fact-check';
import { LLMProvider } from '@/lib/agents/types';

// Mock LLM provider for testing
const createMockProvider = (mockResponse: string): LLMProvider => ({
    name: 'mock-provider',
    call: jest.fn().mockResolvedValue(mockResponse)
});

describe('Fact-Check Agent with Citations', () => {
    const mockContent = `
        According to recent studies, 80% of businesses fail within the first year.
        The human brain has 86 billion neurons.
        JavaScript was created in 10 days by Brendan Eich in 1995.
    `;

    const mockResponseWithCitations = JSON.stringify({
        claims: [
            {
                claim: "80% of businesses fail within the first year",
                verifiable: true,
                status: "needs_source",
                reasoning: "This is a commonly cited statistic that requires verification",
                citations: [
                    {
                        title: "Small Business Failure Rates: Statistics and Trends",
                        url: "https://www.sba.gov/business-guide/manage-your-business/stay-legally-compliant",
                        author: "U.S. Small Business Administration",
                        publicationDate: "2024-03",
                        publisher: "SBA.gov",
                        format: "APA",
                        formattedText: "U.S. Small Business Administration. (2024, March). Small Business Failure Rates: Statistics and Trends. SBA.gov. https://www.sba.gov/business-guide/manage-your-business/stay-legally-compliant"
                    }
                ],
                severity: "high"
            },
            {
                claim: "The human brain has 86 billion neurons",
                verifiable: true,
                status: "needs_source",
                reasoning: "Scientific fact requiring citation",
                citations: [
                    {
                        title: "The human brain in numbers: a linearly scaled-up primate brain",
                        url: "https://www.frontiersin.org/articles/10.3389/fnhum.2009.00031/full",
                        author: "Herculano-Houzel, S.",
                        publicationDate: "2009",
                        publisher: "Frontiers in Human Neuroscience",
                        format: "APA",
                        formattedText: "Herculano-Houzel, S. (2009). The human brain in numbers: a linearly scaled-up primate brain. Frontiers in Human Neuroscience, 3, 31. https://www.frontiersin.org/articles/10.3389/fnhum.2009.00031/full"
                    }
                ],
                severity: "medium"
            },
            {
                claim: "JavaScript was created in 10 days by Brendan Eich in 1995",
                verifiable: true,
                status: "verified",
                reasoning: "Well-documented historical fact",
                severity: "low"
            }
        ],
        factCheckScore: 85,
        overallFeedback: "Content has verifiable claims with good sources",
        passed: true,
        totalClaims: 3,
        verifiedClaims: 1,
        unverifiedClaims: 2
    });

    test('should extract claims with citations', async () => {
        const provider = createMockProvider(mockResponseWithCitations);

        const result = await runFactCheckAgent(provider, {
            fullDraftContent: mockContent,
            topic: "Business Success",
            targetKeyword: "business failure"
        });

        expect(result.success).toBe(true);
        expect(result.data).toBeDefined();
        expect(result.data!.claims).toHaveLength(3);

        // Check first claim has citations
        const firstClaim = result.data!.claims[0];
        expect(firstClaim.citations).toBeDefined();
        expect(firstClaim.citations).toHaveLength(1);
        expect(firstClaim.citations![0].url).toBe("https://www.sba.gov/business-guide/manage-your-business/stay-legally-compliant");
    });

    test('should have properly formatted citations', async () => {
        const provider = createMockProvider(mockResponseWithCitations);

        const result = await runFactCheckAgent(provider, {
            fullDraftContent: mockContent,
            topic: "Business Success",
            targetKeyword: "business failure"
        });

        expect(result.success).toBe(true);
        const firstClaim = result.data!.claims[0];
        const citation = firstClaim.citations![0];

        expect(citation.title).toBeTruthy();
        expect(citation.url).toMatch(/^https?:\/\//);
        expect(citation.format).toBe("APA");
        expect(citation.formattedText).toContain("U.S. Small Business Administration");
        expect(citation.formattedText).toContain("2024");
    });

    test('getAllCitations should extract all citations', async () => {
        const provider = createMockProvider(mockResponseWithCitations);

        const result = await runFactCheckAgent(provider, {
            fullDraftContent: mockContent,
            topic: "Business Success",
            targetKeyword: "business failure"
        });

        expect(result.success).toBe(true);
        const allCitations = getAllCitations(result.data!);

        expect(allCitations).toHaveLength(2); // Two claims have citations
        expect(allCitations[0].url).toBe("https://www.sba.gov/business-guide/manage-your-business/stay-legally-compliant");
        expect(allCitations[1].url).toContain("frontiersin.org");
    });

    test('generateBibliography should create references section', async () => {
        const provider = createMockProvider(mockResponseWithCitations);

        const result = await runFactCheckAgent(provider, {
            fullDraftContent: mockContent,
            topic: "Business Success",
            targetKeyword: "business failure"
        });

        expect(result.success).toBe(true);
        const bibliography = generateBibliography(result.data!, 'APA');

        expect(bibliography).toContain('## References');
        expect(bibliography).toContain('U.S. Small Business Administration');
        expect(bibliography).toContain('Herculano-Houzel');
    });

    test('getClaimsWithCitations should return claims with inline references', async () => {
        const provider = createMockProvider(mockResponseWithCitations);

        const result = await runFactCheckAgent(provider, {
            fullDraftContent: mockContent,
            topic: "Business Success",
            targetKeyword: "business failure"
        });

        expect(result.success).toBe(true);
        const claimsWithCitations = getClaimsWithCitations(result.data!);

        expect(claimsWithCitations).toHaveLength(2);
        expect(claimsWithCitations[0].inlineReference).toBe('[1]');
        expect(claimsWithCitations[1].inlineReference).toBe('[2]');
        expect(claimsWithCitations[0].claim).toContain('80%');
    });

    test('getFactCheckSummary should include citation count', async () => {
        const provider = createMockProvider(mockResponseWithCitations);

        const result = await runFactCheckAgent(provider, {
            fullDraftContent: mockContent,
            topic: "Business Success",
            targetKeyword: "business failure"
        });

        expect(result.success).toBe(true);
        const summary = getFactCheckSummary(result.data!);

        expect(summary.totalClaims).toBe(3);
        expect(summary.verifiedClaims).toBe(1);
        expect(summary.unverifiedClaims).toBe(2);
        expect(summary.needsSourceClaims).toBe(2);
        expect(summary.totalCitations).toBe(2);
    });

    test('should handle empty bibliography when no citations', async () => {
        const mockResponseNoCitations = JSON.stringify({
            claims: [
                {
                    claim: "Test claim",
                    verifiable: true,
                    status: "verified",
                    reasoning: "Common knowledge",
                    severity: "low"
                }
            ],
            factCheckScore: 100,
            overallFeedback: "All verified",
            passed: true,
            totalClaims: 1,
            verifiedClaims: 1,
            unverifiedClaims: 0
        });

        const provider = createMockProvider(mockResponseNoCitations);

        const result = await runFactCheckAgent(provider, {
            fullDraftContent: "Test content",
            topic: "Test",
            targetKeyword: "test"
        });

        expect(result.success).toBe(true);
        const bibliography = generateBibliography(result.data!, 'APA');

        expect(bibliography).toBe('');
    });

    test('should support different citation formats', async () => {
        const mockResponseMultipleFormats = JSON.stringify({
            claims: [
                {
                    claim: "Test claim 1",
                    verifiable: true,
                    status: "needs_source",
                    reasoning: "Needs source",
                    citations: [
                        {
                            title: "Source 1",
                            url: "https://example.com/1",
                            format: "MLA",
                            formattedText: "Author. \"Source 1.\" Publisher, 2024. https://example.com/1"
                        }
                    ],
                    severity: "medium"
                }
            ],
            factCheckScore: 80,
            overallFeedback: "Good",
            passed: true,
            totalClaims: 1,
            verifiedClaims: 0,
            unverifiedClaims: 1
        });

        const provider = createMockProvider(mockResponseMultipleFormats);

        const result = await runFactCheckAgent(provider, {
            fullDraftContent: "Test",
            topic: "Test",
            targetKeyword: "test"
        });

        expect(result.success).toBe(true);
        const bibliography = generateBibliography(result.data!, 'MLA');

        expect(bibliography).toContain('Source 1');
        expect(bibliography).toContain('https://example.com/1');
    });
});
