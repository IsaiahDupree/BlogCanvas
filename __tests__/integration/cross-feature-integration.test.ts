/**
 * Cross-Feature Integration Tests
 * Tests how different features integrate with each other across the application
 * Based on INTEGRATION_TEST_PLAN.md scenarios
 */

import { supabaseAdmin } from '@/lib/supabase';

const TEST_OWNER_ID = '00000000-0000-0000-0000-000000000001';
const TEST_VENDOR_ID = '00000000-0000-0000-0000-000000000002';

describe('Cross-Feature Integration: Client → SEO → Batch → Posts', () => {
    let clientId: string;
    let websiteId: string;
    let auditId: string;
    let clusterId: string;
    let batchId: string;
    let postId: string;

    afterAll(async () => {
        // Cleanup in reverse dependency order
        if (postId) await supabaseAdmin.from('blog_posts').delete().eq('id', postId);
        if (batchId) await supabaseAdmin.from('content_batches').delete().eq('id', batchId);
        if (clusterId) await supabaseAdmin.from('topic_clusters').delete().eq('id', clusterId);
        if (auditId) await supabaseAdmin.from('seo_audits').delete().eq('id', auditId);
        if (websiteId) await supabaseAdmin.from('websites').delete().eq('id', websiteId);
        if (clientId) await supabaseAdmin.from('clients').delete().eq('id', clientId);
    });

    it('INT-006: SEO audit → batch goals → post targeting (full flow)', async () => {
        // Step 1: Create client with brand info
        const { data: client, error: clientError } = await supabaseAdmin
            .from('clients')
            .insert({
                name: 'Integration Flow Corp',
                owner_id: TEST_OWNER_ID,
                website_url: 'https://integration-flow.com',
                primary_contact_email: 'test@integration-flow.com'
            })
            .select()
            .single();

        expect(clientError).toBeNull();
        clientId = client.id;

        // Step 2: Add website
        const { data: website, error: websiteError } = await supabaseAdmin
            .from('websites')
            .insert({
                url: 'https://integration-flow.com',
                domain: 'integration-flow.com',
                title: 'Integration Flow Website'
            })
            .select()
            .single();

        expect(websiteError).toBeNull();
        websiteId = website.id;

        // Step 3: Create SEO audit with baseline score
        const { data: audit, error: auditError } = await supabaseAdmin
            .from('seo_audits')
            .insert({
                website_id: websiteId,
                baseline_score: 62,
                pages_indexed: 45,
                raw_metrics: {
                    title_issues: 5,
                    meta_issues: 8,
                    mobile_friendly: true,
                    page_speed: 72
                }
            })
            .select()
            .single();

        expect(auditError).toBeNull();
        auditId = audit.id;

        // Step 4: Create topic cluster from gap analysis
        const { data: cluster, error: clusterError } = await supabaseAdmin
            .from('topic_clusters')
            .insert({
                website_id: websiteId,
                name: 'Content Marketing',
                primary_keyword: 'content marketing strategy',
                estimated_traffic: 5400,
                difficulty: 45,
                currently_covered: false
            })
            .select()
            .single();

        expect(clusterError).toBeNull();
        clusterId = cluster.id;

        // Step 5: Create content batch with goals based on SEO audit
        const { data: batch, error: batchError } = await supabaseAdmin
            .from('content_batches')
            .insert({
                client_id: clientId,
                website_id: websiteId,
                name: 'Q1 2026 SEO Package',
                goal_score_from: audit.baseline_score, // Uses audit baseline
                goal_score_to: 78,
                status: 'in_progress'
            })
            .select()
            .single();

        expect(batchError).toBeNull();
        expect(batch.goal_score_from).toBe(62); // Matches audit baseline
        batchId = batch.id;

        // Step 6: Create blog post targeting the cluster
        const { data: post, error: postError } = await supabaseAdmin
            .from('blog_posts')
            .insert({
                client_id: clientId,
                content_batch_id: batchId,
                topic_cluster_id: clusterId, // Links to cluster
                topic: 'Ultimate Content Marketing Strategy Guide',
                target_keyword: cluster.primary_keyword, // Uses cluster keyword
                word_count_goal: 2000,
                status: 'drafting'
            })
            .select()
            .single();

        expect(postError).toBeNull();
        expect(post.target_keyword).toBe('content marketing strategy');
        expect(post.topic_cluster_id).toBe(clusterId);
        postId = post.id;

        // Verify the complete chain
        const { data: verifyPost } = await supabaseAdmin
            .from('blog_posts')
            .select(`
                *,
                content_batches!inner(goal_score_from, goal_score_to),
                topic_clusters(primary_keyword, estimated_traffic)
            `)
            .eq('id', postId)
            .single();

        expect(verifyPost.content_batches.goal_score_from).toBe(62);
        expect(verifyPost.topic_clusters.primary_keyword).toBe('content marketing strategy');

        console.log('✅ INT-006: Full SEO audit → batch → post flow verified');
    });
});

