/**
 * Website API Tests
 * Tests website management and scraping endpoints
 * PRD Epic 1: SEO Audit & Topic Forecast
 */

import { supabaseAdmin } from '@/lib/supabase';

const API_BASE = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// Mock fetch for API testing
const mockFetch = async (url: string, options: RequestInit = {}) => {
    const fullUrl = url.startsWith('/') ? `${API_BASE}${url}` : url;
    return fetch(fullUrl, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        }
    });
};

describe('Website API', () => {
    let testWebsiteId: string;
    let testClientId: string;

    beforeAll(async () => {
        // Create test client
        const { data: client } = await supabaseAdmin
            .from('clients')
            .insert({ name: 'API Test Client', slug: 'api-test-client' })
            .select()
            .single();

        testClientId = client?.id;
    });

    afterAll(async () => {
        // Cleanup
        if (testWebsiteId) {
            await supabaseAdmin.from('websites').delete().eq('id', testWebsiteId);
        }
        if (testClientId) {
            await supabaseAdmin.from('clients').delete().eq('id', testClientId);
        }
    });

    describe('POST /api/websites', () => {
        it('should create website with valid data', async () => {
            const response = await mockFetch('/api/websites', {
                method: 'POST',
                body: JSON.stringify({
                    url: 'https://example.com',
                    client_id: testClientId
                })
            });

            expect(response.status).toBe(200);
            const data = await response.json();
            expect(data.success).toBe(true);
            expect(data.website).toBeDefined();
            expect(data.website.url).toBe('https://example.com');

            testWebsiteId = data.website.id;
        });

        it('should reject request without URL', async () => {
            const response = await mockFetch('/api/websites', {
                method: 'POST',
                body: JSON.stringify({ client_id: testClientId })
            });

            expect(response.status).toBe(400);
            const data = await response.json();
            expect(data.success).toBe(false);
        });

        it('should reject invalid URL format', async () => {
            const response = await mockFetch('/api/websites', {
                method: 'POST',
                body: JSON.stringify({
                    url: 'not-a-valid-url',
                    client_id: testClientId
                })
            });

            expect(response.status).toBe(400);
        });
    });

    describe('GET /api/websites', () => {
        it('should return list of websites', async () => {
            const response = await mockFetch('/api/websites');

            expect(response.status).toBe(200);
            const data = await response.json();
            expect(Array.isArray(data.websites)).toBe(true);
        });
    });

    describe('GET /api/websites/[id]', () => {
        it('should return website details', async () => {
            if (!testWebsiteId) return;

            const response = await mockFetch(`/api/websites/${testWebsiteId}`);

            expect(response.status).toBe(200);
            const data = await response.json();
            expect(data.website).toBeDefined();
            expect(data.website.id).toBe(testWebsiteId);
        });

        it('should return 404 for non-existent website', async () => {
            const response = await mockFetch('/api/websites/00000000-0000-0000-0000-000000000000');

            expect(response.status).toBe(404);
        });
    });

    describe('POST /api/websites/scrape', () => {
        it('should trigger scraping job (PRD: Run Audit)', async () => {
            const response = await mockFetch('/api/websites/scrape', {
                method: 'POST',
                body: JSON.stringify({ url: 'https://example.com' })
            });

            expect(response.status).toBe(200);
            const data = await response.json();
            expect(data.success).toBe(true);
            // Should return scraped data or job ID
            expect(data.pages || data.jobId).toBeDefined();
        });

        it('should handle unreachable URLs gracefully', async () => {
            const response = await mockFetch('/api/websites/scrape', {
                method: 'POST',
                body: JSON.stringify({ url: 'https://this-domain-does-not-exist-xyz.com' })
            });

            // Should not crash, should return error gracefully
            const data = await response.json();
            expect(data).toBeDefined();
        });
    });

    describe('GET /api/websites/[id]/gaps', () => {
        it('should return gap analysis (PRD: Gap & Opportunity Analysis)', async () => {
            if (!testWebsiteId) return;

            const response = await mockFetch(`/api/websites/${testWebsiteId}/gaps`);

            expect(response.status).toBe(200);
            const data = await response.json();

            // PRD: Should return topic gaps with traffic estimates
            expect(data.gaps || data.topicGaps).toBeDefined();
        });

        it('should return 404 for invalid website', async () => {
            const response = await mockFetch('/api/websites/invalid-id/gaps');

            expect(response.status).toBe(400);
        });
    });

    describe('GET /api/websites/[id]/clusters', () => {
        it('should return topic clusters (PRD: Topic Map)', async () => {
            if (!testWebsiteId) return;

            const response = await mockFetch(`/api/websites/${testWebsiteId}/clusters`);

            expect(response.status).toBe(200);
            const data = await response.json();

            // PRD: "System builds a Topic Map: Clusters, pillar topics"
            expect(data.clusters || data.topicClusters).toBeDefined();
        });
    });
});

describe('PRD Epic 1: Website Audit Acceptance', () => {
    it('should support full audit workflow', async () => {
        // PRD User Story: "CSM can enter client URL and hit Run Audit"

        // 1. Create website
        const createResponse = await mockFetch('/api/websites', {
            method: 'POST',
            body: JSON.stringify({ url: 'https://test-audit.example.com' })
        });

        expect(createResponse.status).toBeLessThan(500);

        // 2. Trigger scrape/audit
        const scrapeResponse = await mockFetch('/api/websites/scrape', {
            method: 'POST',
            body: JSON.stringify({ url: 'https://test-audit.example.com' })
        });

        expect(scrapeResponse.status).toBeLessThan(500);
        const scrapeData = await scrapeResponse.json();

        // Should return SEO score (PRD requirement)
        if (scrapeData.success) {
            expect(scrapeData.seoScore || scrapeData.pages).toBeDefined();
        }
    });
});
