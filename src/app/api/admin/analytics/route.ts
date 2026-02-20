/**
 * Admin Analytics API
 * GET /api/admin/analytics - Get platform-wide analytics (admin only)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase'

async function checkAdminAccess(supabase: any, userId: string): Promise<boolean> {
  const { data: profile } = await supabase
    .from('vendor_profiles')
    .select('role')
    .eq('id', userId)
    .single()

  return profile?.role === 'admin'
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check admin access
    const isAdmin = await checkAdminAccess(supabase, user.id)
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }

    // Get date range from query params
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30')
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Fetch platform-wide analytics
    const [
      vendorsResult,
      clientsResult,
      offersResult,
      blogPostsResult,
      ordersResult,
      revenueResult,
      usageEventsResult,
      errorLogsResult
    ] = await Promise.all([
      // Total vendors
      supabaseAdmin
        .from('vendors')
        .select('id, created_at, tier', { count: 'exact' }),

      // Total clients
      supabaseAdmin
        .from('vendor_clients')
        .select('id, created_at', { count: 'exact' }),

      // Total offers
      supabaseAdmin
        .from('offers')
        .select('id, created_at', { count: 'exact' }),

      // Total blog posts
      supabaseAdmin
        .from('blog_posts')
        .select('id, created_at, status', { count: 'exact' }),

      // Total orders
      supabaseAdmin
        .from('vendor_orders')
        .select('id, created_at, status', { count: 'exact' }),

      // Revenue (from orders)
      supabaseAdmin
        .from('vendor_orders')
        .select('amount, created_at')
        .eq('status', 'completed'),

      // Usage events (last 30 days)
      supabaseAdmin
        .from('usage_events')
        .select('event_type, created_at', { count: 'exact' })
        .gte('created_at', startDate.toISOString()),

      // Error logs (last 30 days)
      supabaseAdmin
        .from('error_logs')
        .select('severity, created_at', { count: 'exact' })
        .gte('created_at', startDate.toISOString())
    ])

    // Calculate growth metrics
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)

    const vendorsLast30Days = vendorsResult.data?.filter(v =>
      new Date(v.created_at) >= thirtyDaysAgo
    ).length || 0

    const vendorsPrevious30Days = vendorsResult.data?.filter(v =>
      new Date(v.created_at) >= sixtyDaysAgo && new Date(v.created_at) < thirtyDaysAgo
    ).length || 0

    const vendorGrowth = vendorsPrevious30Days > 0
      ? ((vendorsLast30Days - vendorsPrevious30Days) / vendorsPrevious30Days) * 100
      : 0

    // Calculate tier distribution
    const tierDistribution = vendorsResult.data?.reduce((acc: any, vendor: any) => {
      const tier = vendor.tier || 'free'
      acc[tier] = (acc[tier] || 0) + 1
      return acc
    }, {}) || {}

    // Calculate total revenue
    const totalRevenue = revenueResult.data?.reduce((sum, order) => sum + (order.amount || 0), 0) || 0
    const revenueThisMonth = revenueResult.data?.filter(order =>
      new Date(order.created_at).getMonth() === now.getMonth()
    ).reduce((sum, order) => sum + (order.amount || 0), 0) || 0

    // Calculate blog post status distribution
    const blogPostsByStatus = blogPostsResult.data?.reduce((acc: any, post: any) => {
      const status = post.status || 'draft'
      acc[status] = (acc[status] || 0) + 1
      return acc
    }, {}) || {}

    // Calculate order status distribution
    const ordersByStatus = ordersResult.data?.reduce((acc: any, order: any) => {
      const status = order.status || 'pending'
      acc[status] = (acc[status] || 0) + 1
      return acc
    }, {}) || {}

    // Calculate usage event distribution
    const eventsByType = usageEventsResult.data?.reduce((acc: any, event: any) => {
      const type = event.event_type
      acc[type] = (acc[type] || 0) + 1
      return acc
    }, {}) || {}

    // Calculate error distribution
    const errorsBySeverity = errorLogsResult.data?.reduce((acc: any, error: any) => {
      const severity = error.severity || 'info'
      acc[severity] = (acc[severity] || 0) + 1
      return acc
    }, {}) || {}

    return NextResponse.json({
      success: true,
      analytics: {
        // Growth metrics
        growth: {
          total_vendors: vendorsResult.count || 0,
          vendors_last_30_days: vendorsLast30Days,
          vendor_growth_percentage: Math.round(vendorGrowth * 100) / 100,
          total_clients: clientsResult.count || 0,
          total_offers: offersResult.count || 0,
          total_blog_posts: blogPostsResult.count || 0,
          tier_distribution: tierDistribution
        },

        // Revenue metrics
        revenue: {
          total_revenue: totalRevenue,
          revenue_this_month: revenueThisMonth,
          total_orders: ordersResult.count || 0,
          orders_by_status: ordersByStatus
        },

        // Usage metrics
        usage: {
          total_events: usageEventsResult.count || 0,
          events_by_type: eventsByType,
          blog_posts_by_status: blogPostsByStatus
        },

        // Error metrics
        errors: {
          total_errors: errorLogsResult.count || 0,
          errors_by_severity: errorsBySeverity
        }
      },
      period: {
        start_date: startDate.toISOString(),
        end_date: now.toISOString(),
        days
      }
    })
  } catch (error) {
    console.error('Error fetching admin analytics:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
