import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/scheduled-pipelines/execute - Execute scheduled pipelines that are due
 * This endpoint should be called by a cron job
 */

export async function POST(request: NextRequest) {
    try {
        // Verify this is a cron job request or authenticated admin
        const authHeader = request.headers.get('authorization')
        const cronSecret = process.env.CRON_SECRET

        // Allow either cron secret or authenticated user
        let isAuthorized = false

        if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
            isAuthorized = true
        } else {
            // Check if user is authenticated (for manual trigger)
            const supabase = await createClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                isAuthorized = true
            }
        }

        if (!isAuthorized) {
            return NextResponse.json({
                success: false,
                error: 'Unauthorized'
            }, { status: 401 })
        }

        const supabase = await createClient()

        // Find schedules that are due to run
        const now = new Date().toISOString()
        const { data: dueSchedules, error: fetchError } = await supabase
            .from('scheduled_pipeline_runs')
            .select('*')
            .eq('is_active', true)
            .lte('next_run_at', now)

        if (fetchError) {
            console.error('Error fetching due schedules:', fetchError)
            return NextResponse.json({
                success: false,
                error: fetchError.message
            }, { status: 500 })
        }

        const results = []

        for (const schedule of dueSchedules || []) {
            try {
                // Create a new pipeline job
                const { data: job, error: jobError } = await supabase
                    .from('pipeline_jobs')
                    .insert({
                        vendor_id: schedule.vendor_id,
                        client_id: schedule.client_id,
                        website_url: schedule.website_url,
                        target_market: schedule.target_market,
                        client_goals: schedule.client_goals,
                        ideal_customer_profile: schedule.ideal_customer_profile,
                        status: 'pending'
                    })
                    .select()
                    .single()

                if (jobError) {
                    console.error(`Error creating job for schedule ${schedule.id}:`, jobError)
                    results.push({
                        schedule_id: schedule.id,
                        success: false,
                        error: jobError.message
                    })

                    // Update failed run stats
                    await supabase
                        .from('scheduled_pipeline_runs')
                        .update({
                            total_runs: schedule.total_runs + 1,
                            failed_runs: schedule.failed_runs + 1,
                            last_run_at: now
                        })
                        .eq('id', schedule.id)

                    continue
                }

                // Update schedule with last run info
                const { error: updateError } = await supabase
                    .from('scheduled_pipeline_runs')
                    .update({
                        last_run_at: now,
                        last_job_id: job.id,
                        total_runs: schedule.total_runs + 1,
                        successful_runs: schedule.successful_runs + 1
                    })
                    .eq('id', schedule.id)

                if (updateError) {
                    console.error(`Error updating schedule ${schedule.id}:`, updateError)
                }

                results.push({
                    schedule_id: schedule.id,
                    schedule_name: schedule.name,
                    job_id: job.id,
                    success: true
                })

            } catch (scheduleError: any) {
                console.error(`Error processing schedule ${schedule.id}:`, scheduleError)
                results.push({
                    schedule_id: schedule.id,
                    success: false,
                    error: scheduleError.message
                })
            }
        }

        return NextResponse.json({
            success: true,
            executed_count: results.length,
            results
        })

    } catch (error: any) {
        console.error('Scheduled pipeline execution error:', error)
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 })
    }
}
