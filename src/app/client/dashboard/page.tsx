'use client'

import Link from 'next/link'
import {
  User,
  CreditCard,
  Settings,
  FileText,
  MessageSquare,
  Calendar,
  TrendingUp,
  Shield,
  HelpCircle,
  Bell
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function ClientDashboardPage() {
  // Mock data - would come from API
  const clientData = {
    name: 'John Smith',
    email: 'john@acmesoftware.com',
    company: 'Acme Software Inc',
    plan: 'Pro',
    planPrice: '$299/month',
    nextBilling: 'Feb 19, 2026',
    activeWorkspaces: 2,
    totalInvoices: 24,
    accountCreated: 'Jan 15, 2024'
  }

  const stats = [
    {
      label: 'Active Workspaces',
      value: clientData.activeWorkspaces,
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-100'
    },
    {
      label: 'Content Requests',
      value: 12,
      icon: MessageSquare,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-100'
    },
    {
      label: 'Scheduled Meetings',
      value: 3,
      icon: Calendar,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-100'
    },
    {
      label: 'Total Invoices',
      value: clientData.totalInvoices,
      icon: TrendingUp,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-100'
    }
  ]

  const quickActions = [
    {
      title: 'Manage Profile',
      description: 'Update your personal information',
      href: '/client/profile',
      icon: User,
      color: 'from-blue-500 to-cyan-500'
    },
    {
      title: 'Billing & Subscription',
      description: 'View invoices and manage payment',
      href: '/client/billing',
      icon: CreditCard,
      color: 'from-purple-500 to-pink-500'
    },
    {
      title: 'Request Content',
      description: 'Submit a new content request',
      href: '/client/requests/new',
      icon: MessageSquare,
      color: 'from-green-500 to-emerald-500'
    },
    {
      title: 'View Invoices',
      description: 'Access your invoice history',
      href: '/client/invoices',
      icon: FileText,
      color: 'from-orange-500 to-red-500'
    },
    {
      title: 'Security Settings',
      description: 'Manage password and 2FA',
      href: '/client/security',
      icon: Shield,
      color: 'from-red-500 to-pink-500'
    },
    {
      title: 'Get Help',
      description: 'Browse help articles and support',
      href: '/client/support',
      icon: HelpCircle,
      color: 'from-indigo-500 to-purple-500'
    }
  ]

  const recentActivity = [
    {
      type: 'invoice',
      title: 'Invoice paid',
      description: '$299.00 - Invoice #INV-2024-024',
      date: '2 hours ago',
      icon: CreditCard,
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600'
    },
    {
      type: 'request',
      title: 'Content request submitted',
      description: 'Blog post: "10 Ways to Improve Sales"',
      date: '1 day ago',
      icon: MessageSquare,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600'
    },
    {
      type: 'meeting',
      title: 'Meeting scheduled',
      description: 'Strategy call with your vendor',
      date: '2 days ago',
      icon: Calendar,
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Welcome back, {clientData.name.split(' ')[0]}!</h1>
              <p className="text-muted-foreground mt-1">{clientData.company}</p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/client/notifications"
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative"
              >
                <Bell className="w-6 h-6 text-gray-600" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </Link>
              <Link
                href="/client/settings"
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Settings className="w-6 h-6 text-gray-600" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Current Plan */}
        <Card className="p-6 bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-xl mb-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-indigo-100 text-sm mb-1">Current Plan</p>
              <h2 className="text-3xl font-bold mb-2">{clientData.plan} Plan</h2>
              <p className="text-indigo-100">{clientData.planPrice}</p>
            </div>
            <div className="text-right">
              <p className="text-indigo-100 text-sm mb-1">Next Billing</p>
              <p className="text-xl font-semibold">{clientData.nextBilling}</p>
              <Link
                href="/client/billing"
                className="mt-4 inline-block px-4 py-2 bg-white text-indigo-600 rounded-lg font-medium hover:bg-indigo-50 transition-colors"
              >
                Manage Subscription
              </Link>
            </div>
          </div>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <Card key={stat.label} className={`p-6 ${stat.bgColor} border-2 ${stat.borderColor}`}>
                <div className="flex items-center justify-between mb-2">
                  <Icon className={`w-8 h-8 ${stat.color}`} />
                </div>
                <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
              </Card>
            )
          })}
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quickActions.map((action) => {
              const Icon = action.icon
              return (
                <Link key={action.title} href={action.href}>
                  <Card className="p-6 hover:shadow-xl transition-shadow h-full group">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${action.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{action.title}</h3>
                    <p className="text-sm text-muted-foreground">{action.description}</p>
                  </Card>
                </Link>
              )
            })}
          </div>
        </div>

        {/* Recent Activity */}
        <Card className="p-6 bg-white shadow-xl">
          <h2 className="text-2xl font-bold mb-6">Recent Activity</h2>
          <div className="space-y-4">
            {recentActivity.map((activity, index) => {
              const Icon = activity.icon
              return (
                <div key={index} className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50/30 transition-all">
                  <div className={`w-10 h-10 rounded-full ${activity.iconBg} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-5 h-5 ${activity.iconColor}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900">{activity.title}</h3>
                    <p className="text-sm text-muted-foreground">{activity.description}</p>
                  </div>
                  <span className="text-sm text-muted-foreground whitespace-nowrap">{activity.date}</span>
                </div>
              )
            })}
          </div>
        </Card>

        {/* Account Info */}
        <Card className="p-6 bg-white shadow-xl mt-8">
          <h2 className="text-2xl font-bold mb-4">Account Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Email</p>
              <p className="font-medium text-gray-900">{clientData.email}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Company</p>
              <p className="font-medium text-gray-900">{clientData.company}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Member Since</p>
              <p className="font-medium text-gray-900">{clientData.accountCreated}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Plan</p>
              <Badge className="bg-indigo-100 text-indigo-700">{clientData.plan}</Badge>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
