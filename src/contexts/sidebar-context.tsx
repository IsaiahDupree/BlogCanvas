'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface SidebarContextType {
    isOpen: boolean
    toggle: () => void
    open: () => void
    close: () => void
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

export function SidebarProvider({ children }: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(true)

    // Load sidebar state from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem('sidebar-open')
        if (saved !== null) {
            setIsOpen(saved === 'true')
        }
    }, [])

    // Save sidebar state to localStorage when it changes
    useEffect(() => {
        localStorage.setItem('sidebar-open', isOpen.toString())
    }, [isOpen])

    const toggle = () => setIsOpen(prev => !prev)
    const open = () => setIsOpen(true)
    const close = () => setIsOpen(false)

    return (
        <SidebarContext.Provider value={{ isOpen, toggle, open, close }}>
            {children}
        </SidebarContext.Provider>
    )
}

export function useSidebar() {
    const context = useContext(SidebarContext)
    if (context === undefined) {
        throw new Error('useSidebar must be used within a SidebarProvider')
    }
    return context
}

