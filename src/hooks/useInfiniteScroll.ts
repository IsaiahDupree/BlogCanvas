'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

interface UseInfiniteScrollOptions {
    onLoadMore: () => Promise<void> | void
    hasMore: boolean
    threshold?: number // Distance from bottom to trigger load (in pixels)
    rootMargin?: string // Intersection Observer root margin
}

interface UseInfiniteScrollReturn {
    isLoading: boolean
    observerRef: (node: HTMLElement | null) => void
}

/**
 * Infinite scroll hook using Intersection Observer
 * Automatically loads more data when user scrolls near the bottom
 */
export function useInfiniteScroll({
    onLoadMore,
    hasMore,
    threshold = 100,
    rootMargin = '100px'
}: UseInfiniteScrollOptions): UseInfiniteScrollReturn {
    const [isLoading, setIsLoading] = useState(false)
    const observerRef = useRef<IntersectionObserver | null>(null)
    const loadingRef = useRef(false)

    const lastElementRef = useCallback(
        (node: HTMLElement | null) => {
            // Cleanup previous observer
            if (observerRef.current) {
                observerRef.current.disconnect()
            }

            // Don't observe if no more data or currently loading
            if (!hasMore || loadingRef.current) return

            // Create new observer
            observerRef.current = new IntersectionObserver(
                (entries) => {
                    const [entry] = entries

                    // Trigger load when element is intersecting
                    if (entry.isIntersecting && hasMore && !loadingRef.current) {
                        loadingRef.current = true
                        setIsLoading(true)

                        Promise.resolve(onLoadMore())
                            .then(() => {
                                loadingRef.current = false
                                setIsLoading(false)
                            })
                            .catch((error) => {
                                console.error('Error loading more:', error)
                                loadingRef.current = false
                                setIsLoading(false)
                            })
                    }
                },
                {
                    root: null, // viewport
                    rootMargin,
                    threshold: 0.1
                }
            )

            // Observe new node
            if (node) {
                observerRef.current.observe(node)
            }
        },
        [hasMore, onLoadMore, rootMargin]
    )

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect()
            }
        }
    }, [])

    return {
        isLoading,
        observerRef: lastElementRef
    }
}

/**
 * Simpler scroll-based infinite scroll (fallback for older browsers)
 */
export function useScrollInfiniteLoad({
    onLoadMore,
    hasMore,
    threshold = 200
}: {
    onLoadMore: () => Promise<void> | void
    hasMore: boolean
    threshold?: number
}) {
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        if (!hasMore || isLoading) return

        const handleScroll = () => {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop
            const scrollHeight = document.documentElement.scrollHeight
            const clientHeight = document.documentElement.clientHeight

            const distanceFromBottom = scrollHeight - (scrollTop + clientHeight)

            if (distanceFromBottom < threshold && hasMore && !isLoading) {
                setIsLoading(true)

                Promise.resolve(onLoadMore())
                    .then(() => setIsLoading(false))
                    .catch((error) => {
                        console.error('Error loading more:', error)
                        setIsLoading(false)
                    })
            }
        }

        window.addEventListener('scroll', handleScroll, { passive: true })

        return () => {
            window.removeEventListener('scroll', handleScroll)
        }
    }, [hasMore, isLoading, onLoadMore, threshold])

    return { isLoading }
}
