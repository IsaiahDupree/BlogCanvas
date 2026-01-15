'use client'

import { useState, useEffect } from 'react'
import { Globe, Plus, Edit2, Trash2, Check, X, Loader2, ExternalLink } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface Website {
    id: string
    url: string
    domain: string
    target_market?: string | null
    platform?: string | null
    is_primary: boolean
    scrape_status: string
    created_at: string
}

interface WebsiteManagerProps {
    clientId: string
}

const PLATFORM_OPTIONS = [
    { value: 'wordpress', label: 'WordPress' },
    { value: 'webflow', label: 'Webflow' },
    { value: 'shopify', label: 'Shopify' },
    { value: 'squarespace', label: 'Squarespace' },
    { value: 'wix', label: 'Wix' },
    { value: 'custom', label: 'Custom' },
    { value: 'unknown', label: 'Unknown' }
]

export default function WebsiteManager({ clientId }: WebsiteManagerProps) {
    const [websites, setWebsites] = useState<Website[]>([])
    const [loading, setLoading] = useState(true)
    const [showAddForm, setShowAddForm] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)

    // Form state
    const [formData, setFormData] = useState({
        url: '',
        targetMarket: '',
        platform: 'unknown',
        isPrimary: false
    })

    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        fetchWebsites()
    }, [clientId])

    const fetchWebsites = async () => {
        try {
            const res = await fetch(`/api/websites?clientId=${clientId}`)
            const data = await res.json()

            if (data.success) {
                setWebsites(data.data || [])
            }
        } catch (err) {
            console.error('Failed to fetch websites:', err)
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)
        setError(null)

        try {
            // Validate URL format
            try {
                new URL(formData.url)
            } catch (e) {
                setError('Please enter a valid URL (e.g., https://example.com)')
                setSubmitting(false)
                return
            }

            const endpoint = editingId
                ? `/api/websites/${editingId}`
                : '/api/websites'

            const method = editingId ? 'PATCH' : 'POST'

            const res = await fetch(endpoint, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    url: formData.url,
                    clientId,
                    targetMarket: formData.targetMarket || null,
                    platform: formData.platform,
                    isPrimary: formData.isPrimary
                })
            })

            const data = await res.json()

            if (!data.success) {
                setError(data.error || 'Failed to save website')
                setSubmitting(false)
                return
            }

            // Reset form and refresh list
            setFormData({ url: '', targetMarket: '', platform: 'unknown', isPrimary: false })
            setShowAddForm(false)
            setEditingId(null)
            await fetchWebsites()
        } catch (err: any) {
            console.error('Error saving website:', err)
            setError(err.message || 'Failed to save website')
        } finally {
            setSubmitting(false)
        }
    }

    const handleEdit = (website: Website) => {
        setFormData({
            url: website.url,
            targetMarket: website.target_market || '',
            platform: website.platform || 'unknown',
            isPrimary: website.is_primary
        })
        setEditingId(website.id)
        setShowAddForm(true)
        setError(null)
    }

    const handleDelete = async (websiteId: string) => {
        if (!confirm('Are you sure you want to delete this website? This action cannot be undone.')) {
            return
        }

        try {
            const res = await fetch(`/api/websites/${websiteId}`, {
                method: 'DELETE'
            })

            const data = await res.json()

            if (data.success) {
                await fetchWebsites()
            } else {
                alert(data.error || 'Failed to delete website')
            }
        } catch (err) {
            console.error('Error deleting website:', err)
            alert('Failed to delete website')
        }
    }

    const handleCancel = () => {
        setFormData({ url: '', targetMarket: '', platform: 'unknown', isPrimary: false })
        setShowAddForm(false)
        setEditingId(null)
        setError(null)
    }

    const getPlatformBadgeColor = (platform: string | null | undefined) => {
        switch (platform) {
            case 'wordpress': return 'bg-blue-100 text-blue-700 border-blue-200'
            case 'webflow': return 'bg-purple-100 text-purple-700 border-purple-200'
            case 'shopify': return 'bg-green-100 text-green-700 border-green-200'
            case 'squarespace': return 'bg-orange-100 text-orange-700 border-orange-200'
            case 'wix': return 'bg-pink-100 text-pink-700 border-pink-200'
            case 'custom': return 'bg-slate-100 text-slate-700 border-slate-200'
            default: return 'bg-gray-100 text-gray-700 border-gray-200'
        }
    }

    if (loading) {
        return (
            <Card className="p-6">
                <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 text-indigo-600 animate-spin mr-2" />
                    <span className="text-slate-600">Loading websites...</span>
                </div>
            </Card>
        )
    }

    return (
        <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <Globe className="w-6 h-6 text-indigo-600" />
                    <h2 className="text-xl font-bold text-gray-900">Websites</h2>
                    <Badge className="bg-indigo-100 text-indigo-700 border-indigo-200">
                        {websites.length}
                    </Badge>
                </div>
                {!showAddForm && (
                    <Button
                        onClick={() => setShowAddForm(true)}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:opacity-90"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Website
                    </Button>
                )}
            </div>

            {/* Add/Edit Form */}
            {showAddForm && (
                <form onSubmit={handleSubmit} className="mb-6 p-4 bg-slate-50 rounded-lg border-2 border-slate-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        {editingId ? 'Edit Website' : 'Add New Website'}
                    </h3>

                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                            {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Website URL *
                            </label>
                            <input
                                type="url"
                                value={formData.url}
                                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                                placeholder="https://example.com"
                                required
                                disabled={submitting}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Target Market
                            </label>
                            <input
                                type="text"
                                value={formData.targetMarket}
                                onChange={(e) => setFormData({ ...formData, targetMarket: e.target.value })}
                                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                                placeholder="e.g., United States - B2B SaaS"
                                disabled={submitting}
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                                Geographic or demographic target for this website
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Platform
                            </label>
                            <select
                                value={formData.platform}
                                onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                                disabled={submitting}
                            >
                                {PLATFORM_OPTIONS.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                            <p className="text-xs text-muted-foreground mt-1">
                                Will be auto-detected if set to Unknown
                            </p>
                        </div>

                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="isPrimary"
                                checked={formData.isPrimary}
                                onChange={(e) => setFormData({ ...formData, isPrimary: e.target.checked })}
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                disabled={submitting}
                            />
                            <label htmlFor="isPrimary" className="text-sm font-medium text-gray-700">
                                Set as primary website
                            </label>
                        </div>
                    </div>

                    <div className="flex gap-3 mt-6">
                        <Button
                            type="submit"
                            disabled={submitting}
                            className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:opacity-90"
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Check className="w-4 h-4 mr-2" />
                                    {editingId ? 'Update' : 'Add'} Website
                                </>
                            )}
                        </Button>
                        <Button
                            type="button"
                            onClick={handleCancel}
                            disabled={submitting}
                            className="flex-1 bg-gray-100 text-gray-700 hover:bg-gray-200"
                        >
                            <X className="w-4 h-4 mr-2" />
                            Cancel
                        </Button>
                    </div>
                </form>
            )}

            {/* Websites List */}
            {websites.length === 0 ? (
                <div className="text-center py-12">
                    <Globe className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">No websites added</h3>
                    <p className="text-muted-foreground mb-4">
                        Add websites to track SEO performance and manage content.
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {websites.map(website => (
                        <div
                            key={website.id}
                            className="p-4 bg-white border-2 border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <a
                                            href={website.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-lg font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                                        >
                                            {website.domain}
                                            <ExternalLink className="w-4 h-4" />
                                        </a>
                                        {website.is_primary && (
                                            <Badge className="bg-green-100 text-green-700 border-green-200">
                                                Primary
                                            </Badge>
                                        )}
                                        {website.platform && (
                                            <Badge className={getPlatformBadgeColor(website.platform)}>
                                                {website.platform}
                                            </Badge>
                                        )}
                                    </div>
                                    {website.target_market && (
                                        <p className="text-sm text-gray-600 mb-1">
                                            <span className="font-medium">Target Market:</span> {website.target_market}
                                        </p>
                                    )}
                                    <p className="text-xs text-muted-foreground">
                                        Added {new Date(website.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleEdit(website)}
                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                        title="Edit website"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(website.id)}
                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Delete website"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </Card>
    )
}
