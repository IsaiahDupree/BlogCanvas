import { GET as getClients, POST as createClient } from '@/app/api/clients/route';
import { POST as createPost } from '@/app/api/clients/[clientId]/posts/route';
import { POST as updateStatus } from '@/app/api/posts/[postId]/status/route';
import { NextRequest } from 'next/server';

describe('Merchant Portal APIs', () => {
    describe('Client Management', () => {
        it('lists all clients', async () => {
            const request = new NextRequest('http://localhost/api/clients');
            const response = await getClients(request);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.success).toBe(true);
            expect(Array.isArray(data.clients)).toBe(true);
        });

        it('creates a new client', async () => {
            const request = new NextRequest('http://localhost/api/clients', {
                method: 'POST',
                body: JSON.stringify({
                    name: 'Test Company',
                    website: 'test.com',
                    contact_email: 'hello@test.com',
                    onboarding_method: 'site_scan'
                }),
            });

            const response = await createClient(request);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.success).toBe(true);
            expect(data.client.name).toBe('Test Company');
            expect(data.client.slug).toBe('test-company');
            expect(data.client.status).toBe('onboarding');
        });

        it('returns error when client name is missing', async () => {
            const request = new NextRequest('http://localhost/api/clients', {
                method: 'POST',
                body: JSON.stringify({ website: 'test.com' }),
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
                    contentType: 'how-to',
                    wordCountGoal: 1500,
                    includeFAQs: true
                }),
            });

            const response = await createPost(request, { params: { clientId: '1' } });
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

            const response = await updateStatus(request, { params: { postId: '1' } });
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

            const response = await updateStatus(request, { params: { postId: '1' } });
            const data = await response.json();

            expect(response.status).toBe(400);
            expect(data.success).toBe(false);
            expect(data.error).toContain('Invalid status');
        });
    });
});
