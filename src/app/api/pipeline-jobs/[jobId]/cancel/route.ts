import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/pipeline-jobs/[jobId]/cancel - Cancel a running pipeline job
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

        // First, verify the job exists and get its current status
        const { data: existingJob, error: fetchError } = await supabase
            .from('pipeline_jobs')
            .select('id, status')
            .eq('id', jobId)
            .single()

        if (fetchError) {
            return NextResponse.json({
                success: false,
                error: 'Job not found'
            }, { status: 404 })
        }

        // Check if job is already in a terminal state
        if (['completed', 'failed', 'cancelled'].includes(existingJob.status)) {
            return NextResponse.json({
                success: false,
                error: `Cannot cancel job with status: ${existingJob.status}`
            }, { status: 400 })
        }

        // Update the job status to cancelled
        const { data: job, error } = await supabase
            .from('pipeline_jobs')
            .update({
                status: 'cancelled',
                completed_at: new Date().toISOString()
            })
            .eq('id', jobId)
            .select()
            .single()

        if (error) {
            console.error('Error cancelling pipeline job:', error)
            return NextResponse.json({ success: false, error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true, job })

    } catch (error: any) {
        console.error('Pipeline job cancel error:', error)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}
