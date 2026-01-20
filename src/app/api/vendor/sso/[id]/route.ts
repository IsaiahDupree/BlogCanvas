/**
 * SSO Connection by ID API
 * Manage individual SSO connections
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { deleteSSOConnection, upsertSSOConnection, testSSOConnection } from '@/lib/auth/sso'

/**
 * GET /api/vendor/sso/[id]
 * Get a specific SSO connection
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { data: connection, error } = await supabase
      .from('sso_connections')
      .select('*')
      .eq('id', params.id)
      .eq('vendor_id', user.id)
      .single()

    if (error || !connection) {
      return NextResponse.json(
        { error: 'SSO connection not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ connection })
  } catch (error) {
    console.error('Error fetching SSO connection:', error)
    return NextResponse.json(
      { error: 'Failed to fetch SSO connection' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/vendor/sso/[id]
 * Update a specific SSO connection
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify ownership
    const { data: existing } = await supabase
      .from('sso_connections')
      .select('*')
      .eq('id', params.id)
      .eq('vendor_id', user.id)
      .single()

    if (!existing) {
      return NextResponse.json(
        { error: 'SSO connection not found' },
        { status: 404 }
      )
    }

    const body = await request.json()

    // Update the connection
    const { data: connection, error } = await supabase
      .from('sso_connections')
      .update({
        name: body.name ?? existing.name,
        domain: body.domain ?? existing.domain,
        enabled: body.enabled ?? existing.enabled,
        config: body.config ?? existing.config,
      })
      .eq('id', params.id)
      .eq('vendor_id', user.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: 'Failed to update SSO connection' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      connection,
      message: 'SSO connection updated successfully'
    })
  } catch (error) {
    console.error('Error updating SSO connection:', error)
    return NextResponse.json(
      { error: 'Failed to update SSO connection' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/vendor/sso/[id]
 * Delete a specific SSO connection
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify ownership before deleting
    const { data: existing } = await supabase
      .from('sso_connections')
      .select('id')
      .eq('id', params.id)
      .eq('vendor_id', user.id)
      .single()

    if (!existing) {
      return NextResponse.json(
        { error: 'SSO connection not found' },
        { status: 404 }
      )
    }

    await deleteSSOConnection(params.id)

    return NextResponse.json({
      message: 'SSO connection deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting SSO connection:', error)
    return NextResponse.json(
      { error: 'Failed to delete SSO connection' },
      { status: 500 }
    )
  }
}
