import { supabaseAdmin } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const blogPostId = searchParams.get('blog_post_id')
    const sectionId = searchParams.get('section_id')

    try {
        let query = supabaseAdmin.from('comments').select('*').order('created_at')

        if (blogPostId) query = query.eq('blog_post_id', blogPostId)
        if (sectionId) query = query.eq('section_id', sectionId)

        const { data, error } = await query

        if (error) throw error

        return NextResponse.json(data)
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function POST(request: Request) {
    const body = await request.json()

    try {
        const { blog_post_id, section_id, content, user_id, author_name } = body

        const { data, error } = await supabaseAdmin
            .from('comments')
            .insert({
                blog_post_id,
                section_id,
                content,
                user_id,
                author_name, // Fallback if user_id is null
                created_at: new Date().toISOString()
            })
            .select()
            .single()

        if (error) throw error

        return NextResponse.json(data)
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
