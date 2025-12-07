'use client'

import { Menu } from 'lucide-react'
import { useSidebar } from '@/contexts/sidebar-context'
import { Button } from '@/components/ui/button'

export function SidebarToggle() {
    const { toggle, isOpen } = useSidebar()

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={toggle}
            className="lg:hidden"
            aria-label="Toggle sidebar"
        >
            <Menu className="w-5 h-5" />
        </Button>
    )
}

