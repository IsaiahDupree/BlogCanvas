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
    TrendingUp,
    Settings,
    BarChart3,
    ThumbsUp,
    ThumbsDown,
    Check,
    Image as ImageIcon,
    Palette,
    Type,
    Sparkles,
    Ban,
    Trophy
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

interface StylesToKeep {
    preferred_patterns: string[]
    successful_examples: Array<{
        text: string
        voice_type: 'good' | 'bad'
        context: string
        engagement_score?: number
    }>
    engagement_metrics: {
        avg_time_on_page?: number
        avg_engagement_rate?: number
        top_performing_style?: string
    }
    auto_learned: string[]
}

interface ImageGuidelines {
    featured_image_specs: {
        aspect_ratio: string
        min_width: number
        min_height: number
        preferred_format: string
    }
    ai_generation_settings: {
        provider: string
        style: string
        banned_elements: string[]
    }
    alt_text_rules: {
        max_length: number
        include_keywords: boolean
        avoid_phrases: string[]
    }
}

interface TitleGuidelines {
    preferred_formats: string[]
    power_words: string[]
    words_to_avoid: string[]
    high_performing_patterns: Array<{
        pattern: string
        avg_ctr?: number
        avg_engagement?: number
        example_title: string
    }>
}

interface BrandGuide {
    id: string
    client_id: string
    styles_to_avoid: StylesToAvoid
    styles_to_keep: StylesToKeep
    image_guidelines: ImageGuidelines
    title_guidelines: TitleGuidelines
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

    // Styles to Keep State
    const [preferredPatterns, setPreferredPatterns] = useState<string[]>([])
    const [newPreferredPattern, setNewPreferredPattern] = useState('')
    const [successfulExamples, setSuccessfulExamples] = useState<Array<{
        text: string
        voice_type: 'good' | 'bad'
        context: string
        engagement_score?: number
    }>>([])
    const [newExample, setNewExample] = useState({
        text: '',
        voice_type: 'good' as 'good' | 'bad',
        context: '',
        engagement_score: undefined as number | undefined
    })
    const [engagementMetrics, setEngagementMetrics] = useState({
        avg_time_on_page: undefined as number | undefined,
        avg_engagement_rate: undefined as number | undefined,
        top_performing_style: ''
    })

    // Image Guidelines State
    const [aspectRatio, setAspectRatio] = useState('16:9')
    const [minWidth, setMinWidth] = useState(1200)
    const [minHeight, setMinHeight] = useState(630)
    const [preferredFormat, setPreferredFormat] = useState('jpg')
    const [aiProvider, setAiProvider] = useState('dalle')
    const [aiStyle, setAiStyle] = useState('photorealistic')
    const [bannedElements, setBannedElements] = useState<string[]>([])
    const [newBannedElement, setNewBannedElement] = useState('')
    const [altTextMaxLength, setAltTextMaxLength] = useState(125)
    const [altTextIncludeKeywords, setAltTextIncludeKeywords] = useState(true)
    const [avoidPhrases, setAvoidPhrases] = useState<string[]>([])
    const [newAvoidPhrase, setNewAvoidPhrase] = useState('')

    // Title Guidelines State
    const [preferredFormats, setPreferredFormats] = useState<string[]>([])
    const [newFormat, setNewFormat] = useState('')
    const [powerWords, setPowerWords] = useState<string[]>([])
    const [newPowerWord, setNewPowerWord] = useState('')
    const [wordsToAvoid, setWordsToAvoid] = useState<string[]>([])
    const [newWordToAvoid, setNewWordToAvoid] = useState('')
    const [highPerformingPatterns, setHighPerformingPatterns] = useState<Array<{
        pattern: string
        avg_ctr?: number
        avg_engagement?: number
        example_title: string
    }>>([])
    const [newTitlePattern, setNewTitlePattern] = useState({
        pattern: '',
        avg_ctr: undefined as number | undefined,
        avg_engagement: undefined as number | undefined,
        example_title: ''
    })

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

                    // Load styles_to_keep data
                    const stylesToKeep = data.brandGuide.styles_to_keep || {
                        preferred_patterns: [],
                        successful_examples: [],
                        engagement_metrics: {},
                        auto_learned: []
                    }

                    setPreferredPatterns(stylesToKeep.preferred_patterns || [])
                    setSuccessfulExamples(stylesToKeep.successful_examples || [])
                    setEngagementMetrics({
                        avg_time_on_page: stylesToKeep.engagement_metrics?.avg_time_on_page,
                        avg_engagement_rate: stylesToKeep.engagement_metrics?.avg_engagement_rate,
                        top_performing_style: stylesToKeep.engagement_metrics?.top_performing_style || ''
                    })

                    // Load image_guidelines data
                    const imageGuidelines = data.brandGuide.image_guidelines || {
                        featured_image_specs: {
                            aspect_ratio: '16:9',
                            min_width: 1200,
                            min_height: 630,
                            preferred_format: 'jpg'
                        },
                        ai_generation_settings: {
                            provider: 'dalle',
                            style: 'photorealistic',
                            banned_elements: []
                        },
                        alt_text_rules: {
                            max_length: 125,
                            include_keywords: true,
                            avoid_phrases: ['image of', 'picture of']
                        }
                    }

