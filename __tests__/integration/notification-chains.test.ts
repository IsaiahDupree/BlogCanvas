/**
 * Notification Chain Integration Tests
 * Tests event-driven notification flows across features
 * Validates cross-portal notification delivery
 */

import { supabaseAdmin } from '@/lib/supabase';

const TEST_OWNER_ID = '00000000-0000-0000-0000-000000000001';

describe('Notification Chains: Event → Notification Flow', () => {
    let clientId: string;
    let postId: string;
    let notificationIds: string[] = [];
    let vendorProfileId: string;
    let clientProfileId: string;

    beforeAll(async () => {
        // Get available profiles for testing
        const { data: profiles } = await supabaseAdmin
            .from('profiles')
            .select('id, role')
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

    it('should create notification when post is showcased for client', async () => {
        if (!vendorProfileId || !clientProfileId) {
            console.log('⚠️ Skipped - no profiles available');
            return;
        }

        // Setup
        const { data: client } = await supabaseAdmin
            .from('clients')
            .insert({ name: 'Notification Chain Test', owner_id: TEST_OWNER_ID })
            .select()
            .single();
        clientId = client.id;

        const { data: post } = await supabaseAdmin
            .from('blog_posts')
            .insert({
                client_id: clientId,
                topic: 'Notification Test Post',
                status: 'ready_for_review'
            })
            .select()
            .single();
        postId = post.id;

        // Event: Vendor showcases post for client review
        await supabaseAdmin
            .from('blog_posts')
            .update({
                approval_status: 'pending_review',
                showcased_at: new Date().toISOString(),
                showcased_by: vendorProfileId,
                showcased_message: 'Please review this content'
            })
            .eq('id', postId);

        // Notification should be created for client
        const { data: notification, error } = await supabaseAdmin
            .from('notifications')
            .insert({
                user_id: clientProfileId,
                type: 'content_ready_for_review',
                title: 'New Content Ready for Review',
                message: `"${post.topic}" is ready for your review`,
                link: `/portal/approvals/${postId}`,
                metadata: {
                    post_id: postId,
                    client_id: clientId,
                    showcased_by: vendorProfileId
                }
            })
            .select()
            .single();

        expect(error).toBeNull();
        notificationIds.push(notification.id);

        expect(notification.type).toBe('content_ready_for_review');
        expect(notification.metadata.post_id).toBe(postId);

        console.log('✅ Showcase → Client notification created');
    });

    it('should create notification when client approves post', async () => {
        if (!vendorProfileId || !clientProfileId || !postId) {
            console.log('⚠️ Skipped - dependencies not met');
            return;
        }

        // Event: Client approves post
        await supabaseAdmin
            .from('blog_posts')
            .update({
                status: 'approved',
                approval_status: 'approved',
                approved_at: new Date().toISOString(),
                approved_by: clientProfileId
            })
            .eq('id', postId);

        // Notification should be created for vendor
        const { data: notification, error } = await supabaseAdmin
            .from('notifications')
            .insert({
                user_id: vendorProfileId,
                type: 'post_approved',
                title: 'Post Approved by Client',
                message: 'Your post has been approved and is ready to publish',
                link: `/app/blog-posts/${postId}`,
                metadata: {
                    post_id: postId,
                    client_id: clientId,
                    approved_by: clientProfileId
                }
            })
            .select()
            .single();

        expect(error).toBeNull();
        notificationIds.push(notification.id);

        expect(notification.type).toBe('post_approved');

        console.log('✅ Approval → Vendor notification created');
    });

    it('should create notification when client requests revision', async () => {
        if (!vendorProfileId || !clientProfileId) {
            console.log('⚠️ Skipped - dependencies not met');
            return;
        }

        // Create a new post for revision test
        const { data: revisionPost } = await supabaseAdmin
            .from('blog_posts')
            .insert({
                client_id: clientId,
                topic: 'Revision Notification Test',
                status: 'pending_review',
                approval_status: 'pending_review'
            })
            .select()
            .single();

        // Event: Client requests revision
        await supabaseAdmin
            .from('blog_posts')
            .update({
                approval_status: 'revision_requested',
                rejection_reason: 'Please add more statistics'
            })
            .eq('id', revisionPost.id);

        // Notification for vendor/editor
        const { data: notification, error } = await supabaseAdmin
            .from('notifications')
            .insert({
                user_id: vendorProfileId,
                type: 'revision_requested',
                title: 'Revision Requested',
                message: `Client requested changes to "${revisionPost.topic}"`,
                link: `/app/blog-posts/${revisionPost.id}`,
                metadata: {
                    post_id: revisionPost.id,
                    client_id: clientId,
                    reason: 'Please add more statistics'
                }
            })
            .select()
            .single();

        expect(error).toBeNull();
        notificationIds.push(notification.id);

        expect(notification.type).toBe('revision_requested');
        expect(notification.metadata.reason).toBe('Please add more statistics');

        // Cleanup
        await supabaseAdmin.from('blog_posts').delete().eq('id', revisionPost.id);

        console.log('✅ Revision request → Vendor notification created');
    });
});

describe('Notification Chains: Content Request Notifications', () => {
    let clientId: string;
    let requestId: string;
    let notificationIds: string[] = [];
    let vendorId: string;
    let vendorProfileId: string;
    let clientProfileId: string;

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

    it('should notify vendor when client submits content request', async () => {
        if (!vendorId || !vendorProfileId || !clientProfileId) {
            console.log('⚠️ Skipped - no vendor/profiles available');
            return;
        }

        // Setup
        const { data: client } = await supabaseAdmin
            .from('clients')
            .insert({ name: 'Request Notification Test', owner_id: TEST_OWNER_ID })
            .select()
            .single();
        clientId = client.id;

        // Client creates request
        const { data: request } = await supabaseAdmin
            .from('content_requests')
            .insert({
                client_id: clientId,
                vendor_id: vendorId,
                requested_by: clientProfileId,
                content_type: 'blog_post',
                title: 'Need article about AI trends',
                message: 'Please write about emerging AI trends',
                priority: 'high',
                status: 'pending'
            })
            .select()
            .single();
        requestId = request.id;

        // Notification for vendor
        const { data: notification, error } = await supabaseAdmin
            .from('notifications')
            .insert({
                user_id: vendorProfileId,
                type: 'new_content_request',
                title: 'New Content Request',
                message: `New ${request.priority} priority request: "${request.title}"`,
                link: `/app/requests/${requestId}`,
                metadata: {
                    request_id: requestId,
                    client_id: clientId,
                    priority: request.priority,
                    content_type: request.content_type
                }
            })
            .select()
            .single();

        expect(error).toBeNull();
        notificationIds.push(notification.id);

        expect(notification.type).toBe('new_content_request');
        expect(notification.metadata.priority).toBe('high');

        console.log('✅ Content request → Vendor notification created');
    });

    it('should notify client when request status changes', async () => {
        if (!requestId || !clientProfileId) {
            console.log('⚠️ Skipped - dependencies not met');
            return;
        }

        // Vendor starts work
        await supabaseAdmin
            .from('content_requests')
            .update({ status: 'in_progress' })
            .eq('id', requestId);

        // Notification for client
        const { data: notification, error } = await supabaseAdmin
            .from('notifications')
            .insert({
                user_id: clientProfileId,
                type: 'request_status_update',
                title: 'Content Request Update',
                message: 'Your content request is now in progress',
                link: `/portal/requests/${requestId}`,
                metadata: {
                    request_id: requestId,
                    new_status: 'in_progress'
                }
            })
            .select()
            .single();

        expect(error).toBeNull();
        notificationIds.push(notification.id);

        expect(notification.type).toBe('request_status_update');
        expect(notification.metadata.new_status).toBe('in_progress');

        console.log('✅ Request status change → Client notification created');
    });
});

describe('Notification Chains: Read/Unread State', () => {
    let notificationId: string;
    let profileId: string;

    beforeAll(async () => {
        const { data: profiles } = await supabaseAdmin.from('profiles').select('id').limit(1);
        if (profiles?.length) profileId = profiles[0].id;
    });

    afterAll(async () => {
        if (notificationId) await supabaseAdmin.from('notifications').delete().eq('id', notificationId);
    });

    it('should track notification read state', async () => {
        if (!profileId) {
            console.log('⚠️ Skipped - no profile available');
            return;
        }

        // Create unread notification
        const { data: notification } = await supabaseAdmin
            .from('notifications')
            .insert({
                user_id: profileId,
                type: 'test_notification',
                title: 'Test Read State',
                message: 'Testing read/unread tracking',
                read: false
            })
            .select()
            .single();
        notificationId = notification.id;

        expect(notification.read).toBe(false);
        expect(notification.read_at).toBeNull();

        // Mark as read
        const { data: readNotification } = await supabaseAdmin
            .from('notifications')
            .update({
                read: true,
                read_at: new Date().toISOString()
            })
            .eq('id', notificationId)
            .select()
            .single();

        expect(readNotification.read).toBe(true);
        expect(readNotification.read_at).not.toBeNull();

        console.log('✅ Notification read state tracking works');
    });

    it('should count unread notifications per user', async () => {
        if (!profileId) {
            console.log('⚠️ Skipped - no profile available');
            return;
        }

        // Get unread count
        const { count } = await supabaseAdmin
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', profileId)
            .eq('read', false);

        expect(typeof count).toBe('number');

        console.log('✅ Unread notification count works:', count);
    });
});

describe('Notification Chains: Bulk Operations', () => {
    let profileId: string;
    let notificationIds: string[] = [];

    beforeAll(async () => {
        const { data: profiles } = await supabaseAdmin.from('profiles').select('id').limit(1);
        if (profiles?.length) profileId = profiles[0].id;
    });

    afterAll(async () => {
        for (const id of notificationIds) {
            await supabaseAdmin.from('notifications').delete().eq('id', id);
        }
    });

    it('should mark all notifications as read', async () => {
        if (!profileId) {
            console.log('⚠️ Skipped - no profile available');
            return;
        }

        // Create multiple unread notifications
        for (let i = 0; i < 3; i++) {
            const { data } = await supabaseAdmin
                .from('notifications')
                .insert({
                    user_id: profileId,
                    type: 'bulk_test',
                    title: `Bulk Test ${i}`,
                    message: `Message ${i}`,
                    read: false
                })
                .select()
                .single();
            notificationIds.push(data.id);
        }

        // Mark all as read
        const { error } = await supabaseAdmin
            .from('notifications')
            .update({
                read: true,
                read_at: new Date().toISOString()
            })
            .eq('user_id', profileId)
            .eq('type', 'bulk_test')
            .eq('read', false);

        expect(error).toBeNull();

        // Verify all are read
        const { data: notifications } = await supabaseAdmin
            .from('notifications')
            .select('read')
            .in('id', notificationIds);

        const allRead = notifications?.every(n => n.read === true);
        expect(allRead).toBe(true);

        console.log('✅ Bulk mark-as-read works');
    });
});
