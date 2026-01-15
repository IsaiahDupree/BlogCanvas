import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/scheduled-pipelines - List all scheduled pipeline runs
 * POST /api/scheduled-pipelines - Create a new scheduled pipeline run
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

        if (!profile?.vendor_id) {
            return NextResponse.json({ success: false, error: 'No vendor associated with user' }, { status: 400 })
        }

        const { searchParams } = new URL(request.url)
        const isActive = searchParams.get('is_active')

        let query = supabase
            .from('scheduled_pipeline_runs')
            .select(`
                *,
                clients (id, name, website_url)
            `)
            .eq('vendor_id', profile.vendor_id)
            .order('created_at', { ascending: false })

        if (isActive !== null) {
            query = query.eq('is_active', isActive === 'true')
        }

        const { data: schedules, error } = await query

        if (error) {
            console.error('Error fetching scheduled pipelines:', error)
            return NextResponse.json({ success: false, error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true, schedules })

    } catch (error: any) {
        console.error('Scheduled pipelines GET error:', error)
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
            name,
            website_url,
            client_id,
            target_market,
            client_goals,
            ideal_customer_profile,
            frequency,
            day_of_week,
            day_of_month,
            time_of_day
        } = body

        // Validation
        if (!name || !website_url || !frequency) {
            return NextResponse.json({
                success: false,
                error: 'Name, website URL, and frequency are required'
            }, { status: 400 })
        }

        if (!['daily', 'weekly', 'biweekly', 'monthly'].includes(frequency)) {
            return NextResponse.json({
                success: false,
                error: 'Invalid frequency. Must be daily, weekly, biweekly, or monthly'
            }, { status: 400 })
        }

        // Validate frequency-specific fields
        if ((frequency === 'weekly' || frequency === 'biweekly') && day_of_week === undefined) {
            return NextResponse.json({
                success: false,
                error: 'day_of_week is required for weekly/biweekly schedules'
            }, { status: 400 })
        }

        if (frequency === 'monthly' && !day_of_month) {
            return NextResponse.json({
                success: false,
                error: 'day_of_month is required for monthly schedules'
            }, { status: 400 })
        }

        const { data: schedule, error } = await supabase
            .from('scheduled_pipeline_runs')
            .insert({
                vendor_id: profile.vendor_id,
                client_id: client_id || null,
                name,
                website_url,
                target_market,
                client_goals,
                ideal_customer_profile,
                frequency,
                day_of_week: day_of_week !== undefined ? day_of_week : null,
                day_of_month: day_of_month || null,
                time_of_day: time_of_day || '09:00:00',
                is_active: true
            })
            .select()
            .single()

        if (error) {
            console.error('Error creating scheduled pipeline:', error)
            return NextResponse.json({ success: false, error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true, schedule })

    } catch (error: any) {
        console.error('Scheduled pipelines POST error:', error)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}
