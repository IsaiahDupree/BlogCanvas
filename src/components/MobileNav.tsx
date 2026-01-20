'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Home, FileText, Users, Settings, BarChart } from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const vendorNavItems: NavItem[] = [
  { href: '/vendor/dashboard', label: 'Dashboard', icon: <Home className="w-5 h-5" /> },
  { href: '/clients', label: 'Clients', icon: <Users className="w-5 h-5" /> },
  { href: '/posts', label: 'Posts', icon: <FileText className="w-5 h-5" /> },
  { href: '/analytics', label: 'Analytics', icon: <BarChart className="w-5 h-5" /> },
  { href: '/settings', label: 'Settings', icon: <Settings className="w-5 h-5" /> },
];

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const pathname = usePathname();

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close menu when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Don't render on desktop
  if (!isMobile) {
    return null;
  }

  const isActive = (href: string) => {
    return pathname?.startsWith(href);
  };

  return (
    <>
      {/* Mobile Header */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-40 md:hidden">
        <div className="flex items-center justify-between h-full px-4">
          <Link href="/" className="text-xl font-bold text-indigo-600">
            BlogCanvas
          </Link>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 text-gray-600 hover:text-gray-900 active:bg-gray-100 rounded-lg transition-colors"
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile Menu Drawer */}
      <nav
        className={`
          fixed top-16 left-0 bottom-0 w-64 bg-white z-50 md:hidden
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          overflow-y-auto
        `}
      >
        <div className="p-4 space-y-2">
          {vendorNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-lg
                transition-colors
                ${isActive(item.href)
                  ? 'bg-indigo-50 text-indigo-600 font-medium'
                  : 'text-gray-700 hover:bg-gray-100 active:bg-gray-200'
                }
              `}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ))}
        </div>

        {/* User Profile Section */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-gray-50">
          <Link
            href="/vendor/profile"
            className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors"
          >
            <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white font-medium">
              U
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-900">User Name</div>
              <div className="text-xs text-gray-500">View Profile</div>
            </div>
          </Link>
        </div>
      </nav>

      {/* Bottom Navigation (Alternative Mobile Nav) */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-200 z-40 md:hidden">
        <div className="flex items-center justify-around h-full px-2">
          {vendorNavItems.slice(0, 4).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg
                min-w-[60px]
                transition-colors
                ${isActive(item.href)
                  ? 'text-indigo-600'
                  : 'text-gray-600 hover:text-gray-900 active:bg-gray-100'
                }
              `}
            >
              {item.icon}
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          ))}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`
              flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg
              min-w-[60px]
              transition-colors
              ${isOpen
                ? 'text-indigo-600'
                : 'text-gray-600 hover:text-gray-900 active:bg-gray-100'
              }
            `}
          >
            <Menu className="w-5 h-5" />
            <span className="text-xs font-medium">More</span>
          </button>
        </div>
      </nav>

      {/* Spacer for fixed header and bottom nav */}
      <div className="h-16 md:hidden" />
      <div className="h-16 md:hidden fixed bottom-0 w-full pointer-events-none" />
    </>
  );
}
