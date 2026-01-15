import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }

        // Get user profile
        const { data: profile } = await supabase
            .from('profiles')
            .select('id, client_id, vendor_id, role, full_name')
            .eq('id', user.id)
            .single()

        if (!profile) {
            return NextResponse.json({ success: false, error: 'Profile not found' }, { status: 404 })
        }

        // Get the blog post
        const { data: blogPost, error: fetchError } = await supabase
            .from('blog_posts')
            .select('id, title, client_id, vendor_id, approval_status')
            .eq('id', id)
            .single()

        if (fetchError || !blogPost) {
            return NextResponse.json({ success: false, error: 'Blog post not found' }, { status: 404 })
        }

        // Verify client has permission
        const isClient = profile.client_id && profile.client_id === blogPost.client_id

        if (!isClient) {
            return NextResponse.json({ success: false, error: 'Only clients can request revisions' }, { status: 403 })
        }

        // Only pending_review posts can have revisions requested
        if (blogPost.approval_status !== 'pending_review') {
            return NextResponse.json({ 
                success: false, 
                error: `Cannot request revision for post with status: ${blogPost.approval_status}` 
            }, { status: 400 })
        }

        const body = await request.json()
        const { comment, specific_changes } = body

        if (!comment) {
            return NextResponse.json({ success: false, error: 'Comment is required' }, { status: 400 })
        }

        // Update blog post status
        const { data: updatedPost, error: updateError } = await supabase
            .from('blog_posts')
            .update({
                approval_status: 'revision_requested'
            })
            .eq('id', id)
            .select()
            .single()

        if (updateError) {
            console.error('Error updating blog post:', updateError)
            return NextResponse.json({ success: false, error: updateError.message }, { status: 500 })
        }

        // Create revision request record
        const { data: revisionRequest, error: revisionError } = await supabase
            .from('revision_requests')
            .insert({
                blog_post_id: id,
                requested_by: profile.id,
                comment,
                specific_changes: specific_changes || [],
                status: 'open'
            })
            .select()
            .single()

        if (revisionError) {
            console.error('Error creating revision request:', revisionError)
        }

        // Create approval history record
        await supabase.from('content_approvals').insert({
            blog_post_id: id,
            action: 'revision_requested',
            actor_id: profile.id,
            actor_type: 'client',
            comment,
            metadata: { specific_changes: specific_changes || [] }
        })

        // Notify vendor users
        const { data: vendorUsers } = await supabase
            .from('profiles')
            .select('id')
            .eq('vendor_id', blogPost.vendor_id)

        if (vendorUsers && vendorUsers.length > 0) {
            const notifications = vendorUsers.map(vendorUser => ({
                user_id: vendorUser.id,
                type: 'revision_requested',
                title: 'Revision requested',
                message: `${profile.full_name || 'Client'} requested revisions for "${blogPost.title}".`,
                link: `/app/posts/${id}`,
                metadata: {
                    blog_post_id: id,
                    blog_post_title: blogPost.title,
                    revision_comment: comment,
                    revision_request_id: revisionRequest?.id
                }
            }))

            await supabase.from('notifications').insert(notifications)
        }

        return NextResponse.json({ 
            success: true, 
            post: updatedPost,
            revision_request: revisionRequest
        })

    } catch (error: any) {
        console.error('Request revision error:', error)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}
