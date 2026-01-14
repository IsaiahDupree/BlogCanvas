'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { ImageGenerator } from '@/components/ai/ImageGenerator'

export default function AIImagesPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-pink-50 p-6">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <Link href="/app" className="text-sm text-muted-foreground hover:text-gray-900 mb-2 inline-block">
                        <ArrowLeft className="w-4 h-4 inline mr-1" />
                        Back to Dashboard
                    </Link>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                        AI Image Generator
                    </h1>
                    <p className="text-muted-foreground">
                        Generate blog images with AI-powered prompts and DALL-E integration
                    </p>
                </div>

                <ImageGenerator />
            </div>
        </div>
    )
}
