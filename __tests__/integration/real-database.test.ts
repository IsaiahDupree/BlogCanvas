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
        const { data: existingClients } = await supabaseAdmin
            .from('clients')
            .select('id')
            .ilike('name', 'Test Client%');
        
        if (existingClients && existingClients.length > 0) {
            const ids = existingClients.map(c => c.id);
            await supabaseAdmin
                .from('clients')
                .delete()
                .in('id', ids);
        }
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
            // Create a test owner_id (UUID)
            const testOwnerId = '00000000-0000-0000-0000-000000000001';
            
            const { data, error } = await supabaseAdmin
                .from('clients')
                .insert({
                    name: 'Test Client Integration',
                    owner_id: testOwnerId,
                    primary_contact_email: 'test@testclient.com',
                    website_url: 'testclient.com',
                    has_website: true
                })
                .select()
                .single();

            expect(error).toBeNull();
            expect(data).toBeDefined();
            expect(data.name).toBe('Test Client Integration');
            expect(data.primary_contact_email).toBe('test@testclient.com');
            expect(data.website_url).toBe('testclient.com');

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
                    website_url: 'updated-testclient.com',
                    primary_contact_email: 'updated@testclient.com'
                })
                .eq('id', testClientId)
                .select()
                .single();

            expect(error).toBeNull();
            expect(data.website_url).toBe('updated-testclient.com');
            expect(data.primary_contact_email).toBe('updated@testclient.com');
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
                    word_count_goal: 1500,
                    status: 'researching'
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
                    topic: 'Updated: How to Test Integration'
                })
                .eq('id', testPostId)
                .select()
                .single();

            expect(error).toBeNull();
            expect(data.status).toBe('ready_for_review');
            expect(data.topic).toContain('How to Test Integration');
        });
    });

    describe('Client Approval Workflow', () => {
        it('should approve a post', async () => {
            const { data: post, error: postError } = await supabaseAdmin
                .from('blog_posts')
                .update({
                    status: 'approved'
                })
                .eq('id', testPostId)
                .select()
                .single();

            expect(postError).toBeNull();
            expect(post.status).toBe('approved');
        });

        it('should create change request and revert to editing', async () => {
            // Update post back to editing
            const { data: post, error: postError } = await supabaseAdmin
                .from('blog_posts')
                .update({
                    status: 'editing'
                })
                .eq('id', testPostId)
                .select()
                .single();

            expect(postError).toBeNull();
            expect(post.status).toBe('editing');

            // Create review task
            const { data: task, error: taskError } = await supabaseAdmin
                .from('review_tasks')
                .insert({
                    blog_post_id: testPostId,
                    description: 'Please add more examples',
                    status: 'pending'
                })
                .select()
                .single();

            expect(taskError).toBeNull();
            expect(task.description).toBe('Please add more examples');
            expect(task.status).toBe('pending');
        });
    });

    describe('Comments Workflow', () => {
        it('should add comment to post', async () => {
            const testUserId = '00000000-0000-0000-0000-000000000002';
            
            const { data, error } = await supabaseAdmin
                .from('comments')
                .insert({
                    blog_post_id: testPostId,
                    user_id: testUserId,
                    author_name: 'Test User',
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
        it.skip('should create client via API and persist to database', async () => {
            // Skip this test as it requires a running server
            // This test should be run manually when the server is running
            const response = await fetch('http://localhost:3000/api/clients', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: 'API Test Client',
                    website_url: 'apitest.com',
                    primary_contact_email: 'api@test.com',
                    owner_id: '00000000-0000-0000-0000-000000000001'
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
