import { supabaseAdmin } from '@/lib/supabase';

/**
 * Integration tests for real Supabase database workflows
 * These tests connect to your actual Supabase instance
 */

describe('Real Database Integration Tests', () => {
    let testClientId: string;
    let testPostId: string;

    beforeAll(async () => {
        // Clean up any existing test data
        await supabaseAdmin
            .from('clients')
            .delete()
            .like('name', 'Test Client%');
    });

    afterAll(async () => {
        // Clean up test data
        if (testPostId) {
            await supabaseAdmin
                .from('blog_posts')
                .delete()
                .eq('id', testPostId);
        }
        if (testClientId) {
            await supabaseAdmin
                .from('clients')
                .delete()
                .eq('id', testClientId);
        }
    });

    describe('Client Management Workflow', () => {
        it('should create a new client in Supabase', async () => {
            const { data, error } = await supabaseAdmin
                .from('clients')
                .insert({
                    name: 'Test Client Integration',
                    slug: 'test-client-integration',
                    website: 'testclient.com',
                    contact_email: 'test@testclient.com',
                    status: 'active'
                })
                .select()
                .single();

            expect(error).toBeNull();
            expect(data).toBeDefined();
            expect(data.name).toBe('Test Client Integration');
            expect(data.slug).toBe('test-client-integration');

            testClientId = data.id;
        });

        it('should fetch all clients from Supabase', async () => {
            const { data, error } = await supabaseAdmin
                .from('clients')
                .select('*');

            expect(error).toBeNull();
            expect(Array.isArray(data)).toBe(true);
            expect(data.length).toBeGreaterThan(0);

            const testClient = data.find(c => c.id === testClientId);
            expect(testClient).toBeDefined();
        });

        it('should update client details', async () => {
            const { data, error } = await supabaseAdmin
                .from('clients')
                .update({
                    website: 'updated-testclient.com',
                    status: 'onboarding'
                })
                .eq('id', testClientId)
                .select()
                .single();

            expect(error).toBeNull();
            expect(data.website).toBe('updated-testclient.com');
            expect(data.status).toBe('onboarding');
        });
    });

    describe('Blog Post Workflow', () => {
        it('should create a new blog post for client', async () => {
            const { data, error } = await supabaseAdmin
                .from('blog_posts')
                .insert({
                    client_id: testClientId,
                    topic: 'How to Test Integration',
                    target_keyword: 'integration testing',
                    content_type: 'how-to',
                    word_count_goal: 1500,
                    status: 'researching',
                    created_by: 'test-user-id'
                })
                .select()
                .single();

            expect(error).toBeNull();
            expect(data).toBeDefined();
            expect(data.topic).toBe('How to Test Integration');
            expect(data.client_id).toBe(testClientId);
            expect(data.status).toBe('researching');

            testPostId = data.id;
        });

        it('should fetch posts for a specific client', async () => {
            const { data, error } = await supabaseAdmin
                .from('blog_posts')
                .select('*')
                .eq('client_id', testClientId);

            expect(error).toBeNull();
            expect(Array.isArray(data)).toBe(true);
            expect(data.length).toBeGreaterThan(0);

            const testPost = data.find(p => p.id === testPostId);
            expect(testPost).toBeDefined();
        });

        it('should update post status', async () => {
            const { data, error } = await supabaseAdmin
                .from('blog_posts')
                .update({
                    status: 'ready_for_review',
                    title: 'Generated Title: How to Test Integration'
                })
                .eq('id', testPostId)
                .select()
                .single();

            expect(error).toBeNull();
            expect(data.status).toBe('ready_for_review');
            expect(data.title).toContain('How to Test Integration');
        });
    });

    describe('Client Approval Workflow', () => {
        it('should approve a post', async () => {
            const approvedBy = 'client-test-user-id';

            const { data: post, error: postError } = await supabaseAdmin
                .from('blog_posts')
                .update({
                    status: 'approved',
                    approved_at: new Date().toISOString(),
                    approved_by: approvedBy
                })
                .eq('id', testPostId)
                .select()
                .single();

            expect(postError).toBeNull();
            expect(post.status).toBe('approved');
            expect(post.approved_by).toBe(approvedBy);
            expect(post.approved_at).toBeDefined();

            // Verify activity log
            const { data: activity, error: activityError } = await supabaseAdmin
                .from('activity_log')
                .insert({
                    user_id: approvedBy,
                    action: 'post_approved',
                    resource_type: 'blog_post',
                    resource_id: testPostId,
                    details: { test: true }
                })
                .select()
                .single();

            expect(activityError).toBeNull();
            expect(activity.action).toBe('post_approved');
        });

        it('should create change request and revert to editing', async () => {
            const requestedBy = 'client-test-user-id';

            // Update post back to editing
            const { data: post, error: postError } = await supabaseAdmin
                .from('blog_posts')
                .update({
                    status: 'editing',
                    needs_revision: true
                })
                .eq('id', testPostId)
                .select()
                .single();

            expect(postError).toBeNull();
            expect(post.status).toBe('editing');
            expect(post.needs_revision).toBe(true);

            // Create review task
            const { data: task, error: taskError } = await supabaseAdmin
                .from('review_tasks')
                .insert({
                    blog_post_id: testPostId,
                    type: 'client_change_request',
                    description: 'Please add more examples',
                    severity: 'medium',
                    status: 'open',
                    created_by: requestedBy
                })
                .select()
                .single();

            expect(taskError).toBeNull();
            expect(task.description).toBe('Please add more examples');
            expect(task.status).toBe('open');
        });
    });

    describe('Comments Workflow', () => {
        it('should add comment to post', async () => {
            const { data, error } = await supabaseAdmin
                .from('comments')
                .insert({
                    blog_post_id: testPostId,
                    author_id: 'test-user-id',
                    content: 'This looks great!'
                })
                .select()
                .single();

            expect(error).toBeNull();
            expect(data.content).toBe('This looks great!');
            expect(data.blog_post_id).toBe(testPostId);
        });

        it('should fetch all comments for post', async () => {
            const { data, error } = await supabaseAdmin
                .from('comments')
                .select('*')
                .eq('blog_post_id', testPostId);

            expect(error).toBeNull();
            expect(Array.isArray(data)).toBe(true);
            expect(data.length).toBeGreaterThan(0);
        });
    });

    describe('Real API Endpoints with Database', () => {
        it('should create client via API and persist to database', async () => {
            const response = await fetch('http://localhost:3002/api/clients', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: 'API Test Client',
                    website: 'apitest.com',
                    contact_email: 'api@test.com'
                })
            });

            const result = await response.json();
            expect(result.success).toBe(true);
            expect(result.client.name).toBe('API Test Client');

            // Verify it's actually in database
            const { data } = await supabaseAdmin
                .from('clients')
                .select('*')
                .eq('id', result.client.id)
                .single();

            expect(data).toBeDefined();
            expect(data.name).toBe('API Test Client');

            // Cleanup
            await supabaseAdmin
                .from('clients')
                .delete()
                .eq('id', result.client.id);
        });
    });
});
