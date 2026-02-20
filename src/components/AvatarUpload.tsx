'use client'

import { useState, useRef } from 'react'
import { Camera, Upload, Loader2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface AvatarUploadProps {
    currentAvatarUrl?: string | null
    userName?: string
    onUploadSuccess?: (avatarUrl: string) => void
    onUploadError?: (error: string) => void
}

export function AvatarUpload({
    currentAvatarUrl,
    userName = '',
    onUploadSuccess,
    onUploadError
}: AvatarUploadProps) {
    const [isUploading, setIsUploading] = useState(false)
    const [avatarUrl, setAvatarUrl] = useState(currentAvatarUrl)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const getInitials = (name: string) => {
        if (!name) return 'U'
        const parts = name.trim().split(' ')
        if (parts.length >= 2) {
            return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
        }
        return name.substring(0, 2).toUpperCase()
    }

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Validate file type
        if (!file.type.startsWith('image/')) {
            onUploadError?.('Please select an image file')
            return
        }

        // Validate file size (2MB)
        if (file.size > 2 * 1024 * 1024) {
            onUploadError?.('File size must be less than 2MB')
            return
        }

        setIsUploading(true)

        try {
            const formData = new FormData()
            formData.append('file', file)

            const response = await fetch('/api/upload/avatar', {
                method: 'POST',
                body: formData
            })

            const data = await response.json()

            if (!response.ok || !data.success) {
                throw new Error(data.error || 'Upload failed')
            }

            setAvatarUrl(data.avatar_url)
            onUploadSuccess?.(data.avatar_url)

        } catch (error: any) {
            console.error('Upload error:', error)
            onUploadError?.(error.message || 'Failed to upload avatar')
        } finally {
            setIsUploading(false)
            // Reset file input
            if (fileInputRef.current) {
                fileInputRef.current.value = ''
            }
        }
    }

    const handleRemoveAvatar = async () => {
        if (!avatarUrl) return

        setIsUploading(true)

        try {
            const response = await fetch('/api/upload/avatar', {
                method: 'DELETE'
            })

            const data = await response.json()

            if (!response.ok || !data.success) {
                throw new Error(data.error || 'Failed to remove avatar')
            }

            setAvatarUrl(null)
            onUploadSuccess?.('')

        } catch (error: any) {
            console.error('Remove error:', error)
            onUploadError?.(error.message || 'Failed to remove avatar')
        } finally {
            setIsUploading(false)
        }
    }

    const triggerFileInput = () => {
        fileInputRef.current?.click()
    }

    return (
        <div className="flex items-center gap-4">
            <div className="relative">
                <div className="w-20 h-20 rounded-full overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl font-semibold">
                    {avatarUrl ? (
                        <img
                            src={avatarUrl}
                            alt={userName || 'Avatar'}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        getInitials(userName)
                    )}
                </div>
                {!isUploading && (
                    <button
                        onClick={triggerFileInput}
                        className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center shadow-lg transition-colors"
                        title="Change photo"
                        aria-label="Change photo"
                    >
                        <Camera className="w-4 h-4" />
                    </button>
                )}
                {isUploading && (
                    <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
                        <Loader2 className="w-6 h-6 text-white animate-spin" />
                    </div>
                )}
            </div>

            <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                    <Button
                        onClick={triggerFileInput}
                        disabled={isUploading}
                        size="sm"
                        variant="outline"
                    >
                        <Upload className="w-4 h-4 mr-2" />
                        {avatarUrl ? 'Change Photo' : 'Upload Photo'}
                    </Button>
                    {avatarUrl && (
                        <Button
                            onClick={handleRemoveAvatar}
                            disabled={isUploading}
                            size="sm"
                            variant="ghost"
                        >
                            <X className="w-4 h-4 mr-2" />
                            Remove
                        </Button>
                    )}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                    JPG, PNG, WEBP or GIF. Max 2MB.
                </p>
            </div>

            <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleFileSelect}
                className="hidden"
                aria-label="Upload avatar"
            />
        </div>
    )
}
