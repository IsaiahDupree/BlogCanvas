import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET - List blog posts pending approval for client
export async function GET(request: NextRequest) {
    try {
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

        const { searchParams } = new URL(request.url)
        const approvalStatus = searchParams.get('approval_status')
        const limit = parseInt(searchParams.get('limit') || '50')

        let query = supabase
            .from('blog_posts')
            .select(`
                id,
                title,
                seo_description,
                approval_status,
                showcased_at,
                showcased_message,
                created_at,
                vendors (id, company_name)
            `)
            .eq('client_id', profile.client_id)
            .not('showcased_at', 'is', null)
            .order('showcased_at', { ascending: false })
            .limit(limit)

        if (approvalStatus && approvalStatus !== 'all') {
            query = query.eq('approval_status', approvalStatus)
        }

        const { data: posts, error } = await query

        if (error) {
            console.error('Error fetching client approvals:', error)
            return NextResponse.json({ success: false, error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true, posts })

    } catch (error: any) {
        console.error('Portal approvals error:', error)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}
