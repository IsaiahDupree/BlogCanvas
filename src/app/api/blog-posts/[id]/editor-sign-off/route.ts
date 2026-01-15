import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/blog-posts/[id]/editor-sign-off
 * Toggle editor sign-off for a blog post
 *
 * Body:
 * - signedOff: boolean - whether to sign off or remove sign-off
 * - notes: string (optional) - sign-off notes
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createRouteHandlerClient({ cookies })

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { signedOff, notes } = body

    if (typeof signedOff !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'signedOff must be a boolean' },
        { status: 400 }
      )
    }

    // Update blog post with sign-off status
    const updateData: any = {
      editor_signed_off: signedOff,
      updated_at: new Date().toISOString()
    }

    if (signedOff) {
      // Signing off
      updateData.editor_signed_off_by = user.id
      updateData.editor_signed_off_at = new Date().toISOString()
      updateData.editor_sign_off_notes = notes || null
    } else {
      // Removing sign-off
      updateData.editor_signed_off_by = null
      updateData.editor_signed_off_at = null
      updateData.editor_sign_off_notes = null
    }

    const { data: post, error: updateError } = await supabase
      .from('blog_posts')
      .update(updateData)
      .eq('id', id)
      .select('id, topic, editor_signed_off, editor_signed_off_at, editor_sign_off_notes')
      .single()

    if (updateError) {
      console.error('Error updating sign-off:', updateError)
      return NextResponse.json(
        { success: false, error: 'Failed to update sign-off status' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      post,
      message: signedOff
        ? 'Post signed off successfully. Ready for client approval.'
        : 'Sign-off removed successfully.'
    })
  } catch (error: any) {
    console.error('Editor sign-off error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/blog-posts/[id]/editor-sign-off
 * Get editor sign-off status for a blog post
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createRouteHandlerClient({ cookies })

    const { data: post, error } = await supabase
      .from('blog_posts')
      .select('id, topic, editor_signed_off, editor_signed_off_by, editor_signed_off_at, editor_sign_off_notes')
      .eq('id', id)
      .single()

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Post not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      signOff: {
        signedOff: post.editor_signed_off || false,
        signedOffBy: post.editor_signed_off_by,
        signedOffAt: post.editor_signed_off_at,
        notes: post.editor_sign_off_notes
      }
    })
  } catch (error: any) {
    console.error('Get sign-off error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
