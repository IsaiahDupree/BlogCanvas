'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Save, CheckCircle, Bell, Mail, Calendar } from 'lucide-react'
import { Card } from '@/components/ui/card'

export default function PortalNotificationsPage() {
    const [saved, setSaved] = useState(false)
    const [settings, setSettings] = useState({
        notifyOnDraftReady: true,
        notifyBeforePublish: true,
        notifyHoursBefore: 24,
        weeklySummary: true,
        emailDigest: 'daily',
        slackNotifications: false
    })

    const handleSave = () => {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
        // API call would go here
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50">
            {/* Header */}
            <div className="bg-white border-b shadow-sm">
                <div className="max-w-5xl mx-auto px-6 py-4">
                    <Link href="/portal/dashboard" className="inline-flex items-center text-sm text-muted-foreground hover:text-gray-900 mb-2">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Dashboard
                    </Link>
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Notification Settings</h1>
                            <p className="text-muted-foreground mt-1">Choose how you want to be notified</p>
                        </div>
                        <button
                            onClick={handleSave}
                            className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:opacity-90 transition-opacity shadow-lg flex items-center gap-2"
                        >
                            <Save className="w-5 h-5" />
                            Save Settings
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-6 py-8">
                {saved && (
                    <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700">
                        <CheckCircle className="w-5 h-5" />
                        <span className="font-medium">Settings saved successfully!</span>
                    </div>
                )}

                {/* Email Notifications */}
                <Card className="p-6 bg-white shadow-lg mb-8">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                            <Mail className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-2xl font-bold">Email Notifications</h2>
                    </div>

                    <div className="space-y-4">
                        <label className="flex items-start gap-4 p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-indigo-300 transition-colors">
                            <input
                                type="checkbox"
                                checked={settings.notifyOnDraftReady}
                                onChange={(e) => setSettings({ ...settings, notifyOnDraftReady: e.target.checked })}
                                className="mt-1 w-5 h-5 text-indigo-600"
                            />
                            <div className="flex-1">
                                <p className="font-semibold text-gray-900">Draft Ready for Review</p>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Get notified immediately when a new draft is ready for your review
                                </p>
                            </div>
                        </label>

                        <label className="flex items-start gap-4 p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-indigo-300 transition-colors">
                            <input
                                type="checkbox"
                                checked={settings.notifyBeforePublish}
                                onChange={(e) => setSettings({ ...settings, notifyBeforePublish: e.target.checked })}
                                className="mt-1 w-5 h-5 text-indigo-600"
                            />
                            <div className="flex-1">
                                <p className="font-semibold text-gray-900">Before Content Publishes</p>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Get a reminder before scheduled posts go live
                                </p>
                                {settings.notifyBeforePublish && (
                                    <div className="mt-3">
                                        <label className="block text-sm font-medium mb-2">Hours before:</label>
                                        <select
                                            value={settings.notifyHoursBefore}
                                            onChange={(e) => setSettings({ ...settings, notifyHoursBefore: parseInt(e.target.value) })}
                                            className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none"
                                        >
                                            <option value={1}>1 hour</option>
                                            <option value={6}>6 hours</option>
                                            <option value={24}>24 hours</option>
                                            <option value={48}>48 hours</option>
                                        </select>
                                    </div>
                                )}
                            </div>
                        </label>

                        <label className="flex items-start gap-4 p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-indigo-300 transition-colors">
                            <input
                                type="checkbox"
                                checked={settings.weeklySummary}
                                onChange={(e) => setSettings({ ...settings, weeklySummary: e.target.checked })}
                                className="mt-1 w-5 h-5 text-indigo-600"
                            />
                            <div className="flex-1">
                                <p className="font-semibold text-gray-900">Weekly Summary</p>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Receive a weekly digest of all posts created and published
                                </p>
                            </div>
                        </label>
                    </div>
                </Card>

                {/* Digest Frequency */}
                <Card className="p-6 bg-white shadow-lg mb-8">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                            <Calendar className="w-5 h-5 text-purple-600" />
                        </div>
                        <h2 className="text-2xl font-bold">Email Digest</h2>
                    </div>

                    <p className="text-sm text-muted-foreground mb-4">
                        Receive a summary of all activity instead of individual emails
                    </p>

                    <div className="space-y-3">
                        {[
                            { value: 'realtime', label: 'Real-time', desc: 'Individual emails for each event' },
                            { value: 'daily', label: 'Daily Digest', desc: 'One email per day with all updates' },
                            { value: 'weekly', label: 'Weekly Digest', desc: 'One email per week' },
                            { value: 'never', label: 'Never', desc: 'Turn off all digest emails' }
                        ].map((option) => (
                            <label
                                key={option.value}
                                className={`flex items-start gap-4 p-4 border-2 rounded-lg cursor-pointer transition-colors ${settings.emailDigest === option.value
                                        ? 'border-indigo-500 bg-indigo-50'
                                        : 'border-gray-200 hover:border-indigo-300'
                                    }`}
                            >
                                <input
                                    type="radio"
                                    name="emailDigest"
                                    value={option.value}
                                    checked={settings.emailDigest === option.value}
                                    onChange={(e) => setSettings({ ...settings, emailDigest: e.target.value })}
                                    className="mt-1 w-5 h-5 text-indigo-600"
                                />
                                <div className="flex-1">
                                    <p className="font-semibold text-gray-900">{option.label}</p>
                                    <p className="text-sm text-muted-foreground">{option.desc}</p>
                                </div>
                            </label>
                        ))}
                    </div>
                </Card>

                {/* Integration Notifications (Future) */}
                <Card className="p-6 bg-white shadow-lg opacity-60">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                            <Bell className="w-5 h-5 text-gray-600" />
                        </div>
                        <div className="flex-1">
                            <h2 className="text-2xl font-bold text-gray-900">Integrations</h2>
                            <p className="text-sm text-muted-foreground">Coming soon</p>
                        </div>
                    </div>

                    <label className="flex items-start gap-4 p-4 border-2 border-gray-200 rounded-lg cursor-not-allowed">
                        <input
                            type="checkbox"
                            disabled
                            className="mt-1 w-5 h-5"
                        />
                        <div className="flex-1">
                            <p className="font-semibold text-gray-600">Slack Notifications</p>
                            <p className="text-sm text-muted-foreground mt-1">
                                Get notified in Slack when content needs review
                            </p>
                        </div>
                    </label>
                </Card>
            </div>
        </div>
    )
}
