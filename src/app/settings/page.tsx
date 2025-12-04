'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Save, Sliders, Target, CheckCircle } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function SettingsPage() {
    const [settings, setSettings] = useState({
        // Quality Gates
        outlineScoreThreshold: 70,
        seoScoreThreshold: 75,
        voiceToneScoreThreshold: 80,
        completenessScoreThreshold: 70,

        // Word Counts
        minWordCountPercent: 80,
        maxWordCountPercent: 120,
        strictWordCount: false,

        // Content Defaults
        defaultContentType: 'how-to',
        autoIncludeFAQs: false,
        autoIncludeTables: false,

        // Review Settings
        autoApproveThreshold: 90,
        requireHumanReview: true,

        // SEO
        titleMinLength: 50,
        titleMaxLength: 60,
        metaMinLength: 150,
        metaMaxLength: 160,
    })

    const [saved, setSaved] = useState(false)

    const handleSave = () => {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 p-6">
            <div className="max-w-5xl mx-auto">
                <div className="mb-8">
                    <Link href="/" className="text-sm text-muted-foreground hover:text-gray-900 mb-2 inline-block">
                        <ArrowLeft className="w-4 h-4 inline mr-2" />
                        Back to Dashboard
                    </Link>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
                        Settings
                    </h1>
                    <p className="text-muted-foreground">
                        Configure quality gates, word count requirements, and default behaviors
                    </p>
                </div>

                {/* Quality Gates */}
                <Card className="p-6 bg-white shadow-xl mb-8">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                            <Target className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-2xl font-bold">Quality Gate Thresholds</h2>
                    </div>

                    <p className="text-sm text-muted-foreground mb-6">
                        Set minimum scores (0-100) for each quality gate. Posts below these thresholds will be regenerated.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block mb-2 font-medium text-sm">Outline Quality Score</label>
                            <div className="flex items-center gap-4">
                                <input
                                    type="range"
                                    min="50"
                                    max="100"
                                    value={settings.outlineScoreThreshold}
                                    onChange={(e) => setSettings({ ...settings, outlineScoreThreshold: parseInt(e.target.value) })}
                                    className="flex-1"
                                />
                                <Badge variant="outline" className="w-16 text-center font-bold">
                                    {settings.outlineScoreThreshold}
                                </Badge>
                            </div>
                        </div>

                        <div>
                            <label className="block mb-2 font-medium text-sm">SEO Score</label>
                            <div className="flex items-center gap-4">
                                <input
                                    type="range"
                                    min="50"
                                    max="100"
                                    value={settings.seoScoreThreshold}
                                    onChange={(e) => setSettings({ ...settings, seoScoreThreshold: parseInt(e.target.value) })}
                                    className="flex-1"
                                />
                                <Badge variant="outline" className="w-16 text-center font-bold">
                                    {settings.seoScoreThreshold}
                                </Badge>
                            </div>
                        </div>

                        <div>
                            <label className="block mb-2 font-medium text-sm">Voice/Tone Alignment</label>
                            <div className="flex items-center gap-4">
                                <input
                                    type="range"
                                    min="50"
                                    max="100"
                                    value={settings.voiceToneScoreThreshold}
                                    onChange={(e) => setSettings({ ...settings, voiceToneScoreThreshold: parseInt(e.target.value) })}
                                    className="flex-1"
                                />
                                <Badge variant="outline" className="w-16 text-center font-bold">
                                    {settings.voiceToneScoreThreshold}
                                </Badge>
                            </div>
                        </div>

                        <div>
                            <label className="block mb-2 font-medium text-sm">Completeness Score</label>
                            <div className="flex items-center gap-4">
                                <input
                                    type="range"
                                    min="50"
                                    max="100"
                                    value={settings.completenessScoreThreshold}
                                    onChange={(e) => setSettings({ ...settings, completenessScoreThreshold: parseInt(e.target.value) })}
                                    className="flex-1"
                                />
                                <Badge variant="outline" className="w-16 text-center font-bold">
                                    {settings.completenessScoreThreshold}
                                </Badge>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Word Count Settings */}
                <Card className="p-6 bg-white shadow-xl mb-8">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <Sliders className="w-5 h-5 text-blue-600" />
                        </div>
                        <h2 className="text-2xl font-bold">Word Count Requirements</h2>
                    </div>

                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block mb-2 font-medium text-sm">Minimum Word Count (%)</label>
                                <div className="flex items-center gap-4">
                                    <input
                                        type="range"
                                        min="70"
                                        max="100"
                                        value={settings.minWordCountPercent}
                                        onChange={(e) => setSettings({ ...settings, minWordCountPercent: parseInt(e.target.value) })}
                                        className="flex-1"
                                    />
                                    <Badge variant="outline" className="w-16 text-center font-bold">
                                        {settings.minWordCountPercent}%
                                    </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Of target word count (e.g., 1200 words for 1500 target)
                                </p>
                            </div>

                            <div>
                                <label className="block mb-2 font-medium text-sm">Maximum Word Count (%)</label>
                                <div className="flex items-center gap-4">
                                    <input
                                        type="range"
                                        min="100"
                                        max="150"
                                        value={settings.maxWordCountPercent}
                                        onChange={(e) => setSettings({ ...settings, maxWordCountPercent: parseInt(e.target.value) })}
                                        className="flex-1"
                                    />
                                    <Badge variant="outline" className="w-16 text-center font-bold">
                                        {settings.maxWordCountPercent}%
                                    </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Of target word count (e.g., 1800 words for 1500 target)
                                </p>
                            </div>
                        </div>

                        <label className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-300 transition-colors">
                            <input
                                type="checkbox"
                                checked={settings.strictWordCount}
                                onChange={(e) => setSettings({ ...settings, strictWordCount: e.target.checked })}
                                className="w-5 h-5"
                            />
                            <div>
                                <p className="font-medium">Strict Mode (95-105%)</p>
                                <p className="text-sm text-muted-foreground">
                                    Enforce tighter word count limits for maximum precision
                                </p>
                            </div>
                        </label>
                    </div>
                </Card>

                {/* Review Settings */}
                <Card className="p-6 bg-white shadow-xl mb-8">
                    <h2 className="text-2xl font-bold mb-6">Review & Approval</h2>

                    <div className="space-y-4">
                        <div>
                            <label className="block mb-2 font-medium text-sm">Auto-Approve Threshold</label>
                            <div className="flex items-center gap-4">
                                <input
                                    type="range"
                                    min="80"
                                    max="100"
                                    value={settings.autoApproveThreshold}
                                    onChange={(e) => setSettings({ ...settings, autoApproveThreshold: parseInt(e.target.value) })}
                                    className="flex-1"
                                />
                                <Badge variant="outline" className="w-16 text-center font-bold">
                                    {settings.autoApproveThreshold}
                                </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Posts with all quality scores above this will be auto-approved
                            </p>
                        </div>

                        <label className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-300 transition-colors">
                            <input
                                type="checkbox"
                                checked={settings.requireHumanReview}
                                onChange={(e) => setSettings({ ...settings, requireHumanReview: e.target.checked })}
                                className="w-5 h-5"
                            />
                            <div>
                                <p className="font-medium">Always Require Human Review</p>
                                <p className="text-sm text-muted-foreground">
                                    Disable auto-approval and send all posts to review queue
                                </p>
                            </div>
                        </label>
                    </div>
                </Card>

                {/* SEO Settings */}
                <Card className="p-6 bg-white shadow-xl mb-8">
                    <h2 className="text-2xl font-bold mb-6">SEO Requirements</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block mb-2 font-medium text-sm">Title Length Range</label>
                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    min="40"
                                    max="70"
                                    value={settings.titleMinLength}
                                    onChange={(e) => setSettings({ ...settings, titleMinLength: parseInt(e.target.value) })}
                                    className="flex-1 px-4 py-2 border rounded-lg"
                                />
                                <span className="flex items-center px-2">-</span>
                                <input
                                    type="number"
                                    min="40"
                                    max="70"
                                    value={settings.titleMaxLength}
                                    onChange={(e) => setSettings({ ...settings, titleMaxLength: parseInt(e.target.value) })}
                                    className="flex-1 px-4 py-2 border rounded-lg"
                                />
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Optimal: 50-60 characters
                            </p>
                        </div>

                        <div>
                            <label className="block mb-2 font-medium text-sm">Meta Description Length</label>
                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    min="120"
                                    max="180"
                                    value={settings.metaMinLength}
                                    onChange={(e) => setSettings({ ...settings, metaMinLength: parseInt(e.target.value) })}
                                    className="flex-1 px-4 py-2 border rounded-lg"
                                />
                                <span className="flex items-center px-2">-</span>
                                <input
                                    type="number"
                                    min="120"
                                    max="180"
                                    value={settings.metaMaxLength}
                                    onChange={(e) => setSettings({ ...settings, metaMaxLength: parseInt(e.target.value) })}
                                    className="flex-1 px-4 py-2 border rounded-lg"
                                />
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Optimal: 150-160 characters
                            </p>
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
                        className="ml-auto px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:opacity-90 transition-opacity shadow-lg flex items-center gap-2"
                    >
                        <Save className="w-5 h-5" />
                        Save Settings
                    </button>
                </div>
            </div>
        </div>
    )
}
