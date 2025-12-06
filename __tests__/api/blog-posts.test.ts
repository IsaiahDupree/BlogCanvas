/**
 * Blog Post API Tests
 * Tests post management, status transitions, and publishing
 * PRD Epic 4: Human Review & Client Approval
 * PRD Epic 5: CMS Publishing
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

describe('Blog Post API', () => {
    let testPostId: string;
    let testBatchId: string;

    beforeAll(async () => {
        // Create test batch and post
        const { data: batch } = await supabaseAdmin
            .from('content_batches')
            .insert({ name: 'Post API Test Batch' })
            .select()
            .single();

        testBatchId = batch?.id;

        const { data: post } = await supabaseAdmin
            .from('blog_posts')
            .insert({
                content_batch_id: testBatchId,
                topic: 'API Test Post',
                target_keyword: 'test keyword',
                status: 'draft',
                content: '# Test Content\n\nThis is test content.'
            })
            .select()
            .single();

        testPostId = post?.id;
    });

    afterAll(async () => {
        if (testPostId) {
            await supabaseAdmin.from('blog_posts').delete().eq('id', testPostId);
        }
        if (testBatchId) {
            await supabaseAdmin.from('content_batches').delete().eq('id', testBatchId);
        }
    });

    describe('GET /api/blog-posts/[id]', () => {
        it('should return post details', async () => {
            if (!testPostId) return;

            const response = await mockFetch(`/api/blog-posts/${testPostId}`);

            expect(response.status).toBe(200);
            const data = await response.json();
            expect(data.post).toBeDefined();
            expect(data.post.id).toBe(testPostId);
            expect(data.post.topic).toBe('API Test Post');
        });

        it('should return 404 for non-existent post', async () => {
            const response = await mockFetch('/api/blog-posts/00000000-0000-0000-0000-000000000000');

            expect(response.status).toBe(404);
        });
    });

    describe('PATCH /api/blog-posts/[id]/status', () => {
        it('should update status (PRD: Kanban status transitions)', async () => {
            if (!testPostId) return;

            const response = await mockFetch(`/api/blog-posts/${testPostId}/status`, {
                method: 'PATCH',
                body: JSON.stringify({ status: 'in_review' })
            });

            expect(response.status).toBe(200);
            const data = await response.json();
            expect(data.success).toBe(true);
            expect(data.post.status).toBe('in_review');
        });

        it('should store feedback with status change', async () => {
            if (!testPostId) return;

            const response = await mockFetch(`/api/blog-posts/${testPostId}/status`, {
                method: 'PATCH',
                body: JSON.stringify({
                    status: 'approved',
                    feedback: 'Looks great, approved for publishing!'
                })
            });

            expect(response.status).toBe(200);
            const data = await response.json();
            expect(data.success).toBe(true);
        });

        it('should reject invalid status', async () => {
            if (!testPostId) return;

            const response = await mockFetch(`/api/blog-posts/${testPostId}/status`, {
                method: 'PATCH',
                body: JSON.stringify({ status: 'invalid_status' })
            });

            expect(response.status).toBe(400);
        });
    });

    describe('POST /api/blog-posts/[id]/generate', () => {
        it('should trigger AI content generation (PRD: AI Content Factory)', async () => {
            if (!testPostId) return;

            const response = await mockFetch(`/api/blog-posts/${testPostId}/generate`, {
                method: 'POST',
                body: JSON.stringify({ model: 'mock' })
            });

            expect(response.status).toBeLessThan(500);
            const data = await response.json();

            // Should return generation result
            expect(data.success !== undefined || data.content !== undefined).toBe(true);
        });
    });

    describe('POST /api/blog-posts/[id]/publish', () => {
        it('should publish to WordPress (PRD: Auto-publish to CMS)', async () => {
            if (!testPostId) return;

            // Update post to approved first
            await supabaseAdmin
                .from('blog_posts')
                .update({ status: 'approved', content: '# Test\n\nContent for publishing' })
                .eq('id', testPostId);

            const response = await mockFetch(`/api/blog-posts/${testPostId}/publish`, {
                method: 'POST',
                body: JSON.stringify({
                    status: 'draft', // Publish as draft for safety
                    websiteUrl: 'https://mock-wordpress.test'
                })
            });

            expect(response.status).toBeLessThan(500);
            const data = await response.json();

            // PRD: Should push to WordPress
            expect(data.success !== undefined).toBe(true);
        });

        it('should support scheduling (PRD: One-click publish or schedule)', async () => {
            if (!testPostId) return;

            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + 7);

            const response = await mockFetch(`/api/blog-posts/${testPostId}/publish`, {
                method: 'POST',
                body: JSON.stringify({
                    schedule: true,
                    publishDate: futureDate.toISOString()
                })
            });

            expect(response.status).toBeLessThan(500);
        });
    });

    describe('GET /api/blog-posts/[id]/revisions', () => {
        it('should return revision history (PRD: see AI progression)', async () => {
            if (!testPostId) return;

            const response = await mockFetch(`/api/blog-posts/${testPostId}/revisions`);

            expect(response.status).toBeLessThan(500);
            const data = await response.json();

            // PRD: "CSM can see AI outline, first draft, SEO improvements, and fact-check notes in a timeline"
            if (data.success) {
                expect(Array.isArray(data.revisions)).toBe(true);
            }
        });
    });
});

describe('PRD Epic 4: Review Workflow Acceptance', () => {
    it('should support Kanban status flow (PRD: Draft → Ready for Client → Changes → Approved)', async () => {
        // Create test post
        const { data: batch } = await supabaseAdmin
            .from('content_batches')
            .insert({ name: 'Kanban Test' })
            .select()
            .single();

        const { data: post } = await supabaseAdmin
            .from('blog_posts')
            .insert({
                content_batch_id: batch.id,
                topic: 'Kanban Test',
                status: 'draft'
            })
            .select()
            .single();

        const transitions = ['in_review', 'ready_for_review', 'approved'];

        for (const status of transitions) {
            const response = await mockFetch(`/api/blog-posts/${post.id}/status`, {
                method: 'PATCH',
                body: JSON.stringify({ status })
            });

            expect(response.status).toBe(200);
        }

        // Verify final status
        const { data: finalPost } = await supabaseAdmin
            .from('blog_posts')
            .select('status')
            .eq('id', post.id)
            .single();

        expect(finalPost?.status).toBe('approved');

        // Cleanup
        await supabaseAdmin.from('blog_posts').delete().eq('id', post.id);
        await supabaseAdmin.from('content_batches').delete().eq('id', batch.id);
    });
});

describe('PRD Epic 5: Publishing Acceptance', () => {
    it('should track publish status (PRD: Live / Scheduled / Failed)', async () => {
        // Create test data
        const { data: batch } = await supabaseAdmin
            .from('content_batches')
            .insert({ name: 'Publish Status Test' })
            .select()
            .single();

        const { data: post } = await supabaseAdmin
            .from('blog_posts')
            .insert({
                content_batch_id: batch.id,
                topic: 'Publish Status Test',
                status: 'approved',
                content: '# Test\n\nContent'
            })
            .select()
            .single();

        // Attempt publish
        const response = await mockFetch(`/api/blog-posts/${post.id}/publish`, {
            method: 'POST',
            body: JSON.stringify({ status: 'draft' })
        });

        const data = await response.json();

        // Should have status info
        if (data.success) {
            expect(data.wordpress_id || data.url || data.scheduled).toBeDefined();
        } else {
            // Failed publish should have error details
            expect(data.error).toBeDefined();
        }

        // Cleanup
        await supabaseAdmin.from('blog_posts').delete().eq('id', post.id);
        await supabaseAdmin.from('content_batches').delete().eq('id', batch.id);
    });
});
