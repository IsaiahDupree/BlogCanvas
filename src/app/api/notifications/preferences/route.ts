import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/notifications/preferences
 *
 * Get notification preferences for the authenticated user
 */
export async function GET() {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch user's notification preferences
    const { data, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', user.id)

    if (error) {
      console.error('Error fetching notification preferences:', error)
      return NextResponse.json(
        { error: 'Failed to fetch notification preferences' },
        { status: 500 }
      )
    }

    return NextResponse.json({ preferences: data || [] })
  } catch (error) {
    console.error('Error in GET /api/notifications/preferences:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/notifications/preferences
 *
 * Update notification preferences for the authenticated user
 *
 * Body:
 * {
 *   preferences: Array<{
 *     channel: 'push' | 'email' | 'sms',
 *     event_type: string,
 *     enabled: boolean
 *   }>
 * }
 */
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { preferences } = body

    if (!Array.isArray(preferences)) {
      return NextResponse.json(
        { error: 'Preferences must be an array' },
        { status: 400 }
      )
    }

    // Update preferences
    const updates = preferences.map((pref) => ({
      user_id: user.id,
      channel: pref.channel,
      event_type: pref.event_type,
      enabled: pref.enabled,
    }))

    const { data, error } = await supabase
      .from('notification_preferences')
      .upsert(updates, {
        onConflict: 'user_id,channel,event_type',
      })
      .select()

    if (error) {
      console.error('Error updating notification preferences:', error)
      return NextResponse.json(
        { error: 'Failed to update notification preferences' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      preferences: data,
    })
  } catch (error) {
    console.error('Error in PUT /api/notifications/preferences:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
