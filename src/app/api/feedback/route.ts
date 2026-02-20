import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { submitFeedback, getVendorFeedback } from '@/lib/feedback/feedback-service'

// POST /api/feedback - Submit user feedback
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { category, title, description, priority, screenshot } = body

    if (!category || !title || !description) {
      return NextResponse.json(
        { error: 'Missing required fields: category, title, description' },
        { status: 400 }
      )
    }

    // Get vendor ID
    const { data: profile } = await supabase
      .from('vendor_users')
      .select('vendor_id')
      .eq('user_id', user.id)
      .single()

    if (!profile) {
      // Check if user is a client user
      const { data: clientUser } = await supabase
        .from('client_users')
        .select('client:clients(vendor_id)')
        .eq('user_id', user.id)
        .single()

      if (!clientUser) {
        return NextResponse.json(
          { error: 'User profile not found' },
          { status: 404 }
        )
      }

      // Submit feedback for client user
      const result = await submitFeedback({
        vendor_id: (clientUser.client as any).vendor_id,
        user_id: user.id,
        category,
        title,
        description,
        priority: priority || 'medium',
        url: request.headers.get('referer') || undefined,
        user_agent: request.headers.get('user-agent') || undefined,
        screenshot_url: screenshot || undefined
      })

      if (!result.success) {
        return NextResponse.json(
          { error: result.error || 'Failed to submit feedback' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        feedback_id: result.feedback_id,
        message: 'Feedback submitted successfully'
      })
    }

    // Submit feedback for vendor user
    const result = await submitFeedback({
      vendor_id: profile.vendor_id,
      user_id: user.id,
      category,
      title,
      description,
      priority: priority || 'medium',
      url: request.headers.get('referer') || undefined,
      user_agent: request.headers.get('user-agent') || undefined,
      screenshot_url: screenshot || undefined
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to submit feedback' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      feedback_id: result.feedback_id,
      message: 'Feedback submitted successfully'
    })

  } catch (error) {
    console.error('Error in feedback submission:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET /api/feedback - Get vendor feedback
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get vendor ID
    const { data: profile } = await supabase
      .from('vendor_users')
      .select('vendor_id')
      .eq('user_id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json(
        { error: 'Vendor profile not found' },
        { status: 404 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const category = searchParams.get('category') as any
    const status = searchParams.get('status') as any
    const limit = parseInt(searchParams.get('limit') || '50')

    const feedback = await getVendorFeedback(profile.vendor_id, {
      category,
      status,
      limit
    })

    return NextResponse.json({
      success: true,
      data: feedback
    })

  } catch (error) {
    console.error('Error fetching feedback:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
