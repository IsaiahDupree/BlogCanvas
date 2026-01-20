import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { subscribeToPush, type PushSubscription } from '@/lib/notifications/push'

/**
 * POST /api/push/subscribe
 *
 * Subscribe a user to push notifications
 *
 * Body:
 * {
 *   subscription: PushSubscription,
 *   deviceInfo?: { browser?: string, os?: string, device?: string }
 * }
 */
export async function POST(request: NextRequest) {
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
    const { subscription, deviceInfo } = body

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return NextResponse.json(
        { error: 'Invalid subscription object' },
        { status: 400 }
      )
    }

    // Subscribe user to push notifications
    const result = await subscribeToPush(
      user.id,
      subscription as PushSubscription,
      deviceInfo
    )

    return NextResponse.json({
      success: true,
      subscription: result,
    })
  } catch (error) {
    console.error('Error subscribing to push:', error)
    return NextResponse.json(
      { error: 'Failed to subscribe to push notifications' },
      { status: 500 }
    )
  }
}
