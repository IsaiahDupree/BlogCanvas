/**
 * Cross-Portal Data Synchronization Tests
 * Tests how vendor updates affect client pages and vice versa
 * Based on CROSS_PORTAL_DATA_FLOW.md
 */

import { supabaseAdmin } from '@/lib/supabase';

const TEST_OWNER_ID = '00000000-0000-0000-0000-000000000001';

describe('Cross-Portal Sync: Vendor Actions → Client Portal', () => {
    let clientId: string;
    let postId: string;
    let vendorProfileId: string;
    let clientProfileId: string;
    let notificationIds: string[] = [];

    beforeAll(async () => {
        // Get profiles for testing
        const { data: profiles } = await supabaseAdmin
            .from('profiles')
            .select('id')
            .limit(2);

        if (profiles && profiles.length >= 1) {
            vendorProfileId = profiles[0].id;
            clientProfileId = profiles.length > 1 ? profiles[1].id : profiles[0].id;
        }
    });

    afterAll(async () => {
        for (const id of notificationIds) {
            await supabaseAdmin.from('notifications').delete().eq('id', id);
        }
        if (postId) await supabaseAdmin.from('blog_posts').delete().eq('id', postId);
        if (clientId) await supabaseAdmin.from('clients').delete().eq('id', clientId);
    });

    describe('Vendor Creates Post → Client Sees in Portal', () => {
        it('should make new post visible to client after creation', async () => {
            // Setup client
            const { data: client } = await supabaseAdmin
                .from('clients')
                .insert({
                    name: 'Cross-Portal Test Client',
                    owner_id: TEST_OWNER_ID
                })
                .select()
                .single();
            clientId = client.id;

            // Vendor creates post
            const { data: post, error } = await supabaseAdmin
                .from('blog_posts')
                .insert({
                    client_id: clientId,
                    topic: 'Vendor Created Post',
                    target_keyword: 'cross portal test',
                    status: 'drafting'
                })
                .select()
                .single();

            expect(error).toBeNull();
            postId = post.id;

            // Simulate client portal query (filtered by client_id)
            const { data: clientPosts } = await supabaseAdmin
                .from('blog_posts')
                .select('*')
                .eq('client_id', clientId);

            // Client should see the post
            expect(clientPosts?.length).toBeGreaterThan(0);
            expect(clientPosts?.find(p => p.id === postId)).toBeDefined();

            console.log('✅ Vendor creates post → Client sees in portal');
        });
    });

    describe('Vendor Showcases Post → Client Approval Queue', () => {
        it('should appear in client approval queue after showcase', async () => {
            if (!postId || !vendorProfileId) {
                console.log('⚠️ Skipped - dependencies not met');
                return;
            }

            // Vendor showcases post for client review
            const { error: showcaseError } = await supabaseAdmin
                .from('blog_posts')
                .update({
                    status: 'ready_for_review',
                    approval_status: 'pending_review',
                    showcased_at: new Date().toISOString(),
                    showcased_by: vendorProfileId,
                    showcased_message: 'Please review this content for accuracy'
                })
                .eq('id', postId);

            expect(showcaseError).toBeNull();

            // Create notification for client
            if (clientProfileId) {
                const { data: notification } = await supabaseAdmin
                    .from('notifications')
                    .insert({
                        user_id: clientProfileId,
                        type: 'content_ready_for_review',
                        title: 'New Content Ready for Review',
                        message: 'Vendor Created Post is ready for your review',
                        link: `/portal/approvals/${postId}`,
                        metadata: { post_id: postId }
                    })
                    .select()
                    .single();
                notificationIds.push(notification.id);
            }

            // Simulate client portal approvals query
            const { data: pendingApprovals } = await supabaseAdmin
                .from('blog_posts')
                .select('*')
                .eq('client_id', clientId)
                .eq('approval_status', 'pending_review');

            // Post should be in client's approval queue
            expect(pendingApprovals?.find(p => p.id === postId)).toBeDefined();
            expect(pendingApprovals?.[0]?.showcased_message).toBe('Please review this content for accuracy');

            console.log('✅ Vendor showcases → Client sees in approval queue');
        });
    });

    describe('Vendor Publishes Post → Client Sees Live URL', () => {
        it('should show WordPress URL to client after publishing', async () => {
            if (!postId) {
                console.log('⚠️ Skipped - dependencies not met');
                return;
            }

            // First approve the post
            await supabaseAdmin
                .from('blog_posts')
                .update({
                    status: 'approved',
                    approval_status: 'approved'
                })
                .eq('id', postId);

            // Vendor publishes to WordPress
            const wordpressUrl = 'https://example.com/blog/vendor-created-post';
            const { error: publishError } = await supabaseAdmin
                .from('blog_posts')
                .update({
                    status: 'published',
                    approval_status: 'published',
                    wordpress_url: wordpressUrl,
                    wordpress_post_id: 12345,
                    published_to_wordpress_at: new Date().toISOString()
                })
                .eq('id', postId);

            expect(publishError).toBeNull();

            // Simulate client portal post view
            const { data: clientPost } = await supabaseAdmin
                .from('blog_posts')
                .select('status, wordpress_url')
                .eq('id', postId)
                .eq('client_id', clientId)
                .single();

            // Client should see published status and URL
            expect(clientPost?.status).toBe('published');
            expect(clientPost?.wordpress_url).toBe(wordpressUrl);

            console.log('✅ Vendor publishes → Client sees live URL');
        });
    });
});

