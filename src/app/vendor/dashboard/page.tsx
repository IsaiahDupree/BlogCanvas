'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  FileText,
  Users,
  DollarSign,
  TrendingUp,
  Eye,
  MousePointerClick,
  ShoppingCart,
  Calendar
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import type { Vendor } from '@/types/vendor';

interface DashboardStats {
  totalPages: number;
  publishedPages: number;
  totalClients: number;
  activeWorkspaces: number;
  totalRevenue: number;
  monthlyRevenue: number;
  totalViews: number;
  conversionRate: number;
}

export default function VendorDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalPages: 0,
    publishedPages: 0,
    totalClients: 0,
    activeWorkspaces: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    totalViews: 0,
    conversionRate: 0
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Load vendor profile
      const profileResponse = await fetch('/api/vendor/profile');
      const profileData = await profileResponse.json();

      if (!profileData.success) {
        router.push('/vendor/register');
        return;
      }

      setVendor(profileData.vendor);

      // Load dashboard stats from API
      const statsResponse = await fetch('/api/vendor/dashboard/stats');
      const statsData = await statsResponse.json();

      if (statsData.success) {
        setStats(statsData.stats);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error loading dashboard:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="p-8">
        <Card className="p-6 text-center">
          <p className="text-gray-600">No vendor profile found. Redirecting...</p>
        </Card>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Pages',
      value: stats.totalPages,
      subtitle: `${stats.publishedPages} published`,
      icon: FileText,
      color: 'blue',
      href: '/vendor/pages'
    },
    {
      title: 'Active Clients',
      value: stats.activeWorkspaces,
      subtitle: `${stats.totalClients} total`,
      icon: Users,
      color: 'green',
      href: '/vendor/clients'
    },
    {
      title: 'Total Revenue',
      value: `$${stats.totalRevenue.toLocaleString()}`,
      subtitle: `$${stats.monthlyRevenue.toLocaleString()} this month`,
      icon: DollarSign,
      color: 'purple',
      href: '/vendor/sales'
    },
    {
      title: 'Page Views',
      value: stats.totalViews.toLocaleString(),
      subtitle: `${stats.conversionRate}% conversion`,
      icon: Eye,
      color: 'orange',
      href: '/vendor/analytics'
    }
  ];

  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600'
  };

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Welcome back, {vendor.business_name}!
        </p>
        <p className="text-sm text-gray-500 mt-1">
          Your public URL: <span className="font-mono text-blue-600">blogcanvas.com/@{vendor.handle}</span>
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          const colorClass = colorClasses[stat.color as keyof typeof colorClasses];

          return (
            <Card
              key={stat.title}
              className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => router.push(stat.href)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                  <p className="text-sm text-gray-500 mt-1">{stat.subtitle}</p>
                </div>
                <div className={`rounded-lg p-3 ${colorClass}`}>
                  <Icon className="h-6 w-6" />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => router.push('/vendor/pages/new')}
            className="flex items-center gap-3 p-4 rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
          >
            <FileText className="h-6 w-6 text-blue-600" />
            <div>
              <p className="font-medium text-gray-900">Create Offer Page</p>
              <p className="text-sm text-gray-500">Build a new landing page</p>
            </div>
          </button>

          <button
            onClick={() => router.push('/vendor/clients')}
            className="flex items-center gap-3 p-4 rounded-lg border-2 border-dashed border-gray-300 hover:border-green-500 hover:bg-green-50 transition-colors text-left"
          >
            <Users className="h-6 w-6 text-green-600" />
            <div>
              <p className="font-medium text-gray-900">View Clients</p>
              <p className="text-sm text-gray-500">Manage client workspaces</p>
            </div>
          </button>

          <button
            onClick={() => router.push('/vendor/meetings')}
            className="flex items-center gap-3 p-4 rounded-lg border-2 border-dashed border-gray-300 hover:border-purple-500 hover:bg-purple-50 transition-colors text-left"
          >
            <Calendar className="h-6 w-6 text-purple-600" />
            <div>
              <p className="font-medium text-gray-900">Schedule Meeting</p>
              <p className="text-sm text-gray-500">Book time with a client</p>
            </div>
          </button>
        </div>
      </Card>

      {/* Getting Started */}
      {stats.totalPages === 0 && (
        <Card className="p-6 bg-blue-50 border-blue-200">
          <h2 className="text-lg font-semibold text-blue-900 mb-2">Get Started with BlogCanvas</h2>
          <p className="text-blue-800 mb-4">
            Welcome to your vendor dashboard! Here's what you can do:
          </p>
          <ul className="space-y-2 text-blue-800">
            <li className="flex items-start gap-2">
              <span className="font-bold mt-0.5">1.</span>
              <span>Create your first offer page with our block-based editor</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold mt-0.5">2.</span>
              <span>Configure your offers and pricing</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold mt-0.5">3.</span>
              <span>Share your page URL and start getting clients!</span>
            </li>
          </ul>
          <button
            onClick={() => router.push('/vendor/pages/new')}
            className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Create Your First Page
          </button>
        </Card>
      )}
    </div>
  );
}
