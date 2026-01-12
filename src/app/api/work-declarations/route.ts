import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { queueTransactionalEmail } from '@/lib/emails/transactional-email-service'

/**
 * GET /api/work-declarations
 * List work declarations with filtering
 * Query params:
 * - clientId: Filter by client ID
 * - status: Filter by status
 * - type: Filter by type
 * - limit: Number of records (default 50)
 * - offset: Pagination offset (default 0)
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

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('clientId')
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build query
    let query = supabase
      .from('work_declarations')
      .select(
        `
        *,
        vendor:vendors(id, name, slug),
        client:clients(id, name, slug),
        created_by_user:profiles!work_declarations_created_by_fkey(id, full_name, email)
      `,
        { count: 'exact' }
      )
      .order('created_at', { ascending: false })

    // Apply filters
    if (clientId) {
      query = query.eq('client_id', clientId)
    }
    if (status) {
      query = query.eq('status', status)
    }
    if (type) {
      query = query.eq('type', type)
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: declarations, error, count } = await query

    if (error) {
      console.error('Error fetching work declarations:', error)
      return NextResponse.json({ error: 'Failed to fetch work declarations' }, { status: 500 })
    }

    return NextResponse.json({
      declarations,
      pagination: {
        total: count || 0,
        limit,
        offset,
      },
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/work-declarations
 * Create a new work declaration
 */
export async function POST(request: Request) {
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

    // Get user's vendor_id
    const { data: profile } = await supabase
      .from('profiles')
      .select('vendor_id')
      .eq('id', user.id)
      .single()

    if (!profile?.vendor_id) {
      return NextResponse.json({ error: 'Vendor profile not found' }, { status: 404 })
    }

    // Parse request body
    const body = await request.json()
    const {
      client_id,
      content_batch_id,
      title,
      description,
      type,
      status = 'planned',
      priority = 'medium',
      start_date,
      due_date,
      progress_percentage = 0,
      milestones = [],
      deliverables = [],
      metadata = {},
      notes,
    } = body

    // Validate required fields
    if (!client_id || !title || !description || !type) {
      return NextResponse.json(
        { error: 'Missing required fields: client_id, title, description, type' },
        { status: 400 }
      )
    }

    // Validate type
    const validTypes = ['content_batch', 'seo_audit', 'publishing', 'analytics', 'reporting', 'custom']
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: `Invalid type. Must be one of: ${validTypes.join(', ')}` }, { status: 400 })
    }

    // Validate status
    const validStatuses = ['planned', 'in_progress', 'review', 'completed', 'on_hold', 'cancelled']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      )
    }

    // Validate priority
    const validPriorities = ['low', 'medium', 'high', 'urgent']
    if (!validPriorities.includes(priority)) {
      return NextResponse.json(
        { error: `Invalid priority. Must be one of: ${validPriorities.join(', ')}` },
        { status: 400 }
      )
    }

    // Verify client belongs to vendor and get client details
    const { data: client } = await supabase
      .from('clients')
      .select('vendor_id, name, email')
      .eq('id', client_id)
      .single()

    if (!client || client.vendor_id !== profile.vendor_id) {
      return NextResponse.json({ error: 'Client not found or does not belong to your organization' }, { status: 403 })
    }

    // Get vendor details for email
    const { data: vendor } = await supabase
      .from('vendors')
      .select('name')
      .eq('id', profile.vendor_id)
      .single()

    // Create work declaration
    const { data: declaration, error: insertError } = await supabase
      .from('work_declarations')
      .insert({
        vendor_id: profile.vendor_id,
        client_id,
        content_batch_id,
        created_by: user.id,
        title,
        description,
        type,
        status,
        priority,
        start_date,
        due_date,
        progress_percentage,
        milestones,
        deliverables,
        metadata,
        notes,
      })
      .select(
        `
        *,
        vendor:vendors(id, name, slug),
        client:clients(id, name, slug),
        created_by_user:profiles!work_declarations_created_by_fkey(id, full_name, email)
      `
      )
      .single()

    if (insertError) {
      console.error('Error creating work declaration:', insertError)
      return NextResponse.json({ error: 'Failed to create work declaration' }, { status: 500 })
    }

    // Send notification email to client using transactional email system (feat-013)
    if (client.email && vendor) {
      try {
        await queueTransactionalEmail({
          template_name: 'work_declared',
          to_email: client.email,
          to_name: client.name,
          variables: {
            client_name: client.name,
            vendor_name: vendor.name,
            work_title: title,
            work_description: description,
            work_type: type.replace('_', ' '),
            work_priority: priority,
            due_date: due_date ? new Date(due_date).toLocaleDateString() : '',
            portal_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:4848'}/portal/work`,
          },
          priority: 5,
        })
      } catch (emailError) {
        console.error('Error queueing work declared email:', emailError)
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json({ declaration }, { status: 201 })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
