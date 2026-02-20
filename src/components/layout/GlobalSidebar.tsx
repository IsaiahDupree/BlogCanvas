'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSidebar } from '@/contexts/sidebar-context'
import { useEffect, useState } from 'react'
import {
    LayoutDashboard,
    Globe,
    FileText,
    CheckSquare,
    Settings,
    ChevronRight,
    Menu,
    X,
    Users,
    BarChart3,
    BookOpen,
    Bell,
    LogOut,
    Mail,
    Key,
    Shield,
    Lock,
    Sparkles,
    MessageSquare
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/ThemeToggle'

interface NavItem {
    name: string
    href: string
    icon: any
    badge?: string | number
}

interface NavGroup {
    name: string
    items: NavItem[]
}

// Staff/Admin navigation
const staffNavigation: NavGroup[] = [
    {
        name: 'Overview',
        items: [
            { name: 'Dashboard', href: '/app', icon: LayoutDashboard },
        ]
    },
    {
        name: 'Content Pipeline',
        items: [
            { name: 'Pipeline', href: '/app/pipeline', icon: Sparkles },
            { name: 'Websites', href: '/app/websites', icon: Globe },
            { name: 'Content Batches', href: '/app/batches', icon: FileText },
            { name: 'Review Board', href: '/app/review', icon: CheckSquare },
            { name: 'Newsletters', href: '/app/newsletters', icon: Mail },
        ]
    },
    {
        name: 'Management',
        items: [
            { name: 'Requests', href: '/app/requests', icon: MessageSquare },
            { name: 'Approvals', href: '/app/approvals', icon: CheckSquare },
            { name: 'Clients', href: '/app/clients', icon: Users },
            { name: 'Analytics', href: '/app/analytics', icon: BarChart3 },
        ]
    },
    {
        name: 'Developer',
        items: [
            { name: 'Developer Portal', href: '/app/developer', icon: Key },
            { name: 'API Keys', href: '/app/api-keys', icon: Key },
            { name: 'Webhooks', href: '/app/webhooks', icon: Bell },
        ]
    },
    {
        name: 'Settings',
        items: [
            { name: 'Configuration', href: '/app/settings', icon: Settings },
            { name: 'Audit Logs', href: '/app/audit-logs', icon: Shield },
        ]
    }
]

// Client navigation
const clientNavigation: NavGroup[] = [
    {
        name: 'Overview',
        items: [
            { name: 'Dashboard', href: '/portal/dashboard', icon: LayoutDashboard },
        ]
    },
    {
        name: 'Content',
        items: [
            { name: 'Approvals', href: '/portal/approvals', icon: CheckSquare },
            { name: 'Blog Posts', href: '/portal/posts', icon: BookOpen },
            { name: 'Content Batches', href: '/portal/batches', icon: FileText },
        ]
    },
    {
        name: 'Account',
        items: [
            { name: 'Brand Guide', href: '/portal/brand', icon: Settings },
            { name: 'Notifications', href: '/portal/notifications', icon: Bell },
        ]
    }
]

export function GlobalSidebar() {
    const pathname = usePathname()
    const { isOpen, toggle, close } = useSidebar()
    const [user, setUser] = useState<any>(null)
    const [profile, setProfile] = useState<any>(null)

    // Fetch user data
    useEffect(() => {
        fetch('/api/auth/me')
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setUser(data.user)
                    setProfile(data.profile)
                }
            })
            .catch(() => {
                // Not authenticated or error
            })
    }, [])

    const signOut = async () => {
        await fetch('/api/auth/logout', { method: 'POST' })
        window.location.href = '/login'
    }

    // Determine which navigation to show based on route
    const isPortal = pathname.startsWith('/portal')
    const isApp = pathname.startsWith('/app')
    const navigation = isPortal ? clientNavigation : staffNavigation

    // Don't show sidebar on login/auth pages or public pages
    const hideSidebarRoutes = [
                '/auth/',
        '/login',
        '/register',
        '/signup',
        '/forgot-password',
        '/reset-password',
    ]
    
    // Hide on home page and non-app/portal routes
    const isPublicPage = pathname === '/' || 
        hideSidebarRoutes.some(route => pathname.startsWith(route)) ||
        (!pathname.startsWith('/app') && !pathname.startsWith('/portal'))
    
    if (isPublicPage) {
        return null
    }

    return (
        <>
            {/* Mobile menu button - visible when sidebar is closed */}
            {!isOpen && (
                <Button
                    variant="default"
                    size="icon"
                    onClick={toggle}
                    className="fixed top-4 left-4 z-30 lg:hidden bg-gray-900 hover:bg-gray-800 text-white shadow-lg"
                    aria-label="Open sidebar"
                >
                    <Menu className="w-5 h-5" />
                </Button>
            )}

            {/* Mobile overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={close}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`
                    fixed top-0 left-0 z-50 h-full w-64 bg-gray-900 text-white
                    transform transition-transform duration-300 ease-in-out
                    ${isOpen ? 'translate-x-0' : '-translate-x-full'}
                    lg:translate-x-0
                    flex flex-col
                    shadow-xl
                `}
            >
                {/* Header */}
                <div className="flex h-16 items-center justify-between px-6 border-b border-gray-800">
                    <div className="flex items-center gap-3">
                        <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                            BlogCanvas
                        </h1>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggle}
                        className="lg:hidden text-gray-400 hover:text-white hover:bg-gray-800"
                    >
                        <X className="w-5 h-5" />
                    </Button>
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
                                            (item.href !== '/app' && item.href !== '/portal/dashboard' && 
                                             pathname.startsWith(item.href))

                                        return (
                                            <Link
                                                key={item.name}
                                                href={item.href}
                                                onClick={() => {
                                                    // Close sidebar on mobile when navigating
                                                    if (window.innerWidth < 1024) {
                                                        close()
                                                    }
                                                }}
                                                className={`
                                                    group flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-lg transition-all
                                                    ${isActive
                                                        ? 'bg-indigo-600 text-white shadow-lg'
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
                                                {item.badge && (
                                                    <span className="px-2 py-0.5 text-xs bg-indigo-500 rounded-full">
                                                        {item.badge}
                                                    </span>
                                                )}
                                            </Link>
                                        )
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </nav>

                       {/* User section */}
                       {user && (
                           <div className="border-t border-gray-800 p-4">
                               <div className="flex items-center gap-3 mb-3">
                                   <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-sm font-semibold">
                                       {user.email?.charAt(0).toUpperCase() || 'U'}
                                   </div>
                                   <div className="flex-1 min-w-0">
                                       <p className="text-sm font-medium text-white truncate">
                                           {profile?.full_name || user.email}
                                       </p>
                                       <p className="text-xs text-gray-400 truncate">
                                           {profile?.role || 'user'}
                                       </p>
                                   </div>
                               </div>
                               <div className="flex flex-col gap-1">
                                   <ThemeToggle />
                                   <Button
                                       variant="ghost"
                                       size="sm"
                                       onClick={signOut}
                                       className="w-full justify-start text-gray-300 hover:text-white hover:bg-gray-800"
                                   >
                                       <LogOut className="w-4 h-4 mr-2" />
                                       Sign Out
                                   </Button>
                               </div>

                               {/* Version info - WordBrew style */}
                               <div className="mt-4 pt-4 border-t border-gray-800">
                                   <p className="text-xs text-gray-500 text-center mb-1">BlogCanvas v1.0</p>
                                   <p className="text-xs text-gray-600 text-center">AI-Powered SEO Platform</p>
                               </div>
                           </div>
                       )}
            </aside>
        </>
    )
}

