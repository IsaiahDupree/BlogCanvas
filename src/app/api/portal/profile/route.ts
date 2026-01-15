import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET - Get client profile with plan info
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }

        const { data: profile, error } = await supabase
            .from('profiles')
            .select(`
                id,
                full_name,
                email,
                avatar_url,
                role,
                client_id,
                created_at,
                clients (
                    id,
                    name,
                    status,
                    plan_type,
                    plan_posts_per_month,
                    plan_renewal_date
                )
            `)
            .eq('id', user.id)
            .single()

        if (error || !profile) {
            return NextResponse.json({ success: false, error: 'Profile not found' }, { status: 404 })
        }

        return NextResponse.json({ 
            success: true, 
            profile: {
                ...profile,
                email: user.email
            }
        })

    } catch (error: any) {
        console.error('Profile GET error:', error)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}

// PATCH - Update profile (name, avatar)
export async function PATCH(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { full_name, avatar_url } = body

        const updateData: any = {}
        if (full_name !== undefined) updateData.full_name = full_name
        if (avatar_url !== undefined) updateData.avatar_url = avatar_url

        const { data: profile, error } = await supabase
            .from('profiles')
            .update(updateData)
            .eq('id', user.id)
            .select()
            .single()

        if (error) {
            console.error('Error updating profile:', error)
            return NextResponse.json({ success: false, error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true, profile })

    } catch (error: any) {
        console.error('Profile PATCH error:', error)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}
