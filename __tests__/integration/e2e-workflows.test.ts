import { supabaseAdmin } from '@/lib/supabase';

/**
 * End-to-End workflow test simulating complete user journeys
 * From client creation → post creation → review → approval
 */

describe('E2E: Complete Blog Creation Workflow', () => {
    let clientId: string;
    let postId: string;

    beforeAll(async () => {
        // Clean up test data
        await supabaseAdmin
            .from('clients')
            .delete()
            .like('name', 'E2E Test%');
    });

    afterAll(async () => {
        // Cleanup
        if (postId) {
            await supabaseAdmin.from('blog_posts').delete().eq('id', postId);
        }
        if (clientId) {
            await supabaseAdmin.from('clients').delete().eq('id', clientId);
        }
    });

    it('WORKFLOW: Merchant creates client → creates post →client reviews → approves', async () => {
        // Step 1: Merchant creates client
        const { data: client, error: clientError } = await supabaseAdmin
            .from('clients')
            .insert({
                name: 'E2E Test Company',
                slug: 'e2e-test-company',
                website: 'e2etest.com',
                contact_email: 'test@e2e.com',
                status: 'active',
                product_service_summary: 'AI CRM Platform',
                target_audience: 'B2B sales teams'
            })
            .select()
            .single();

        expect(clientError).toBeNull();
        expect(client).toBeDefined();
        clientId = client.id;

        console.log('✓ Client created:', client.name);

        // Step 2: Merchant creates blog post for client
        const { data: post, error: postError } = await supabaseAdmin
            .from('blog_posts')
            .insert({
                client_id: clientId,
                topic: 'How AI CRM Boosts Sales',
                target_keyword: 'AI CRM',
                content_type: 'how-to',
                word_count_goal: 1500,
                status: 'drafting',
                created_by: 'merchant-user-id'
            })
            .select()
            .single();

        expect(postError).toBeNull();
        postId = post.id;

        console.log('✓ Post created:', post.topic);

        // Step 3: Simulate AI pipeline completion
        const { data: draftedPost, error: draftError } = await supabaseAdmin
            .from('blog_posts')
            .update({
                status: 'ready_for_review',
                title: 'How AI CRM Boosts Sales by 40%',
                content: '<h2>Introduction</h2><p>AI is transforming CRM...</p>'
            })
            .eq('id', postId)
            .select()
            .single();

        expect(draftError).toBeNull();
        expect(draftedPost.status).toBe('ready_for_review');

        console.log('✓ Draft completed and sent for review');

        // Step 4: Client adds comment
        const { data: comment, error: commentError } = await supabaseAdmin
            .from('comments')
            .insert({
                blog_post_id: postId,
                author_id: 'client-user-id',
                content: 'Can we add more statistics about ROI?'
            })
            .select()
            .single();

        expect(commentError).toBeNull();

        console.log('✓ Client added comment');

        // Step 5: Client approves post
        const { data: approvedPost, error: approveError } = await supabaseAdmin
            .from('blog_posts')
            .update({
                status: 'approved',
                approved_at: new Date().toISOString(),
                approved_by: 'client-user-id'
            })
            .eq('id', postId)
            .select()
            .single();

        expect(approveError).toBeNull();
        expect(approvedPost.status).toBe('approved');
        expect(approvedPost.approved_by).toBe('client-user-id');

        console.log('✓ Client approved post');

        // Step 6: Merchant publishes
        const { data: publishedPost, error: publishError } = await supabaseAdmin
            .from('blog_posts')
            .update({
                status: 'published',
                published_at: new Date().toISOString()
            })
            .eq('id', postId)
            .select()
            .single();

        expect(publishError).toBeNull();
        expect(publishedPost.status).toBe('published');

        console.log('✓ Post published');

        // Verify complete workflow
        const { data: finalPost } = await supabaseAdmin
            .from('blog_posts')
            .select('*')
            .eq('id', postId)
            .single();

        expect(finalPost.status).toBe('published');
        expect(finalPost.approved_by).toBeDefined();
        expect(finalPost.published_at).toBeDefined();

        console.log('\n🎉 Complete workflow successful!');
    });

    it('WORKFLOW: Client requests changes → merchant edits → client approves', async () => {
        // Create test client and post
        const { data: client } = await supabaseAdmin
            .from('clients')
            .insert({
                name: 'E2E Test Client 2',
                slug: 'e2e-test-client-2',
                status: 'active'
            })
            .select()
            .single();

        const { data: post } = await supabaseAdmin
            .from('blog_posts')
            .insert({
                client_id: client.id,
                topic: 'CRM Best Practices',
                status: 'ready_for_review',
                created_by: 'merchant-user-id'
            })
            .select()
            .single();

        console.log('✓ Setup: Client and post created');

        // Client requests changes
        const { data: editingPost } = await supabaseAdmin
            .from('blog_posts')
            .update({
                status: 'editing',
                needs_revision: true
            })
            .eq('id', post.id)
            .select()
            .single();

        const { data: task } = await supabaseAdmin
            .from('review_tasks')
            .insert({
                blog_post_id: post.id,
                type: 'client_change_request',
                description: 'Add section about automation',
                severity: 'medium',
                status: 'open',
                created_by: 'client-user-id'
            })
            .select()
            .single();

        expect(editingPost.status).toBe('editing');
        expect(task.description).toContain('automation');

        console.log('✓ Client requested changes');

        // Merchant completes changes
        const { data: updatedTask } = await supabaseAdmin
            .from('review_tasks')
            .update({ status: 'complete' })
            .eq('id', task.id)
            .select()
            .single();

        const { data: resubmittedPost } = await supabaseAdmin
            .from('blog_posts')
            .update({
                status: 'ready_for_review',
                needs_revision: false
            })
            .eq('id', post.id)
            .select()
            .single();

        expect(updatedTask.status).toBe('complete');
        expect(resubmittedPost.status).toBe('ready_for_review');

        console.log('✓ Merchant completed changes');

        // Client approves
        const { data: finalPost } = await supabaseAdmin
            .from('blog_posts')
            .update({
                status: 'approved',
                approved_by: 'client-user-id',
                approved_at: new Date().toISOString()
            })
            .eq('id', post.id)
            .select()
            .single();

        expect(final Post.status).toBe('approved');

        console.log('✓ Client approved after revisions');
        console.log('\n🎉 Change request workflow successful!');

        // Cleanup
        await supabaseAdmin.from('blog_posts').delete().eq('id', post.id);
        await supabaseAdmin.from('clients').delete().eq('id', client.id);
    });
});