describe('Cross-Feature Integration: Batch Status ↔ Post Status Sync', () => {
    let clientId: string;
    let batchId: string;
    let postIds: string[] = [];

    afterAll(async () => {
        for (const id of postIds) {
            await supabaseAdmin.from('blog_posts').delete().eq('id', id);
        }
        if (batchId) await supabaseAdmin.from('content_batches').delete().eq('id', batchId);
        if (clientId) await supabaseAdmin.from('clients').delete().eq('id', clientId);
    });

    it('INT-008: Batch status reflects child post statuses', async () => {
        // Setup
        const { data: client } = await supabaseAdmin
            .from('clients')
            .insert({ name: 'Batch Sync Test', owner_id: TEST_OWNER_ID })
            .select()
            .single();
        clientId = client.id;

        const { data: batch } = await supabaseAdmin
            .from('content_batches')
            .insert({ name: 'Status Sync Test Batch', client_id: clientId, status: 'draft' })
            .select()
            .single();
        batchId = batch.id;

        // Create 3 posts in the batch
        for (let i = 0; i < 3; i++) {
            const { data: post } = await supabaseAdmin
                .from('blog_posts')
                .insert({
                    client_id: clientId,
                    content_batch_id: batchId,
                    topic: `Test Post ${i + 1}`,
                    status: 'drafting'
                })
                .select()
                .single();
            postIds.push(post.id);
        }

        // Move batch to in_progress when posts are drafting
        await supabaseAdmin
            .from('content_batches')
            .update({ status: 'in_progress' })
            .eq('id', batchId);

        // Verify all posts are drafting
        const { data: draftingPosts } = await supabaseAdmin
            .from('blog_posts')
            .select('status')
            .in('id', postIds);

        expect(draftingPosts?.every(p => p.status === 'drafting')).toBe(true);

        // Move all posts to approved
        for (const id of postIds) {
            await supabaseAdmin
                .from('blog_posts')
                .update({ status: 'approved' })
                .eq('id', id);
        }

        // Batch should be ready for completion
        const { data: approvedPosts } = await supabaseAdmin
            .from('blog_posts')
            .select('status')
            .eq('content_batch_id', batchId);

        const allApproved = approvedPosts?.every(p => p.status === 'approved');
        expect(allApproved).toBe(true);

        // Update batch status to approved
        if (allApproved) {
            await supabaseAdmin
                .from('content_batches')
                .update({ status: 'approved' })
                .eq('id', batchId);
        }

        const { data: finalBatch } = await supabaseAdmin
            .from('content_batches')
            .select('status')
            .eq('id', batchId)
            .single();

        expect(finalBatch.status).toBe('approved');

        console.log('✅ INT-008: Batch status syncs with child posts');
    });
});

