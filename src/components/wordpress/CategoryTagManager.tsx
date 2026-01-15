'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Tag, FolderOpen, RefreshCw, Edit2, Check, X } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface CategoryTagManagerProps {
  postId: string
  connectionId?: string
  onUpdate?: () => void
}

interface Taxonomy {
  id: number
  name: string
  slug: string
}

interface Assignment {
  categories: Taxonomy[]
  tags: Taxonomy[]
  categoriesAutoAssigned: boolean
  tagsAutoAssigned: boolean
}

export default function CategoryTagManager({
  postId,
  connectionId,
  onUpdate
}: CategoryTagManagerProps) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [autoAssigning, setAutoAssigning] = useState(false)
  const [editing, setEditing] = useState(false)

  const [assignment, setAssignment] = useState<Assignment | null>(null)
  const [availableCategories, setAvailableCategories] = useState<Taxonomy[]>([])
  const [availableTags, setAvailableTags] = useState<Taxonomy[]>([])

  const [selectedCategories, setSelectedCategories] = useState<Taxonomy[]>([])
  const [selectedTags, setSelectedTags] = useState<Taxonomy[]>([])

  useEffect(() => {
    fetchCurrentAssignment()
    if (connectionId) {
      fetchAvailableTaxonomies()
    }
  }, [postId, connectionId])

  const fetchCurrentAssignment = async () => {
    try {
      const response = await fetch(`/api/blog-posts/${postId}/categories-tags`)
      const data = await response.json()

      if (data.success) {
        setAssignment({
          categories: data.categories || [],
          tags: data.tags || [],
          categoriesAutoAssigned: data.categoriesAutoAssigned || false,
          tagsAutoAssigned: data.tagsAutoAssigned || false
        })
        setSelectedCategories(data.categories || [])
        setSelectedTags(data.tags || [])
      }
    } catch (error) {
      console.error('Failed to fetch assignment:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAvailableTaxonomies = async () => {
    if (!connectionId) return

    try {
      const response = await fetch(`/api/wordpress/taxonomies?connectionId=${connectionId}`)
      const data = await response.json()

      if (data.success) {
        setAvailableCategories(data.categories || [])
        setAvailableTags(data.tags || [])
      }
    } catch (error) {
      console.error('Failed to fetch taxonomies:', error)
    }
  }

  const handleAutoAssign = async () => {
    if (!connectionId) {
      alert('WordPress connection required for auto-assignment')
      return
    }

    setAutoAssigning(true)
    try {
      const response = await fetch(`/api/blog-posts/${postId}/categories-tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'auto',
          connectionId
        })
      })

      const data = await response.json()

      if (data.success) {
        setAssignment({
          categories: data.categories,
          tags: data.tags,
          categoriesAutoAssigned: data.categoriesAutoAssigned,
          tagsAutoAssigned: data.tagsAutoAssigned
        })
        setSelectedCategories(data.categories)
        setSelectedTags(data.tags)
        onUpdate?.()
      } else {
        alert(`Failed to auto-assign: ${data.error}`)
      }
    } catch (error) {
      console.error('Auto-assign failed:', error)
      alert('Failed to auto-assign categories and tags')
    } finally {
      setAutoAssigning(false)
    }
  }

  const handleSaveManual = async () => {
    setSaving(true)
    try {
      const response = await fetch(`/api/blog-posts/${postId}/categories-tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'manual',
          categories: selectedCategories,
          tags: selectedTags
        })
      })

      const data = await response.json()

      if (data.success) {
        setAssignment({
          categories: selectedCategories,
          tags: selectedTags,
          categoriesAutoAssigned: false,
          tagsAutoAssigned: false
        })
        setEditing(false)
        onUpdate?.()
      } else {
        alert(`Failed to save: ${data.error}`)
      }
    } catch (error) {
      console.error('Save failed:', error)
      alert('Failed to save categories and tags')
    } finally {
      setSaving(false)
    }
  }

  const toggleCategory = (category: Taxonomy) => {
    setSelectedCategories(prev => {
      const exists = prev.find(c => c.id === category.id)
      if (exists) {
        return prev.filter(c => c.id !== category.id)
      } else {
        return [...prev, category]
      }
    })
  }

  const toggleTag = (tag: Taxonomy) => {
    setSelectedTags(prev => {
      const exists = prev.find(t => t.id === tag.id)
      if (exists) {
        return prev.filter(t => t.id !== tag.id)
      } else {
        return [...prev, tag]
      }
    })
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Categories & Tags
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Categories & Tags
          </CardTitle>
          <div className="flex gap-2">
            {!editing && connectionId && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleAutoAssign}
                disabled={autoAssigning}
              >
                {autoAssigning ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Auto-assigning...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Auto-assign
                  </>
                )}
              </Button>
            )}
            {!editing ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setEditing(true)}
              >
                <Edit2 className="mr-2 h-4 w-4" />
                Edit
              </Button>
            ) : (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEditing(false)
                    setSelectedCategories(assignment?.categories || [])
                    setSelectedTags(assignment?.tags || [])
                  }}
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveManual}
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Save
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Categories Section */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <FolderOpen className="h-4 w-4 text-gray-500" />
            <h4 className="font-medium text-sm">Categories</h4>
            {assignment?.categoriesAutoAssigned && (
              <Badge variant="secondary" className="text-xs">
                Auto-assigned
              </Badge>
            )}
          </div>

          {editing ? (
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                {availableCategories.map(category => {
                  const isSelected = selectedCategories.some(c => c.id === category.id)
                  return (
                    <Badge
                      key={category.id}
                      variant={isSelected ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => toggleCategory(category)}
                    >
                      {category.name}
                    </Badge>
                  )
                })}
              </div>
              {availableCategories.length === 0 && connectionId && (
                <p className="text-sm text-gray-500">
                  No categories available. They will be loaded from WordPress.
                </p>
              )}
              {!connectionId && (
                <p className="text-sm text-gray-500">
                  Connect to WordPress to select categories.
                </p>
              )}
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {selectedCategories.length > 0 ? (
                selectedCategories.map(category => (
                  <Badge key={category.id} variant="secondary">
                    {category.name}
                  </Badge>
                ))
              ) : (
                <p className="text-sm text-gray-500">No categories assigned</p>
              )}
            </div>
          )}
        </div>

        {/* Tags Section */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Tag className="h-4 w-4 text-gray-500" />
            <h4 className="font-medium text-sm">Tags</h4>
            {assignment?.tagsAutoAssigned && (
              <Badge variant="secondary" className="text-xs">
                Auto-assigned
              </Badge>
            )}
          </div>

          {editing ? (
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                {availableTags.map(tag => {
                  const isSelected = selectedTags.some(t => t.id === tag.id)
                  return (
                    <Badge
                      key={tag.id}
                      variant={isSelected ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => toggleTag(tag)}
                    >
                      {tag.name}
                    </Badge>
                  )
                })}
              </div>
              {availableTags.length === 0 && connectionId && (
                <p className="text-sm text-gray-500">
                  No tags available. They will be loaded from WordPress.
                </p>
              )}
              {!connectionId && (
                <p className="text-sm text-gray-500">
                  Connect to WordPress to select tags.
                </p>
              )}
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {selectedTags.length > 0 ? (
                selectedTags.map(tag => (
                  <Badge key={tag.id} variant="secondary">
                    {tag.name}
                  </Badge>
                ))
              ) : (
                <p className="text-sm text-gray-500">No tags assigned</p>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
