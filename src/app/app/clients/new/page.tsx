'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Globe, Mail, User, Building, Check } from 'lucide-react'
import { Card } from '@/components/ui/card'

export default function NewClientPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [onboardingMethod, setOnboardingMethod] = useState<'site_scan' | 'manual_intake' | null>(null)

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        website: '',
        contact_email: '',
        contact_name: '',
        industry: '',
        target_audience: '',
        product_summary: ''
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            // TODO: Replace with actual API call
            // const response = await fetch('/api/clients', {
            //     method: 'POST',
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify(formData)
            // })
            // const data = await response.json()

            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000))

            // Redirect to client overview
            router.push(`/app/clients/${formData.slug}/overview`)
        } catch (error) {
            console.error('Failed to create client:', error)
            alert('Failed to create client. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    const handleAutoSlug = (name: string) => {
        const slug = name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')
        setFormData({ ...formData, name, slug })
    }

    if (!onboardingMethod) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
                {/* Header */}
                <div className="bg-white border-b shadow-sm">
                    <div className="max-w-4xl mx-auto px-6 py-4">
                        <Link href="/app/clients" className="inline-flex items-center text-sm text-muted-foreground hover:text-gray-900 mb-2">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Clients
                        </Link>
                        <h1 className="text-3xl font-bold text-gray-900">Add New Client</h1>
                        <p className="text-muted-foreground mt-1">Choose how to onboard this client</p>
                    </div>
                </div>

                {/* Onboarding Method Selection */}
                <div className="max-w-4xl mx-auto px-6 py-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card
                            onClick={() => setOnboardingMethod('site_scan')}
                            className="p-8 bg-white shadow-lg hover:shadow-xl transition-all cursor-pointer border-2 border-transparent hover:border-blue-500 group"
                        >
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <Globe className="w-8 h-8 text-blue-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Site Scan</h3>
                            <p className="text-muted-foreground mb-4">Automatically extract brand info from their website</p>
                            <ul className="space-y-2 text-sm text-gray-600">
                                <li className="flex items-center gap-2">
                                    <Check className="w-4 h-4 text-green-600" />
                                    Auto-detect brand voice
                                </li>
                                <li className="flex items-center gap-2">
                                    <Check className="w-4 h-4 text-green-600" />
                                    Extract product info
                                </li>
                                <li className="flex items-center gap-2">
                                    <Check className="w-4 h-4 text-green-600" />
                                    Fast onboarding
                                </li>
                            </ul>
                        </Card>

                        <Card
                            onClick={() => setOnboardingMethod('manual_intake')}
                            className="p-8 bg-white shadow-lg hover:shadow-xl transition-all cursor-pointer border-2 border-transparent hover:border-purple-500 group"
                        >
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <Building className="w-8 h-8 text-purple-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Manual Intake</h3>
                            <p className="text-muted-foreground mb-4">Enter brand details manually</p>
                            <ul className="space-y-2 text-sm text-gray-600">
                                <li className="flex items-center gap-2">
                                    <Check className="w-4 h-4 text-green-600" />
                                    Full control
                                </li>
                                <li className="flex items-center gap-2">
                                    <Check className="w-4 h-4 text-green-600" />
                                    Detailed customization
                                </li>
                                <li className="flex items-center gap-2">
                                    <Check className="w-4 h-4 text-green-600" />
                                    No website needed
                                </li>
                            </ul>
                        </Card>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
            {/* Header */}
            <div className="bg-white border-b shadow-sm">
                <div className="max-w-4xl mx-auto px-6 py-4">
                    <button
                        onClick={() => setOnboardingMethod(null)}
                        className="inline-flex items-center text-sm text-muted-foreground hover:text-gray-900 mb-2"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Method Selection
                    </button>
                    <h1 className="text-3xl font-bold text-gray-900">Client Information</h1>
                    <p className="text-muted-foreground mt-1">
                        {onboardingMethod === 'site_scan' ? 'Enter website URL to scan' : 'Enter client details manually'}
                    </p>
                </div>
            </div>

            {/* Form */}
            <div className="max-w-4xl mx-auto px-6 py-8">
                <Card className="p-8 bg-white shadow-lg">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Basic Info */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Company Name *
                            </label>
                            <div className="relative">
                                <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => handleAutoSlug(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                                    placeholder="Acme Software Inc"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Slug (URL-friendly identifier) *
                            </label>
                            <input
                                type="text"
                                value={formData.slug}
                                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                                placeholder="acme-software"
                                required
                            />
                            <p className="text-xs text-muted-foreground mt-1">Will be used in URLs: /app/clients/{formData.slug || 'slug'}</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Website URL *
                            </label>
                            <div className="relative">
                                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="url"
                                    value={formData.website}
                                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                                    placeholder="https://acme.com"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Contact Email *
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="email"
                                    value={formData.contact_email}
                                    onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                                    placeholder="marketing@acme.com"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Contact Person
                            </label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    value={formData.contact_name}
                                    onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                                    placeholder="John Smith"
                                />
                            </div>
                        </div>

                        {/* Submit Buttons */}
                        <div className="flex gap-4 pt-6 border-t">
                            <Link
                                href="/app/clients"
                                className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors text-center"
                            >
                                Cancel
                            </Link>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 shadow-lg"
                            >
                                {loading ? 'Creating...' : 'Create Client'}
                            </button>
                        </div>
                    </form>
                </Card>
            </div>
        </div>
    )
}