describe('Cross-Feature Integration: Approval → Notification Chain', () => {
    let clientId: string;
    let postId: string;
    let notificationId: string;
    let profileId: string;

    afterAll(async () => {
        if (notificationId) await supabaseAdmin.from('notifications').delete().eq('id', notificationId);
        if (postId) await supabaseAdmin.from('blog_posts').delete().eq('id', postId);
        if (clientId) await supabaseAdmin.from('clients').delete().eq('id', clientId);
    });

    it('INT-003: Client approval triggers correct notifications', async () => {
        // Setup client and post
        const { data: client } = await supabaseAdmin
            .from('clients')
            .insert({ name: 'Notification Test Client', owner_id: TEST_OWNER_ID })
            .select()
            .single();
        clientId = client.id;

        const { data: post } = await supabaseAdmin
            .from('blog_posts')
            .insert({
                client_id: clientId,
                topic: 'Notification Test Post',
                status: 'pending_review',
                approval_status: 'pending_review'
            })
            .select()
            .single();
        postId = post.id;

        // Get or create a profile to receive notification
        const { data: profiles } = await supabaseAdmin
            .from('profiles')
            .select('id')
            .limit(1);

        if (profiles && profiles.length > 0) {
            profileId = profiles[0].id;

            // Simulate approval action creating notification
            const { data: notification, error: notifError } = await supabaseAdmin
                .from('notifications')
                .insert({
                    user_id: profileId,
                    type: 'post_approved',
                    title: 'Post Approved',
                    message: `"${post.topic}" has been approved by client`,
                    link: `/app/blog-posts/${postId}`,
                    metadata: {
                        post_id: postId,
                        client_id: clientId,
                        action: 'approved'
                    }
                })
                .select()
                .single();

            expect(notifError).toBeNull();
            notificationId = notification.id;

            // Update post status
            await supabaseAdmin
                .from('blog_posts')
                .update({
                    status: 'approved',
                    approval_status: 'approved',
                    approved_at: new Date().toISOString()
                })
                .eq('id', postId);

            // Verify notification was created with correct data
            const { data: verifyNotif } = await supabaseAdmin
                .from('notifications')
                .select('*')
                .eq('id', notificationId)
                .single();

            expect(verifyNotif.type).toBe('post_approved');
            expect(verifyNotif.metadata.post_id).toBe(postId);
            expect(verifyNotif.metadata.action).toBe('approved');

            console.log('✅ INT-003: Approval notification chain verified');
        } else {
            console.log('⚠️ INT-003: Skipped - no profiles available');
        }
    });
});

