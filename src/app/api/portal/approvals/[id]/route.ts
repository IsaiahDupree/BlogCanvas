import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET - Get single blog post for client approval
export async function GET(
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

        // Get user profile to get client_id
        const { data: profile } = await supabase
            .from('profiles')
            .select('id, client_id')
            .eq('id', user.id)
            .single()

        if (!profile?.client_id) {
            return NextResponse.json({ success: false, error: 'Not a client user' }, { status: 403 })
        }

        // Fetch the blog post
        const { data: post, error } = await supabase
            .from('blog_posts')
            .select(`
                id,
                title,
                content,
                seo_title,
                seo_description,
                featured_image_url,
                approval_status,
                showcased_at,
                showcased_message,
                created_at,
                updated_at,
                vendors (id, company_name)
            `)
            .eq('id', id)
            .eq('client_id', profile.client_id)
            .single()

        if (error || !post) {
            return NextResponse.json({ success: false, error: 'Post not found' }, { status: 404 })
        }

        // Get revision requests for this post
        const { data: revisionRequests } = await supabase
            .from('revision_requests')
            .select('id, comment, status, created_at')
            .eq('blog_post_id', id)
            .order('created_at', { ascending: false })

        return NextResponse.json({ 
            success: true, 
            post: {
                ...post,
                revision_requests: revisionRequests || []
            }
        })

    } catch (error: any) {
        console.error('Portal approval detail error:', error)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}
