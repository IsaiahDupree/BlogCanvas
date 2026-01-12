import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { queueTransactionalEmail } from '@/lib/emails/transactional-email-service'

/**
 * GET /api/work-declarations/[id]
 * Get a single work declaration with full details including updates
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

    // Fetch work declaration with relationships
    const { data: declaration, error } = await supabase
      .from('work_declarations')
      .select(
        `
        *,
        vendor:vendors(id, name, slug),
        client:clients(id, name, slug, email),
        content_batch:content_batches(id, name, status),
        created_by_user:profiles!work_declarations_created_by_fkey(id, full_name, email, avatar_url)
      `
      )
      .eq('id', id)
      .single()

    if (error || !declaration) {
      return NextResponse.json({ error: 'Work declaration not found' }, { status: 404 })
    }

    // Fetch updates for this declaration
    const { data: updates, error: updatesError } = await supabase
      .from('work_declaration_updates')
      .select(
        `
        *,
        created_by_user:profiles!work_declaration_updates_created_by_fkey(id, full_name, email, avatar_url)
      `
      )
      .eq('work_declaration_id', id)
      .order('created_at', { ascending: false })

    if (updatesError) {
      console.error('Error fetching updates:', updatesError)
    }

    return NextResponse.json({
      declaration,
      updates: updates || [],
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PATCH /api/work-declarations/[id]
 * Update a work declaration
 */
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
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

    // Fetch current declaration to check for status changes
    const { data: currentDeclaration } = await supabase
      .from('work_declarations')
      .select(
        `
        *,
        vendor:vendors(id, name),
        client:clients(id, name, email)
      `
      )
      .eq('id', id)
      .single()

    if (!currentDeclaration) {
      return NextResponse.json({ error: 'Work declaration not found' }, { status: 404 })
    }

    // Parse request body
    const body = await request.json()
    const {
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
    } = body

    // Build update object (only include provided fields)
    const updateData: any = {}
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (type !== undefined) updateData.type = type
    if (status !== undefined) updateData.status = status
    if (priority !== undefined) updateData.priority = priority
    if (start_date !== undefined) updateData.start_date = start_date
    if (due_date !== undefined) updateData.due_date = due_date
    if (progress_percentage !== undefined) updateData.progress_percentage = progress_percentage
    if (milestones !== undefined) updateData.milestones = milestones
    if (deliverables !== undefined) updateData.deliverables = deliverables
    if (metadata !== undefined) updateData.metadata = metadata
    if (notes !== undefined) updateData.notes = notes

    // Update work declaration (RLS will ensure user has permission)
    const { data: declaration, error: updateError } = await supabase
      .from('work_declarations')
      .update(updateData)
      .eq('id', id)
      .select(
        `
        *,
        vendor:vendors(id, name, slug),
        client:clients(id, name, slug),
        created_by_user:profiles!work_declarations_created_by_fkey(id, full_name, email)
      `
      )
      .single()

    if (updateError) {
      console.error('Error updating work declaration:', updateError)
      return NextResponse.json({ error: 'Failed to update work declaration' }, { status: 500 })
    }

    if (!declaration) {
      return NextResponse.json({ error: 'Work declaration not found or access denied' }, { status: 404 })
    }

    // Send notification email to client if status changed
    const statusChanged = status !== undefined && currentDeclaration.status !== status
    const isCompleted = status === 'completed'

    if (currentDeclaration.client.email && currentDeclaration.vendor) {
      try {
        if (isCompleted) {
          // Send completion email
          await queueTransactionalEmail({
            template_name: 'work_completed',
            to_email: currentDeclaration.client.email,
            to_name: currentDeclaration.client.name,
            variables: {
              client_name: currentDeclaration.client.name,
              vendor_name: currentDeclaration.vendor.name,
              work_title: declaration.title,
              portal_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:4848'}/portal/work`,
              completion_message: notes || '',
              deliverables_count: declaration.deliverables?.length?.toString() || '0',
            },
            priority: 5,
          })
        } else if (statusChanged) {
          // Send status change email
          await queueTransactionalEmail({
            template_name: 'work_status_changed',
            to_email: currentDeclaration.client.email,
            to_name: currentDeclaration.client.name,
            variables: {
              client_name: currentDeclaration.client.name,
              vendor_name: currentDeclaration.vendor.name,
              work_title: declaration.title,
              old_status: currentDeclaration.status.replace('_', ' '),
              new_status: status.replace('_', ' '),
              portal_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:4848'}/portal/work`,
              progress_percentage: declaration.progress_percentage?.toString() || '',
              update_comment: notes || '',
            },
            priority: 5,
          })
        }
      } catch (emailError) {
        console.error('Error queueing status change email:', emailError)
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json({ declaration })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * DELETE /api/work-declarations/[id]
 * Delete a work declaration
 */
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
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

    // Delete work declaration (RLS will ensure user has permission)
    const { error: deleteError } = await supabase.from('work_declarations').delete().eq('id', id)

    if (deleteError) {
      console.error('Error deleting work declaration:', deleteError)
      return NextResponse.json({ error: 'Failed to delete work declaration' }, { status: 500 })
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
