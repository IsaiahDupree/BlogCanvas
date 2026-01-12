'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Check, ArrowRight, Loader2, Building, Globe, Users, FileText } from 'lucide-react'
import { Card } from '@/components/ui/card'

interface OnboardingStep {
    id: string
    title: string
    description: string
    completed: boolean
    required: boolean
}

export default function ClientOnboardingPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [currentStep, setCurrentStep] = useState(0)
    const [clientData, setClientData] = useState<any>(null)

    const [formData, setFormData] = useState({
        // Company details
        industry: '',
        company_size: '',
        target_audience: '',

        // Brand voice
        brand_voice: '',
        tone_preferences: [] as string[],

        // Content goals
        primary_goals: [] as string[],
        content_topics: '',

        // Additional info
        competitors: '',
        key_differentiators: '',
    })

    const [steps, setSteps] = useState<OnboardingStep[]>([
        {
            id: 'company_info',
            title: 'Company Information',
            description: 'Tell us about your business',
            completed: false,
            required: true
        },
        {
            id: 'brand_voice',
            title: 'Brand Voice & Tone',
            description: 'Define your communication style',
            completed: false,
            required: true
        },
        {
            id: 'content_goals',
            title: 'Content Goals',
            description: 'What do you want to achieve?',
            completed: false,
            required: true
        },
        {
            id: 'final_details',
            title: 'Final Details',
            description: 'Competitors and differentiators',
            completed: false,
            required: false
        }
    ])

    useEffect(() => {
        // Check if client has completed onboarding
        checkOnboardingStatus()
    }, [])

    const checkOnboardingStatus = async () => {
        try {
            const response = await fetch('/api/portal/client-profile')
            const data = await response.json()

            if (data.success && data.client) {
                setClientData(data.client)

                // If already onboarded, redirect to dashboard
                if (data.client.status === 'active') {
                    router.push('/portal/dashboard')
                }
            }
        } catch (error) {
            console.error('Failed to check onboarding status:', error)
        }
    }

    const handleNext = () => {
        // Mark current step as completed
        const updatedSteps = [...steps]
        updatedSteps[currentStep].completed = true
        setSteps(updatedSteps)

        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1)
        } else {
            // Final step - complete onboarding
            completeOnboarding()
        }
    }

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1)
        }
    }

    const handleSkip = () => {
        if (!steps[currentStep].required) {
            handleNext()
        }
    }

    const completeOnboarding = async () => {
        setLoading(true)

        try {
            const response = await fetch('/api/portal/complete-onboarding', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })

            const data = await response.json()

            if (!response.ok || !data.success) {
                throw new Error(data.error || 'Failed to complete onboarding')
            }

            // Success - redirect to dashboard
            router.push('/portal/dashboard')
        } catch (error: any) {
            console.error('Onboarding error:', error)
            alert(error.message || 'Failed to complete onboarding. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    const toneOptions = [
        'Professional', 'Friendly', 'Casual', 'Technical',
        'Educational', 'Conversational', 'Authoritative', 'Humorous'
    ]

    const goalOptions = [
        'Increase Brand Awareness',
        'Generate Leads',
        'Educate Customers',
        'Drive Website Traffic',
        'Improve SEO Rankings',
        'Build Thought Leadership',
        'Support Customer Success',
        'Announce Product Updates'
    ]

    const industryOptions = [
        'Technology', 'Healthcare', 'Finance', 'E-commerce',
        'Manufacturing', 'Education', 'Real Estate', 'Professional Services',
        'Retail', 'Other'
    ]

    const companySizeOptions = [
        '1-10 employees',
        '11-50 employees',
        '51-200 employees',
        '201-500 employees',
        '500+ employees'
    ]

    const renderStepContent = () => {
        switch (steps[currentStep].id) {
            case 'company_info':
                return (
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Industry *
                            </label>
                            <select
                                value={formData.industry}
                                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                                required
                            >
                                <option value="">Select your industry</option>
                                {industryOptions.map(option => (
                                    <option key={option} value={option}>{option}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Company Size *
                            </label>
                            <select
                                value={formData.company_size}
                                onChange={(e) => setFormData({ ...formData, company_size: e.target.value })}
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                                required
                            >
                                <option value="">Select company size</option>
                                {companySizeOptions.map(option => (
                                    <option key={option} value={option}>{option}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Target Audience *
                            </label>
                            <textarea
                                value={formData.target_audience}
                                onChange={(e) => setFormData({ ...formData, target_audience: e.target.value })}
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                                rows={4}
                                placeholder="Describe your ideal customers and target audience..."
                                required
                            />
                        </div>
                    </div>
                )

            case 'brand_voice':
                return (
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Brand Voice Description *
                            </label>
                            <textarea
                                value={formData.brand_voice}
                                onChange={(e) => setFormData({ ...formData, brand_voice: e.target.value })}
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                                rows={4}
                                placeholder="How would you describe your brand's personality and communication style?"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-3">
                                Tone Preferences (Select all that apply)
                            </label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {toneOptions.map(tone => (
                                    <button
                                        key={tone}
                                        type="button"
                                        onClick={() => {
                                            const newTones = formData.tone_preferences.includes(tone)
                                                ? formData.tone_preferences.filter(t => t !== tone)
                                                : [...formData.tone_preferences, tone]
                                            setFormData({ ...formData, tone_preferences: newTones })
                                        }}
                                        className={`px-4 py-2 rounded-lg border-2 font-medium transition-all ${formData.tone_preferences.includes(tone)
                                                ? 'bg-indigo-600 text-white border-indigo-600'
                                                : 'bg-white text-gray-700 border-gray-200 hover:border-indigo-300'
                                            }`}
                                    >
                                        {tone}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )

            case 'content_goals':
                return (
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-3">
                                Primary Content Goals (Select all that apply) *
                            </label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {goalOptions.map(goal => (
                                    <button
                                        key={goal}
                                        type="button"
                                        onClick={() => {
                                            const newGoals = formData.primary_goals.includes(goal)
                                                ? formData.primary_goals.filter(g => g !== goal)
                                                : [...formData.primary_goals, goal]
                                            setFormData({ ...formData, primary_goals: newGoals })
                                        }}
                                        className={`px-4 py-3 rounded-lg border-2 font-medium transition-all text-left ${formData.primary_goals.includes(goal)
                                                ? 'bg-indigo-600 text-white border-indigo-600'
                                                : 'bg-white text-gray-700 border-gray-200 hover:border-indigo-300'
                                            }`}
                                    >
                                        {goal}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Content Topics & Themes
                            </label>
                            <textarea
                                value={formData.content_topics}
                                onChange={(e) => setFormData({ ...formData, content_topics: e.target.value })}
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                                rows={4}
                                placeholder="What topics and themes should we focus on in your content?"
                            />
                        </div>
                    </div>
                )

            case 'final_details':
                return (
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Main Competitors (Optional)
                            </label>
                            <textarea
                                value={formData.competitors}
                                onChange={(e) => setFormData({ ...formData, competitors: e.target.value })}
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                                rows={3}
                                placeholder="List your main competitors (comma-separated or one per line)"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Key Differentiators (Optional)
                            </label>
                            <textarea
                                value={formData.key_differentiators}
                                onChange={(e) => setFormData({ ...formData, key_differentiators: e.target.value })}
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                                rows={4}
                                placeholder="What makes your company unique? What sets you apart from competitors?"
                            />
                        </div>
                    </div>
                )

            default:
                return null
        }
    }

    const canProceed = () => {
        switch (steps[currentStep].id) {
            case 'company_info':
                return formData.industry && formData.company_size && formData.target_audience
            case 'brand_voice':
                return formData.brand_voice
            case 'content_goals':
                return formData.primary_goals.length > 0
            case 'final_details':
                return true // Optional step
            default:
                return false
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
            {/* Header */}
            <div className="bg-white border-b shadow-sm">
                <div className="max-w-4xl mx-auto px-6 py-6">
                    <h1 className="text-3xl font-bold text-gray-900">Complete Your Profile</h1>
                    <p className="text-muted-foreground mt-1">Help us understand your business better</p>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-6 py-8">
                {/* Progress Steps */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        {steps.map((step, index) => (
                            <div key={step.id} className="flex items-center flex-1">
                                <div className="flex flex-col items-center flex-1">
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-all ${index === currentStep
                                            ? 'bg-indigo-600 text-white scale-110 shadow-lg'
                                            : step.completed
                                                ? 'bg-green-500 text-white'
                                                : 'bg-gray-200 text-gray-500'
                                        }`}>
                                        {step.completed ? (
                                            <Check className="w-6 h-6" />
                                        ) : (
                                            <span className="font-bold">{index + 1}</span>
                                        )}
                                    </div>
                                    <div className="text-center">
                                        <p className={`text-sm font-medium ${index === currentStep ? 'text-indigo-600' : 'text-gray-600'
                                            }`}>
                                            {step.title}
                                        </p>
                                    </div>
                                </div>
                                {index < steps.length - 1 && (
                                    <div className={`h-1 flex-1 mx-4 rounded ${index < currentStep ? 'bg-green-500' : 'bg-gray-200'
                                        }`} />
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Step Content */}
                <Card className="p-8 bg-white shadow-lg">
                    <div className="mb-6">
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                            {steps[currentStep].title}
                        </h2>
                        <p className="text-muted-foreground">
                            {steps[currentStep].description}
                        </p>
                    </div>

                    {renderStepContent()}

                    {/* Navigation Buttons */}
                    <div className="flex gap-4 pt-8 mt-8 border-t">
                        {currentStep > 0 && (
                            <button
                                onClick={handleBack}
                                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
                            >
                                Back
                            </button>
                        )}

                        {!steps[currentStep].required && (
                            <button
                                onClick={handleSkip}
                                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
                            >
                                Skip
                            </button>
                        )}

                        <button
                            onClick={handleNext}
                            disabled={!canProceed() || loading}
                            className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-lg flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Processing...
                                </>
                            ) : currentStep === steps.length - 1 ? (
                                <>
                                    Complete Onboarding
                                    <Check className="w-5 h-5" />
                                </>
                            ) : (
                                <>
                                    Continue
                                    <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    </div>
                </Card>
            </div>
        </div>
    )
}
