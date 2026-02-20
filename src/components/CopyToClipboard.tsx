'use client'

import { useState } from 'react'
import { Check, Copy } from 'lucide-react'

interface CopyToClipboardProps {
    text: string
    children?: React.ReactNode
    className?: string
    showIcon?: boolean
    feedback?: 'text' | 'icon' | 'both'
}

export function CopyToClipboard({
    text,
    children,
    className = '',
    showIcon = true,
    feedback = 'both'
}: CopyToClipboardProps) {
    const [copied, setCopied] = useState(false)

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(text)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch (error) {
            console.error('Failed to copy:', error)
        }
    }

    return (
        <button
            onClick={handleCopy}
            className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                copied
                    ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
            } ${className}`}
            title={copied ? 'Copied!' : 'Click to copy'}
            aria-label={copied ? 'Copied to clipboard' : 'Copy to clipboard'}
        >
            {children && <span className="text-sm font-mono">{children}</span>}
            {showIcon && (
                <>
                    {copied ? (
                        <Check className="w-4 h-4 flex-shrink-0" />
                    ) : (
                        <Copy className="w-4 h-4 flex-shrink-0" />
                    )}
                </>
            )}
            {feedback !== 'icon' && copied && (
                <span className="text-xs font-medium">Copied!</span>
            )}
        </button>
    )
}

// Inline variant for copying text snippets
export function CopyButton({ text, size = 'sm' }: { text: string; size?: 'xs' | 'sm' | 'md' }) {
    const [copied, setCopied] = useState(false)

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(text)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch (error) {
            console.error('Failed to copy:', error)
        }
    }

    const sizeClasses = {
        xs: 'w-3 h-3',
        sm: 'w-4 h-4',
        md: 'w-5 h-5'
    }

    return (
        <button
            onClick={handleCopy}
            className="inline-flex items-center justify-center p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            title={copied ? 'Copied!' : 'Copy'}
            aria-label={copied ? 'Copied to clipboard' : 'Copy to clipboard'}
        >
            {copied ? (
                <Check className={`${sizeClasses[size]} text-green-600 dark:text-green-400`} />
            ) : (
                <Copy className={`${sizeClasses[size]} text-gray-500 dark:text-gray-400`} />
            )}
        </button>
    )
}

// Code block variant
export function CopyCodeBlock({ code, language = 'text' }: { code: string; language?: string }) {
    const [copied, setCopied] = useState(false)

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(code)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch (error) {
            console.error('Failed to copy:', error)
        }
    }

    return (
        <div className="relative group">
            <button
                onClick={handleCopy}
                className={`absolute top-2 right-2 px-2 py-1 rounded text-xs font-medium transition-all ${
                    copied
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
                aria-label={copied ? 'Copied!' : 'Copy code'}
            >
                {copied ? (
                    <span className="flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        Copied
                    </span>
                ) : (
                    <span className="flex items-center gap-1">
                        <Copy className="w-3 h-3" />
                        Copy
                    </span>
                )}
            </button>
            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                <code className={`language-${language}`}>{code}</code>
            </pre>
        </div>
    )
}
