
import { GET as getClients, POST as createClient } from '@/app/api/clients/route';
import { POST as createPost } from '@/app/api/clients/[clientId]/posts/route';
import { POST as updateStatus } from '@/app/api/posts/[postId]/status/route';
import { NextRequest } from 'next/server';

// Fix hoisting issue by inlining the mock or defining it inside the factory
jest.mock('@/lib/supabase/server', () => ({
    createClient: jest.fn(() => ({
        from: jest.fn((table: string) => ({
            select: jest.fn(() => ({
                order: jest.fn(() => Promise.resolve({
                    data: [
                        { id: '1', name: 'Test Company', status: 'onboarding' }
                    ],
                    error: null
                })),
                eq: jest.fn(() => ({
                    order: jest.fn(() => Promise.resolve({
                        data: [
                            { id: '1', topic: 'How to Use CRM', status: 'researching', client_id: '1' }
                        ],
                        error: null
                    }))
                })),
                single: jest.fn(() => Promise.resolve({
                    data: { id: '1', topic: 'How to Use CRM', status: 'researching', client_id: '1' },
                    error: null
                }))
            })),
            insert: jest.fn((data: any) => ({
                select: jest.fn(() => ({
                    single: jest.fn(() => Promise.resolve({
                        data: {
                            ...data,
                            id: '1',
                            status: data.status || 'onboarding',
                            topic: data.topic || 'Test Topic'
                        },
                        error: null
                    }))
                }))
            })),
            update: jest.fn((data: any) => ({
                select: jest.fn(() => ({
                    single: jest.fn(() => Promise.resolve({
                        data: { id: '1', ...data, status: data.status },
                        error: null
                    }))
                }))
            }))
        }))
    }))
}));

jest.mock('@/lib/supabase', () => ({
    supabaseAdmin: {
        from: jest.fn((table: string) => ({
            select: jest.fn(() => ({
                order: jest.fn(() => Promise.resolve({
                    data: [
                        { id: '1', name: 'Test Company', status: 'onboarding' }
                    ],
                    error: null
                })),
                eq: jest.fn(() => ({
                    order: jest.fn(() => Promise.resolve({
                        data: [
                            { id: '1', topic: 'How to Use CRM', status: 'researching', client_id: '1' }
                        ],
                        error: null
                    }))
                })),
                single: jest.fn(() => Promise.resolve({
                    data: { id: '1', topic: 'How to Use CRM', status: 'researching', client_id: '1' },
                    error: null
                }))
            })),
            insert: jest.fn((data: any) => ({
                select: jest.fn(() => ({
                    single: jest.fn(() => Promise.resolve({
                        data: {
                            ...data,
                            id: '1',
                            status: data.status || 'onboarding',
                            topic: data.topic || 'Test Topic'
                        },
                        error: null
                    }))
                }))
            })),
            update: jest.fn((data: any) => ({
                select: jest.fn(() => ({
                    single: jest.fn(() => Promise.resolve({
                        data: { id: '1', ...data, status: data.status },
                        error: null
                    }))
                }))
            }))
        }))
    }
}));

describe('Merchant Portal APIs', () => {
    describe('Client Management', () => {
        it('lists all clients', async () => {
            const request = new NextRequest('http://localhost/api/clients');
            const response = await getClients(request);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.success).toBe(true);
            expect(Array.isArray(data.clients)).toBe(true);
            expect(data.clients[0].name).toBe('Test Company');
        });

        it('creates a new client', async () => {
            const request = new NextRequest('http://localhost/api/clients', {
                method: 'POST',
                body: JSON.stringify({
                    name: 'Test Company',
                    website_url: 'test.com',
                    primary_contact_email: 'hello@test.com',
                    onboarding_method: 'site_scan'
                }),
            });

            const response = await createClient(request);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.success).toBe(true);
            expect(data.client.name).toBe('Test Company');
            // slug removed
            expect(data.client.status).toBe('onboarding');
        });

        it('returns error when client name is missing', async () => {
            const request = new NextRequest('http://localhost/api/clients', {
                method: 'POST',
                body: JSON.stringify({ website_url: 'test.com' }),
            });

            const response = await createClient(request);
            const data = await response.json();

            expect(response.status).toBe(400);
            expect(data.success).toBe(false);
            expect(data.error).toContain('required');
        });
    });

    describe('Post Management', () => {
        it('creates a new post for client', async () => {
            const request = new NextRequest('http://localhost/api/clients/1/posts', {
                method: 'POST',
                body: JSON.stringify({
                    topic: 'How to Use CRM',
                    targetKeyword: 'CRM guide',
                    word_count_goal: 1500,
                    // contentType removed
                }),
            });

            // Use simple object for params as Next.js expects, trying async param resolution
            const response = await createPost(request, { params: Promise.resolve({ clientId: '1' }) });
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.success).toBe(true);
            expect(data.post.topic).toBe('How to Use CRM');
            expect(data.post.client_id).toBe('1');
            expect(data.post.status).toBe('researching');
            expect(data.redirectUrl).toContain('/pipeline');
        });

        it('updates post status', async () => {
            const request = new NextRequest('http://localhost/api/posts/1/status', {
                method: 'POST',
                body: JSON.stringify({
                    status: 'ready_for_review',
                    notes: 'Ready for client review'
                }),
            });

            const response = await updateStatus(request, { params: Promise.resolve({ postId: '1' }) });
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.success).toBe(true);
            expect(data.post.status).toBe('ready_for_review');
        });

        it('rejects invalid status', async () => {
            const request = new NextRequest('http://localhost/api/posts/1/status', {
                method: 'POST',
                body: JSON.stringify({ status: 'invalid_status' }),
            });

            const response = await updateStatus(request, { params: Promise.resolve({ postId: '1' }) });
            const data = await response.json();

            expect(response.status).toBe(400);
            expect(data.success).toBe(false);
            expect(data.error).toContain('Invalid status');
        });
    });
});
