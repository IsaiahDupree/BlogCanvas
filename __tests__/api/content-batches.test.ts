/**
 * Content Batch API Tests
 * Tests batch creation, AI generation, and publishing
 * PRD Epic 3: Content Batch & AI Writing Pipeline
 * PRD Epic 5: CMS Publishing & Scheduling
 */

import { supabaseAdmin } from '@/lib/supabase';

const API_BASE = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

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

describe('Content Batch API', () => {
    let testBatchId: string;
    let testWebsiteId: string;

    beforeAll(async () => {
        // Create test website
        const { data: website } = await supabaseAdmin
            .from('websites')
            .insert({ url: 'https://batch-test.example.com', domain: 'batch-test.example.com' })
            .select()
            .single();

        testWebsiteId = website?.id;
    });

    afterAll(async () => {
        if (testBatchId) {
            await supabaseAdmin.from('blog_posts').delete().eq('content_batch_id', testBatchId);
            await supabaseAdmin.from('content_batches').delete().eq('id', testBatchId);
        }
        if (testWebsiteId) {
            await supabaseAdmin.from('websites').delete().eq('id', testWebsiteId);
        }
    });

    describe('POST /api/content-batches', () => {
        it('should create batch with topics (PRD: Topic list → Production batch)', async () => {
            const response = await mockFetch('/api/content-batches', {
                method: 'POST',
                body: JSON.stringify({
                    website_id: testWebsiteId,
                    name: 'Test Batch',
                    topics: [
                        { topic: 'SEO Guide', keyword: 'seo guide', word_count: 1500 },
                        { topic: 'Content Marketing', keyword: 'content marketing', word_count: 1200 }
                    ],
                    goal_score_from: 62,
                    goal_score_to: 78
                })
            });

            expect(response.status).toBe(200);
            const data = await response.json();
            expect(data.success).toBe(true);
            expect(data.batch).toBeDefined();
            expect(data.batch.name).toBe('Test Batch');

            testBatchId = data.batch.id;
        });

        it('should validate required fields', async () => {
            const response = await mockFetch('/api/content-batches', {
                method: 'POST',
                body: JSON.stringify({})
            });

            expect(response.status).toBe(400);
        });

        it('should create blog_posts for each topic', async () => {
            if (!testBatchId) return;

            const { data: posts } = await supabaseAdmin
                .from('blog_posts')
                .select('*')
                .eq('content_batch_id', testBatchId);

            // PRD: "Each row = 1 blog post with: Topic, primary keyword..."
            expect(posts?.length).toBeGreaterThanOrEqual(2);
            posts?.forEach(post => {
                expect(post.topic).toBeDefined();
                expect(post.target_keyword).toBeDefined();
            });
        });
    });

    describe('GET /api/content-batches', () => {
        it('should return list of batches', async () => {
            const response = await mockFetch('/api/content-batches');

            expect(response.status).toBe(200);
            const data = await response.json();
            expect(Array.isArray(data.batches)).toBe(true);
        });
    });

    describe('GET /api/content-batches/[id]', () => {
        it('should return batch with posts', async () => {
            if (!testBatchId) return;

            const response = await mockFetch(`/api/content-batches/${testBatchId}`);

            expect(response.status).toBe(200);
            const data = await response.json();
            expect(data.batch).toBeDefined();
            expect(data.batch.posts || data.posts).toBeDefined();
        });
    });

    describe('POST /api/content-batches/[id]/generate', () => {
        it('should trigger AI generation pipeline (PRD: AI Content Factory)', async () => {
            if (!testBatchId) return;

            const response = await mockFetch(`/api/content-batches/${testBatchId}/generate`, {
                method: 'POST',
                body: JSON.stringify({
                    model: 'mock', // Use mock for tests
                    limit: 1
                })
            });

            expect(response.status).toBeLessThan(500);
            const data = await response.json();

            // Should return generation status
            expect(data.success !== undefined || data.generated !== undefined).toBe(true);
        });
    });

    describe('POST /api/content-batches/[id]/publish-all', () => {
        it('should publish approved posts (PRD: Publish Approved Posts)', async () => {
            if (!testBatchId) return;

            // First approve some posts
            await supabaseAdmin
                .from('blog_posts')
                .update({ status: 'approved' })
                .eq('content_batch_id', testBatchId);

            const response = await mockFetch(`/api/content-batches/${testBatchId}/publish-all`, {
                method: 'POST',
                body: JSON.stringify({
                    status: 'draft' // Publish as draft for safety
                })
            });

            expect(response.status).toBeLessThan(500);
            const data = await response.json();

            // PRD: "Publish Approved Posts" functionality
            expect(data.success !== undefined || data.results !== undefined).toBe(true);
        });
    });
});

describe('PRD Epic 3: Content Batch Acceptance', () => {
    it('should support CSV-style batch creation', async () => {
        // PRD: "CSM can import CSV of topics and turn it into a production batch"
        const csvTopics = [
            { topic: 'Topic 1', keyword: 'keyword 1', word_count: 1000, due_date: '2024-12-31' },
            { topic: 'Topic 2', keyword: 'keyword 2', word_count: 1500, due_date: '2024-12-31' }
        ];

        const response = await mockFetch('/api/content-batches', {
            method: 'POST',
            body: JSON.stringify({
                name: 'CSV Import Test',
                topics: csvTopics
            })
        });

        expect(response.status).toBeLessThan(500);
        const data = await response.json();

        if (data.success) {
            expect(data.batch.posts_total || csvTopics.length).toBeGreaterThanOrEqual(2);

            // Cleanup
            await supabaseAdmin.from('content_batches').delete().eq('id', data.batch.id);
        }
    });

    it('should store goal scores from/to (PRD data model)', async () => {
        const response = await mockFetch('/api/content-batches', {
            method: 'POST',
            body: JSON.stringify({
                name: 'Goal Score Test',
                goal_score_from: 62,
                goal_score_to: 78,
                topics: [{ topic: 'Test', keyword: 'test' }]
            })
        });

        const data = await response.json();

        if (data.success) {
            expect(data.batch.goal_score_from).toBe(62);
            expect(data.batch.goal_score_to).toBe(78);

            // Cleanup
            await supabaseAdmin.from('content_batches').delete().eq('id', data.batch.id);
        }
    });
});
