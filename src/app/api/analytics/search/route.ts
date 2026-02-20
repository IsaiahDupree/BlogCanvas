import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  getNoResultQueries,
  getPopularSearches,
  getSearchAnalyticsSummary
} from '@/lib/analytics/search-analytics'

// GET /api/analytics/search - Get search analytics for vendor
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

    // Get vendor ID from user
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

    const vendorId = profile.vendor_id
    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get('type') || 'summary'
    const days = parseInt(searchParams.get('days') || '30')
    const limit = parseInt(searchParams.get('limit') || '50')

    if (type === 'no-results') {
      const noResults = await getNoResultQueries(vendorId, limit)
      return NextResponse.json({
        success: true,
        data: noResults
      })
    }

    if (type === 'popular') {
      const popular = await getPopularSearches(vendorId, limit, days)
      return NextResponse.json({
        success: true,
        data: popular
      })
    }

    // Default: return summary
    const summary = await getSearchAnalyticsSummary(vendorId, days)
    return NextResponse.json({
      success: true,
      data: summary
    })

  } catch (error) {
    console.error('Error fetching search analytics:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