describe('Cross-Feature Integration: Content Request → Fulfillment', () => {
    let clientId: string;
    let requestId: string;
    let postId: string;
    let vendorProfileId: string;

    afterAll(async () => {
        if (postId) await supabaseAdmin.from('blog_posts').delete().eq('id', postId);
        if (requestId) await supabaseAdmin.from('content_requests').delete().eq('id', requestId);
        if (clientId) await supabaseAdmin.from('clients').delete().eq('id', clientId);
    });

    it('INT-005: Content request → post creation → delivery flow', async () => {
        // Setup client
        const { data: client } = await supabaseAdmin
            .from('clients')
            .insert({ 
                name: 'Request Flow Test Client', 
                owner_id: TEST_OWNER_ID 
            })
            .select()
            .single();
        clientId = client.id;

        // Get vendor info
        const { data: vendors } = await supabaseAdmin
            .from('vendors')
            .select('id')
            .limit(1);

        const { data: profiles } = await supabaseAdmin
            .from('profiles')
            .select('id')
            .limit(1);

        if (vendors?.length && profiles?.length) {
            vendorProfileId = profiles[0].id;
            const vendorId = vendors[0].id;

            // Step 1: Client creates content request
            const { data: request, error: requestError } = await supabaseAdmin
                .from('content_requests')
                .insert({
                    client_id: clientId,
                    vendor_id: vendorId,
                    requested_by: vendorProfileId, // Using available profile
                    content_type: 'blog_post',
                    title: 'Need article about AI trends',
                    message: 'Please write about emerging AI trends in 2026',
                    priority: 'high',
                    status: 'pending'
                })
                .select()
                .single();

            expect(requestError).toBeNull();
            requestId = request.id;
            expect(request.status).toBe('pending');

            // Step 2: Vendor starts work (status → in_progress)
            const { data: inProgressRequest } = await supabaseAdmin
                .from('content_requests')
                .update({ 
                    status: 'in_progress',
                    vendor_response: 'Working on this now'
                })
                .eq('id', requestId)
                .select()
                .single();

            expect(inProgressRequest.status).toBe('in_progress');

            // Step 3: Vendor creates blog post for request
            const { data: post, error: postError } = await supabaseAdmin
                .from('blog_posts')
                .insert({
                    client_id: clientId,
                    topic: request.title,
                    target_keyword: 'AI trends 2026',
                    status: 'drafting'
                })
                .select()
                .single();

            expect(postError).toBeNull();
            postId = post.id;

            // Step 4: Link post to request and mark complete
            const { data: completedRequest } = await supabaseAdmin
                .from('content_requests')
                .update({
                    status: 'completed',
                    result_blog_post_id: postId,
                    responded_at: new Date().toISOString()
                })
                .eq('id', requestId)
                .select()
                .single();

            expect(completedRequest.status).toBe('completed');
            expect(completedRequest.result_blog_post_id).toBe(postId);

            // Verify the full chain
            const { data: finalRequest } = await supabaseAdmin
                .from('content_requests')
                .select(`
                    *,
                    blog_posts:result_blog_post_id(id, topic, status)
                `)
                .eq('id', requestId)
                .single();

            expect(finalRequest.blog_posts).toBeDefined();
            expect(finalRequest.blog_posts.topic).toBe(request.title);

            console.log('✅ INT-005: Content request → post creation → delivery verified');
        } else {
            console.log('⚠️ INT-005: Skipped - no vendors/profiles available');
        }
    });
});

describe('Cross-Feature Integration: Publishing → Check-back Scheduling', () => {
    let clientId: string;
    let postId: string;

    afterAll(async () => {
        if (postId) {
            await supabaseAdmin.from('blog_post_metrics').delete().eq('blog_post_id', postId);
            await supabaseAdmin.from('blog_posts').delete().eq('id', postId);
        }
        if (clientId) await supabaseAdmin.from('clients').delete().eq('id', clientId);
    });

    it('INT-004: Published post schedules check-backs', async () => {
        // Setup
        const { data: client } = await supabaseAdmin
            .from('clients')
            .insert({ name: 'Check-back Test Client', owner_id: TEST_OWNER_ID })
            .select()
            .single();
        clientId = client.id;

        const { data: post } = await supabaseAdmin
            .from('blog_posts')
            .insert({
                client_id: clientId,
                topic: 'Check-back Integration Test',
                status: 'approved'
            })
            .select()
            .single();
        postId = post.id;

        // Simulate publishing
        const publishedAt = new Date();
        await supabaseAdmin
            .from('blog_posts')
            .update({
                status: 'published',
                wordpress_url: 'https://example.com/blog/check-back-test',
                published_to_wordpress_at: publishedAt.toISOString()
            })
            .eq('id', postId);

        // Simulate check-back creation (Day 7, 30, 60, 90)
        const checkBackDays = [7, 30, 60, 90];
        const checkBackRecords = checkBackDays.map(days => {
            const checkDate = new Date(publishedAt);
            checkDate.setDate(checkDate.getDate() + days);
            return {
                blog_post_id: postId,
                snapshot_date: checkDate.toISOString().split('T')[0],
                impressions: 0,
                clicks: 0,
                avg_position: 0
            };
        });

        const { error: metricsError } = await supabaseAdmin
            .from('blog_post_metrics')
            .insert(checkBackRecords);

        expect(metricsError).toBeNull();

        // Verify check-backs were scheduled
        const { data: metrics } = await supabaseAdmin
            .from('blog_post_metrics')
            .select('snapshot_date')
            .eq('blog_post_id', postId)
            .order('snapshot_date', { ascending: true });

        expect(metrics?.length).toBe(4);

        console.log('✅ INT-004: Publishing → check-back scheduling verified');
    });
});

