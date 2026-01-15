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
            .select('id, client_id, vendor_id, role')
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

        // Verify client has permission to approve (must be assigned to this client)
        const isClient = profile.client_id && profile.client_id === blogPost.client_id
        const isVendor = profile.vendor_id && profile.vendor_id === blogPost.vendor_id

        if (!isClient && !isVendor) {
            return NextResponse.json({ success: false, error: 'Not authorized to approve this post' }, { status: 403 })
        }

        // Only pending_review posts can be approved
        if (blogPost.approval_status !== 'pending_review' && blogPost.approval_status !== 'revision_requested') {
            return NextResponse.json({ 
                success: false, 
                error: `Cannot approve post with status: ${blogPost.approval_status}` 
            }, { status: 400 })
        }

        const body = await request.json().catch(() => ({}))
        const { comment } = body

        // Update blog post status to approved
        const { data: updatedPost, error: updateError } = await supabase
            .from('blog_posts')
            .update({
                approval_status: 'approved',
                approved_at: new Date().toISOString(),
                approved_by: profile.id
            })
            .eq('id', id)
            .select()
            .single()

        if (updateError) {
            console.error('Error approving blog post:', updateError)
            return NextResponse.json({ success: false, error: updateError.message }, { status: 500 })
        }

        // Create approval history record
        await supabase.from('content_approvals').insert({
            blog_post_id: id,
            action: 'approved',
            actor_id: profile.id,
            actor_type: isClient ? 'client' : 'vendor',
            comment: comment || null
        })

        // Close any open revision requests
        await supabase
            .from('revision_requests')
            .update({ status: 'closed' })
            .eq('blog_post_id', id)
            .eq('status', 'open')

        // Notify vendor users if approved by client
        if (isClient) {
            const { data: vendorUsers } = await supabase
                .from('profiles')
                .select('id')
                .eq('vendor_id', blogPost.vendor_id)

            if (vendorUsers && vendorUsers.length > 0) {
                const notifications = vendorUsers.map(vendorUser => ({
                    user_id: vendorUser.id,
                    type: 'content_approved',
                    title: 'Content approved!',
                    message: `"${blogPost.title}" has been approved by the client.`,
                    link: `/app/posts/${id}`,
                    metadata: {
                        blog_post_id: id,
                        blog_post_title: blogPost.title
                    }
                }))

                await supabase.from('notifications').insert(notifications)
            }
        }

        return NextResponse.json({ success: true, post: updatedPost })

    } catch (error: any) {
        console.error('Approve error:', error)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}
