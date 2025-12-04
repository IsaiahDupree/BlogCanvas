'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Save, CheckCircle } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function PortalBrandPage() {
    const [saved, setSaved] = useState(false)
    const [brandData, setBrandData] = useState({
        productSummary: 'AI-powered CRM platform for sales teams that never let relationships go cold',
        targetAudience: 'B2B sales managers, founders, and revenue leaders at growing companies',
        positioning: 'Enterprise-grade CRM with AI intelligence at startup-friendly pricing',

        // Tone sliders
        casualToFormal: 60,
        playfulToSerious: 70,
        directToStory: 40,

        // Phrases
        preferredPhrases: ['relationship intelligence', 'never let a lead go cold', 'smart automation'],
        avoidPhrases: ['revolutionary', 'game-changing', 'disruptive'],

        // Stories
        stories: [
            {
                title: 'How we closed our first enterprise deal',
                summary: 'Using AI insights to identify the perfect outreach timing',
                tags: ['sales', 'enterprise', 'success']
            },
            {
                title: 'Founder story: Why we built this',
                summary: 'After losing a $500k deal to a missed follow-up...',
                tags: ['founder', 'origin']
            }
        ]
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
                            <h1 className="text-3xl font-bold text-gray-900">Brand & Voice Settings</h1>
                            <p className="text-muted-foreground mt-1">Control how AI writes your content</p>
                        </div>
                        <button
                            onClick={handleSave}
                            className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:opacity-90 transition-opacity shadow-lg flex items-center gap-2"
                        >
                            <Save className="w-5 h-5" />
                            Save Changes
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

                {/* Brand Overview */}
                <Card className="p-6 bg-white shadow-lg mb-8">
                    <h2 className="text-2xl font-bold mb-6">Brand Overview</h2>

                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Product/Service Summary
                            </label>
                            <textarea
                                value={brandData.productSummary}
                                onChange={(e) => setBrandData({ ...brandData, productSummary: e.target.value })}
                                rows={3}
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                                This helps AI understand what you offer
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Target Audience
                            </label>
                            <textarea
                                value={brandData.targetAudience}
                                onChange={(e) => setBrandData({ ...brandData, targetAudience: e.target.value })}
                                rows={2}
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Positioning & Unique Angle
                            </label>
                            <textarea
                                value={brandData.positioning}
                                onChange={(e) => setBrandData({ ...brandData, positioning: e.target.value })}
                                rows={2}
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                            />
                        </div>
                    </div>
                </Card>

                {/* Tone & Style */}
                <Card className="p-6 bg-white shadow-lg mb-8">
                    <h2 className="text-2xl font-bold mb-6">Tone & Style</h2>
                    <p className="text-sm text-muted-foreground mb-6">
                        Adjust these sliders to control the writing style
                    </p>

                    <div className="space-y-6">
                        <div>
                            <div className="flex justify-between text-sm font-medium mb-2">
                                <span>Casual</span>
                                <span>Formal</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={brandData.casualToFormal}
                                onChange={(e) => setBrandData({ ...brandData, casualToFormal: parseInt(e.target.value) })}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                            />
                            <div className="flex justify-center mt-2">
                                <Badge variant="outline">{brandData.casualToFormal}% formal</Badge>
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between text-sm font-medium mb-2">
                                <span>Playful</span>
                                <span>Serious</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={brandData.playfulToSerious}
                                onChange={(e) => setBrandData({ ...brandData, playfulToSerious: parseInt(e.target.value) })}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                            />
                            <div className="flex justify-center mt-2">
                                <Badge variant="outline">{brandData.playfulToSerious}% serious</Badge>
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between text-sm font-medium mb-2">
                                <span>Direct</span>
                                <span>Story-Driven</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={brandData.directToStory}
                                onChange={(e) => setBrandData({ ...brandData, directToStory: parseInt(e.target.value) })}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                            />
                            <div className="flex justify-center mt-2">
                                <Badge variant="outline">{brandData.directToStory}% story-driven</Badge>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Preferred/Avoid Phrases */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    <Card className="p-6 bg-white shadow-lg">
                        <h3 className="text-xl font-bold mb-4">Words We Love ✓</h3>
                        <div className="flex flex-wrap gap-2 mb-4">
                            {brandData.preferredPhrases.map((phrase, i) => (
                                <Badge key={i} className="bg-green-100 text-green-700 border-green-200 px-3 py-1">
                                    {phrase}
                                </Badge>
                            ))}
                        </div>
                        <input
                            type="text"
                            placeholder="Add preferred phrase..."
                            className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none"
                            onKeyPress={(e) => {
                                if (e.key === 'Enter' && e.currentTarget.value) {
                                    setBrandData({
                                        ...brandData,
                                        preferredPhrases: [...brandData.preferredPhrases, e.currentTarget.value]
                                    })
                                    e.currentTarget.value = ''
                                }
                            }}
                        />
                    </Card>

                    <Card className="p-6 bg-white shadow-lg">
                        <h3 className="text-xl font-bold mb-4">Words to Avoid ✗</h3>
                        <div className="flex flex-wrap gap-2 mb-4">
                            {brandData.avoidPhrases.map((phrase, i) => (
                                <Badge key={i} className="bg-red-100 text-red-700 border-red-200 px-3 py-1">
                                    {phrase}
                                </Badge>
                            ))}
                        </div>
                        <input
                            type="text"
                            placeholder="Add phrase to avoid..."
                            className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none"
                            onKeyPress={(e) => {
                                if (e.key === 'Enter' && e.currentTarget.value) {
                                    setBrandData({
                                        ...brandData,
                                        avoidPhrases: [...brandData.avoidPhrases, e.currentTarget.value]
                                    })
                                    e.currentTarget.value = ''
                                }
                            }}
                        />
                    </Card>
                </div>

                {/* Story Bank */}
                <Card className="p-6 bg-white shadow-lg">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold">Story Bank</h2>
                        <button className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg text-sm font-medium hover:bg-indigo-200 transition-colors">
                            + Add Story
                        </button>
                    </div>

                    <div className="space-y-4">
                        {brandData.stories.map((story, i) => (
                            <div key={i} className="p-4 border-2 border-gray-200 rounded-lg hover:border-indigo-300 transition-colors">
                                <h3 className="font-bold text-gray-900 mb-2">{story.title}</h3>
                                <p className="text-sm text-muted-foreground mb-3">{story.summary}</p>
                                <div className="flex flex-wrap gap-2">
                                    {story.tags.map((tag, j) => (
                                        <Badge key={j} variant="outline" className="text-xs">
                                            {tag}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
        </div>
    )
}