                    setAspectRatio(imageGuidelines.featured_image_specs?.aspect_ratio || '16:9')
                    setMinWidth(imageGuidelines.featured_image_specs?.min_width || 1200)
                    setMinHeight(imageGuidelines.featured_image_specs?.min_height || 630)
                    setPreferredFormat(imageGuidelines.featured_image_specs?.preferred_format || 'jpg')
                    setAiProvider(imageGuidelines.ai_generation_settings?.provider || 'dalle')
                    setAiStyle(imageGuidelines.ai_generation_settings?.style || 'photorealistic')
                    setBannedElements(imageGuidelines.ai_generation_settings?.banned_elements || [])
                    setAltTextMaxLength(imageGuidelines.alt_text_rules?.max_length || 125)
                    setAltTextIncludeKeywords(imageGuidelines.alt_text_rules?.include_keywords ?? true)
                    setAvoidPhrases(imageGuidelines.alt_text_rules?.avoid_phrases || ['image of', 'picture of'])

                    // Load title_guidelines data
                    const titleGuidelines = data.brandGuide.title_guidelines || {
                        preferred_formats: [
                            'How to [X]',
                            '[Number] Ways to [X]',
                            '[X]: A Complete Guide'
                        ],
                        power_words: [],
                        words_to_avoid: [],
                        high_performing_patterns: []
                    }

                    setPreferredFormats(titleGuidelines.preferred_formats || [])
                    setPowerWords(titleGuidelines.power_words || [])
                    setWordsToAvoid(titleGuidelines.words_to_avoid || [])
                    setHighPerformingPatterns(titleGuidelines.high_performing_patterns || [])
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

            const stylesToKeep: StylesToKeep = {
                preferred_patterns: preferredPatterns,
                successful_examples: successfulExamples,
                engagement_metrics: {
                    avg_time_on_page: engagementMetrics.avg_time_on_page,
                    avg_engagement_rate: engagementMetrics.avg_engagement_rate,
                    top_performing_style: engagementMetrics.top_performing_style
                },
                auto_learned: []
            }

            const imageGuidelines: ImageGuidelines = {
                featured_image_specs: {
                    aspect_ratio: aspectRatio,
                    min_width: minWidth,
                    min_height: minHeight,
                    preferred_format: preferredFormat
                },
                ai_generation_settings: {
                    provider: aiProvider,
                    style: aiStyle,
                    banned_elements: bannedElements
                },
                alt_text_rules: {
                    max_length: altTextMaxLength,
                    include_keywords: altTextIncludeKeywords,
                    avoid_phrases: avoidPhrases
                }
            }

            const titleGuidelines: TitleGuidelines = {
                preferred_formats: preferredFormats,
                power_words: powerWords,
                words_to_avoid: wordsToAvoid,
                high_performing_patterns: highPerformingPatterns
            }

