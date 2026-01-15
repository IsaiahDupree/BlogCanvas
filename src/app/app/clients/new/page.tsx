'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Globe, Mail, User, Building, Check, Target, TrendingUp, MapPin, Tag } from 'lucide-react'
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
        niche: '',
        company_size: '',
        target_audience: '',
        product_summary: '',
        business_goals: '',
        seo_target_score: '',
        target_keywords: '',
        monthly_traffic_goal: '',
        target_markets: '',
        brand_values: '',
        key_differentiators: '',
        content_topics: ''
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            // Parse array/object fields from comma-separated strings
            const businessGoals = formData.business_goals
                ? formData.business_goals.split(',').map(g => g.trim()).filter(Boolean)
                : [];

            const targetKeywords = formData.target_keywords
                ? formData.target_keywords.split(',').map(k => k.trim()).filter(Boolean)
                : [];

            const targetMarkets = formData.target_markets
                ? formData.target_markets.split(',').map(m => ({ market: m.trim() })).filter(m => m.market)
                : [];

            const brandValues = formData.brand_values
                ? formData.brand_values.split(',').map(v => v.trim()).filter(Boolean)
                : [];

            const contentTopics = formData.content_topics
                ? formData.content_topics.split(',').map(t => t.trim()).filter(Boolean)
                : [];

            const response = await fetch('/api/clients', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name,
                    website: formData.website,
                    contact_email: formData.contact_email,
                    contact_name: formData.contact_name,
                    onboarding_method: onboardingMethod,
                    send_invitation: true,
                    client_role: 'client_admin',
                    // PRD Stage 1 fields
                    industry: formData.industry,
                    niche: formData.niche,
                    company_size: formData.company_size,
                    business_goals: businessGoals,
                    seo_goals: {
                        target_score: formData.seo_target_score ? parseInt(formData.seo_target_score) : null,
                        target_keywords: targetKeywords,
                        monthly_traffic_goal: formData.monthly_traffic_goal ? parseInt(formData.monthly_traffic_goal) : null
                    },
                    target_markets: targetMarkets,
                    brand_values: brandValues,
                    key_differentiators: formData.key_differentiators,
                    content_topics: contentTopics
                })
            })

            const data = await response.json()

            if (!response.ok || !data.success) {
                throw new Error(data.error || 'Failed to create client')
            }

            // Success - redirect to client overview
            router.push(`/app/clients/${data.client.slug}/overview`)
        } catch (error: any) {
            console.error('Failed to create client:', error)
            alert(error.message || 'Failed to create client. Please try again.')
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

                        {/* PRD Stage 1: Brand Info & Niche */}
                        <div className="pt-6 border-t">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <Building className="w-5 h-5 text-blue-600" />
                                Brand Information
                            </h3>
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Industry
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.industry}
                                            onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                                            placeholder="e.g., SaaS, E-commerce, Healthcare"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Niche
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.niche}
                                            onChange={(e) => setFormData({ ...formData, niche: e.target.value })}
                                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                                            placeholder="e.g., Email Marketing Software, Athletic Wear"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Company Size
                                    </label>
                                    <select
                                        value={formData.company_size}
                                        onChange={(e) => setFormData({ ...formData, company_size: e.target.value })}
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                                    >
                                        <option value="">Select company size</option>
                                        <option value="1-10">1-10 employees</option>
                                        <option value="11-50">11-50 employees</option>
                                        <option value="51-200">51-200 employees</option>
                                        <option value="201-1000">201-1000 employees</option>
                                        <option value="1000+">1000+ employees</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Key Differentiators
                                    </label>
                                    <textarea
                                        value={formData.key_differentiators}
                                        onChange={(e) => setFormData({ ...formData, key_differentiators: e.target.value })}
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                                        placeholder="What makes this brand unique in their market?"
                                        rows={3}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* PRD Stage 1: Business Goals */}
                        <div className="pt-6 border-t">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <Target className="w-5 h-5 text-blue-600" />
                                Business Goals
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Business Objectives
                                    </label>
                                    <textarea
                                        value={formData.business_goals}
                                        onChange={(e) => setFormData({ ...formData, business_goals: e.target.value })}
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                                        placeholder="Enter goals separated by commas (e.g., Increase organic traffic by 50%, Generate 100 leads per month)"
                                        rows={3}
                                    />
                                    <p className="text-xs text-muted-foreground mt-1">Separate multiple goals with commas</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Brand Values
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.brand_values}
                                        onChange={(e) => setFormData({ ...formData, brand_values: e.target.value })}
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                                        placeholder="e.g., Innovation, Customer-First, Transparency"
                                    />
                                    <p className="text-xs text-muted-foreground mt-1">Separate multiple values with commas</p>
                                </div>
                            </div>
                        </div>

                        {/* PRD Stage 1: SEO Goals */}
                        <div className="pt-6 border-t">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-blue-600" />
                                SEO Goals
                            </h3>
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Target SEO Score (0-100)
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            max="100"
                                            value={formData.seo_target_score}
                                            onChange={(e) => setFormData({ ...formData, seo_target_score: e.target.value })}
                                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                                            placeholder="e.g., 75"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Monthly Traffic Goal
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={formData.monthly_traffic_goal}
                                            onChange={(e) => setFormData({ ...formData, monthly_traffic_goal: e.target.value })}
                                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                                            placeholder="e.g., 10000"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Target Keywords
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.target_keywords}
                                        onChange={(e) => setFormData({ ...formData, target_keywords: e.target.value })}
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                                        placeholder="e.g., seo content, blog writing, content marketing"
                                    />
                                    <p className="text-xs text-muted-foreground mt-1">Separate keywords with commas</p>
                                </div>
                            </div>
                        </div>

                        {/* PRD Stage 1: Target Markets */}
                        <div className="pt-6 border-t">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <MapPin className="w-5 h-5 text-blue-600" />
                                Target Markets
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Geographic & Demographic Markets
                                    </label>
                                    <textarea
                                        value={formData.target_markets}
                                        onChange={(e) => setFormData({ ...formData, target_markets: e.target.value })}
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                                        placeholder="e.g., United States - B2B SaaS, United Kingdom - Enterprise, Canada - SMB"
                                        rows={3}
                                    />
                                    <p className="text-xs text-muted-foreground mt-1">Separate markets with commas</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Content Topics
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.content_topics}
                                        onChange={(e) => setFormData({ ...formData, content_topics: e.target.value })}
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                                        placeholder="e.g., SEO Best Practices, Content Strategy, Marketing Automation"
                                    />
                                    <p className="text-xs text-muted-foreground mt-1">Primary themes to cover in content - separate with commas</p>
                                </div>
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
