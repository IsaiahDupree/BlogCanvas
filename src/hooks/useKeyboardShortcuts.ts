'use client'

import { useEffect, useCallback, useRef } from 'react'

type KeyHandler = (event: KeyboardEvent) => void

interface KeyBinding {
    key: string
    ctrl?: boolean
    alt?: boolean
    shift?: boolean
    meta?: boolean // Command on Mac
    handler: KeyHandler
    description?: string
}

/**
 * Keyboard shortcuts hook
 * Provides power user shortcuts for navigation and actions
 */
export function useKeyboardShortcuts(bindings: KeyBinding[], enabled: boolean = true) {
    const bindingsRef = useRef(bindings)

    // Update ref when bindings change
    useEffect(() => {
        bindingsRef.current = bindings
    }, [bindings])

    useEffect(() => {
        if (!enabled) return

        const handleKeyDown = (event: KeyboardEvent) => {
            const activeElement = document.activeElement
            const isInputField =
                activeElement?.tagName === 'INPUT' ||
                activeElement?.tagName === 'TEXTAREA' ||
                activeElement?.getAttribute('contenteditable') === 'true'

            // Check each binding
            for (const binding of bindingsRef.current) {
                const keyMatches = event.key.toLowerCase() === binding.key.toLowerCase()
                const ctrlMatches = binding.ctrl === undefined || event.ctrlKey === binding.ctrl
                const altMatches = binding.alt === undefined || event.altKey === binding.alt
                const shiftMatches = binding.shift === undefined || event.shiftKey === binding.shift
                const metaMatches = binding.meta === undefined || event.metaKey === binding.meta

                if (keyMatches && ctrlMatches && altMatches && shiftMatches && metaMatches) {
                    // Prevent shortcuts in input fields unless explicitly using modifier keys
                    if (isInputField && !binding.ctrl && !binding.alt && !binding.meta) {
                        continue
                    }

                    event.preventDefault()
                    binding.handler(event)
                    break
                }
            }
        }

        window.addEventListener('keydown', handleKeyDown)

        return () => {
            window.removeEventListener('keydown', handleKeyDown)
        }
    }, [enabled])
}

/**
 * Common keyboard shortcuts presets
 */
export const commonShortcuts = {
    save: { key: 's', ctrl: true, description: 'Save' },
    search: { key: 'k', ctrl: true, description: 'Search' },
    newItem: { key: 'n', ctrl: true, description: 'New item' },
    close: { key: 'Escape', description: 'Close/Cancel' },
    submit: { key: 'Enter', ctrl: true, description: 'Submit' },
    delete: { key: 'Delete', description: 'Delete' },
    undo: { key: 'z', ctrl: true, description: 'Undo' },
    redo: { key: 'z', ctrl: true, shift: true, description: 'Redo' },
    copy: { key: 'c', ctrl: true, description: 'Copy' },
    paste: { key: 'v', ctrl: true, description: 'Paste' },
    selectAll: { key: 'a', ctrl: true, description: 'Select all' },
    find: { key: 'f', ctrl: true, description: 'Find' },
    help: { key: '?', shift: true, description: 'Help' }
}

/**
 * Global app shortcuts
 */
export function useAppShortcuts({
    onSearch,
    onNewItem,
    onSettings,
    onHelp
}: {
    onSearch?: () => void
    onNewItem?: () => void
    onSettings?: () => void
    onHelp?: () => void
}) {
    const bindings: KeyBinding[] = []

    if (onSearch) {
        bindings.push({
            key: 'k',
            ctrl: true,
            handler: onSearch,
            description: 'Open search'
        })
        bindings.push({
            key: '/',
            handler: onSearch,
            description: 'Open search'
        })
    }

    if (onNewItem) {
        bindings.push({
            key: 'n',
            ctrl: true,
            handler: onNewItem,
            description: 'Create new item'
        })
    }

    if (onSettings) {
        bindings.push({
            key: ',',
            ctrl: true,
            handler: onSettings,
            description: 'Open settings'
        })
    }

    if (onHelp) {
        bindings.push({
            key: '?',
            shift: true,
            handler: onHelp,
            description: 'Show help'
        })
    }

    useKeyboardShortcuts(bindings)
}
