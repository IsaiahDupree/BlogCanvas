'use client'

import { Moon, Sun, Monitor } from 'lucide-react'
import { useTheme } from '@/contexts/theme-context'

export function ThemeToggle() {
    const { theme, setTheme } = useTheme()

    const toggleTheme = () => {
        const themes: Array<'light' | 'dark' | 'system'> = ['light', 'dark', 'system']
        const currentIndex = themes.indexOf(theme)
        const nextTheme = themes[(currentIndex + 1) % themes.length]
        setTheme(nextTheme)
    }

    const getIcon = () => {
        switch (theme) {
            case 'light':
                return <Sun className="h-5 w-5" />
            case 'dark':
                return <Moon className="h-5 w-5" />
            case 'system':
                return <Monitor className="h-5 w-5" />
        }
    }

    const getLabel = () => {
        switch (theme) {
            case 'light':
                return 'Light'
            case 'dark':
                return 'Dark'
            case 'system':
                return 'System'
        }
    }

    return (
        <button
            onClick={toggleTheme}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-gray-800 text-gray-300 hover:text-white w-full"
            title={`Theme: ${getLabel()}`}
            aria-label={`Switch theme (current: ${getLabel()})`}
        >
            {getIcon()}
            <span>{getLabel()} Mode</span>
        </button>
    )
}
