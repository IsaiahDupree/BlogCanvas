'use client';

import Link from 'next/link';
import { 
  Shield, 
  Mail, 
  BarChart3, 
  Clock, 
  Smartphone,
  Settings,
  ChevronRight
} from 'lucide-react';
import { Card } from '@/components/ui/card';

const settingsItems = [
  {
    title: 'Security',
    description: 'Manage password, sessions, and security preferences',
    href: '/app/settings/security',
    icon: Shield,
    color: 'text-blue-600 bg-blue-100',
  },
  {
    title: 'Two-Factor Authentication',
    description: 'Set up 2FA for enhanced account security',
    href: '/app/settings/2fa',
    icon: Smartphone,
    color: 'text-purple-600 bg-purple-100',
  },
  {
    title: 'Gmail Integration',
    description: 'Connect your Gmail account for email management',
    href: '/app/settings/gmail',
    icon: Mail,
    color: 'text-red-600 bg-red-100',
  },
  {
    title: 'Google Analytics',
    description: 'Connect GA4 for performance tracking',
    href: '/app/settings/ga4',
    icon: BarChart3,
    color: 'text-green-600 bg-green-100',
  },
  {
    title: 'SLA Configuration',
    description: 'Set up service level agreements and alerts',
    href: '/app/settings/sla',
    icon: Clock,
    color: 'text-orange-600 bg-orange-100',
  },
];

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <Settings className="w-8 h-8 text-indigo-600" />
            Settings
          </h1>
          <p className="text-gray-600">Manage your account and application preferences</p>
        </div>

        <div className="grid gap-4">
          {settingsItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer group">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-lg ${item.color}`}>
                    <item.icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-sm text-gray-600">{item.description}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-indigo-600 transition-colors" />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
