'use client'

import { useEffect, useRef, useState } from 'react'

interface UseAutoSaveOptions<T> {
    data: T
    onSave: (data: T) => Promise<void> | void
    delay?: number // Debounce delay in milliseconds
    enabled?: boolean
    storageKey?: string // For localStorage persistence
}

interface UseAutoSaveReturn {
    isSaving: boolean
    lastSaved: Date | null
    error: Error | null
    manualSave: () => Promise<void>
}

/**
 * Auto-save hook for forms and data
 * Automatically saves data after a debounce delay
 * Optionally persists to localStorage
 */
export function useAutoSave<T>({
    data,
    onSave,
    delay = 2000,
    enabled = true,
    storageKey
}: UseAutoSaveOptions<T>): UseAutoSaveReturn {
    const [isSaving, setIsSaving] = useState(false)
    const [lastSaved, setLastSaved] = useState<Date | null>(null)
    const [error, setError] = useState<Error | null>(null)
    const timeoutRef = useRef<NodeJS.Timeout | null>(null)
    const previousDataRef = useRef<T>(data)

    // Save to localStorage if storage key is provided
    useEffect(() => {
        if (storageKey && data) {
            try {
                localStorage.setItem(storageKey, JSON.stringify(data))
            } catch (err) {
                console.error('Failed to save to localStorage:', err)
            }
        }
    }, [data, storageKey])

    // Auto-save logic
    useEffect(() => {
        if (!enabled) return

        // Check if data has changed
        const hasChanged = JSON.stringify(data) !== JSON.stringify(previousDataRef.current)

        if (!hasChanged) return

        // Clear existing timeout
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current)
        }

        // Set new timeout for auto-save
        timeoutRef.current = setTimeout(async () => {
            setIsSaving(true)
            setError(null)

            try {
                await onSave(data)
                setLastSaved(new Date())
                previousDataRef.current = data
            } catch (err) {
                console.error('Auto-save failed:', err)
                setError(err as Error)
            } finally {
                setIsSaving(false)
            }
        }, delay)

        // Cleanup timeout on unmount or data change
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
            }
        }
    }, [data, onSave, delay, enabled])

    // Manual save function
    const manualSave = async () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current)
        }

        setIsSaving(true)
        setError(null)

        try {
            await onSave(data)
            setLastSaved(new Date())
            previousDataRef.current = data
        } catch (err) {
            console.error('Manual save failed:', err)
            setError(err as Error)
        } finally {
            setIsSaving(false)
        }
    }

    return {
        isSaving,
        lastSaved,
        error,
        manualSave
    }
}

/**
 * Simpler hook that only does localStorage persistence
 */
export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
    const [storedValue, setStoredValue] = useState<T>(() => {
        if (typeof window === 'undefined') {
            return initialValue
        }

        try {
            const item = window.localStorage.getItem(key)
            return item ? JSON.parse(item) : initialValue
        } catch (error) {
            console.error('Error loading from localStorage:', error)
            return initialValue
        }
    })

    const setValue = (value: T) => {
        try {
            setStoredValue(value)
            if (typeof window !== 'undefined') {
                window.localStorage.setItem(key, JSON.stringify(value))
            }
        } catch (error) {
            console.error('Error saving to localStorage:', error)
        }
    }

    return [storedValue, setValue]
}
