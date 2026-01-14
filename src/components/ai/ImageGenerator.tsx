'use client'

import { useState } from 'react'
import { 
  Image as ImageIcon, 
  Wand2, 
  Loader2, 
  Download, 
  Copy, 
  Check,
  AlertTriangle,
  Sparkles
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface GeneratedImage {
  type: 'hero' | 'social' | 'inline'
  prompt: string
  url?: string
  stockKeywords?: string[]
}

interface ImageGeneratorProps {
  blogPostId?: string
  topic?: string
  content?: string
  onImageGenerated?: (images: GeneratedImage[]) => void
}

export function ImageGenerator({ blogPostId, topic, content, onImageGenerated }: ImageGeneratorProps) {
  const [inputTopic, setInputTopic] = useState(topic || '')
  const [inputContent, setInputContent] = useState(content || '')
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [images, setImages] = useState<GeneratedImage[]>([])
  const [error, setError] = useState<string | null>(null)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  const generatePrompts = async () => {
    if (!inputTopic) {
      setError('Please enter a topic')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/ai/images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'prompts',
          topic: inputTopic,
          content: inputContent,
          blogPostId
        })
      })

      const data = await res.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to generate prompts')
      }

      const generatedImages: GeneratedImage[] = [
        {
          type: 'hero',
          prompt: data.prompts.hero?.prompt || '',
          stockKeywords: data.prompts.hero?.stockKeywords || []
        },
        {
          type: 'social',
          prompt: data.prompts.social?.prompt || '',
          stockKeywords: data.prompts.social?.stockKeywords || []
        },
        ...(data.prompts.inline || []).map((p: any) => ({
          type: 'inline' as const,
          prompt: p.prompt,
          stockKeywords: p.stockKeywords || []
        }))
      ]

      setImages(generatedImages)
      onImageGenerated?.(generatedImages)

    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const generateWithDallE = async (prompt: string, index: number) => {
    setGenerating(true)

    try {
      const res = await fetch('/api/ai/images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate',
          prompt,
          size: '1024x1024'
        })
      })

      const data = await res.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to generate image')
      }

      const updatedImages = [...images]
      updatedImages[index] = {
        ...updatedImages[index],
        url: data.imageUrl
      }
      setImages(updatedImages)

    } catch (err: any) {
      setError(err.message)
    } finally {
      setGenerating(false)
    }
  }

  const copyPrompt = (prompt: string, index: number) => {
    navigator.clipboard.writeText(prompt)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  return (
    <div className="space-y-6">
      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            AI Image Generator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Topic / Title</label>
            <input
              type="text"
              placeholder="Enter blog topic or title"
              value={inputTopic}
              onChange={(e) => setInputTopic(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-600"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Content (optional)</label>
            <textarea
              placeholder="Paste blog content for more relevant images..."
              value={inputContent}
              onChange={(e) => setInputContent(e.target.value)}
              rows={4}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-600"
            />
          </div>

          <Button
            onClick={generatePrompts}
            disabled={loading || !inputTopic}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating Prompts...
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4 mr-2" />
                Generate Image Prompts
              </>
            )}
          </Button>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
              <AlertTriangle className="w-5 h-5" />
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Generated Images */}
      {images.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {images.map((image, index) => (
            <Card key={index} className="overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center justify-between">
                  <span className="capitalize">{image.type} Image</span>
                  <Badge variant="outline" className="capitalize">{image.type}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Image Preview */}
                {image.url ? (
                  <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                    <img 
                      src={image.url} 
                      alt={`Generated ${image.type} image`}
                      className="w-full h-full object-cover"
                    />
                    <a 
                      href={image.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="absolute bottom-2 right-2"
                    >
                      <Button size="sm" variant="secondary">
                        <Download className="w-4 h-4 mr-1" /> Download
                      </Button>
                    </a>
                  </div>
                ) : (
                  <div className="aspect-square rounded-lg bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                    <ImageIcon className="w-16 h-16 text-purple-300" />
                  </div>
                )}

                {/* Prompt */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Prompt</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyPrompt(image.prompt, index)}
                    >
                      {copiedIndex === index ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg line-clamp-4">
                    {image.prompt}
                  </p>
                </div>

                {/* Stock Keywords */}
                {image.stockKeywords && image.stockKeywords.length > 0 && (
                  <div>
                    <span className="text-sm font-medium text-gray-700 mb-2 block">Stock Photo Keywords</span>
                    <div className="flex flex-wrap gap-1">
                      {image.stockKeywords.slice(0, 5).map((kw, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">{kw}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Generate Button */}
                {!image.url && (
                  <Button
                    onClick={() => generateWithDallE(image.prompt, index)}
                    disabled={generating}
                    className="w-full"
                    variant="outline"
                  >
                    {generating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-4 h-4 mr-2" />
                        Generate with DALL-E
                      </>
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
