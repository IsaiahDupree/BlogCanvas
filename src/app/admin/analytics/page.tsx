'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface AnalyticsData {
  growth: {
    total_vendors: number
    vendors_last_30_days: number
    vendor_growth_percentage: number
    total_clients: number
    total_offers: number
    total_blog_posts: number
    tier_distribution: Record<string, number>
  }
  revenue: {
    total_revenue: number
    revenue_this_month: number
    total_orders: number
    orders_by_status: Record<string, number>
  }
  usage: {
    total_events: number
    events_by_type: Record<string, number>
    blog_posts_by_status: Record<string, number>
  }
  errors: {
    total_errors: number
    errors_by_severity: Record<string, number>
  }
}

export default function AdminAnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [days, setDays] = useState(30)

  useEffect(() => {
    fetchAnalytics()
  }, [days])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/analytics?days=${days}`)
      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch analytics')
      }

      setAnalytics(data.analytics)
      setError(null)
    } catch (err: any) {
      setError(err.message)
      console.error('Error fetching analytics:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-8">
        <h1 className="text-3xl font-bold mb-8">Admin Analytics</h1>
        <p>Loading analytics...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-8">
        <h1 className="text-3xl font-bold mb-8">Admin Analytics</h1>
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4">
          <p className="font-semibold">Error</p>
          <p>{error}</p>
        </div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="container mx-auto p-8">
        <h1 className="text-3xl font-bold mb-8">Admin Analytics</h1>
        <p>No analytics data available</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Admin Analytics</h1>
        <select
          value={days}
          onChange={(e) => setDays(parseInt(e.target.value))}
          className="px-4 py-2 border border-gray-300 rounded-lg"
        >
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Growth Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Total Vendors</CardTitle>
            <CardDescription>Platform-wide</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{analytics.growth.total_vendors}</p>
            <p className="text-sm text-gray-600 mt-2">
              {analytics.growth.vendors_last_30_days} in last 30 days
            </p>
            <p className="text-sm text-green-600 mt-1">
              {analytics.growth.vendor_growth_percentage > 0 ? '+' : ''}
              {analytics.growth.vendor_growth_percentage.toFixed(1)}% growth
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Total Clients</CardTitle>
            <CardDescription>All vendors</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{analytics.growth.total_clients}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Total Offers</CardTitle>
            <CardDescription>Published offers</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{analytics.growth.total_offers}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Blog Posts</CardTitle>
            <CardDescription>All content</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{analytics.growth.total_blog_posts}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Revenue Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue</CardTitle>
            <CardDescription>Financial metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold">
                  ${(analytics.revenue.total_revenue / 100).toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">This Month</p>
                <p className="text-xl font-semibold">
                  ${(analytics.revenue.revenue_this_month / 100).toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Orders</p>
                <p className="text-xl font-semibold">{analytics.revenue.total_orders}</p>
              </div>
              <div className="pt-4 border-t">
                <p className="text-sm font-semibold mb-2">Orders by Status</p>
                {Object.entries(analytics.revenue.orders_by_status).map(([status, count]) => (
                  <div key={status} className="flex justify-between text-sm">
                    <span className="capitalize">{status}</span>
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tier Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Tier Distribution</CardTitle>
            <CardDescription>Vendors by pricing tier</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(analytics.growth.tier_distribution).map(([tier, count]) => (
                <div key={tier} className="flex justify-between items-center">
                  <span className="capitalize font-medium">{tier}</span>
                  <div className="flex items-center gap-3">
                    <div className="w-48 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{
                          width: `${(count / analytics.growth.total_vendors) * 100}%`
                        }}
                      />
                    </div>
                    <span className="text-sm font-semibold w-12 text-right">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Usage Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>Usage Events</CardTitle>
            <CardDescription>Last {days} days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-2xl font-bold mb-4">{analytics.usage.total_events} events</p>
              {Object.entries(analytics.usage.events_by_type).map(([type, count]) => (
                <div key={type} className="flex justify-between text-sm">
                  <span className="capitalize">{type.replace(/_/g, ' ')}</span>
                  <span className="font-medium">{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Error Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>Errors</CardTitle>
            <CardDescription>Last {days} days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-2xl font-bold mb-4">{analytics.errors.total_errors} errors</p>
              {Object.entries(analytics.errors.errors_by_severity).map(([severity, count]) => (
                <div key={severity} className="flex justify-between text-sm">
                  <span className="capitalize">{severity}</span>
                  <span
                    className={`font-medium ${
                      severity === 'error' ? 'text-red-600' :
                      severity === 'warning' ? 'text-yellow-600' :
                      'text-gray-600'
                    }`}
                  >
                    {count}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
