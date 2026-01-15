import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/blog-posts/[id]/transition
 *
 * Transition blog post status according to PRD workflow:
 * ai_drafting → editor_review → client_review → approved → published
 *
 * Body:
 * - targetStatus: 'editor_review' | 'client_review' | 'approved' | 'published'
 * - comment?: string (optional comment for the transition)
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const supabase = await createClient();

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { targetStatus, comment } = body;

        if (!targetStatus) {
            return NextResponse.json(
                { success: false, error: 'targetStatus is required' },
                { status: 400 }
            );
        }

        // Get the blog post with current status
        const { data: post, error: fetchError } = await supabase
            .from('blog_posts')
            .select('id, topic, status, client_id, content_batch_id, topic_cluster_id')
            .eq('id', id)
            .single();

        if (fetchError || !post) {
            return NextResponse.json(
                { success: false, error: 'Blog post not found' },
                { status: 404 }
            );
        }

        // Validate transition based on current status
        const validTransitions: Record<string, string[]> = {
            'ai_drafting': ['editor_review'],
            'drafting': ['editor_review'], // Support existing status too
            'editor_review': ['client_review'],
            'client_review': ['approved'],
            'approved': ['published']
        };

        const currentStatus = post.status;
        const allowedTargets = validTransitions[currentStatus] || [];

        if (!allowedTargets.includes(targetStatus)) {
            return NextResponse.json(
                {
                    success: false,
                    error: `Cannot transition from ${currentStatus} to ${targetStatus}. Allowed: ${allowedTargets.join(', ')}`
                },
                { status: 400 }
            );
        }

        // Prepare update data based on target status
        const updateData: any = {
            status: targetStatus,
            updated_at: new Date().toISOString()
        };

        // Set transition-specific fields
        switch (targetStatus) {
            case 'editor_review':
                // AI completed, ready for editor review
                updateData.editor_reviewed_at = new Date().toISOString();
                updateData.editor_reviewed_by = user.id;
                break;

            case 'client_review':
                // Editor approved, ready for client
                updateData.client_reviewed_at = new Date().toISOString();
                updateData.client_reviewed_by = user.id;
                break;

            case 'approved':
                // Client approved
                updateData.approved_at = new Date().toISOString();
                updateData.approved_by = user.id;
                break;

            case 'published':
                // Published to CMS (cms_url should be set separately via publish endpoint)
                updateData.published_at = new Date().toISOString();
                break;
        }

        // Update the blog post
        const { data: updatedPost, error: updateError } = await supabase
            .from('blog_posts')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (updateError) {
            console.error('Error transitioning blog post:', updateError);
            return NextResponse.json(
                { success: false, error: updateError.message },
                { status: 500 }
            );
        }

        // Create revision record for audit trail
        await supabase.from('blog_post_revisions').insert({
            blog_post_id: id,
            revision_type: 'human_edit',
            created_by: user.id,
            created_by_type: 'user',
            notes: `Status transitioned from ${currentStatus} to ${targetStatus}${comment ? `: ${comment}` : ''}`
        });

        // Send notifications based on transition type
        if (targetStatus === 'client_review') {
            // Notify client that post is ready for review
            const { data: clientProfiles } = await supabase
                .from('client_profiles')
                .select('user_id')
                .eq('client_id', post.client_id);

            if (clientProfiles && clientProfiles.length > 0) {
                const notifications = clientProfiles.map(profile => ({
                    user_id: profile.user_id,
                    type: 'content_ready',
                    title: 'New content ready for review',
                    message: `"${post.topic}" is ready for your review.`,
                    link: `/portal/posts/${id}`,
                    metadata: {
                        blog_post_id: id,
                        blog_post_topic: post.topic
                    }
                }));

                await supabase.from('notifications').insert(notifications);
            }
        } else if (targetStatus === 'approved') {
            // Notify vendor/editors that client approved
            const { data: clients } = await supabase
                .from('clients')
                .select('vendor_user_id')
                .eq('id', post.client_id)
                .single();

            if (clients?.vendor_user_id) {
                await supabase.from('notifications').insert({
                    user_id: clients.vendor_user_id,
                    type: 'content_approved',
                    title: 'Content approved by client',
                    message: `"${post.topic}" has been approved and is ready to publish.`,
                    link: `/app/posts/${id}`,
                    metadata: {
                        blog_post_id: id,
                        blog_post_topic: post.topic
                    }
                });
            }
        }

        // Update topic cluster coverage if publishing
        if (targetStatus === 'published' && post.topic_cluster_id) {
            await supabase
                .from('topic_clusters')
                .update({ currently_covered: true })
                .eq('id', post.topic_cluster_id);
        }

        // Update content batch progress counters
        if (post.content_batch_id) {
            if (targetStatus === 'approved') {
                await supabase.rpc('increment_batch_counter', {
                    batch_id: post.content_batch_id,
                    counter_name: 'posts_approved'
                });
            } else if (targetStatus === 'published') {
                await supabase.rpc('increment_batch_counter', {
                    batch_id: post.content_batch_id,
                    counter_name: 'posts_published'
                });
            }
        }

        return NextResponse.json({
            success: true,
            post: updatedPost,
            message: `Status transitioned to ${targetStatus}`
        });

    } catch (error: any) {
        console.error('Transition error:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
