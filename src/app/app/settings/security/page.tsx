'use client'

import Link from 'next/link'
import { ArrowLeft, Shield } from 'lucide-react'
import TwoFactorAuth from '@/components/settings/TwoFactorAuth'

export default function SecuritySettingsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/app"
            className="text-sm text-muted-foreground hover:text-gray-900 mb-4 inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>

          <div className="flex items-center gap-3 mt-4">
            <div className="p-3 bg-indigo-100 rounded-lg">
              <Shield className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Security Settings</h1>
              <p className="text-gray-600 mt-1">
                Manage your account security and authentication methods
              </p>
            </div>
          </div>
        </div>

        {/* Two-Factor Authentication Component */}
        <TwoFactorAuth />
      </div>
    </div>
  )
}
