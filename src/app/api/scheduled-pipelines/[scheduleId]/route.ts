import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/scheduled-pipelines/[scheduleId] - Get a specific scheduled pipeline
 * PATCH /api/scheduled-pipelines/[scheduleId] - Update a scheduled pipeline
 * DELETE /api/scheduled-pipelines/[scheduleId] - Delete a scheduled pipeline
 */

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ scheduleId: string }> }
) {
    try {
        const { scheduleId } = await params
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }

        const { data: schedule, error } = await supabase
            .from('scheduled_pipeline_runs')
            .select(`
                *,
                clients (id, name, website_url)
            `)
            .eq('id', scheduleId)
            .single()

        if (error) {
            console.error('Error fetching scheduled pipeline:', error)
            return NextResponse.json({ success: false, error: error.message }, { status: 500 })
        }

        if (!schedule) {
            return NextResponse.json({ success: false, error: 'Schedule not found' }, { status: 404 })
        }

        return NextResponse.json({ success: true, schedule })

    } catch (error: any) {
        console.error('Scheduled pipeline GET error:', error)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ scheduleId: string }> }
) {
    try {
        const { scheduleId } = await params
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const {
            name,
            website_url,
            target_market,
            client_goals,
            ideal_customer_profile,
            frequency,
            day_of_week,
            day_of_month,
            time_of_day,
            is_active
        } = body

        // Build update object with only provided fields
        const updates: any = {}

        if (name !== undefined) updates.name = name
        if (website_url !== undefined) updates.website_url = website_url
        if (target_market !== undefined) updates.target_market = target_market
        if (client_goals !== undefined) updates.client_goals = client_goals
        if (ideal_customer_profile !== undefined) updates.ideal_customer_profile = ideal_customer_profile
        if (frequency !== undefined) {
            if (!['daily', 'weekly', 'biweekly', 'monthly'].includes(frequency)) {
                return NextResponse.json({
                    success: false,
                    error: 'Invalid frequency'
                }, { status: 400 })
            }
            updates.frequency = frequency
        }
        if (day_of_week !== undefined) updates.day_of_week = day_of_week
        if (day_of_month !== undefined) updates.day_of_month = day_of_month
        if (time_of_day !== undefined) updates.time_of_day = time_of_day
        if (is_active !== undefined) updates.is_active = is_active

        const { data: schedule, error } = await supabase
            .from('scheduled_pipeline_runs')
            .update(updates)
            .eq('id', scheduleId)
            .select()
            .single()

        if (error) {
            console.error('Error updating scheduled pipeline:', error)
            return NextResponse.json({ success: false, error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true, schedule })

    } catch (error: any) {
        console.error('Scheduled pipeline PATCH error:', error)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ scheduleId: string }> }
) {
    try {
        const { scheduleId } = await params
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }

        const { error } = await supabase
            .from('scheduled_pipeline_runs')
            .delete()
            .eq('id', scheduleId)

        if (error) {
            console.error('Error deleting scheduled pipeline:', error)
            return NextResponse.json({ success: false, error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true })

    } catch (error: any) {
        console.error('Scheduled pipeline DELETE error:', error)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}
