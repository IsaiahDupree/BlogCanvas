import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { deleteUserData } from '@/lib/gdpr/data-export'

/**
 * GDPR Data Deletion API
 * feat-045: Data export/deletion/consent
 *
 * Allows users to permanently delete all their data (Right to be forgotten)
 */

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Get authenticated user
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { confirmation } = body

    // Require explicit confirmation
    if (confirmation !== 'DELETE_MY_DATA') {
      return NextResponse.json(
        { error: 'Confirmation required. Send confirmation: "DELETE_MY_DATA"' },
        { status: 400 }
      )
    }

    // Log the deletion request
    await supabase.from('gdpr_requests').insert({
      user_id: session.user.id,
      request_type: 'data_deletion',
      status: 'processing',
    })

    // Delete all user data
    await deleteUserData(session.user.id)

    // Update the request status
    await supabase
      .from('gdpr_requests')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('user_id', session.user.id)
      .eq('request_type', 'data_deletion')

    return NextResponse.json({
      success: true,
      message: 'All your data has been permanently deleted',
    })
  } catch (error) {
    console.error('Error deleting user data:', error)
    return NextResponse.json(
      { error: 'Failed to delete data' },
      { status: 500 }
    )
  }
}
