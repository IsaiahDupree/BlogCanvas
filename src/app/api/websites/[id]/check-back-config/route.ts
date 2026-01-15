import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

/**
 * GET /api/websites/[id]/check-back-config
 * Get check-back configuration for a website
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: websiteId } = await params

    // Get configuration or create default if not exists
    let { data: config, error } = await supabaseAdmin
      .from('check_back_configurations')
      .select('*')
      .eq('website_id', websiteId)
      .single()

    if (error) {
      // If no config exists, create default
      if (error.code === 'PGRST116') {
        const { data: newConfig, error: insertError } = await supabaseAdmin
          .from('check_back_configurations')
          .insert({
            website_id: websiteId,
            intervals: [7, 30, 60, 90],
            enabled: true
          })
          .select()
          .single()

        if (insertError) {
          return NextResponse.json(
            { error: 'Failed to create default configuration' },
            { status: 500 }
          )
        }

        config = newConfig
      } else {
        return NextResponse.json(
          { error: 'Failed to fetch configuration' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json(config)
  } catch (error) {
    console.error('Error fetching check-back configuration:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/websites/[id]/check-back-config
 * Update check-back configuration for a website
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: websiteId } = await params
    const body = await request.json()

    const { intervals, enabled } = body

    // Validate intervals
    if (intervals && !Array.isArray(intervals)) {
      return NextResponse.json(
        { error: 'Intervals must be an array' },
        { status: 400 }
      )
    }

    if (intervals && intervals.some((i: any) => typeof i !== 'number' || i <= 0)) {
      return NextResponse.json(
        { error: 'All intervals must be positive numbers' },
        { status: 400 }
      )
    }

    // Check if configuration exists
    const { data: existing } = await supabaseAdmin
      .from('check_back_configurations')
      .select('id')
      .eq('website_id', websiteId)
      .single()

    let result

    if (existing) {
      // Update existing
      const { data, error } = await supabaseAdmin
        .from('check_back_configurations')
        .update({
          intervals: intervals || undefined,
          enabled: enabled !== undefined ? enabled : undefined,
          updated_at: new Date().toISOString()
        })
        .eq('website_id', websiteId)
        .select()
        .single()

      if (error) {
        console.error('Update error:', error)
        return NextResponse.json(
          { error: 'Failed to update configuration' },
          { status: 500 }
        )
      }

      result = data
    } else {
      // Insert new
      const { data, error } = await supabaseAdmin
        .from('check_back_configurations')
        .insert({
          website_id: websiteId,
          intervals: intervals || [7, 30, 60, 90],
          enabled: enabled !== undefined ? enabled : true
        })
        .select()
        .single()

      if (error) {
        console.error('Insert error:', error)
        return NextResponse.json(
          { error: 'Failed to create configuration' },
          { status: 500 }
        )
      }

      result = data
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error updating check-back configuration:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/websites/[id]/check-back-config
 * Reset check-back configuration to default
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: websiteId } = await params

    // Reset to default
    const { data, error } = await supabaseAdmin
      .from('check_back_configurations')
      .upsert({
        website_id: websiteId,
        intervals: [7, 30, 60, 90],
        enabled: true,
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: 'Failed to reset configuration' },
        { status: 500 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error resetting check-back configuration:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