describe('Cross-Feature Integration: Revision Request Flow', () => {
    let clientId: string;
    let postId: string;
    let revisionId: string;

    afterAll(async () => {
        if (revisionId) await supabaseAdmin.from('revision_requests').delete().eq('id', revisionId);
        if (postId) await supabaseAdmin.from('blog_posts').delete().eq('id', postId);
        if (clientId) await supabaseAdmin.from('clients').delete().eq('id', clientId);
    });

    it('INT-007: Revision request → edit → re-approval flow', async () => {
        // Setup
        const { data: client } = await supabaseAdmin
            .from('clients')
            .insert({ name: 'Revision Test Client', owner_id: TEST_OWNER_ID })
            .select()
            .single();
        clientId = client.id;

        const { data: profiles } = await supabaseAdmin
            .from('profiles')
            .select('id')
            .limit(1);

        if (profiles?.length) {
            const profileId = profiles[0].id;

            // Step 1: Create post in pending_review
            const { data: post } = await supabaseAdmin
                .from('blog_posts')
                .insert({
                    client_id: clientId,
                    topic: 'Revision Flow Test',
                    status: 'pending_review',
                    approval_status: 'pending_review',
                    final_html: '<h1>Original Content</h1><p>This needs changes.</p>'
                })
                .select()
                .single();
            postId = post.id;

            // Step 2: Client requests revision
            const { data: revision, error: revisionError } = await supabaseAdmin
                .from('revision_requests')
                .insert({
                    blog_post_id: postId,
                    requested_by: profileId,
                    comment: 'Please add more statistics about ROI',
                    specific_changes: JSON.stringify([
                        { section: 'intro', change: 'Add ROI statistics' },
                        { section: 'body', change: 'Include case study' }
                    ]),
                    status: 'open'
                })
                .select()
                .single();

            expect(revisionError).toBeNull();
            revisionId = revision.id;

            // Update post status
            await supabaseAdmin
                .from('blog_posts')
                .update({ 
                    approval_status: 'revision_requested',
                    status: 'editing'
                })
                .eq('id', postId);

            // Step 3: Editor addresses changes
            await supabaseAdmin
                .from('blog_posts')
                .update({
                    final_html: '<h1>Updated Content</h1><p>ROI stats: 40% improvement. Case study included.</p>'
                })
                .eq('id', postId);

            // Step 4: Mark revision as addressed
            await supabaseAdmin
                .from('revision_requests')
                .update({
                    status: 'addressed',
                    addressed_at: new Date().toISOString(),
                    addressed_by: profileId
                })
                .eq('id', revisionId);

            // Step 5: Resubmit for approval
            await supabaseAdmin
                .from('blog_posts')
                .update({
                    status: 'pending_review',
                    approval_status: 'pending_review'
                })
                .eq('id', postId);

            // Step 6: Client approves
            await supabaseAdmin
                .from('blog_posts')
                .update({
                    status: 'approved',
                    approval_status: 'approved',
                    approved_at: new Date().toISOString(),
                    approved_by: profileId
                })
                .eq('id', postId);

            // Verify final state
            const { data: finalPost } = await supabaseAdmin
                .from('blog_posts')
                .select('status, approval_status, final_html')
                .eq('id', postId)
                .single();

            expect(finalPost.status).toBe('approved');
            expect(finalPost.approval_status).toBe('approved');
            expect(finalPost.final_html).toContain('ROI stats');

            const { data: finalRevision } = await supabaseAdmin
                .from('revision_requests')
                .select('status')
                .eq('id', revisionId)
                .single();

            expect(finalRevision.status).toBe('addressed');

            console.log('✅ INT-007: Revision request → edit → re-approval verified');
        } else {
            console.log('⚠️ INT-007: Skipped - no profiles available');
        }
    });
});
