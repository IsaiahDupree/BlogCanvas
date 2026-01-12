import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * GET /api/work-declarations/[id]/updates
 * Get all updates for a work declaration
 */
export async function GET(request: Request, { params }: { params: { id: string } }) {
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

    const { id } = params

    // Fetch updates
    const { data: updates, error } = await supabase
      .from('work_declaration_updates')
      .select(
        `
        *,
        created_by_user:profiles!work_declaration_updates_created_by_fkey(id, full_name, email, avatar_url)
      `
      )
      .eq('work_declaration_id', id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching updates:', error)
      return NextResponse.json({ error: 'Failed to fetch updates' }, { status: 500 })
    }

    return NextResponse.json({ updates })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/work-declarations/[id]/updates
 * Add a comment or manual update to a work declaration
 */
export async function POST(request: Request, { params }: { params: { id: string } }) {
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

    const { id } = params

    // Parse request body
    const body = await request.json()
    const { update_type = 'comment', comment, old_value, new_value, metadata = {} } = body

    // Validate required fields
    if (!comment && update_type === 'comment') {
      return NextResponse.json({ error: 'Comment is required' }, { status: 400 })
    }

    // Validate update type
    const validTypes = [
      'status_change',
      'progress_update',
      'milestone_complete',
      'deliverable_added',
      'comment',
      'due_date_change',
    ]
    if (!validTypes.includes(update_type)) {
      return NextResponse.json({ error: `Invalid update type. Must be one of: ${validTypes.join(', ')}` }, { status: 400 })
    }

    // Verify work declaration exists and user has access
    const { data: declaration, error: declError } = await supabase
      .from('work_declarations')
      .select('id, vendor_id')
      .eq('id', id)
      .single()

    if (declError || !declaration) {
      return NextResponse.json({ error: 'Work declaration not found' }, { status: 404 })
    }

    // Create update
    const { data: update, error: insertError } = await supabase
      .from('work_declaration_updates')
      .insert({
        work_declaration_id: id,
        created_by: user.id,
        update_type,
        old_value,
        new_value,
        comment,
        metadata,
      })
      .select(
        `
        *,
        created_by_user:profiles!work_declaration_updates_created_by_fkey(id, full_name, email, avatar_url)
      `
      )
      .single()

    if (insertError) {
      console.error('Error creating update:', insertError)
      return NextResponse.json({ error: 'Failed to create update' }, { status: 500 })
    }

    // TODO: Send notification if it's a comment or important update
    // Use transactional email system (feat-013)

    return NextResponse.json({ update }, { status: 201 })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