describe('Cross-Portal Sync: Client Actions → Vendor Portal', () => {
    let clientId: string;
    let postId: string;
    let vendorProfileId: string;
    let clientProfileId: string;
    let notificationIds: string[] = [];

    beforeAll(async () => {
        const { data: profiles } = await supabaseAdmin
            .from('profiles')
            .select('id')
            .limit(2);

        if (profiles && profiles.length >= 1) {
            vendorProfileId = profiles[0].id;
            clientProfileId = profiles.length > 1 ? profiles[1].id : profiles[0].id;
        }

        // Setup
        const { data: client } = await supabaseAdmin
            .from('clients')
            .insert({ name: 'Client Action Test', owner_id: TEST_OWNER_ID })
            .select()
            .single();
        clientId = client.id;

        const { data: post } = await supabaseAdmin
            .from('blog_posts')
            .insert({
                client_id: clientId,
                topic: 'Client Action Test Post',
                status: 'ready_for_review',
                approval_status: 'pending_review'
            })
            .select()
            .single();
        postId = post.id;
    });

    afterAll(async () => {
        for (const id of notificationIds) {
            await supabaseAdmin.from('notifications').delete().eq('id', id);
        }
        if (postId) await supabaseAdmin.from('blog_posts').delete().eq('id', postId);
        if (clientId) await supabaseAdmin.from('clients').delete().eq('id', clientId);
    });

    describe('Client Approves Post → Vendor Dashboard Updates', () => {
        it('should update vendor dashboard when client approves', async () => {
            if (!vendorProfileId || !clientProfileId) {
                console.log('⚠️ Skipped - profiles not available');
                return;
            }

            // Client approves the post
            const { error: approveError } = await supabaseAdmin
                .from('blog_posts')
                .update({
                    status: 'approved',
                    approval_status: 'approved',
                    approved_at: new Date().toISOString(),
                    approved_by: clientProfileId
                })
                .eq('id', postId);

            expect(approveError).toBeNull();

            // Create notification for vendor
            const { data: notification } = await supabaseAdmin
                .from('notifications')
                .insert({
                    user_id: vendorProfileId,
                    type: 'post_approved',
                    title: 'Post Approved',
                    message: 'Client Action Test Post has been approved',
                    link: `/app/blog-posts/${postId}`,
                    metadata: {
                        post_id: postId,
                        approved_by: clientProfileId
                    }
                })
                .select()
                .single();
            notificationIds.push(notification.id);

            // Simulate vendor dashboard query
            const { data: approvedPosts } = await supabaseAdmin
                .from('blog_posts')
                .select('*')
                .eq('approval_status', 'approved');

            // Vendor should see approved post
            const vendorPost = approvedPosts?.find(p => p.id === postId);
            expect(vendorPost).toBeDefined();
            expect(vendorPost?.approved_by).toBe(clientProfileId);

            // Vendor should see notification
            const { data: vendorNotifications } = await supabaseAdmin
                .from('notifications')
                .select('*')
                .eq('user_id', vendorProfileId)
                .eq('type', 'post_approved');

            expect(vendorNotifications?.find(n => n.metadata?.post_id === postId)).toBeDefined();

            console.log('✅ Client approves → Vendor sees in dashboard + notification');
        });
    });

    describe('Client Requests Revision → Vendor Review Queue', () => {
        it('should appear in vendor review queue with revision details', async () => {
            if (!vendorProfileId || !clientProfileId) {
                console.log('⚠️ Skipped - profiles not available');
                return;
            }

            // Create new post for revision test
            const { data: revisionPost } = await supabaseAdmin
                .from('blog_posts')
                .insert({
                    client_id: clientId,
                    topic: 'Revision Test Post',
                    status: 'ready_for_review',
                    approval_status: 'pending_review'
                })
                .select()
                .single();

            // Client requests revision
            const revisionReason = 'Please add more statistics and examples';
            const { error: revisionError } = await supabaseAdmin
                .from('blog_posts')
                .update({
                    approval_status: 'revision_requested',
                    rejection_reason: revisionReason
                })
                .eq('id', revisionPost.id);

            expect(revisionError).toBeNull();

            // Create revision request record
            const { data: revisionRequest } = await supabaseAdmin
                .from('revision_requests')
                .insert({
                    blog_post_id: revisionPost.id,
                    requested_by: clientProfileId,
                    comment: revisionReason,
                    status: 'open'
                })
                .select()
                .single();

            // Create notification for vendor
            const { data: notification } = await supabaseAdmin
                .from('notifications')
                .insert({
                    user_id: vendorProfileId,
                    type: 'revision_requested',
                    title: 'Revision Requested',
                    message: `Client requested changes: ${revisionReason}`,
                    link: `/app/blog-posts/${revisionPost.id}`,
                    metadata: {
                        post_id: revisionPost.id,
                        revision_id: revisionRequest.id
                    }
                })
                .select()
                .single();
            notificationIds.push(notification.id);

            // Simulate vendor review queue query
            const { data: revisionPosts } = await supabaseAdmin
                .from('blog_posts')
                .select('*, revision_requests(*)')
                .eq('approval_status', 'revision_requested');

            // Vendor should see post needing revision
            const vendorPost = revisionPosts?.find(p => p.id === revisionPost.id);
            expect(vendorPost).toBeDefined();
            expect(vendorPost?.rejection_reason).toBe(revisionReason);

            // Cleanup
            await supabaseAdmin.from('revision_requests').delete().eq('id', revisionRequest.id);
            await supabaseAdmin.from('blog_posts').delete().eq('id', revisionPost.id);

            console.log('✅ Client requests revision → Vendor sees in review queue');
        });
    });
});

