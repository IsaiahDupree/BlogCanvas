'use client'

import { useState } from 'react'
import { Upload, FileText, Globe, CheckCircle, Sparkles, Settings, Table, HelpCircle, BarChart } from 'lucide-react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function BrandGuidePage() {
    const [uploadedDoc, setUploadedDoc] = useState(false)
    const [scrapedSite, setScrapedSite] = useState(false)

    // Mock data
    const brandGuide = {
        brandName: 'EverReach CRM',
        tagline: 'Never Let a Relationship Go Cold',
        voiceTraits: ['Direct', 'Confident', 'Helpful', 'Benefit-driven'],
        productsServices: [
            {
                name: 'AI CRM Platform',
                description: 'AI-powered relationship management',
                features: ['Smart reminders', 'Relationship scoring', 'Auto-follow-ups'],
                targetAudience: 'Sales professionals and founders'
            },
            {
                name: 'Mobile App',
                description: 'CRM on the go',
                features: ['Offline mode', 'Push notifications', 'Quick actions'],
                targetAudience: 'Busy professionals'
            }
        ],
        faqs: [
            { question: 'How does AI scoring work?', answer: 'We analyze communication patterns...', category: 'Features' },
            { question: 'What integrations do you support?', answer: 'Gmail, Outlook, Slack...', category: 'Integrations' }
        ],
        comparisonTables: [
            { id: '1', title: 'EverReach vs Traditional CRM', rows: 5 },
            { id: '2', title: 'Pricing Comparison', rows: 3 }
        ]
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-indigo-50 to-purple-50 p-6">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <Link href="/" className="text-sm text-muted-foreground hover:text-gray-900 mb-2 inline-block">
                        ← Back to Dashboard
                    </Link>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
                        Brand Messaging Guide
                    </h1>
                    <p className="text-muted-foreground">
                        Upload documents or scrape your website to extract brand messaging, products, and FAQs
                    </p>
                </div>

                {/* Upload Options */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <Card className="p-8 bg-white shadow-xl hover:shadow-2xl transition-shadow group">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <Upload className="w-8 h-8 text-indigo-600" />
                            </div>
                            <h3 className="text-xl font-bold mb-2">Upload Brand Guide</h3>
                            <p className="text-sm text-muted-foreground mb-6">
                                Upload a Word doc, PDF, or text file with your brand messaging
                            </p>
                            <label className="w-full cursor-pointer">
                                <input
                                    type="file"
                                    className="hidden"
                                    accept=".doc,.docx,.pdf,.txt"
                                    onChange={() => setUploadedDoc(true)}
                                />
                                <div className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-medium hover:opacity-90 transition-opacity text-center">
                                    Choose File
                                </div>
                            </label>
                            {uploadedDoc && (
                                <div className="mt-4 flex items-center gap-2 text-green-600">
                                    <CheckCircle className="w-5 h-5" />
                                    <span className="text-sm font-medium">Brand guide uploaded & analyzed!</span>
                                </div>
                            )}
                        </div>
                    </Card>

                    <Card className="p-8 bg-white shadow-xl hover:shadow-2xl transition-shadow group">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <Globe className="w-8 h-8 text-purple-600" />
                            </div>
                            <h3 className="text-xl font-bold mb-2">Scrape Website</h3>
                            <p className="text-sm text-muted-foreground mb-6">
                                Automatically extract brand messaging from your website
                            </p>
                            <input
                                type="url"
                                placeholder="https://yourwebsite.com"
                                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg mb-3 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none"
                            />
                            <button
                                onClick={() => setScrapedSite(true)}
                                className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
                            >
                                Analyze Website
                            </button>
                            {scrapedSite && (
                                <div className="mt-4 flex items-center gap-2 text-green-600">
                                    <CheckCircle className="w-5 h-5" />
                                    <span className="text-sm font-medium">Website analyzed successfully!</span>
                                </div>
                            )}
                        </div>
                    </Card>
                </div>

                {(uploadedDoc || scrapedSite) && (
                    <>
                        {/* Brand Overview */}
                        <Card className="p-6 bg-white shadow-xl mb-8">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold">Brand Overview</h2>
                                <button className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg text-sm font-medium hover:bg-indigo-200 transition-colors flex items-center gap-2">
                                    <Settings className="w-4 h-4" />
                                    Edit Guide
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h3 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
                                        {brandGuide.brandName}
                                    </h3>
                                    <p className="text-lg text-muted-foreground mb-4">{brandGuide.tagline}</p>

                                    <div>
                                        <h4 className="font-semibold mb-2">Voice Traits</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {brandGuide.voiceTraits.map((trait, i) => (
                                                <Badge key={i} className="bg-indigo-100 text-indigo-700 border-indigo-200 px-3 py-1">
                                                    {trait}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    <div className="p-4 bg-indigo-50 rounded-lg text-center">
                                        <FileText className="w-8 h-8 text-indigo-600 mx-auto mb-2" />
                                        <p className="text-2xl font-bold text-indigo-900">{brandGuide.productsServices.length}</p>
                                        <p className="text-xs text-muted-foreground">Products</p>
                                    </div>
                                    <div className="p-4 bg-purple-50 rounded-lg text-center">
                                        <HelpCircle className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                                        <p className="text-2xl font-bold text-purple-900">{brandGuide.faqs.length}</p>
                                        <p className="text-xs text-muted-foreground">FAQs</p>
                                    </div>
                                    <div className="p-4 bg-pink-50 rounded-lg text-center">
                                        <Table className="w-8 h-8 text-pink-600 mx-auto mb-2" />
                                        <p className="text-2xl font-bold text-pink-900">{brandGuide.comparisonTables.length}</p>
                                        <p className="text-xs text-muted-foreground">Tables</p>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* Products & Services */}
                        <Card className="p-6 bg-white shadow-xl mb-8">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold flex items-center gap-2">
                                    <BarChart className="w-6 h-6 text-indigo-600" />
                                    Products & Services
                                </h2>
                                <button className="px-4 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200 transition-colors flex items-center gap-2">
                                    <Sparkles className="w-4 h-4" />
                                    Generate FAQs
                                </button>
                            </div>

                            <div className="space-y-4">
                                {brandGuide.productsServices.map((product, i) => (
                                    <div key={i} className="p-4 border-2 border-gray-100 rounded-lg hover:border-indigo-200 transition-colors">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <h3 className="text-lg font-bold text-gray-900">{product.name}</h3>
                                                <p className="text-sm text-muted-foreground mt-1">{product.description}</p>
                                                <div className="mt-3 flex flex-wrap gap-2">
                                                    {product.features.map((feature, j) => (
                                                        <Badge key={j} variant="outline" className="text-xs">
                                                            ✓ {feature}
                                                        </Badge>
                                                    ))}
                                                </div>
                                                <p className="text-xs text-purple-600 mt-2">Target: {product.targetAudience}</p>
                                            </div>
                                            <button className="ml-4 px-3 py-1 bg-indigo-100 text-indigo-700 rounded text-sm font-medium hover:bg-indigo-200">
                                                Use in Blog
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>

                        {/* FAQ Library */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <Card className="p-6 bg-white shadow-xl">
                                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                                    <HelpCircle className="w-6 h-6 text-purple-600" />
                                    FAQ Library
                                </h2>
                                <div className="space-y-3">
                                    {brandGuide.faqs.map((faq, i) => (
                                        <div key={i} className="p-3 border border-gray-200 rounded-lg hover:border-purple-300 transition-colors group">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <Badge variant="outline" className="text-xs mb-2">{faq.category}</Badge>
                                                    <p className="font-semibold text-sm text-gray-900">{faq.question}</p>
                                                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{faq.answer}</p>
                                                </div>
                                                <input type="checkbox" className="mt-1" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </Card>

                            <Card className="p-6 bg-white shadow-xl">
                                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                                    <Table className="w-6 h-6 text-pink-600" />
                                    Comparison Tables
                                </h2>
                                <div className="space-y-3">
                                    {brandGuide.comparisonTables.map((table, i) => (
                                        <div key={i} className="p-4 border border-gray-200 rounded-lg hover:border-pink-300 transition-colors group">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h3 className="font-semibold text-sm text-gray-900">{table.title}</h3>
                                                    <p className="text-xs text-muted-foreground mt-1">{table.rows} rows</p>
                                                </div>
                                                <input type="checkbox" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}
