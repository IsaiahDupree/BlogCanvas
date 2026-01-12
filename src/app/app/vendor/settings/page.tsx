'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Save, Building2, Users, Palette, Bell, CheckCircle } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function VendorSettingsPage() {
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const [vendor, setVendor] = useState<any>(null)
    const [stats, setStats] = useState({ team_members: 0, clients: 0 })

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        website: '',
        company_type: 'agency',
        team_size: 'solo',
        default_timezone: 'America/New_York',
        brand_colors: {
            primary: '#4F46E5',
            secondary: '#7C3AED',
            accent: '#3B82F6',
        },
    })

    // Fetch vendor data
    useEffect(() => {
        fetchVendor()
    }, [])

    const fetchVendor = async () => {
        try {
            setLoading(true)
            const res = await fetch('/api/vendors')
            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || 'Failed to fetch vendor data')
            }

            setVendor(data.vendor)
            setStats(data.stats)

            // Populate form
            setFormData({
                name: data.vendor.name || '',
                email: data.vendor.email || '',
                phone: data.vendor.phone || '',
                website: data.vendor.website || '',
                company_type: data.vendor.company_type || 'agency',
                team_size: data.vendor.team_size || 'solo',
                default_timezone: data.vendor.default_timezone || 'America/New_York',
                brand_colors: data.vendor.brand_colors || {
                    primary: '#4F46E5',
                    secondary: '#7C3AED',
                    accent: '#3B82F6',
                },
            })

        } catch (err: any) {
            console.error('Error fetching vendor:', err)
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        try {
            setSaving(true)
            setError(null)

            const res = await fetch('/api/vendors', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || 'Failed to save settings')
            }

            setSaved(true)
            setTimeout(() => setSaved(false), 3000)

            // Refresh vendor data
            await fetchVendor()

        } catch (err: any) {
            console.error('Error saving settings:', err)
            setError(err.message)
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading vendor settings...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 p-6">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <Link href="/app" className="text-sm text-muted-foreground hover:text-gray-900 mb-2 inline-block">
                        <ArrowLeft className="w-4 h-4 inline mr-2" />
                        Back to Dashboard
                    </Link>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
                        Vendor Settings
                    </h1>
                    <p className="text-muted-foreground">
                        Manage your organization profile and preferences
                    </p>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
                        {error}
                    </div>
                )}

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <Card className="p-6 bg-white shadow-xl">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center">
                                <Building2 className="w-6 h-6 text-indigo-600" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Organization</p>
                                <p className="text-2xl font-bold">{vendor?.slug}</p>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6 bg-white shadow-xl">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                                <Users className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Team Members</p>
                                <p className="text-2xl font-bold">{stats.team_members}</p>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6 bg-white shadow-xl">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                                <Users className="w-6 h-6 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Clients</p>
                                <p className="text-2xl font-bold">{stats.clients}</p>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Organization Info */}
                <Card className="p-6 bg-white shadow-xl mb-8">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-2xl font-bold">Organization Information</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block mb-2 font-medium text-sm">Organization Name *</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                                placeholder="Acme Content Agency"
                            />
                        </div>

                        <div>
                            <label className="block mb-2 font-medium text-sm">Contact Email *</label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                                placeholder="hello@agency.com"
                            />
                        </div>

                        <div>
                            <label className="block mb-2 font-medium text-sm">Phone</label>
                            <input
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                                placeholder="+1 (555) 123-4567"
                            />
                        </div>

                        <div>
                            <label className="block mb-2 font-medium text-sm">Website</label>
                            <input
                                type="url"
                                value={formData.website}
                                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                                placeholder="https://agency.com"
                            />
                        </div>

                        <div>
                            <label className="block mb-2 font-medium text-sm">Company Type</label>
                            <select
                                value={formData.company_type}
                                onChange={(e) => setFormData({ ...formData, company_type: e.target.value })}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="agency">Agency</option>
                                <option value="freelancer">Freelancer</option>
                                <option value="inhouse">In-House Team</option>
                                <option value="other">Other</option>
                            </select>
                        </div>

                        <div>
                            <label className="block mb-2 font-medium text-sm">Team Size</label>
                            <select
                                value={formData.team_size}
                                onChange={(e) => setFormData({ ...formData, team_size: e.target.value })}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="solo">Solo (1 person)</option>
                                <option value="small">Small (2-10 people)</option>
                                <option value="medium">Medium (11-50 people)</option>
                                <option value="large">Large (51+ people)</option>
                            </select>
                        </div>
                    </div>
                </Card>

                {/* Brand Colors */}
                <Card className="p-6 bg-white shadow-xl mb-8">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                            <Palette className="w-5 h-5 text-purple-600" />
                        </div>
                        <h2 className="text-2xl font-bold">Brand Colors</h2>
                    </div>

                    <p className="text-sm text-muted-foreground mb-6">
                        Customize the color scheme for your client portal (white-label branding)
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="block mb-2 font-medium text-sm">Primary Color</label>
                            <div className="flex items-center gap-3">
                                <input
                                    type="color"
                                    value={formData.brand_colors.primary}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        brand_colors: { ...formData.brand_colors, primary: e.target.value }
                                    })}
                                    className="w-16 h-16 border-2 rounded-lg cursor-pointer"
                                />
                                <input
                                    type="text"
                                    value={formData.brand_colors.primary}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        brand_colors: { ...formData.brand_colors, primary: e.target.value }
                                    })}
                                    className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block mb-2 font-medium text-sm">Secondary Color</label>
                            <div className="flex items-center gap-3">
                                <input
                                    type="color"
                                    value={formData.brand_colors.secondary}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        brand_colors: { ...formData.brand_colors, secondary: e.target.value }
                                    })}
                                    className="w-16 h-16 border-2 rounded-lg cursor-pointer"
                                />
                                <input
                                    type="text"
                                    value={formData.brand_colors.secondary}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        brand_colors: { ...formData.brand_colors, secondary: e.target.value }
                                    })}
                                    className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block mb-2 font-medium text-sm">Accent Color</label>
                            <div className="flex items-center gap-3">
                                <input
                                    type="color"
                                    value={formData.brand_colors.accent}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        brand_colors: { ...formData.brand_colors, accent: e.target.value }
                                    })}
                                    className="w-16 h-16 border-2 rounded-lg cursor-pointer"
                                />
                                <input
                                    type="text"
                                    value={formData.brand_colors.accent}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        brand_colors: { ...formData.brand_colors, accent: e.target.value }
                                    })}
                                    className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
                                />
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Save Button */}
                <div className="flex items-center justify-between">
                    {saved && (
                        <div className="flex items-center gap-2 text-green-600">
                            <CheckCircle className="w-5 h-5" />
                            <span className="font-medium">Settings saved successfully!</span>
                        </div>
                    )}
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="ml-auto px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:opacity-90 transition-opacity shadow-lg flex items-center gap-2 disabled:opacity-50"
                    >
                        {saving ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="w-5 h-5" />
                                Save Settings
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}
