/**
 * API Integration Tests
 * Tests the HTTP endpoints for review, sections, and comments
 */

import { NextRequest } from 'next/server';

// Mock Supabase client
jest.mock('@/lib/supabase/server', () => ({
    createClient: jest.fn(() => ({
        from: jest.fn((table: string) => ({
            select: jest.fn(() => ({
                eq: jest.fn(() => ({
                    single: jest.fn(() => Promise.resolve({
                        data: { id: 'test-123', topic: 'Test', status: 'drafting' },
                        error: null
                    })),
                    order: jest.fn(() => Promise.resolve({
                        data: [],
                        error: null
                    }))
                })),
                order: jest.fn(() => Promise.resolve({ data: [], error: null }))
            })),
            update: jest.fn(() => ({
                eq: jest.fn(() => ({
                    select: jest.fn(() => ({
                        single: jest.fn(() => Promise.resolve({
                            data: { id: 'test-123', status: 'approved' },
                            error: null
                        }))
                    }))
                }))
            })),
            insert: jest.fn(() => ({
                select: jest.fn(() => ({
                    single: jest.fn(() => Promise.resolve({
                        data: { id: 'comment-123', content: 'Test comment' },
                        error: null
                    }))
                }))
            }))
        }))
    }))
}));

// Mock Supabase admin client
jest.mock('@/lib/supabase', () => ({
    supabaseAdmin: {
        from: jest.fn((table: string) => ({
            select: jest.fn(() => ({
                order: jest.fn(() => ({
                    eq: jest.fn(() => Promise.resolve({
                        data: [{ id: 'comment-1', content: 'Test comment' }],
                        error: null
                    }))
                })),
                eq: jest.fn(() => ({
                    order: jest.fn(() => Promise.resolve({
                        data: [{ id: 'comment-1', content: 'Test comment' }],
                        error: null
                    }))
                }))
            })),
            insert: jest.fn(() => ({
                select: jest.fn(() => ({
                    single: jest.fn(() => Promise.resolve({
                        data: { id: 'comment-123', content: 'Test comment' },
                        error: null
                    }))
                }))
            }))
        }))
    }
}));

describe('API Routes - Post Status Endpoints', () => {
    describe('POST /api/posts/[postId]/status', () => {
        it('should update post status', async () => {
            const { POST } = await import('@/app/api/posts/[postId]/status/route');

            const request = new NextRequest('http://localhost/api/posts/test-123/status', {
                method: 'POST',
                body: JSON.stringify({ status: 'approved' })
            });

            const response = await POST(request, { params: Promise.resolve({ postId: 'test-123' }) });
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.success).toBe(true);
            expect(data.post.status).toBe('approved');
        });

        it('should reject invalid status', async () => {
            const { POST } = await import('@/app/api/posts/[postId]/status/route');

            const request = new NextRequest('http://localhost/api/posts/test-123/status', {
                method: 'POST',
                body: JSON.stringify({ status: 'invalid_status' })
            });

            const response = await POST(request, { params: Promise.resolve({ postId: 'test-123' }) });
            const data = await response.json();

            expect(response.status).toBe(400);
            expect(data.success).toBe(false);
        });
    });
});

describe('API Routes - Section Endpoints', () => {
    describe('PATCH /api/posts/[postId]/sections/[sectionId]', () => {
        it('should update section content', async () => {
            const { PATCH } = await import('@/app/api/posts/[postId]/sections/[sectionId]/route');

            const request = new NextRequest('http://localhost/api/posts/test-123/sections/section-1', {
                method: 'PATCH',
                body: JSON.stringify({ content: 'Updated content' })
            });

            const response = await PATCH(request, {
                params: Promise.resolve({ postId: 'test-123', sectionId: 'section-1' })
            });

            expect(response.status).toBe(200);
        });

        it('should validate update fields', async () => {
            const { PATCH } = await import('@/app/api/posts/[postId]/sections/[sectionId]/route');

            const request = new NextRequest('http://localhost/api/posts/test-123/sections/section-1', {
                method: 'PATCH',
                body: JSON.stringify({
                    content: 'New content',
                    needs_human: true,
                    human_prompt: 'Please review this'
                })
            });

            const response = await PATCH(request, {
                params: Promise.resolve({ postId: 'test-123', sectionId: 'section-1' })
            });

            expect(response.status).toBe(200);
        });
    });
});

describe('API Routes - Comments Endpoints', () => {
    describe('GET /api/comments', () => {
        it('should fetch comments for a post', async () => {
            const { GET } = await import('@/app/api/comments/route');

            const request = new NextRequest('http://localhost/api/comments?blog_post_id=test-123');
            const response = await GET(request);

            expect(response.status).toBe(200);
        });

        it('should filter by section_id', async () => {
            const { GET } = await import('@/app/api/comments/route');

            const request = new NextRequest('http://localhost/api/comments?section_id=section-1');
            const response = await GET(request);

            expect(response.status).toBe(200);
        });
    });

    describe('POST /api/comments', () => {
        it('should create a new comment', async () => {
            const { POST } = await import('@/app/api/comments/route');

            const request = new NextRequest('http://localhost/api/comments', {
                method: 'POST',
                body: JSON.stringify({
                    blog_post_id: 'test-123',
                    section_id: 'section-1',
                    content: 'This is a test comment',
                    author_name: 'Test User'
                })
            });

            const response = await POST(request);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.content).toBe('Test comment');
        });
    });
});
