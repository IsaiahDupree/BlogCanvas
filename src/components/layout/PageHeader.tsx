'use client'

import { SidebarToggle } from './SidebarToggle'
import { useSidebar } from '@/contexts/sidebar-context'
import { Button } from '@/components/ui/button'
import { PanelLeft } from 'lucide-react'

interface PageHeaderProps {
    title?: string
    description?: string
    actions?: React.ReactNode
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
    const { isOpen, toggle } = useSidebar()

    return (
        <div className="bg-white border-b shadow-sm sticky top-0 z-30">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center gap-4">
                        {/* Sidebar toggle - visible on all screen sizes */}
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={toggle}
                            className="lg:hidden"
                            aria-label="Toggle sidebar"
                        >
                            <PanelLeft className="w-5 h-5" />
                        </Button>
                        
                        {/* Desktop toggle button */}
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={toggle}
                            className="hidden lg:flex"
                            aria-label="Toggle sidebar"
                        >
                            <PanelLeft className={`w-5 h-5 transition-transform ${isOpen ? '' : 'rotate-180'}`} />
                        </Button>

                        {(title || description) && (
                            <div>
                                {title && (
                                    <h1 className="text-xl font-semibold text-gray-900">
                                        {title}
                                    </h1>
                                )}
                                {description && (
                                    <p className="text-sm text-gray-500">
                                        {description}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>

                    {actions && (
                        <div className="flex items-center gap-2">
                            {actions}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

