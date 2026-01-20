'use client';

import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import {
  CreditCard,
  Clock,
  User,
  Bell,
  Shield,
  Palette,
  Mail,
  Globe,
  ChevronRight
} from 'lucide-react';

interface SettingsSection {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
}

const settingsSections: SettingsSection[] = [
  {
    title: 'Payment Settings',
    description: 'Connect Stripe and manage your payout settings',
    href: '/vendor/settings/payments',
    icon: <CreditCard className="h-6 w-6" />,
    badge: 'Important'
  },
  {
    title: 'Availability',
    description: 'Set your weekly availability for client meetings',
    href: '/vendor/settings/availability',
    icon: <Clock className="h-6 w-6" />
  },
  {
    title: 'Profile',
    description: 'Update your business name, bio, and contact info',
    href: '/vendor/settings/profile',
    icon: <User className="h-6 w-6" />
  },
  {
    title: 'Branding',
    description: 'Customize colors, logo, and page styling',
    href: '/vendor/settings/branding',
    icon: <Palette className="h-6 w-6" />
  },
  {
    title: 'Notifications',
    description: 'Configure email and in-app notification preferences',
    href: '/vendor/settings/notifications',
    icon: <Bell className="h-6 w-6" />
  },
  {
    title: 'Email Templates',
    description: 'Customize automated emails sent to clients',
    href: '/vendor/settings/emails',
    icon: <Mail className="h-6 w-6" />
  },
  {
    title: 'Domain Settings',
    description: 'Connect a custom domain to your offer pages',
    href: '/vendor/settings/domain',
    icon: <Globe className="h-6 w-6" />
  },
  {
    title: 'Security',
    description: 'Manage password, two-factor auth, and sessions',
    href: '/vendor/settings/security',
    icon: <Shield className="h-6 w-6" />
  }
];

export default function VendorSettingsPage() {
  const router = useRouter();

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">
          Manage your account, payments, and preferences
        </p>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {settingsSections.map((section) => (
          <Card
            key={section.href}
            className="p-6 hover:shadow-lg transition-shadow cursor-pointer group"
            onClick={() => router.push(section.href)}
          >
            <div className="flex items-start gap-4">
              <div className="rounded-lg p-3 bg-gray-100 text-gray-600 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                {section.icon}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {section.title}
                  </h3>
                  {section.badge && (
                    <span className="px-2 py-0.5 text-xs font-medium bg-orange-100 text-orange-800 rounded-full">
                      {section.badge}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {section.description}
                </p>
              </div>

              <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
            </div>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <h2 className="text-lg font-semibold text-blue-900 mb-2">Getting Started</h2>
        <p className="text-blue-800 mb-4">
          Complete these steps to start accepting payments:
        </p>
        <ul className="space-y-2 text-blue-800">
          <li className="flex items-start gap-2">
            <span className="font-bold mt-0.5">1.</span>
            <span>Connect your Stripe account in Payment Settings</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold mt-0.5">2.</span>
            <span>Set your weekly availability for meetings</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold mt-0.5">3.</span>
            <span>Complete your profile with business details</span>
          </li>
        </ul>
      </Card>
    </div>
  );
}