describe('Cross-Portal Sync: Content Requests Flow', () => {
    let clientId: string;
    let requestId: string;
    let vendorId: string;
    let vendorProfileId: string;
    let clientProfileId: string;
    let notificationIds: string[] = [];

    beforeAll(async () => {
        const { data: vendors } = await supabaseAdmin.from('vendors').select('id').limit(1);
        const { data: profiles } = await supabaseAdmin.from('profiles').select('id').limit(2);

        if (vendors && vendors.length > 0) vendorId = vendors[0].id;
        if (profiles && profiles.length >= 1) {
            vendorProfileId = profiles[0].id;
            clientProfileId = profiles.length > 1 ? profiles[1].id : profiles[0].id;
        }
    });

    afterAll(async () => {
        for (const id of notificationIds) {
            await supabaseAdmin.from('notifications').delete().eq('id', id);
        }
        if (requestId) await supabaseAdmin.from('content_requests').delete().eq('id', requestId);
        if (clientId) await supabaseAdmin.from('clients').delete().eq('id', clientId);
    });

    describe('Client Submits Request → Vendor Sees in Dashboard', () => {
        it('should show new request in vendor requests page', async () => {
            if (!vendorId || !vendorProfileId || !clientProfileId) {
                console.log('⚠️ Skipped - vendor/profiles not available');
                return;
            }

            // Setup
            const { data: client } = await supabaseAdmin
                .from('clients')
                .insert({ name: 'Content Request Test Client', owner_id: TEST_OWNER_ID })
                .select()
                .single();
            clientId = client.id;

            // Client submits content request
            const { data: request, error: requestError } = await supabaseAdmin
                .from('content_requests')
                .insert({
                    client_id: clientId,
                    vendor_id: vendorId,
                    requested_by: clientProfileId,
                    content_type: 'blog_post',
                    title: 'Need article about cloud security',
                    message: 'We need a comprehensive guide on cloud security best practices',
                    priority: 'high',
                    status: 'pending'
                })
                .select()
                .single();

            expect(requestError).toBeNull();
            requestId = request.id;

            // Create notification for vendor
            const { data: notification } = await supabaseAdmin
                .from('notifications')
                .insert({
                    user_id: vendorProfileId,
                    type: 'new_content_request',
                    title: 'New Content Request',
                    message: `High priority request: ${request.title}`,
                    link: `/app/requests/${requestId}`,
                    metadata: {
                        request_id: requestId,
                        priority: 'high'
                    }
                })
                .select()
                .single();
            notificationIds.push(notification.id);

            // Simulate vendor requests page query
            const { data: vendorRequests } = await supabaseAdmin
                .from('content_requests')
                .select('*, clients(name)')
                .eq('vendor_id', vendorId);

            // Vendor should see the request
            const vendorRequest = vendorRequests?.find(r => r.id === requestId);
            expect(vendorRequest).toBeDefined();
            expect(vendorRequest?.priority).toBe('high');
            expect(vendorRequest?.clients?.name).toBe('Content Request Test Client');

            console.log('✅ Client submits request → Vendor sees in dashboard');
        });
    });

    describe('Vendor Updates Request Status → Client Sees Update', () => {
        it('should show status change to client', async () => {
            if (!requestId || !clientProfileId) {
                console.log('⚠️ Skipped - dependencies not met');
                return;
            }

            // Vendor starts working on request
            const { error: updateError } = await supabaseAdmin
                .from('content_requests')
                .update({
                    status: 'in_progress',
                    vendor_response: 'Working on this now, will have draft by Friday'
                })
                .eq('id', requestId);

            expect(updateError).toBeNull();

            // Create notification for client
            const { data: notification } = await supabaseAdmin
                .from('notifications')
                .insert({
                    user_id: clientProfileId,
                    type: 'request_status_update',
                    title: 'Request Update',
                    message: 'Your content request is now in progress',
                    link: `/portal/requests/${requestId}`,
                    metadata: {
                        request_id: requestId,
                        new_status: 'in_progress'
                    }
                })
                .select()
                .single();
            notificationIds.push(notification.id);

            // Simulate client request view
            const { data: clientRequest } = await supabaseAdmin
                .from('content_requests')
                .select('*')
                .eq('id', requestId)
                .eq('client_id', clientId)
                .single();

            // Client should see updated status
            expect(clientRequest?.status).toBe('in_progress');
            expect(clientRequest?.vendor_response).toContain('Working on this now');

            console.log('✅ Vendor updates request → Client sees status change');
        });
    });
});

