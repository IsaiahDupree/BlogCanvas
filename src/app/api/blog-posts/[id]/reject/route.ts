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
            return NextResponse.json({ success: false, error: 'Only clients can reject content' }, { status: 403 })
        }

        // Only pending_review or revision_requested posts can be rejected
        if (!['pending_review', 'revision_requested'].includes(blogPost.approval_status)) {
            return NextResponse.json({ 
                success: false, 
                error: `Cannot reject post with status: ${blogPost.approval_status}` 
            }, { status: 400 })
        }

        const body = await request.json()
        const { reason } = body

        if (!reason) {
            return NextResponse.json({ success: false, error: 'Rejection reason is required' }, { status: 400 })
        }

        // Update blog post status
        const { data: updatedPost, error: updateError } = await supabase
            .from('blog_posts')
            .update({
                approval_status: 'rejected',
                rejected_at: new Date().toISOString(),
                rejected_by: profile.id,
                rejection_reason: reason
            })
            .eq('id', id)
            .select()
            .single()

        if (updateError) {
            console.error('Error rejecting blog post:', updateError)
            return NextResponse.json({ success: false, error: updateError.message }, { status: 500 })
        }

        // Create approval history record
        await supabase.from('content_approvals').insert({
            blog_post_id: id,
            action: 'rejected',
            actor_id: profile.id,
            actor_type: 'client',
            comment: reason
        })

        // Close any open revision requests
        await supabase
            .from('revision_requests')
            .update({ status: 'closed' })
            .eq('blog_post_id', id)
            .eq('status', 'open')

        // Notify vendor users
        const { data: vendorUsers } = await supabase
            .from('profiles')
            .select('id')
            .eq('vendor_id', blogPost.vendor_id)

        if (vendorUsers && vendorUsers.length > 0) {
            const notifications = vendorUsers.map(vendorUser => ({
                user_id: vendorUser.id,
                type: 'content_rejected',
                title: 'Content rejected',
                message: `${profile.full_name || 'Client'} rejected "${blogPost.title}".`,
                link: `/app/posts/${id}`,
                metadata: {
                    blog_post_id: id,
                    blog_post_title: blogPost.title,
                    rejection_reason: reason
                }
            }))

            await supabase.from('notifications').insert(notifications)
        }

        return NextResponse.json({ success: true, post: updatedPost })

    } catch (error: any) {
        console.error('Reject error:', error)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}
