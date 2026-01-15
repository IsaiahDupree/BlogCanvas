import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { randomBytes } from 'crypto'

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

        // Get user profile to verify vendor access
        const { data: profile } = await supabase
            .from('profiles')
            .select('id, vendor_id, role')
            .eq('id', user.id)
            .single()

        if (!profile?.vendor_id) {
            return NextResponse.json({ success: false, error: 'Only vendors can showcase content' }, { status: 403 })
        }

        // Get the blog post and verify ownership
        const { data: blogPost, error: fetchError } = await supabase
            .from('blog_posts')
            .select('id, title, vendor_id, client_id, approval_status')
            .eq('id', id)
            .single()

        if (fetchError || !blogPost) {
            return NextResponse.json({ success: false, error: 'Blog post not found' }, { status: 404 })
        }

        if (blogPost.vendor_id !== profile.vendor_id) {
            return NextResponse.json({ success: false, error: 'Not authorized to showcase this post' }, { status: 403 })
        }

        const body = await request.json()
        const { client_id, message } = body

        if (!client_id) {
            return NextResponse.json({ success: false, error: 'Client ID is required' }, { status: 400 })
        }

        // Verify client exists and belongs to vendor
        const { data: client, error: clientError } = await supabase
            .from('clients')
            .select('id, name, vendor_id')
            .eq('id', client_id)
            .single()

        if (clientError || !client) {
            return NextResponse.json({ success: false, error: 'Client not found' }, { status: 404 })
        }

        if (client.vendor_id !== profile.vendor_id) {
            return NextResponse.json({ success: false, error: 'Client does not belong to your vendor' }, { status: 403 })
        }

        // Update blog post with showcase info
        const { data: updatedPost, error: updateError } = await supabase
            .from('blog_posts')
            .update({
                client_id: client_id,
                approval_status: 'pending_review',
                showcased_at: new Date().toISOString(),
                showcased_by: profile.id,
                showcased_message: message || null
            })
            .eq('id', id)
            .select()
            .single()

        if (updateError) {
            console.error('Error showcasing blog post:', updateError)
            return NextResponse.json({ success: false, error: updateError.message }, { status: 500 })
        }

        // Create approval history record
        await supabase.from('content_approvals').insert({
            blog_post_id: id,
            action: 'showcased',
            actor_id: profile.id,
            actor_type: 'vendor',
            comment: message || null,
            metadata: { client_id, client_name: client.name }
        })

        // Get client users to notify
        const { data: clientUsers } = await supabase
            .from('profiles')
            .select('id, email, full_name')
            .eq('client_id', client_id)

        // Create notifications for client users
        if (clientUsers && clientUsers.length > 0) {
            const notifications = clientUsers.map(clientUser => ({
                user_id: clientUser.id,
                type: 'content_showcase',
                title: 'New content ready for review',
                message: `"${blogPost.title}" has been shared for your approval.`,
                link: `/portal/approvals/${id}`,
                metadata: {
                    blog_post_id: id,
                    blog_post_title: blogPost.title,
                    vendor_message: message
                }
            }))

            await supabase.from('notifications').insert(notifications)

            // TODO: Send email notifications (integrate with email service)
        }

        return NextResponse.json({ 
            success: true, 
            post: updatedPost,
            notified_users: clientUsers?.length || 0
        })

    } catch (error: any) {
        console.error('Showcase error:', error)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}