describe('Cross-Portal Sync: Notification Counts', () => {
    let profileId: string;
    let notificationIds: string[] = [];

    beforeAll(async () => {
        const { data: profiles } = await supabaseAdmin.from('profiles').select('id').limit(1);
        if (profiles && profiles.length > 0) profileId = profiles[0].id;
    });

    afterAll(async () => {
        for (const id of notificationIds) {
            await supabaseAdmin.from('notifications').delete().eq('id', id);
        }
    });

    it('should correctly count unread notifications per user', async () => {
        if (!profileId) {
            console.log('⚠️ Skipped - no profile available');
            return;
        }

        // Create multiple unread notifications
        const notificationTypes = ['post_approved', 'revision_requested', 'new_content_request'];
        for (const type of notificationTypes) {
            const { data } = await supabaseAdmin
                .from('notifications')
                .insert({
                    user_id: profileId,
                    type,
                    title: `Test ${type}`,
                    message: `Test message for ${type}`,
                    read: false
                })
                .select()
                .single();
            notificationIds.push(data.id);
        }

        // Query unread count (as portal header badge would)
        const { count: unreadCount } = await supabaseAdmin
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', profileId)
            .eq('read', false);

        expect(unreadCount).toBeGreaterThanOrEqual(3);

        // Mark one as read
        await supabaseAdmin
            .from('notifications')
            .update({ read: true, read_at: new Date().toISOString() })
            .eq('id', notificationIds[0]);

        // Verify count decreased
        const { count: newCount } = await supabaseAdmin
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', profileId)
            .eq('read', false);

        expect(newCount).toBe((unreadCount || 0) - 1);

        console.log('✅ Notification badge counts sync correctly');
    });
});

