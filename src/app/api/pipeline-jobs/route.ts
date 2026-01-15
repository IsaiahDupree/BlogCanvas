import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/pipeline-jobs - List all pipeline jobs for vendor
 * POST /api/pipeline-jobs - Create a new pipeline job
 */

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }

        // Get vendor_id from user profile
        const { data: profile } = await supabase
            .from('profiles')
            .select('vendor_id')
            .eq('id', user.id)
            .single()

        const { searchParams } = new URL(request.url)
        const status = searchParams.get('status')
        const limit = parseInt(searchParams.get('limit') || '20')

        let query = supabase
            .from('pipeline_jobs')
            .select(`
                *,
                clients (id, name, website_url)
            `)
            .order('created_at', { ascending: false })
            .limit(limit)

        if (profile?.vendor_id) {
            query = query.eq('vendor_id', profile.vendor_id)
        }

        if (status) {
            query = query.eq('status', status)
        }

        const { data: jobs, error } = await query

        if (error) {
            console.error('Error fetching pipeline jobs:', error)
            return NextResponse.json({ success: false, error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true, jobs })

    } catch (error: any) {
        console.error('Pipeline jobs GET error:', error)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }

        // Get vendor_id from user profile
        const { data: profile } = await supabase
            .from('profiles')
            .select('vendor_id')
            .eq('id', user.id)
            .single()

        if (!profile?.vendor_id) {
            return NextResponse.json({ success: false, error: 'No vendor associated with user' }, { status: 400 })
        }

        const body = await request.json()
        const { 
            website_url, 
            client_id, 
            target_market, 
            client_goals, 
            ideal_customer_profile 
        } = body

        if (!website_url) {
            return NextResponse.json({ success: false, error: 'Website URL is required' }, { status: 400 })
        }

        const { data: job, error } = await supabase
            .from('pipeline_jobs')
            .insert({
                vendor_id: profile.vendor_id,
                client_id: client_id || null,
                website_url,
                target_market,
                client_goals,
                ideal_customer_profile,
                status: 'pending'
            })
            .select()
            .single()

        if (error) {
            console.error('Error creating pipeline job:', error)
            return NextResponse.json({ success: false, error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true, job })

    } catch (error: any) {
        console.error('Pipeline jobs POST error:', error)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}
