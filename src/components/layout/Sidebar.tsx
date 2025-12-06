'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    LayoutDashboard,
    Globe,
    FileText,
    CheckSquare,
    Settings,
    ChevronRight
} from 'lucide-react'

interface NavItem {
    name: string
    href: string
    icon: any
}

interface NavGroup {
    name: string
    items: NavItem[]
}

const navigation: NavGroup[] = [
    {
        name: 'Overview',
        items: [
            { name: 'Dashboard', href: '/app', icon: LayoutDashboard },
        ]
    },
    {
        name: 'Content Pipeline',
        items: [
            { name: 'Websites', href: '/app/websites', icon: Globe },
            { name: 'Content Batches', href: '/app/batches', icon: FileText },
            { name: 'Review Board', href: '/app/review', icon: CheckSquare },
        ]
    },
    {
        name: 'Settings',
        items: [
            { name: 'Configuration', href: '/app/settings', icon: Settings },
        ]
    }
]

export function Sidebar() {
    const pathname = usePathname()

    return (
        <div className="flex h-screen w-64 flex-col bg-gray-900 text-white">
            {/* Logo */}
            <div className="flex h-16 items-center justify-between px-6 border-b border-gray-800">
                <div>
                    <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                        BlogCanvas
                    </h1>
                    <p className="text-xs text-gray-400">Content Pipeline</p>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto px-4 py-6">
                <div className="space-y-8">
                    {navigation.map((group) => (
                        <div key={group.name}>
                            <h3 className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                                {group.name}
                            </h3>
                            <div className="space-y-1">
                                {group.items.map((item) => {
                                    const isActive = pathname === item.href ||
                                        (item.href !== '/app' && pathname.startsWith(item.href))

                                    return (
                                        <Link
                                            key={item.name}
                                            href={item.href}
                                            className={`
                                                group flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors
                                                ${isActive
                                                    ? 'bg-indigo-600 text-white'
                                                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                                                }
                                            `}
                                        >
                                            <div className="flex items-center gap-3">
                                                <item.icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                                                <span>{item.name}</span>
                                            </div>
                                            {isActive && (
                                                <ChevronRight className="w-4 h-4" />
                                            )}
                                        </Link>
                                    )
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </nav>

            {/* Footer */}
            <div className="border-t border-gray-800 p-4">
                <div className="text-xs text-gray-400">
                    <div className="font-semibold text-white mb-1">BlogCanvas v1.0</div>
                    <div>AI-Powered SEO Platform</div>
                </div>
            </div>
        </div>
    )
}
