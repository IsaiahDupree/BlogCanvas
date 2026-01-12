import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * GET /api/portal/work-declarations
 * Get work declarations for the current client (client portal view)
 * Includes progress statistics and filtering options
 */
export async function GET(request: Request) {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's profile to check if they are a client
    const { data: profile } = await supabase.from('profiles').select('role, client_id').eq('id', user.id).single()

    if (!profile || !profile.client_id) {
      return NextResponse.json({ error: 'Client profile not found' }, { status: 404 })
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const type = searchParams.get('type')

    // Build query for work declarations
    let query = supabase
      .from('work_declarations')
      .select(
        `
        *,
        vendor:vendors(id, name, slug, logo_url, brand_colors),
        content_batch:content_batches(id, name, status),
        created_by_user:profiles!work_declarations_created_by_fkey(id, full_name, email, avatar_url)
      `
      )
      .eq('client_id', profile.client_id)
      .order('created_at', { ascending: false })

    // Apply filters
    if (status) {
      query = query.eq('status', status)
    }
    if (type) {
      query = query.eq('type', type)
    }

    const { data: declarations, error } = await query

    if (error) {
      console.error('Error fetching work declarations:', error)
      return NextResponse.json({ error: 'Failed to fetch work declarations' }, { status: 500 })
    }

    // Get overall progress statistics using the database function
    const { data: progressStats, error: statsError } = await supabase.rpc('get_client_work_progress', {
      p_client_id: profile.client_id,
    })

    if (statsError) {
      console.error('Error fetching progress stats:', statsError)
    }

    return NextResponse.json({
      declarations,
      stats: progressStats?.[0] || {
        total_declarations: 0,
        planned_count: 0,
        in_progress_count: 0,
        completed_count: 0,
        on_hold_count: 0,
        cancelled_count: 0,
        avg_progress: 0,
      },
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
