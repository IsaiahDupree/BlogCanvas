import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET - Get public blog post by token (no auth required)
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ token: string }> }
) {
    try {
        const { token } = await params
        const supabase = await createClient()

        // Find blog post by public token
        const { data: blogPost, error } = await supabase
            .from('blog_posts')
            .select(`
                id,
                title,
                content,
                seo_title,
                seo_description,
                featured_image_url,
                status,
                is_public,
                public_expires_at,
                created_at,
                updated_at,
                clients (id, name),
                vendors (id, company_name)
            `)
            .eq('public_token', token)
            .eq('is_public', true)
            .single()

        if (error || !blogPost) {
            return NextResponse.json({ 
                success: false, 
                error: 'Content not found or not publicly accessible' 
            }, { status: 404 })
        }

        // Check if public link has expired
        if (blogPost.public_expires_at && new Date(blogPost.public_expires_at) < new Date()) {
            return NextResponse.json({ 
                success: false, 
                error: 'This public link has expired' 
            }, { status: 403 })
        }

        return NextResponse.json({ 
            success: true, 
            post: {
                id: blogPost.id,
                title: blogPost.title,
                content: blogPost.content,
                seo_title: blogPost.seo_title,
                seo_description: blogPost.seo_description,
                featured_image_url: blogPost.featured_image_url,
                created_at: blogPost.created_at,
                updated_at: blogPost.updated_at,
                client_name: blogPost.clients?.name,
                vendor_name: blogPost.vendors?.company_name
            }
        })

    } catch (error: any) {
        console.error('Public post access error:', error)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}