            const response = await fetch(`/api/clients/${clientId}/brand-guide`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    styles_to_avoid: stylesToAvoid,
                    styles_to_keep: stylesToKeep,
                    image_guidelines: imageGuidelines,
                    title_guidelines: titleGuidelines
                })
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

    // Styles to Keep Helper Functions
    const addPreferredPattern = () => {
        if (newPreferredPattern.trim()) {
            setPreferredPatterns([...preferredPatterns, newPreferredPattern.trim()])
            setNewPreferredPattern('')
        }
    }

    const removePreferredPattern = (index: number) => {
        setPreferredPatterns(preferredPatterns.filter((_, i) => i !== index))
    }

    const addSuccessfulExample = () => {
        if (newExample.text.trim() && newExample.context.trim()) {
            setSuccessfulExamples([...successfulExamples, {
                text: newExample.text.trim(),
                voice_type: newExample.voice_type,
                context: newExample.context.trim(),
                engagement_score: newExample.engagement_score
            }])
            setNewExample({
                text: '',
                voice_type: 'good',
                context: '',
                engagement_score: undefined
            })
        }
    }

    const removeSuccessfulExample = (index: number) => {
        setSuccessfulExamples(successfulExamples.filter((_, i) => i !== index))
    }

    // Image Guidelines Helper Functions
    const addBannedElement = () => {
        if (newBannedElement.trim()) {
            setBannedElements([...bannedElements, newBannedElement.trim()])
            setNewBannedElement('')
        }
    }

    const removeBannedElement = (index: number) => {
        setBannedElements(bannedElements.filter((_, i) => i !== index))
    }

    const addAvoidPhrase = () => {
        if (newAvoidPhrase.trim()) {
            setAvoidPhrases([...avoidPhrases, newAvoidPhrase.trim()])
            setNewAvoidPhrase('')
        }
    }

    const removeAvoidPhrase = (index: number) => {
        setAvoidPhrases(avoidPhrases.filter((_, i) => i !== index))
    }

    // Title Guidelines Helper Functions
    const addPreferredFormat = () => {
        if (newFormat.trim()) {
            setPreferredFormats([...preferredFormats, newFormat.trim()])
            setNewFormat('')
        }
    }

    const removePreferredFormat = (index: number) => {
        setPreferredFormats(preferredFormats.filter((_, i) => i !== index))
    }

    const addPowerWord = () => {
        if (newPowerWord.trim()) {
            setPowerWords([...powerWords, newPowerWord.trim()])
            setNewPowerWord('')
        }
    }

    const removePowerWord = (index: number) => {
        setPowerWords(powerWords.filter((_, i) => i !== index))
    }

    const addWordToAvoid = () => {
        if (newWordToAvoid.trim()) {
            setWordsToAvoid([...wordsToAvoid, newWordToAvoid.trim()])
            setNewWordToAvoid('')
        }
    }

    const removeWordToAvoid = (index: number) => {
        setWordsToAvoid(wordsToAvoid.filter((_, i) => i !== index))
    }

    const addHighPerformingPattern = () => {
        if (newTitlePattern.pattern.trim() && newTitlePattern.example_title.trim()) {
            setHighPerformingPatterns([...highPerformingPatterns, {
                pattern: newTitlePattern.pattern.trim(),
                avg_ctr: newTitlePattern.avg_ctr,
                avg_engagement: newTitlePattern.avg_engagement,
                example_title: newTitlePattern.example_title.trim()
            }])
            setNewTitlePattern({
                pattern: '',
                avg_ctr: undefined,
                avg_engagement: undefined,
                example_title: ''
            })
        }
    }

    const removeHighPerformingPattern = (index: number) => {
        setHighPerformingPatterns(highPerformingPatterns.filter((_, i) => i !== index))
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
                            <TrendingUp className="w-4 h-4 inline mr-2" />
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

                {/* Styles to Keep Tab */}
                {activeTab === 'keep' && (
                    <div className="space-y-6">
                        {/* Preferred Patterns Section */}
                        <Card className="p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h2 className="text-xl font-semibold text-gray-900 mb-1">
                                        Preferred Patterns
                                    </h2>
                                    <p className="text-sm text-gray-600">
                                        Writing patterns, phrases, and styles that perform well for this client
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {/* Add New Pattern */}
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="Enter preferred pattern (e.g., 'Start with actionable insights', 'Use data-driven examples')"
                                        value={newPreferredPattern}
                                        onChange={(e) => setNewPreferredPattern(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && addPreferredPattern()}
                                        className="flex-1"
                                    />
                                    <Button onClick={addPreferredPattern} variant="outline">
                                        <Plus className="w-4 h-4 mr-1" />
                                        Add
                                    </Button>
                                </div>

                                {/* Pattern List */}
                                <div className="flex flex-wrap gap-2">
                                    {preferredPatterns.length === 0 ? (
                                        <p className="text-sm text-gray-500 italic">
                                            No patterns added yet. Add writing patterns to keep.
                                        </p>
                                    ) : (
                                        preferredPatterns.map((pattern, index) => (
                                            <Badge
                                                key={index}
                                                variant="secondary"
                                                className="px-3 py-1.5 flex items-center gap-2 bg-green-50 text-green-700 border-green-200"
                                            >
                                                {pattern}
                                                <button
                                                    onClick={() => removePreferredPattern(index)}
                                                    className="hover:text-green-900"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </Badge>
                                        ))
                                    )}
                                </div>
                            </div>
                        </Card>

                        {/* Good vs Bad Voice Examples Section */}
                        <Card className="p-6">
                            <div className="mb-4">
                                <h2 className="text-xl font-semibold text-gray-900 mb-1 flex items-center gap-2">
                                    <ThumbsUp className="w-5 h-5 text-indigo-600" />
                                    Good vs Bad Voice Examples
                                </h2>
                                <p className="text-sm text-gray-600">
                                    Concrete examples of successful and unsuccessful voice/tone
                                </p>
                            </div>

                            <div className="space-y-4">
                                {/* Add New Example */}
                                <div className="p-4 bg-gray-50 rounded-lg space-y-3">
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setNewExample({...newExample, voice_type: 'good'})}
                                            className={`flex-1 px-4 py-2 rounded-lg border-2 font-medium transition-colors ${
                                                newExample.voice_type === 'good'
                                                    ? 'border-green-500 bg-green-50 text-green-700'
                                                    : 'border-gray-200 bg-white text-gray-600 hover:border-green-300'
                                            }`}
                                        >
                                            <ThumbsUp className="w-4 h-4 inline mr-2" />
                                            Good Example
                                        </button>
                                        <button
                                            onClick={() => setNewExample({...newExample, voice_type: 'bad'})}
                                            className={`flex-1 px-4 py-2 rounded-lg border-2 font-medium transition-colors ${
                                                newExample.voice_type === 'bad'
                                                    ? 'border-red-500 bg-red-50 text-red-700'
                                                    : 'border-gray-200 bg-white text-gray-600 hover:border-red-300'
                                            }`}
                                        >
                                            <ThumbsDown className="w-4 h-4 inline mr-2" />
                                            Bad Example
                                        </button>
                                    </div>
                                    <Textarea
                                        placeholder="Example text (e.g., 'Our proven methodology drives 3x ROI increases...')"
                                        value={newExample.text}
                                        onChange={(e) => setNewExample({...newExample, text: e.target.value})}
                                        rows={3}
                                    />
                                    <Input
                                        placeholder="Context (e.g., 'Opening paragraph for case studies')"
                                        value={newExample.context}
                                        onChange={(e) => setNewExample({...newExample, context: e.target.value})}
                                    />
                                    <div className="flex items-center gap-2">
                                        <Input
                                            type="number"
                                            placeholder="Engagement score (0-100)"
                                            value={newExample.engagement_score || ''}
                                            onChange={(e) => setNewExample({
                                                ...newExample,
                                                engagement_score: e.target.value ? parseFloat(e.target.value) : undefined
                                            })}
                                            className="w-48"
                                            min="0"
                                            max="100"
                                            step="0.1"
                                        />
                                        <span className="text-sm text-gray-600">(optional)</span>
                                    </div>
                                    <Button onClick={addSuccessfulExample} variant="outline" size="sm">
                                        <Plus className="w-4 h-4 mr-1" />
                                        Add Example
                                    </Button>
                                </div>

                                {/* Examples List */}
                                <div className="space-y-3">
                                    {successfulExamples.length === 0 ? (
                                        <div className="text-center py-8 text-sm text-gray-500 italic">
                                            No examples added yet. Add voice examples to guide AI content generation.
                                        </div>
                                    ) : (
                                        successfulExamples.map((example, index) => (
                                            <div
                                                key={index}
                                                className={`p-4 border-2 rounded-lg ${
                                                    example.voice_type === 'good'
                                                        ? 'border-green-200 bg-green-50'
                                                        : 'border-red-200 bg-red-50'
                                                }`}
                                            >
                                                <div className="flex items-start justify-between mb-2">
                                                    <div className="flex items-center gap-2">
                                                        {example.voice_type === 'good' ? (
                                                            <Badge className="bg-green-600">
                                                                <ThumbsUp className="w-3 h-3 mr-1" />
                                                                Good Example
                                                            </Badge>
                                                        ) : (
                                                            <Badge className="bg-red-600">
                                                                <ThumbsDown className="w-3 h-3 mr-1" />
                                                                Bad Example
                                                            </Badge>
                                                        )}
                                                        {example.engagement_score && (
                                                            <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                                                                Score: {example.engagement_score}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <button
                                                        onClick={() => removeSuccessfulExample(index)}
                                                        className="text-gray-400 hover:text-red-600"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                                <p className="text-sm text-gray-700 mb-2 italic">"{example.text}"</p>
                                                <p className="text-xs text-gray-600">
                                                    <strong>Context:</strong> {example.context}
                                                </p>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </Card>

                        {/* Engagement Metrics Section */}
                        <Card className="p-6">
                            <div className="mb-4">
                                <h2 className="text-xl font-semibold text-gray-900 mb-1 flex items-center gap-2">
                                    <BarChart3 className="w-5 h-5 text-indigo-600" />
                                    Engagement Metrics
                                </h2>
                                <p className="text-sm text-gray-600">
                                    Performance data to guide content optimization
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Average Time on Page
                                    </label>
                                    <div className="flex items-center gap-4">
                                        <Input
                                            type="number"
                                            placeholder="e.g., 180"
                                            value={engagementMetrics.avg_time_on_page || ''}
                                            onChange={(e) => setEngagementMetrics({
                                                ...engagementMetrics,
                                                avg_time_on_page: e.target.value ? parseFloat(e.target.value) : undefined
                                            })}
                                            className="w-32"
                                            min="0"
                                            step="1"
                                        />
                                        <span className="text-sm text-gray-600">seconds</span>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Average Engagement Rate
                                    </label>
                                    <div className="flex items-center gap-4">
                                        <Input
                                            type="number"
                                            placeholder="e.g., 65.5"
                                            value={engagementMetrics.avg_engagement_rate || ''}
                                            onChange={(e) => setEngagementMetrics({
                                                ...engagementMetrics,
                                                avg_engagement_rate: e.target.value ? parseFloat(e.target.value) : undefined
                                            })}
                                            className="w-32"
                                            min="0"
                                            max="100"
                                            step="0.1"
                                        />
                                        <span className="text-sm text-gray-600">%</span>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Top Performing Style
                                    </label>
                                    <Input
                                        placeholder="e.g., 'Data-driven storytelling with case studies'"
                                        value={engagementMetrics.top_performing_style}
                                        onChange={(e) => setEngagementMetrics({
                                            ...engagementMetrics,
                                            top_performing_style: e.target.value
                                        })}
                                    />
                                </div>

                                {/* Metrics Summary */}
                                {(engagementMetrics.avg_time_on_page || engagementMetrics.avg_engagement_rate || engagementMetrics.top_performing_style) && (
                                    <div className="mt-4 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                                        <h4 className="text-sm font-semibold text-indigo-900 mb-2 flex items-center gap-2">
                                            <Check className="w-4 h-4" />
                                            Active Metrics
                                        </h4>
                                        <div className="space-y-1 text-sm text-indigo-700">
                                            {engagementMetrics.avg_time_on_page && (
                                                <p>• Targeting {engagementMetrics.avg_time_on_page}s average time on page</p>
                                            )}
                                            {engagementMetrics.avg_engagement_rate && (
                                                <p>• Aiming for {engagementMetrics.avg_engagement_rate}% engagement rate</p>
                                            )}
                                            {engagementMetrics.top_performing_style && (
                                                <p>• Best style: "{engagementMetrics.top_performing_style}"</p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </Card>

                        {/* Preview Section */}
                        <Card className="p-6 bg-green-50 border-green-200">
                            <div className="mb-4">
                                <h3 className="font-semibold text-green-900 mb-1 flex items-center gap-2">
                                    <TrendingUp className="w-5 h-5 text-green-600" />
                                    Content Generation Guidelines
                                </h3>
                                <p className="text-sm text-green-700 mb-4">
                                    These patterns will guide AI to create content matching your successful styles.
                                </p>
                            </div>

                            <div className="space-y-3">
                                {/* Active Patterns Summary */}
                                <div className="bg-white p-4 rounded-lg border border-green-200">
                                    <h4 className="text-sm font-semibold text-gray-900 mb-3">Active Guidelines:</h4>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex items-center gap-2">
                                            <span className="text-gray-600">Preferred patterns:</span>
                                            <Badge variant="secondary" className="bg-green-100 text-green-700">
                                                {preferredPatterns.length} patterns
                                            </Badge>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-gray-600">Voice examples:</span>
                                            <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                                                {successfulExamples.filter(e => e.voice_type === 'good').length} good
                                            </Badge>
                                            <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                                                {successfulExamples.filter(e => e.voice_type === 'bad').length} bad
                                            </Badge>
                                        </div>
                                    </div>
                                </div>

                                {/* Example Impact */}
                                <div className="bg-white p-4 rounded-lg border border-green-200">
                                    <h4 className="text-sm font-semibold text-gray-900 mb-2">AI Will:</h4>
                                    <div className="space-y-2 text-xs text-gray-600">
                                        <p>✓ Emulate patterns from your {successfulExamples.filter(e => e.voice_type === 'good').length} good examples</p>
                                        <p>✓ Avoid styles from your {successfulExamples.filter(e => e.voice_type === 'bad').length} bad examples</p>
                                        <p>✓ Target {engagementMetrics.avg_engagement_rate || 'optimal'} engagement rate</p>
                                        {preferredPatterns.length > 0 && (
                                            <p>✓ Follow {preferredPatterns.length} preferred writing patterns</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>
                )}

                {activeTab === 'images' && (
                    <div className="space-y-6">
                        {/* Featured Image Specs */}
                        <Card className="p-6">
                            <div className="mb-4">
                                <h2 className="text-xl font-semibold text-gray-900 mb-1 flex items-center gap-2">
                                    <ImageIcon className="w-5 h-5 text-indigo-600" />
                                    Featured Image Specifications
                                </h2>
                                <p className="text-sm text-gray-600">
                                    Define technical requirements for blog featured images
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Aspect Ratio
                                    </label>
                                    <select
                                        value={aspectRatio}
                                        onChange={(e) => setAspectRatio(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    >
                                        <option value="16:9">16:9 (Widescreen)</option>
                                        <option value="4:3">4:3 (Standard)</option>
                                        <option value="1:1">1:1 (Square)</option>
                                        <option value="3:2">3:2 (Classic)</option>
                                        <option value="2:1">2:1 (Panoramic)</option>
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Minimum Width (px)
                                        </label>
                                        <Input
                                            type="number"
                                            value={minWidth}
                                            onChange={(e) => setMinWidth(parseInt(e.target.value) || 1200)}
                                            min="100"
                                            step="50"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Minimum Height (px)
                                        </label>
                                        <Input
                                            type="number"
                                            value={minHeight}
                                            onChange={(e) => setMinHeight(parseInt(e.target.value) || 630)}
                                            min="100"
                                            step="50"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Preferred Format
                                    </label>
                                    <select
                                        value={preferredFormat}
                                        onChange={(e) => setPreferredFormat(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    >
                                        <option value="jpg">JPG (Best for photos)</option>
                                        <option value="png">PNG (Best for graphics)</option>
                                        <option value="webp">WebP (Modern, smaller size)</option>
                                    </select>
                                </div>
                            </div>
                        </Card>

                        {/* AI Generation Settings */}
                        <Card className="p-6">
                            <div className="mb-4">
                                <h2 className="text-xl font-semibold text-gray-900 mb-1 flex items-center gap-2">
                                    <Palette className="w-5 h-5 text-indigo-600" />
                                    AI Generation Settings
                                </h2>
                                <p className="text-sm text-gray-600">
                                    Configure how AI generates images for this client
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        AI Provider
                                    </label>
                                    <select
                                        value={aiProvider}
                                        onChange={(e) => setAiProvider(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    >
                                        <option value="dalle">DALL-E (OpenAI)</option>
                                        <option value="midjourney">Midjourney</option>
                                        <option value="stable-diffusion">Stable Diffusion</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        AI Style
                                    </label>
                                    <select
                                        value={aiStyle}
                                        onChange={(e) => setAiStyle(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    >
                                        <option value="photorealistic">Photorealistic</option>
                                        <option value="artistic">Artistic</option>
                                        <option value="illustration">Illustration</option>
                                        <option value="minimalist">Minimalist</option>
                                        <option value="abstract">Abstract</option>
                                        <option value="corporate">Corporate</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Banned Elements
                                    </label>
                                    <p className="text-xs text-gray-500 mb-2">
                                        Elements that should never appear in generated images
                                    </p>
                                    <div className="flex gap-2 mb-3">
                                        <Input
                                            placeholder="e.g., 'people', 'text overlays', 'logos'"
                                            value={newBannedElement}
                                            onChange={(e) => setNewBannedElement(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && addBannedElement()}
                                            className="flex-1"
                                        />
                                        <Button onClick={addBannedElement} variant="outline">
                                            <Plus className="w-4 h-4 mr-1" />
                                            Add
                                        </Button>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {bannedElements.length === 0 ? (
                                            <p className="text-sm text-gray-500 italic">
                                                No banned elements. Add elements to avoid in images.
                                            </p>
                                        ) : (
                                            bannedElements.map((element, index) => (
                                                <Badge
                                                    key={index}
                                                    variant="secondary"
                                                    className="px-3 py-1.5 flex items-center gap-2 bg-red-50 text-red-700 border-red-200"
                                                >
                                                    {element}
                                                    <button
                                                        onClick={() => removeBannedElement(index)}
                                                        className="hover:text-red-900"
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </Badge>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* Alt Text Rules */}
                        <Card className="p-6">
                            <div className="mb-4">
                                <h2 className="text-xl font-semibold text-gray-900 mb-1 flex items-center gap-2">
                                    <Settings className="w-5 h-5 text-indigo-600" />
                                    Alt Text Rules
                                </h2>
                                <p className="text-sm text-gray-600">
                                    Guidelines for generating accessible image descriptions
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Maximum Alt Text Length
                                    </label>
                                    <div className="flex items-center gap-4">
                                        <Input
                                            type="number"
                                            value={altTextMaxLength}
                                            onChange={(e) => setAltTextMaxLength(parseInt(e.target.value) || 125)}
                                            className="w-32"
                                            min="50"
                                            max="250"
                                        />
                                        <span className="text-sm text-gray-600">characters</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                                    <input
                                        type="checkbox"
                                        id="include-keywords"
                                        checked={altTextIncludeKeywords}
                                        onChange={(e) => setAltTextIncludeKeywords(e.target.checked)}
                                        className="w-4 h-4 text-indigo-600 rounded"
                                    />
                                    <label htmlFor="include-keywords" className="text-sm font-medium text-gray-700">
                                        Include target keywords in alt text when relevant
                                    </label>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Phrases to Avoid in Alt Text
                                    </label>
                                    <p className="text-xs text-gray-500 mb-2">
                                        Redundant phrases that should be excluded
                                    </p>
                                    <div className="flex gap-2 mb-3">
                                        <Input
                                            placeholder="e.g., 'image of', 'photo showing'"
                                            value={newAvoidPhrase}
                                            onChange={(e) => setNewAvoidPhrase(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && addAvoidPhrase()}
                                            className="flex-1"
                                        />
                                        <Button onClick={addAvoidPhrase} variant="outline">
                                            <Plus className="w-4 h-4 mr-1" />
                                            Add
                                        </Button>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {avoidPhrases.length === 0 ? (
                                            <p className="text-sm text-gray-500 italic">
                                                No phrases to avoid. Common ones: "image of", "picture of"
                                            </p>
                                        ) : (
                                            avoidPhrases.map((phrase, index) => (
                                                <Badge
                                                    key={index}
                                                    variant="secondary"
                                                    className="px-3 py-1.5 flex items-center gap-2 bg-orange-50 text-orange-700 border-orange-200"
                                                >
                                                    {phrase}
                                                    <button
                                                        onClick={() => removeAvoidPhrase(index)}
                                                        className="hover:text-orange-900"
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </Badge>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* Preview Section */}
                        <Card className="p-6 bg-indigo-50 border-indigo-200">
                            <div className="mb-4">
                                <h3 className="font-semibold text-indigo-900 mb-1 flex items-center gap-2">
                                    <AlertCircle className="w-5 h-5 text-indigo-600" />
                                    Image Generation Guidelines Summary
                                </h3>
                                <p className="text-sm text-indigo-700 mb-4">
                                    All AI-generated images will follow these specifications
                                </p>
                            </div>

                            <div className="space-y-3">
                                <div className="bg-white p-4 rounded-lg border border-indigo-200">
                                    <h4 className="text-sm font-semibold text-gray-900 mb-3">Active Settings:</h4>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex items-center gap-2">
                                            <span className="text-gray-600">Dimensions:</span>
                                            <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                                                {minWidth}×{minHeight}px ({aspectRatio})
                                            </Badge>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-gray-600">Format:</span>
                                            <Badge variant="secondary" className="bg-green-100 text-green-700">
                                                {preferredFormat.toUpperCase()}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-gray-600">AI Style:</span>
                                            <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                                                {aiStyle} ({aiProvider})
                                            </Badge>
                                        </div>
                                        {bannedElements.length > 0 && (
                                            <div className="flex items-center gap-2">
                                                <span className="text-gray-600">Banned elements:</span>
                                                <Badge variant="secondary" className="bg-red-100 text-red-700">
                                                    {bannedElements.length} items
                                                </Badge>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-2">
                                            <span className="text-gray-600">Alt text max:</span>
                                            <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                                                {altTextMaxLength} chars
                                            </Badge>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white p-4 rounded-lg border border-indigo-200">
                                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Example:</h4>
                                    <div className="space-y-2 text-xs text-gray-600">
                                        <p>✓ Generated images will be {minWidth}×{minHeight}px in {aspectRatio} ratio</p>
                                        <p>✓ Style: {aiStyle} using {aiProvider}</p>
                                        {bannedElements.length > 0 && (
                                            <p>✓ Will avoid: {bannedElements.slice(0, 3).join(', ')}{bannedElements.length > 3 ? '...' : ''}</p>
                                        )}
                                        <p>✓ Alt text under {altTextMaxLength} characters{altTextIncludeKeywords ? ' with keywords' : ''}</p>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>
                )}

                {activeTab === 'titles' && (
                    <div className="space-y-6">
                        {/* Preferred Title Formats */}
                        <Card className="p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h2 className="text-xl font-semibold text-gray-900 mb-1 flex items-center gap-2">
                                        <Type className="w-5 h-5 text-indigo-600" />
                                        Preferred Title Formats
                                    </h2>
                                    <p className="text-sm text-gray-600">
                                        Define template patterns for blog post titles (use [X] as placeholder)
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="e.g., How to [X], [Number] Ways to [X]"
                                        value={newFormat}
                                        onChange={(e) => setNewFormat(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && addPreferredFormat()}
                                        className="flex-1"
                                    />
                                    <Button
                                        onClick={addPreferredFormat}
                                        size="sm"
                                        className="whitespace-nowrap"
                                    >
                                        <Plus className="w-4 h-4 mr-1" />
                                        Add Format
                                    </Button>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    {preferredFormats.length === 0 ? (
                                        <p className="text-sm text-gray-500 italic">
                                            No preferred formats yet. Add common title patterns like "How to [X]" or "[Number] Tips for [X]"
                                        </p>
                                    ) : (
                                        preferredFormats.map((format, index) => (
                                            <Badge
                                                key={index}
                                                variant="secondary"
                                                className="px-3 py-1.5 flex items-center gap-2 bg-blue-50 text-blue-700 border-blue-200"
                                            >
                                                {format}
                                                <button
                                                    onClick={() => removePreferredFormat(index)}
                                                    className="hover:text-blue-900"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </Badge>
                                        ))
                                    )}
                                </div>
                            </div>
                        </Card>

                        {/* Power Words */}
                        <Card className="p-6">
                            <div className="mb-4">
                                <h2 className="text-xl font-semibold text-gray-900 mb-1 flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-indigo-600" />
                                    Power Words
                                </h2>
                                <p className="text-sm text-gray-600">
                                    High-impact words to include in titles for better engagement
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="e.g., Ultimate, Essential, Proven, Secret"
                                        value={newPowerWord}
                                        onChange={(e) => setNewPowerWord(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && addPowerWord()}
                                        className="flex-1"
                                    />
                                    <Button
                                        onClick={addPowerWord}
                                        size="sm"
                                        className="whitespace-nowrap"
                                    >
                                        <Plus className="w-4 h-4 mr-1" />
                                        Add Word
                                    </Button>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    {powerWords.length === 0 ? (
                                        <p className="text-sm text-gray-500 italic">
                                            No power words yet. Add impactful words like "Ultimate", "Essential", "Proven"
                                        </p>
                                    ) : (
                                        powerWords.map((word, index) => (
                                            <Badge
                                                key={index}
                                                variant="secondary"
                                                className="px-3 py-1.5 flex items-center gap-2 bg-green-50 text-green-700 border-green-200"
                                            >
                                                {word}
                                                <button
                                                    onClick={() => removePowerWord(index)}
                                                    className="hover:text-green-900"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </Badge>
                                        ))
                                    )}
                                </div>
                            </div>
                        </Card>

                        {/* Words to Avoid */}
                        <Card className="p-6">
                            <div className="mb-4">
                                <h2 className="text-xl font-semibold text-gray-900 mb-1 flex items-center gap-2">
                                    <Ban className="w-5 h-5 text-indigo-600" />
                                    Words to Avoid in Titles
                                </h2>
                                <p className="text-sm text-gray-600">
                                    Words or phrases that should not appear in blog titles
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="e.g., Shocking, Click here, You won't believe"
                                        value={newWordToAvoid}
                                        onChange={(e) => setNewWordToAvoid(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && addWordToAvoid()}
                                        className="flex-1"
                                    />
                                    <Button
                                        onClick={addWordToAvoid}
                                        size="sm"
                                        variant="outline"
                                        className="whitespace-nowrap"
                                    >
                                        <Plus className="w-4 h-4 mr-1" />
                                        Add Word
                                    </Button>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    {wordsToAvoid.length === 0 ? (
                                        <p className="text-sm text-gray-500 italic">
                                            No words to avoid yet. Add clickbait or low-quality words to exclude
                                        </p>
                                    ) : (
                                        wordsToAvoid.map((word, index) => (
                                            <Badge
                                                key={index}
                                                variant="secondary"
                                                className="px-3 py-1.5 flex items-center gap-2 bg-red-50 text-red-700 border-red-200"
                                            >
                                                {word}
                                                <button
                                                    onClick={() => removeWordToAvoid(index)}
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

                        {/* High-Performing Patterns */}
                        <Card className="p-6">
                            <div className="mb-4">
                                <h2 className="text-xl font-semibold text-gray-900 mb-1 flex items-center gap-2">
                                    <Trophy className="w-5 h-5 text-indigo-600" />
                                    High-Performing Patterns
                                </h2>
                                <p className="text-sm text-gray-600">
                                    Historical data on successful title patterns with engagement metrics
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Pattern Template
                                        </label>
                                        <Input
                                            placeholder="e.g., [Number] Reasons Why [X]"
                                            value={newTitlePattern.pattern}
                                            onChange={(e) => setNewTitlePattern({...newTitlePattern, pattern: e.target.value})}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Example Title
                                        </label>
                                        <Input
                                            placeholder="e.g., 10 Reasons Why React is Great"
                                            value={newTitlePattern.example_title}
                                            onChange={(e) => setNewTitlePattern({...newTitlePattern, example_title: e.target.value})}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Avg CTR % (optional)
                                        </label>
                                        <Input
                                            type="number"
                                            step="0.1"
                                            placeholder="e.g., 3.5"
                                            value={newTitlePattern.avg_ctr || ''}
                                            onChange={(e) => setNewTitlePattern({...newTitlePattern, avg_ctr: e.target.value ? parseFloat(e.target.value) : undefined})}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Avg Engagement % (optional)
                                        </label>
                                        <Input
                                            type="number"
                                            step="0.1"
                                            placeholder="e.g., 65.2"
                                            value={newTitlePattern.avg_engagement || ''}
                                            onChange={(e) => setNewTitlePattern({...newTitlePattern, avg_engagement: e.target.value ? parseFloat(e.target.value) : undefined})}
                                        />
                                    </div>
                                </div>
                                <Button
                                    onClick={addHighPerformingPattern}
                                    size="sm"
                                    className="w-full"
                                >
                                    <Plus className="w-4 h-4 mr-1" />
                                    Add High-Performing Pattern
                                </Button>

                                <div className="space-y-3">
                                    {highPerformingPatterns.length === 0 ? (
                                        <p className="text-sm text-gray-500 italic text-center py-4">
                                            No high-performing patterns yet. Add patterns from your historical data with metrics
                                        </p>
                                    ) : (
                                        highPerformingPatterns.map((pattern, index) => (
                                            <div
                                                key={index}
                                                className="p-4 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-lg"
                                            >
                                                <div className="flex items-start justify-between mb-2">
                                                    <div className="flex-1">
                                                        <h3 className="font-semibold text-gray-900 mb-1">
                                                            {pattern.pattern}
                                                        </h3>
                                                        <p className="text-sm text-gray-600 mb-2">
                                                            Example: <span className="italic">{pattern.example_title}</span>
                                                        </p>
                                                        <div className="flex gap-4 text-xs text-gray-600">
                                                            {pattern.avg_ctr && (
                                                                <span className="flex items-center gap-1">
                                                                    <TrendingUp className="w-3 h-3 text-green-600" />
                                                                    CTR: {pattern.avg_ctr}%
                                                                </span>
                                                            )}
                                                            {pattern.avg_engagement && (
                                                                <span className="flex items-center gap-1">
                                                                    <BarChart3 className="w-3 h-3 text-blue-600" />
                                                                    Engagement: {pattern.avg_engagement}%
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => removeHighPerformingPattern(index)}
                                                        className="text-gray-400 hover:text-red-600"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </Card>

                        {/* Preview Section */}
                        <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-indigo-200">
                            <div className="mb-4">
                                <h2 className="text-xl font-semibold text-gray-900 mb-1 flex items-center gap-2">
                                    <Check className="w-5 h-5 text-indigo-600" />
                                    Title Guidelines Summary
                                </h2>
                                <p className="text-sm text-gray-600">
                                    Active title guidelines for AI content generation
                                </p>
                            </div>

                            <div className="space-y-3 text-sm">
                                <div className="flex items-start gap-2">
                                    <Type className="w-4 h-4 text-indigo-600 mt-0.5" />
                                    <div>
                                        <span className="font-medium text-gray-900">Preferred Formats:</span>
                                        <span className="text-gray-700 ml-2">
                                            {preferredFormats.length > 0 ? `${preferredFormats.length} format(s)` : 'None configured'}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-start gap-2">
                                    <Sparkles className="w-4 h-4 text-indigo-600 mt-0.5" />
                                    <div>
                                        <span className="font-medium text-gray-900">Power Words:</span>
                                        <span className="text-gray-700 ml-2">
                                            {powerWords.length > 0 ? powerWords.slice(0, 5).join(', ') + (powerWords.length > 5 ? '...' : '') : 'None configured'}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-start gap-2">
                                    <Ban className="w-4 h-4 text-indigo-600 mt-0.5" />
                                    <div>
                                        <span className="font-medium text-gray-900">Words to Avoid:</span>
                                        <span className="text-gray-700 ml-2">
                                            {wordsToAvoid.length > 0 ? `${wordsToAvoid.length} word(s) blocked` : 'None configured'}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-start gap-2">
                                    <Trophy className="w-4 h-4 text-indigo-600 mt-0.5" />
                                    <div>
                                        <span className="font-medium text-gray-900">High-Performing Patterns:</span>
                                        <span className="text-gray-700 ml-2">
                                            {highPerformingPatterns.length > 0 ? `${highPerformingPatterns.length} pattern(s) with metrics` : 'None configured'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 p-3 bg-white/50 rounded-lg border border-indigo-200">
                                <p className="text-xs text-gray-600">
                                    💡 These guidelines will be used by AI agents when generating blog post titles.
                                    Configure formats and power words to match your brand voice and improve engagement.
                                </p>
                            </div>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    )
}
