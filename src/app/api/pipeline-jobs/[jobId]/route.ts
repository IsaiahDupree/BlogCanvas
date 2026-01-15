import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/pipeline-jobs/[jobId] - Get a specific pipeline job
 * PATCH /api/pipeline-jobs/[jobId] - Update a pipeline job status/results
 * DELETE /api/pipeline-jobs/[jobId] - Delete a pipeline job
 */

export async function GET(
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

        const { data: job, error } = await supabase
            .from('pipeline_jobs')
            .select(`
                *,
                clients (id, name, website_url)
            `)
            .eq('id', jobId)
            .single()

        if (error) {
            return NextResponse.json({ success: false, error: error.message }, { status: 404 })
        }

        return NextResponse.json({ success: true, job })

    } catch (error: any) {
        console.error('Pipeline job GET error:', error)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}

export async function PATCH(
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

        const body = await request.json()
        const {
            status,
            current_step,
            progress,
            eta_seconds,
            crawl_result,
            analyze_result,
            gaps_result,
            topics_result,
            seo_score,
            pages_indexed,
            content_gaps,
            topics_generated,
            blogs_created,
            error_message,
            error_step,
            started_at,
            completed_at
        } = body

        const updateData: any = {}

        if (status !== undefined) updateData.status = status
        if (current_step !== undefined) updateData.current_step = current_step
        if (progress !== undefined) updateData.progress = progress
        if (eta_seconds !== undefined) updateData.eta_seconds = eta_seconds
        if (crawl_result !== undefined) updateData.crawl_result = crawl_result
        if (analyze_result !== undefined) updateData.analyze_result = analyze_result
        if (gaps_result !== undefined) updateData.gaps_result = gaps_result
        if (topics_result !== undefined) updateData.topics_result = topics_result
        if (seo_score !== undefined) updateData.seo_score = seo_score
        if (pages_indexed !== undefined) updateData.pages_indexed = pages_indexed
        if (content_gaps !== undefined) updateData.content_gaps = content_gaps
        if (topics_generated !== undefined) updateData.topics_generated = topics_generated
        if (blogs_created !== undefined) updateData.blogs_created = blogs_created
        if (error_message !== undefined) updateData.error_message = error_message
        if (error_step !== undefined) updateData.error_step = error_step
        if (started_at !== undefined) updateData.started_at = started_at
        if (completed_at !== undefined) updateData.completed_at = completed_at

        const { data: job, error } = await supabase
            .from('pipeline_jobs')
            .update(updateData)
            .eq('id', jobId)
            .select()
            .single()

        if (error) {
            console.error('Error updating pipeline job:', error)
            return NextResponse.json({ success: false, error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true, job })

    } catch (error: any) {
        console.error('Pipeline job PATCH error:', error)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}

export async function DELETE(
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

        const { error } = await supabase
            .from('pipeline_jobs')
            .delete()
            .eq('id', jobId)

        if (error) {
            console.error('Error deleting pipeline job:', error)
            return NextResponse.json({ success: false, error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true })

    } catch (error: any) {
        console.error('Pipeline job DELETE error:', error)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}