describe('Cross-Portal Sync: Batch Progress Updates', () => {
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

    it('should show batch progress to client as posts complete', async () => {
        // Setup
        const { data: client } = await supabaseAdmin
            .from('clients')
            .insert({ name: 'Batch Progress Test', owner_id: TEST_OWNER_ID })
            .select()
            .single();
        clientId = client.id;

        const { data: batch } = await supabaseAdmin
            .from('content_batches')
            .insert({
                client_id: clientId,
                name: 'Progress Test Batch',
                status: 'in_progress'
            })
            .select()
            .single();
        batchId = batch.id;

        // Create 5 posts in batch
        for (let i = 0; i < 5; i++) {
            const { data: post } = await supabaseAdmin
                .from('blog_posts')
                .insert({
                    client_id: clientId,
                    content_batch_id: batchId,
                    topic: `Batch Post ${i + 1}`,
                    status: 'drafting'
                })
                .select()
                .single();
            postIds.push(post.id);
        }

        // Simulate client batch view - calculate progress
        const { data: batchPosts } = await supabaseAdmin
            .from('blog_posts')
            .select('status')
            .eq('content_batch_id', batchId);

        const total = batchPosts?.length || 0;
        const completed = batchPosts?.filter(p => 
            ['approved', 'published'].includes(p.status)
        ).length || 0;

        expect(total).toBe(5);
        expect(completed).toBe(0);

        // Vendor completes 3 posts
        for (let i = 0; i < 3; i++) {
            await supabaseAdmin
                .from('blog_posts')
                .update({ status: 'approved' })
                .eq('id', postIds[i]);
        }

        // Check updated progress
        const { data: updatedPosts } = await supabaseAdmin
            .from('blog_posts')
            .select('status')
            .eq('content_batch_id', batchId);

        const newCompleted = updatedPosts?.filter(p => 
            ['approved', 'published'].includes(p.status)
        ).length || 0;

        expect(newCompleted).toBe(3);

        const progress = Math.round((newCompleted / total) * 100);
        expect(progress).toBe(60);

        console.log('✅ Batch progress updates as posts complete: 60%');
    });
});
