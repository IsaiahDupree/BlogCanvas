import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// PATCH - Mark all notifications as read
export async function PATCH(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }

        const { error } = await supabase
            .from('notifications')
            .update({
                read: true,
                read_at: new Date().toISOString()
            })
            .eq('user_id', user.id)
            .eq('read', false)

        if (error) {
            console.error('Error marking all notifications as read:', error)
            return NextResponse.json({ success: false, error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true })

    } catch (error: any) {
        console.error('Mark all read error:', error)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}
