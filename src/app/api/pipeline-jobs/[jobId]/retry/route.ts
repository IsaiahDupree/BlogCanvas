import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/pipeline-jobs/[jobId]/retry - Retry a pipeline job by cloning it
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ jobId: string }> }
) {
    try {
        const { jobId } = await params
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }

        // First, fetch the existing job to clone its parameters
        const { data: existingJob, error: fetchError } = await supabase
            .from('pipeline_jobs')
            .select('*')
            .eq('id', jobId)
            .single()

        if (fetchError) {
            return NextResponse.json({
                success: false,
                error: 'Job not found'
            }, { status: 404 })
        }

        // Create a new job with the same parameters
        const { data: newJob, error: createError } = await supabase
            .from('pipeline_jobs')
            .insert({
                website_url: existingJob.website_url,
                client_id: existingJob.client_id,
                target_market: existingJob.target_market,
                client_goals: existingJob.client_goals,
                ideal_customer_profile: existingJob.ideal_customer_profile,
                status: 'pending',
                progress: 0,
                created_by: user.id
            })
            .select(`
                *,
                clients (id, name, website_url)
            `)
            .single()

        if (createError) {
            console.error('Error creating retry job:', createError)
            return NextResponse.json({ success: false, error: createError.message }, { status: 500 })
        }

        return NextResponse.json({ success: true, job: newJob })

    } catch (error: any) {
        console.error('Pipeline job retry error:', error)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}
