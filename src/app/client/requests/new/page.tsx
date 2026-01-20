'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Send, FileText, Calendar, Target, Sparkles, Upload, X } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

export default function NewContentRequestPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [attachments, setAttachments] = useState<File[]>([])
  const [requestData, setRequestData] = useState({
    contentType: 'blog_post',
    title: '',
    description: '',
    keywords: '',
    targetAudience: '',
    deadline: '',
    priority: 'normal',
    wordCount: '1000',
    tone: 'professional',
    additionalNotes: ''
  })

  const handleChange = (field: string, value: string) => {
    setRequestData((prev) => ({
      ...prev,
      [field]: value
    }))
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
      setAttachments((prev) => [...prev, ...newFiles])
    }
  }

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setIsSubmitting(false)
    // Redirect to dashboard or show success message
  }

  const contentTypes = [
    { value: 'blog_post', label: 'Blog Post', icon: FileText },
    { value: 'article', label: 'Article', icon: FileText },
    { value: 'case_study', label: 'Case Study', icon: Target },
    { value: 'white_paper', label: 'White Paper', icon: FileText },
    { value: 'social_media', label: 'Social Media', icon: Sparkles },
    { value: 'email', label: 'Email Copy', icon: Sparkles }
  ]

  const priorities = [
    { value: 'low', label: 'Low', color: 'text-gray-600' },
    { value: 'normal', label: 'Normal', color: 'text-blue-600' },
    { value: 'high', label: 'High', color: 'text-orange-600' },
    { value: 'urgent', label: 'Urgent', color: 'text-red-600' }
  ]

  const tones = [
    'Professional',
    'Casual',
    'Friendly',
    'Authoritative',
    'Educational',
    'Conversational'
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="flex items-center gap-4">
            <Link
              href="/client/dashboard"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">New Content Request</h1>
              <p className="text-muted-foreground mt-1">Submit a new content request to your vendor</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Content Type Selection */}
        <Card className="p-6 bg-white shadow-xl mb-6">
          <h2 className="text-xl font-bold mb-4">Content Type</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {contentTypes.map((type) => {
              const Icon = type.icon
              const isSelected = requestData.contentType === type.value
              return (
                <button
                  key={type.value}
                  onClick={() => handleChange('contentType', type.value)}
                  className={`p-4 border-2 rounded-lg transition-all ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-indigo-300'
                  }`}
                >
                  <Icon className={`w-6 h-6 mx-auto mb-2 ${isSelected ? 'text-indigo-600' : 'text-gray-600'}`} />
                  <p className={`text-sm font-medium ${isSelected ? 'text-indigo-700' : 'text-gray-700'}`}>
                    {type.label}
                  </p>
                </button>
              )
            })}
          </div>
        </Card>

        {/* Basic Information */}
        <Card className="p-6 bg-white shadow-xl mb-6">
          <h2 className="text-xl font-bold mb-4">Basic Information</h2>
          <div className="space-y-6">
            <div>
              <Label htmlFor="title">Content Title *</Label>
              <Input
                id="title"
                value={requestData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder="e.g., 10 Ways to Improve Your Sales Process"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={requestData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Provide a detailed description of what you want this content to cover..."
                rows={5}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="keywords">Target Keywords</Label>
              <Input
                id="keywords"
                value={requestData.keywords}
                onChange={(e) => handleChange('keywords', e.target.value)}
                placeholder="Separate keywords with commas (e.g., sales automation, CRM, lead generation)"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="targetAudience">Target Audience</Label>
              <Input
                id="targetAudience"
                value={requestData.targetAudience}
                onChange={(e) => handleChange('targetAudience', e.target.value)}
                placeholder="e.g., Small business owners, SaaS founders, Marketing managers"
                className="mt-1"
              />
            </div>
          </div>
        </Card>

        {/* Content Requirements */}
        <Card className="p-6 bg-white shadow-xl mb-6">
          <h2 className="text-xl font-bold mb-4">Content Requirements</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="wordCount">Word Count</Label>
              <select
                id="wordCount"
                value={requestData.wordCount}
                onChange={(e) => handleChange('wordCount', e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="500">500 words</option>
                <option value="1000">1,000 words</option>
                <option value="1500">1,500 words</option>
                <option value="2000">2,000 words</option>
                <option value="2500">2,500 words+</option>
              </select>
            </div>
            <div>
              <Label htmlFor="tone">Content Tone</Label>
              <select
                id="tone"
                value={requestData.tone}
                onChange={(e) => handleChange('tone', e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {tones.map((tone) => (
                  <option key={tone} value={tone.toLowerCase()}>
                    {tone}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="deadline" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Deadline (Optional)
              </Label>
              <Input
                id="deadline"
                type="date"
                value={requestData.deadline}
                onChange={(e) => handleChange('deadline', e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="priority">Priority</Label>
              <select
                id="priority"
                value={requestData.priority}
                onChange={(e) => handleChange('priority', e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {priorities.map((priority) => (
                  <option key={priority.value} value={priority.value}>
                    {priority.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        {/* Additional Details */}
        <Card className="p-6 bg-white shadow-xl mb-6">
          <h2 className="text-xl font-bold mb-4">Additional Details</h2>
          <div>
            <Label htmlFor="additionalNotes">Additional Notes</Label>
            <Textarea
              id="additionalNotes"
              value={requestData.additionalNotes}
              onChange={(e) => handleChange('additionalNotes', e.target.value)}
              placeholder="Any additional information, references, or specific requirements..."
              rows={4}
              className="mt-1"
            />
          </div>
        </Card>

        {/* Attachments */}
        <Card className="p-6 bg-white shadow-xl mb-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Upload className="w-5 h-5 text-indigo-600" />
            Attachments
          </h2>
          <div className="space-y-4">
            <div>
              <input
                type="file"
                id="file-upload"
                multiple
                onChange={handleFileUpload}
                className="hidden"
              />
              <label
                htmlFor="file-upload"
                className="block p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-400 transition-colors cursor-pointer text-center"
              >
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">
                  Click to upload files or drag and drop
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  PDF, DOC, Images (Max 10MB each)
                </p>
              </label>
            </div>
            {attachments.length > 0 && (
              <div className="space-y-2">
                {attachments.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-gray-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeAttachment(index)}
                      className="p-1 hover:bg-gray-200 rounded transition-colors"
                    >
                      <X className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* Submit Button */}
        <div className="flex items-center justify-between">
          <Link
            href="/client/dashboard"
            className="text-muted-foreground hover:text-gray-900 transition-colors"
          >
            Cancel
          </Link>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !requestData.title || !requestData.description}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-8"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Submitting...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Submit Request
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
