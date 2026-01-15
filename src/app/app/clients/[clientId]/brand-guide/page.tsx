'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
    ChevronLeft,
    Save,
    Plus,
    X,
    AlertCircle,
    TrendingDown,
    Settings,
    BarChart3
} from 'lucide-react'
import Link from 'next/link'

interface StylesToAvoid {
    word_patterns: string[]
    structural_rules: {
        max_passive_voice_percent: number | null
        max_sentence_length: number | null
        avoid_all_caps: boolean
    }
    data_backing: Array<{
        rule: string
        evidence: string
        impact: string
    }>
}

interface BrandGuide {
    id: string
    client_id: string
    styles_to_avoid: StylesToAvoid
    styles_to_keep: any
    image_guidelines: any
    title_guidelines: any
}

export default function BrandGuideEditorPage() {
    const params = useParams()
    const router = useRouter()
    const clientId = params.clientId as string

    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [brandGuide, setBrandGuide] = useState<BrandGuide | null>(null)
    const [activeTab, setActiveTab] = useState<'avoid' | 'keep' | 'images' | 'titles'>('avoid')

    // Styles to Avoid State
    const [wordPatterns, setWordPatterns] = useState<string[]>([])
    const [newPattern, setNewPattern] = useState('')
    const [maxPassiveVoice, setMaxPassiveVoice] = useState<number | null>(null)
    const [maxSentenceLength, setMaxSentenceLength] = useState<number | null>(null)
    const [avoidAllCaps, setAvoidAllCaps] = useState(true)
    const [dataBacking, setDataBacking] = useState<Array<{rule: string, evidence: string, impact: string}>>([])
    const [newDataBacking, setNewDataBacking] = useState({rule: '', evidence: '', impact: ''})

    // Load brand guide data
    useEffect(() => {
        async function loadBrandGuide() {
            try {
                const response = await fetch(`/api/clients/${clientId}/brand-guide`)
                const data = await response.json()

                if (data.success && data.brandGuide) {
                    setBrandGuide(data.brandGuide)

                    // Load styles_to_avoid data
                    const stylesToAvoid = data.brandGuide.styles_to_avoid || {
                        word_patterns: [],
                        structural_rules: {
                            max_passive_voice_percent: null,
                            max_sentence_length: null,
                            avoid_all_caps: true
                        },
                        data_backing: []
                    }

                    setWordPatterns(stylesToAvoid.word_patterns || [])
                    setMaxPassiveVoice(stylesToAvoid.structural_rules?.max_passive_voice_percent || null)
                    setMaxSentenceLength(stylesToAvoid.structural_rules?.max_sentence_length || null)
                    setAvoidAllCaps(stylesToAvoid.structural_rules?.avoid_all_caps ?? true)
                    setDataBacking(stylesToAvoid.data_backing || [])
                }
            } catch (error) {
                console.error('Error loading brand guide:', error)
            } finally {
                setLoading(false)
            }
        }

        loadBrandGuide()
    }, [clientId])

    const handleSave = async () => {
        setSaving(true)
        try {
            const stylesToAvoid: StylesToAvoid = {
                word_patterns: wordPatterns,
                structural_rules: {
                    max_passive_voice_percent: maxPassiveVoice,
                    max_sentence_length: maxSentenceLength,
                    avoid_all_caps: avoidAllCaps
                },
                data_backing: dataBacking
            }

            const response = await fetch(`/api/clients/${clientId}/brand-guide`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ styles_to_avoid: stylesToAvoid })
            })

            const data = await response.json()

            if (data.success) {
                setBrandGuide(data.brandGuide)
                alert('Brand guide saved successfully!')
            } else {
                alert('Failed to save brand guide')
            }
        } catch (error) {
            console.error('Error saving brand guide:', error)
            alert('Error saving brand guide')
        } finally {
            setSaving(false)
        }
    }

    const addWordPattern = () => {
        if (newPattern.trim()) {
            setWordPatterns([...wordPatterns, newPattern.trim()])
            setNewPattern('')
        }
    }

    const removeWordPattern = (index: number) => {
        setWordPatterns(wordPatterns.filter((_, i) => i !== index))
    }

    const addDataBacking = () => {
        if (newDataBacking.rule.trim() && newDataBacking.evidence.trim()) {
            setDataBacking([...dataBacking, newDataBacking])
            setNewDataBacking({rule: '', evidence: '', impact: ''})
        }
    }

    const removeDataBacking = (index: number) => {
        setDataBacking(dataBacking.filter((_, i) => i !== index))
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading brand guide...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Header */}
                <div className="mb-8">
                    <Link
                        href={`/app/clients/${clientId}`}
                        className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
                    >
                        <ChevronLeft className="w-4 h-4 mr-1" />
                        Back to Client
                    </Link>

                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                Brand Style Guidelines
                            </h1>
                            <p className="text-gray-600">
                                Define writing styles to avoid for consistent, on-brand content
                            </p>
                        </div>
                        <Button
                            onClick={handleSave}
                            disabled={saving}
                            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-90"
                        >
                            <Save className="w-4 h-4 mr-2" />
                            {saving ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="border-b border-gray-200 mb-6">
                    <div className="flex gap-8">
                        <button
                            onClick={() => setActiveTab('avoid')}
                            className={`pb-4 px-1 border-b-2 font-medium transition-colors ${
                                activeTab === 'avoid'
                                    ? 'border-indigo-600 text-indigo-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            <TrendingDown className="w-4 h-4 inline mr-2" />
                            Styles to Avoid
                        </button>
                        <button
                            onClick={() => setActiveTab('keep')}
                            className={`pb-4 px-1 border-b-2 font-medium transition-colors ${
                                activeTab === 'keep'
                                    ? 'border-indigo-600 text-indigo-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            Styles to Keep
                        </button>
                        <button
                            onClick={() => setActiveTab('images')}
                            className={`pb-4 px-1 border-b-2 font-medium transition-colors ${
                                activeTab === 'images'
                                    ? 'border-indigo-600 text-indigo-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            Image Guidelines
                        </button>
                        <button
                            onClick={() => setActiveTab('titles')}
                            className={`pb-4 px-1 border-b-2 font-medium transition-colors ${
                                activeTab === 'titles'
                                    ? 'border-indigo-600 text-indigo-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            Title Guidelines
                        </button>
                    </div>
                </div>

                {/* Styles to Avoid Tab */}
                {activeTab === 'avoid' && (
                    <div className="space-y-6">
                        {/* Word Patterns to Avoid */}
                        <Card className="p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h2 className="text-xl font-semibold text-gray-900 mb-1">
                                        Word Patterns to Avoid
                                    </h2>
                                    <p className="text-sm text-gray-600">
                                        Specific words, phrases, or patterns that should not be used in content
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {/* Add New Pattern */}
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="Enter word or phrase to avoid (e.g., 'synergy', 'leverage', 'game-changer')"
                                        value={newPattern}
                                        onChange={(e) => setNewPattern(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && addWordPattern()}
                                        className="flex-1"
                                    />
                                    <Button onClick={addWordPattern} variant="outline">
                                        <Plus className="w-4 h-4 mr-1" />
                                        Add
                                    </Button>
                                </div>

                                {/* Pattern List */}
                                <div className="flex flex-wrap gap-2">
                                    {wordPatterns.length === 0 ? (
                                        <p className="text-sm text-gray-500 italic">
                                            No patterns added yet. Add words or phrases to avoid.
                                        </p>
                                    ) : (
                                        wordPatterns.map((pattern, index) => (
                                            <Badge
                                                key={index}
                                                variant="secondary"
                                                className="px-3 py-1.5 flex items-center gap-2 bg-red-50 text-red-700 border-red-200"
                                            >
                                                {pattern}
                                                <button
                                                    onClick={() => removeWordPattern(index)}
                                                    className="hover:text-red-900"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </Badge>
                                        ))
                                    )}
                                </div>
                            </div>
                        </Card>

                        {/* Structural Rules */}
                        <Card className="p-6">
                            <div className="mb-4">
                                <h2 className="text-xl font-semibold text-gray-900 mb-1 flex items-center gap-2">
                                    <Settings className="w-5 h-5 text-indigo-600" />
                                    Structural Rules
                                </h2>
                                <p className="text-sm text-gray-600">
                                    Configure quantitative limits for writing style
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Maximum Passive Voice Percentage
                                    </label>
                                    <div className="flex items-center gap-4">
                                        <Input
                                            type="number"
                                            placeholder="e.g., 10"
                                            value={maxPassiveVoice || ''}
                                            onChange={(e) => setMaxPassiveVoice(e.target.value ? parseInt(e.target.value) : null)}
                                            className="w-32"
                                            min="0"
                                            max="100"
                                        />
                                        <span className="text-sm text-gray-600">
                                            % of sentences (leave empty for no limit)
                                        </span>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Maximum Sentence Length
                                    </label>
                                    <div className="flex items-center gap-4">
                                        <Input
                                            type="number"
                                            placeholder="e.g., 25"
                                            value={maxSentenceLength || ''}
                                            onChange={(e) => setMaxSentenceLength(e.target.value ? parseInt(e.target.value) : null)}
                                            className="w-32"
                                            min="1"
                                        />
                                        <span className="text-sm text-gray-600">
                                            words per sentence (leave empty for no limit)
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                                    <input
                                        type="checkbox"
                                        id="avoid-all-caps"
                                        checked={avoidAllCaps}
                                        onChange={(e) => setAvoidAllCaps(e.target.checked)}
                                        className="w-4 h-4 text-indigo-600 rounded"
                                    />
                                    <label htmlFor="avoid-all-caps" className="text-sm font-medium text-gray-700">
                                        Avoid ALL CAPS text (except acronyms)
                                    </label>
                                </div>
                            </div>
                        </Card>

                        {/* Data Backing */}
                        <Card className="p-6">
                            <div className="mb-4">
                                <h2 className="text-xl font-semibold text-gray-900 mb-1 flex items-center gap-2">
                                    <BarChart3 className="w-5 h-5 text-indigo-600" />
                                    Data Backing
                                </h2>
                                <p className="text-sm text-gray-600">
                                    Evidence and metrics supporting these style guidelines
                                </p>
                            </div>

                            <div className="space-y-4">
                                {/* Add New Data Backing */}
                                <div className="p-4 bg-gray-50 rounded-lg space-y-3">
                                    <Input
                                        placeholder="Rule (e.g., 'Avoid passive voice')"
                                        value={newDataBacking.rule}
                                        onChange={(e) => setNewDataBacking({...newDataBacking, rule: e.target.value})}
                                    />
                                    <Textarea
                                        placeholder="Evidence (e.g., 'Analysis of top 50 posts showed 85% used active voice')"
                                        value={newDataBacking.evidence}
                                        onChange={(e) => setNewDataBacking({...newDataBacking, evidence: e.target.value})}
                                        rows={2}
                                    />
                                    <Textarea
                                        placeholder="Impact (e.g., 'Active voice posts had 23% higher engagement')"
                                        value={newDataBacking.impact}
                                        onChange={(e) => setNewDataBacking({...newDataBacking, impact: e.target.value})}
                                        rows={2}
                                    />
                                    <Button onClick={addDataBacking} variant="outline" size="sm">
                                        <Plus className="w-4 h-4 mr-1" />
                                        Add Data Point
                                    </Button>
                                </div>

                                {/* Data Backing List */}
                                <div className="space-y-3">
                                    {dataBacking.length === 0 ? (
                                        <div className="text-center py-8 text-sm text-gray-500 italic">
                                            No data backing added yet. Add metrics to support your guidelines.
                                        </div>
                                    ) : (
                                        dataBacking.map((item, index) => (
                                            <div key={index} className="p-4 border border-gray-200 rounded-lg">
                                                <div className="flex items-start justify-between mb-2">
                                                    <h4 className="font-medium text-gray-900">{item.rule}</h4>
                                                    <button
                                                        onClick={() => removeDataBacking(index)}
                                                        className="text-gray-400 hover:text-red-600"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                                <p className="text-sm text-gray-600 mb-1">
                                                    <strong>Evidence:</strong> {item.evidence}
                                                </p>
                                                {item.impact && (
                                                    <p className="text-sm text-gray-600">
                                                        <strong>Impact:</strong> {item.impact}
                                                    </p>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </Card>

                        {/* Preview Impact Section */}
                        <Card className="p-6 bg-indigo-50 border-indigo-200">
                            <div className="mb-4">
                                <h3 className="font-semibold text-indigo-900 mb-1 flex items-center gap-2">
                                    <AlertCircle className="w-5 h-5 text-indigo-600" />
                                    AI Content Generation Impact Preview
                                </h3>
                                <p className="text-sm text-indigo-700 mb-4">
                                    These guidelines will be automatically enforced when generating content for this client.
                                </p>
                            </div>

                            <div className="space-y-3">
                                {/* Active Rules Summary */}
                                <div className="bg-white p-4 rounded-lg border border-indigo-200">
                                    <h4 className="text-sm font-semibold text-gray-900 mb-3">Active Rules:</h4>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex items-center gap-2">
                                            <span className="text-gray-600">Word patterns to avoid:</span>
                                            <Badge variant="secondary" className="bg-red-100 text-red-700">
                                                {wordPatterns.length} patterns
                                            </Badge>
                                        </div>
                                        {maxPassiveVoice !== null && (
                                            <div className="flex items-center gap-2">
                                                <span className="text-gray-600">Max passive voice:</span>
                                                <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                                                    {maxPassiveVoice}%
                                                </Badge>
                                            </div>
                                        )}
                                        {maxSentenceLength !== null && (
                                            <div className="flex items-center gap-2">
                                                <span className="text-gray-600">Max sentence length:</span>
                                                <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                                                    {maxSentenceLength} words
                                                </Badge>
                                            </div>
                                        )}
                                        {avoidAllCaps && (
                                            <div className="flex items-center gap-2">
                                                <span className="text-gray-600">ALL CAPS text:</span>
                                                <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                                                    Prohibited
                                                </Badge>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Example Impact */}
                                <div className="bg-white p-4 rounded-lg border border-indigo-200">
                                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Example Impact:</h4>
                                    <div className="space-y-2">
                                        <div>
                                            <p className="text-xs text-red-600 font-medium mb-1">❌ Will be flagged:</p>
                                            <p className="text-xs text-gray-600 italic">
                                                {wordPatterns.length > 0 ? `Content containing: ${wordPatterns.slice(0, 3).join(', ')}${wordPatterns.length > 3 ? '...' : ''}` : 'No word patterns configured yet'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-green-600 font-medium mb-1">✅ Will be enforced:</p>
                                            <p className="text-xs text-gray-600 italic">
                                                {maxPassiveVoice || maxSentenceLength || avoidAllCaps
                                                    ? 'AI will write in active voice with concise sentences'
                                                    : 'Configure structural rules to see enforcement examples'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>
                )}

                {/* Other Tabs (Placeholder) */}
                {activeTab === 'keep' && (
                    <Card className="p-8 text-center text-gray-500">
                        <p>Styles to Keep section coming soon...</p>
                    </Card>
                )}

                {activeTab === 'images' && (
                    <Card className="p-8 text-center text-gray-500">
                        <p>Image Guidelines section coming soon...</p>
                    </Card>
                )}

                {activeTab === 'titles' && (
                    <Card className="p-8 text-center text-gray-500">
                        <p>Title Guidelines section coming soon...</p>
                    </Card>
                )}
            </div>
        </div>
    )
}
