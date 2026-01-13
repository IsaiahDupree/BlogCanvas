'use client'

/**
 * Image Generation Dialog Component
 * Modal for generating AI images for blog posts
 * feat-039: AI image generation for posts
 */

import { useState, useEffect } from 'react'
import { Loader2, Sparkles, RefreshCw, Check, X, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'

interface GeneratedImage {
  id: string
  url: string
  prompt: string
  revised_prompt?: string
  is_selected: boolean
  is_featured: boolean
  quality: string
  style: string
  created_at: string
}

interface ImageGenerationDialogProps {
  postId: string
  postTitle: string
  isOpen: boolean
  onClose: () => void
  onImagesGenerated?: () => void
}

export default function ImageGenerationDialog({
  postId,
  postTitle,
  isOpen,
  onClose,
  onImagesGenerated,
}: ImageGenerationDialogProps) {
  const [generating, setGenerating] = useState(false)
  const [loading, setLoading] = useState(false)
  const [customPrompt, setCustomPrompt] = useState('')
  const [images, setImages] = useState<GeneratedImage[]>([])
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null)

  // Fetch existing images when dialog opens
  useEffect(() => {
    if (isOpen) {
      fetchExistingImages()
    }
  }, [isOpen, postId])

  const fetchExistingImages = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/posts/${postId}/generate-images`)
      const data = await response.json()

      if (data.success) {
        setImages(data.images || [])
        // Find the selected image
        const selected = data.images?.find((img: GeneratedImage) => img.is_selected)
        if (selected) {
          setSelectedImageId(selected.id)
        }
      }
    } catch (error) {
      console.error('Failed to fetch images:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateImages = async () => {
    setGenerating(true)
    try {
      const response = await fetch(`/api/posts/${postId}/generate-images`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: customPrompt || undefined,
          count: 3,
          position: 'header',
        }),
      })

      const data = await response.json()

      if (data.success) {
        // Refresh the images list
        await fetchExistingImages()
        setCustomPrompt('') // Clear custom prompt
        onImagesGenerated?.()
      } else {
        alert(`Failed to generate images: ${data.error}`)
      }
    } catch (error) {
      console.error('Failed to generate images:', error)
      alert('Failed to generate images. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  const handleSelectImage = async (imageId: string) => {
    try {
      // Update the selected image
      const response = await fetch(`/api/posts/${postId}/images/${imageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          is_selected: true,
          is_featured: true,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setSelectedImageId(imageId)
        // Refresh to update selection state
        await fetchExistingImages()
      }
    } catch (error) {
      console.error('Failed to select image:', error)
    }
  }

  const handleDeleteImage = async (imageId: string) => {
    if (!confirm('Are you sure you want to delete this image?')) {
      return
    }

    try {
      const response = await fetch(`/api/posts/${postId}/images/${imageId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.success) {
        // Refresh the images list
        await fetchExistingImages()
      }
    } catch (error) {
      console.error('Failed to delete image:', error)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            Generate AI Images
          </DialogTitle>
          <DialogDescription>
            Generate professional images for: <strong>{postTitle}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Custom Prompt Input */}
          <div className="space-y-2">
            <Label htmlFor="custom-prompt">
              Custom Prompt (Optional)
            </Label>
            <div className="flex gap-2">
              <Input
                id="custom-prompt"
                placeholder="e.g., A minimalist illustration of cloud computing..."
                value={customPrompt}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCustomPrompt(e.target.value)}
                disabled={generating}
              />
              <Button
                onClick={handleGenerateImages}
                disabled={generating}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white whitespace-nowrap"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Images
                  </>
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Leave blank to auto-generate a prompt from your post content
            </p>
          </div>

          {/* Existing Images Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : images.length > 0 ? (
            <div>
              <h3 className="font-semibold mb-3">
                Generated Images ({images.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {images.map((image) => (
                  <div
                    key={image.id}
                    className={`relative group border-2 rounded-lg overflow-hidden transition-all ${
                      image.is_selected
                        ? 'border-green-500 ring-2 ring-green-200'
                        : 'border-gray-200 hover:border-purple-400'
                    }`}
                  >
                    {/* Image */}
                    <img
                      src={image.url}
                      alt={image.prompt}
                      className="w-full h-48 object-cover"
                    />

                    {/* Overlay with actions */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      {!image.is_selected ? (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleSelectImage(image.id)}
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Select
                        </Button>
                      ) : (
                        <Badge className="bg-green-600">
                          <Check className="w-3 h-3 mr-1" />
                          Selected
                        </Badge>
                      )}
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteImage(image.id)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Badges */}
                    <div className="absolute top-2 left-2 flex gap-1">
                      {image.quality === 'hd' && (
                        <Badge className="bg-purple-600 text-xs">HD</Badge>
                      )}
                      <Badge variant="outline" className="bg-white/90 text-xs">
                        {image.style}
                      </Badge>
                    </div>

                    {/* Selected Badge */}
                    {image.is_selected && (
                      <div className="absolute top-2 right-2">
                        <Badge className="bg-green-600">
                          <Check className="w-3 h-3 mr-1" />
                          Selected
                        </Badge>
                      </div>
                    )}

                    {/* Prompt Preview */}
                    <div className="p-2 bg-gray-50">
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {image.revised_prompt || image.prompt}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
              <Sparkles className="w-12 h-12 mx-auto text-gray-400 mb-3" />
              <p className="text-muted-foreground">
                No images generated yet. Click "Generate Images" to create options.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
