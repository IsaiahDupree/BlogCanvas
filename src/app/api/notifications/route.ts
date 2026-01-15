import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET - List notifications for current user
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const limit = parseInt(searchParams.get('limit') || '20')
        const unreadOnly = searchParams.get('unread_only') === 'true'

        let query = supabase
            .from('notifications')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(limit)

        if (unreadOnly) {
            query = query.eq('read', false)
        }

        const { data: notifications, error } = await query

        if (error) {
            console.error('Error fetching notifications:', error)
            return NextResponse.json({ success: false, error: error.message }, { status: 500 })
        }

        // Get unread count
        const { count: unreadCount } = await supabase
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('read', false)

        return NextResponse.json({ 
            success: true, 
            notifications,
            unread_count: unreadCount || 0
        })

    } catch (error: any) {
        console.error('Notifications GET error:', error)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}
