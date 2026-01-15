import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { randomBytes } from 'crypto'

// POST - Make blog post public
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
            .select('id, vendor_id')
            .eq('id', user.id)
            .single()

        if (!profile?.vendor_id) {
            return NextResponse.json({ success: false, error: 'Only vendors can make content public' }, { status: 403 })
        }

        // Get the blog post
        const { data: blogPost, error: fetchError } = await supabase
            .from('blog_posts')
            .select('id, title, vendor_id, is_public, public_token')
            .eq('id', id)
            .single()

        if (fetchError || !blogPost) {
            return NextResponse.json({ success: false, error: 'Blog post not found' }, { status: 404 })
        }

        if (blogPost.vendor_id !== profile.vendor_id) {
            return NextResponse.json({ success: false, error: 'Not authorized' }, { status: 403 })
        }

        // Parse optional body for expiration
        const body = await request.json().catch(() => ({}))
        const { expires_in_days } = body

        // Generate public token if not exists
        const publicToken = blogPost.public_token || randomBytes(24).toString('base64url')
        
        // Calculate expiration if provided
        let expiresAt = null
        if (expires_in_days) {
            expiresAt = new Date()
            expiresAt.setDate(expiresAt.getDate() + expires_in_days)
        }

        // Update blog post
        const { data: updatedPost, error: updateError } = await supabase
            .from('blog_posts')
            .update({
                is_public: true,
                public_token: publicToken,
                public_expires_at: expiresAt?.toISOString() || null
            })
            .eq('id', id)
            .select()
            .single()

        if (updateError) {
            console.error('Error making post public:', updateError)
            return NextResponse.json({ success: false, error: updateError.message }, { status: 500 })
        }

        // Create approval history record
        await supabase.from('content_approvals').insert({
            blog_post_id: id,
            action: 'made_public',
            actor_id: profile.id,
            actor_type: 'vendor',
            metadata: { expires_at: expiresAt?.toISOString() }
        })

        // Generate the public URL
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://blogcanvas.io'
        const publicUrl = `${baseUrl}/shared/${publicToken}`

        return NextResponse.json({ 
            success: true, 
            post: updatedPost,
            public_url: publicUrl,
            public_token: publicToken
        })

    } catch (error: any) {
        console.error('Make public error:', error)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}

// DELETE - Make blog post private
export async function DELETE(
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
            .select('id, vendor_id')
            .eq('id', user.id)
            .single()

        if (!profile?.vendor_id) {
            return NextResponse.json({ success: false, error: 'Only vendors can modify content visibility' }, { status: 403 })
        }

        // Get the blog post
        const { data: blogPost, error: fetchError } = await supabase
            .from('blog_posts')
            .select('id, vendor_id')
            .eq('id', id)
            .single()

        if (fetchError || !blogPost) {
            return NextResponse.json({ success: false, error: 'Blog post not found' }, { status: 404 })
        }

        if (blogPost.vendor_id !== profile.vendor_id) {
            return NextResponse.json({ success: false, error: 'Not authorized' }, { status: 403 })
        }

        // Update blog post to private (keep token for potential re-enabling)
        const { data: updatedPost, error: updateError } = await supabase
            .from('blog_posts')
            .update({
                is_public: false
            })
            .eq('id', id)
            .select()
            .single()

        if (updateError) {
            console.error('Error making post private:', updateError)
            return NextResponse.json({ success: false, error: updateError.message }, { status: 500 })
        }

        // Create approval history record
        await supabase.from('content_approvals').insert({
            blog_post_id: id,
            action: 'made_private',
            actor_id: profile.id,
            actor_type: 'vendor'
        })

        return NextResponse.json({ success: true, post: updatedPost })

    } catch (error: any) {
        console.error('Make private error:', error)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}
