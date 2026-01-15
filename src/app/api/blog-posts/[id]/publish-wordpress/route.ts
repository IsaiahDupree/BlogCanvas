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

        const { data: profile } = await supabase
            .from('profiles')
            .select('id, vendor_id')
            .eq('id', user.id)
            .single()

        if (!profile?.vendor_id) {
            return NextResponse.json({ success: false, error: 'Not a vendor user' }, { status: 403 })
        }

        // Get the blog post
        const { data: blogPost, error: postError } = await supabase
            .from('blog_posts')
            .select('id, title, content, seo_title, seo_description, featured_image_url, vendor_id, approval_status')
            .eq('id', id)
            .single()

        if (postError || !blogPost) {
            return NextResponse.json({ success: false, error: 'Blog post not found' }, { status: 404 })
        }

        if (blogPost.vendor_id !== profile.vendor_id) {
            return NextResponse.json({ success: false, error: 'Not authorized' }, { status: 403 })
        }

        // Check if post is approved
        if (blogPost.approval_status !== 'approved') {
            return NextResponse.json({ 
                success: false, 
                error: 'Only approved posts can be published to WordPress' 
            }, { status: 400 })
        }

        const body = await request.json()
        const { wordpress_site_id, status: wpStatus = 'publish', categories = [], tags = [] } = body

        if (!wordpress_site_id) {
            return NextResponse.json({ success: false, error: 'WordPress site ID is required' }, { status: 400 })
        }

        // Get WordPress site credentials
        const { data: wpSite, error: siteError } = await supabase
            .from('wordpress_sites')
            .select('*')
            .eq('id', wordpress_site_id)
            .eq('vendor_id', profile.vendor_id)
            .single()

        if (siteError || !wpSite) {
            return NextResponse.json({ success: false, error: 'WordPress site not found' }, { status: 404 })
        }

        if (!wpSite.api_username || !wpSite.api_key_encrypted) {
            return NextResponse.json({ 
                success: false, 
                error: 'WordPress site credentials not configured' 
            }, { status: 400 })
        }

        // Prepare WordPress post data
        const wpPostData: any = {
            title: blogPost.seo_title || blogPost.title,
            content: blogPost.content,
            status: wpStatus,
            excerpt: blogPost.seo_description || ''
        }

        // Add categories and tags if provided
        if (categories.length > 0) {
            wpPostData.categories = categories
        }
        if (tags.length > 0) {
            wpPostData.tags = tags
        }

        // Publish to WordPress
        const authHeader = 'Basic ' + Buffer.from(`${wpSite.api_username}:${wpSite.api_key_encrypted}`).toString('base64')
        
        const wpResponse = await fetch(`${wpSite.api_url}/posts`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': authHeader
            },
            body: JSON.stringify(wpPostData)
        })

        if (!wpResponse.ok) {
            const errorText = await wpResponse.text()
            console.error('WordPress API error:', errorText)
            
            // Update site status to error
            await supabase
                .from('wordpress_sites')
                .update({ 
                    status: 'error', 
                    last_error: `Failed to publish: ${wpResponse.status}` 
                })
                .eq('id', wordpress_site_id)

            return NextResponse.json({ 
                success: false, 
                error: `WordPress publishing failed: ${wpResponse.status}` 
            }, { status: 500 })
        }

        const wpPost = await wpResponse.json()

        // Record the published post
        await supabase.from('wordpress_posts').upsert({
            blog_post_id: id,
            wordpress_site_id,
            wordpress_post_id: wpPost.id,
            wordpress_url: wpPost.link,
            wordpress_status: wpPost.status,
            published_at: new Date().toISOString(),
            metadata: {
                categories: wpPost.categories,
                tags: wpPost.tags
            }
        }, {
            onConflict: 'blog_post_id,wordpress_site_id'
        })

        // Update blog post status and WordPress info
        await supabase
            .from('blog_posts')
            .update({
                approval_status: 'published',
                wordpress_post_id: wpPost.id,
                wordpress_url: wpPost.link,
                published_to_wordpress_at: new Date().toISOString()
            })
            .eq('id', id)

        // Update WordPress site last publish time
        await supabase
            .from('wordpress_sites')
            .update({ 
                last_publish_at: new Date().toISOString(),
                status: 'active',
                last_error: null
            })
            .eq('id', wordpress_site_id)

        // Create approval history record
        await supabase.from('content_approvals').insert({
            blog_post_id: id,
            action: 'published',
            actor_id: profile.id,
            actor_type: 'vendor',
            metadata: {
                wordpress_site_id,
                wordpress_post_id: wpPost.id,
                wordpress_url: wpPost.link
            }
        })

        return NextResponse.json({ 
            success: true, 
            wordpress_post_id: wpPost.id,
            wordpress_url: wpPost.link
        })

    } catch (error: any) {
        console.error('WordPress publish error:', error)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}
