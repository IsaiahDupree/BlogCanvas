import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/webhooks/integrations - Get vendor webhooks
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('vendor_users')
      .select('vendor_id')
      .eq('user_id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Vendor profile not found' }, { status: 404 })
    }

    const { data: webhooks, error } = await supabase
      .from('vendor_webhooks')
      .select('*')
      .eq('vendor_id', profile.vendor_id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching webhooks:', error)
      return NextResponse.json({ error: 'Failed to fetch webhooks' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: webhooks })
  } catch (error) {
    console.error('Error in webhooks GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/webhooks/integrations - Create webhook
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('vendor_users')
      .select('vendor_id')
      .eq('user_id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Vendor profile not found' }, { status: 404 })
    }

    const body = await request.json()
    const { platform, webhook_url, name, description, events } = body

    if (!platform || !webhook_url || !name) {
      return NextResponse.json(
        { error: 'Missing required fields: platform, webhook_url, name' },
        { status: 400 }
      )
    }

    if (!['slack', 'discord'].includes(platform)) {
      return NextResponse.json(
        { error: 'Invalid platform. Must be slack or discord' },
        { status: 400 }
      )
    }

    const { data: webhook, error } = await supabase
      .from('vendor_webhooks')
      .insert({
        vendor_id: profile.vendor_id,
        platform,
        webhook_url,
        name,
        description,
        events: events || ['order', 'message', 'meeting', 'approval', 'payment']
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating webhook:', error)
      return NextResponse.json({ error: 'Failed to create webhook' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: webhook,
      message: 'Webhook created successfully'
    })
  } catch (error) {
    console.error('Error in webhooks POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
