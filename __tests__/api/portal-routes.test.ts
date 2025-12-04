import { POST as approvePost } from '@/app/api/portal/posts/[postId]/approve/route';
import { POST as requestChanges } from '@/app/api/portal/posts/[postId]/request-changes/route';
import { GET as getComments, POST as addComment } from '@/app/api/portal/posts/[postId]/comments/route';
import { NextRequest } from 'next/server';

describe('Client Portal APIs', () => {
    describe('POST /api/portal/posts/[postId]/approve', () => {
        it('approves post and updates status', async () => {
            const request = new NextRequest('http://localhost/api/portal/posts/1/approve', {
                method: 'POST',
            });

            const response = await approvePost(request, { params: { postId: '1' } });
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.success).toBe(true);
            expect(data.post.status).toBe('approved');
            expect(data.post.approved_at).toBeDefined();
        });
    });

    describe('POST /api/portal/posts/[postId]/request-changes', () => {
        it('creates change request and sets status to editing', async () => {
            const request = new NextRequest('http://localhost/api/portal/posts/1/request-changes', {
                method: 'POST',
                body: JSON.stringify({
                    changeRequest: 'Please add more data about ROI',
                    severity: 'medium'
                }),
            });

            const response = await requestChanges(request, { params: { postId: '1' } });
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.success).toBe(true);
            expect(data.post.status).toBe('editing');
            expect(data.task).toBeDefined();
            expect(data.task.description).toBe('Please add more data about ROI');
        });

        it('returns error when change request is empty', async () => {
            const request = new NextRequest('http://localhost/api/portal/posts/1/request-changes', {
                method: 'POST',
                body: JSON.stringify({ changeRequest: '' }),
            });

            const response = await requestChanges(request, { params: { postId: '1' } });
            const data = await response.json();

            expect(response.status).toBe(400);
            expect(data.success).toBe(false);
            expect(data.error).toContain('required');
        });
    });

    describe('Comments API', () => {
        it('gets comments for a post', async () => {
            const request = new NextRequest('http://localhost/api/portal/posts/1/comments');

            const response = await getComments(request, { params: { postId: '1' } });
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.success).toBe(true);
            expect(data.comments).toBeDefined();
            expect(Array.isArray(data.comments)).toBe(true);
        });

        it('adds a new comment', async () => {
            const request = new NextRequest('http://localhost/api/portal/posts/1/comments', {
                method: 'POST',
                body: JSON.stringify({
                    content: 'This looks great!'
                }),
            });

            const response = await addComment(request, { params: { postId: '1' } });
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.success).toBe(true);
            expect(data.comment.content).toBe('This looks great!');
            expect(data.comment.author_role).toBe('client');
        });

        it('returns error when comment is empty', async () => {
            const request = new NextRequest('http://localhost/api/portal/posts/1/comments', {
                method: 'POST',
                body: JSON.stringify({ content: '' }),
            });

            const response = await addComment(request, { params: { postId: '1' } });
            const data = await response.json();

            expect(response.status).toBe(400);
            expect(data.success).toBe(false);
        });
    });
});
