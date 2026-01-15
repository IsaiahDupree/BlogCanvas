'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Sparkles, 
  FileText, 
  Target, 
  Loader2,
  CheckCircle,
  Globe
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface Client {
  id: string
  name: string
}

export default function CreateBlogPostPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [clients, setClients] = useState<Client[]>([])
  const [loadingClients, setLoadingClients] = useState(false)
  
  // Form state
  const [topic, setTopic] = useState('')
  const [targetKeyword, setTargetKeyword] = useState('')
  const [selectedClient, setSelectedClient] = useState('')
  const [contentType, setContentType] = useState<'blog' | 'guide' | 'listicle' | 'comparison'>('blog')
  const [wordCount, setWordCount] = useState(1500)
  const [searchIntent, setSearchIntent] = useState<'informational' | 'commercial' | 'transactional' | 'navigational'>('informational')
  const [toneOfVoice, setToneOfVoice] = useState('professional')
  const [dueDate, setDueDate] = useState('')

  useEffect(() => {
    const fetchClients = async () => {
      setLoadingClients(true)
      try {
        const res = await fetch('/api/clients')
        const data = await res.json()
        setClients(data.clients || [])
      } catch (e) {
        console.error('Failed to fetch clients:', e)
      } finally {
        setLoadingClients(false)
      }
    }
    fetchClients()
  }, [])

  const handleSubmit = async () => {
    if (!topic) return
    
    setLoading(true)
    try {
      const res = await fetch('/api/blog-posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          target_keyword: targetKeyword || topic,
          client_id: selectedClient || null,
          content_type: contentType,
          target_word_count: wordCount,
          search_intent: searchIntent,
          tone_of_voice: toneOfVoice,
          due_date: dueDate || null,
          status: 'planned'
        })
      })

      const data = await res.json()
      
      if (data.success && data.post?.id) {
        router.push(`/app/posts/${data.post.id}`)
      } else {
        throw new Error(data.error || 'Failed to create post')
      }
    } catch (error) {
      console.error('Failed to create post:', error)
      alert('Failed to create post. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const contentTypes = [
    { id: 'blog', label: 'Blog Post', desc: 'Standard informative article', icon: FileText },
    { id: 'guide', label: 'How-To Guide', desc: 'Step-by-step instructions', icon: Target },
    { id: 'listicle', label: 'Listicle', desc: 'List-based article (Top 10, etc.)', icon: CheckCircle },
    { id: 'comparison', label: 'Comparison', desc: 'Compare products or concepts', icon: Globe },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/app" className="text-sm text-muted-foreground hover:text-gray-900 mb-2 inline-flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Create New Blog Post
          </h1>
          <p className="text-muted-foreground">
            Let AI help you create high-quality, SEO-optimized content
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center gap-4 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= s ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                {s}
              </div>
              <span className={`text-sm ${step >= s ? 'text-gray-900' : 'text-gray-400'}`}>
                {s === 1 ? 'Topic' : s === 2 ? 'Details' : 'Generate'}
              </span>
              {s < 3 && <div className="w-12 h-0.5 bg-gray-200" />}
            </div>
          ))}
        </div>

        {/* Step 1: Topic */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-600" />
                What do you want to write about?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Topic or Title
                </label>
                <input
                  type="text"
                  placeholder="e.g., How to Choose the Best CRM for Small Business"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-600 text-lg"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Target Keyword (optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g., best CRM for small business"
                  value={targetKeyword}
                  onChange={(e) => setTargetKeyword(e.target.value)}
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-600"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  The primary keyword you want to rank for
                </p>
              </div>

              <Button
                onClick={() => setStep(2)}
                disabled={!topic}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600"
                size="lg"
              >
                Continue
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Details */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Content Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Content Type */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-3 block">
                  Content Type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {contentTypes.map((type) => {
                    const Icon = type.icon
                    return (
                      <button
                        key={type.id}
                        onClick={() => setContentType(type.id as any)}
                        className={`p-4 border-2 rounded-lg text-left transition-all ${
                          contentType === type.id
                            ? 'border-blue-600 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <Icon className={`w-5 h-5 mb-2 ${contentType === type.id ? 'text-blue-600' : 'text-gray-400'}`} />
                        <p className="font-medium">{type.label}</p>
                        <p className="text-xs text-muted-foreground">{type.desc}</p>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Word Count */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Target Word Count: {wordCount} words
                </label>
                <input
                  type="range"
                  min="500"
                  max="5000"
                  step="100"
                  value={wordCount}
                  onChange={(e) => setWordCount(Number(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>500</span>
                  <span>5000</span>
                </div>
              </div>

              {/* Search Intent */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Search Intent
                </label>
                <select
                  value={searchIntent}
                  onChange={(e) => setSearchIntent(e.target.value as any)}
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-600"
                >
                  <option value="informational">Informational (How-to, guides, education)</option>
                  <option value="commercial">Commercial (Reviews, comparisons)</option>
                  <option value="transactional">Transactional (Buy, purchase)</option>
                  <option value="navigational">Navigational (Brand/product searches)</option>
                </select>
                <p className="text-xs text-muted-foreground mt-1">
                  The primary intent behind the search query
                </p>
              </div>

              {/* Tone of Voice */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Tone of Voice
                </label>
                <select
                  value={toneOfVoice}
                  onChange={(e) => setToneOfVoice(e.target.value)}
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-600"
                >
                  <option value="professional">Professional</option>
                  <option value="casual">Casual & Conversational</option>
                  <option value="authoritative">Authoritative & Expert</option>
                  <option value="friendly">Friendly & Approachable</option>
                  <option value="technical">Technical & Detailed</option>
                </select>
              </div>

              {/* Due Date */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Due Date (optional)
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-600"
                  min={new Date().toISOString().split('T')[0]}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Target completion date for this post
                </p>
              </div>

              {/* Client */}
              {clients.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Client (optional)
                  </label>
                  <select
                    value={selectedClient}
                    onChange={(e) => setSelectedClient(e.target.value)}
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="">No client</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>{client.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                  Back
                </Button>
                <Button
                  onClick={() => setStep(3)}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600"
                >
                  Continue
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Review & Generate */}
        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Ready to Generate</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Topic</span>
                  <span className="text-sm font-medium">{topic}</span>
                </div>
                {targetKeyword && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Target Keyword</span>
                    <span className="text-sm font-medium">{targetKeyword}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Content Type</span>
                  <Badge variant="secondary" className="capitalize">{contentType}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Search Intent</span>
                  <Badge variant="secondary" className="capitalize">{searchIntent}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Tone of Voice</span>
                  <span className="text-sm font-medium capitalize">{toneOfVoice}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Word Count</span>
                  <span className="text-sm font-medium">{wordCount} words</span>
                </div>
                {dueDate && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Due Date</span>
                    <span className="text-sm font-medium">{new Date(dueDate).toLocaleDateString()}</span>
                  </div>
                )}
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>What happens next:</strong> We&apos;ll create your post and you can then generate AI content with our research, outline, and draft agents.
                </p>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                  Back
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Create Post
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
