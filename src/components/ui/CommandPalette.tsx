'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Search, Command as CommandIcon, ArrowRight, Hash, FileText, Users, Settings } from 'lucide-react';
import { useRouter } from 'next/navigation';

export interface CommandAction {
    id: string;
    label: string;
    keywords?: string[];
    icon?: React.ReactNode;
    category?: 'navigation' | 'action' | 'search';
    onExecute?: () => void;
    href?: string;
}

interface CommandPaletteProps {
    actions?: CommandAction[];
    placeholder?: string;
    onClose?: () => void;
}

export function CommandPalette({
    actions = [],
    placeholder = 'Type a command or search...',
    onClose
}: CommandPaletteProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();

    // Default actions if none provided
    const defaultActions: CommandAction[] = [
        {
            id: 'dashboard',
            label: 'Go to Dashboard',
            keywords: ['home', 'overview'],
            icon: <Hash className="h-4 w-4" />,
            category: 'navigation',
            href: '/vendor/dashboard'
        },
        {
            id: 'clients',
            label: 'View Clients',
            keywords: ['customers', 'users'],
            icon: <Users className="h-4 w-4" />,
            category: 'navigation',
            href: '/vendor/clients'
        },
        {
            id: 'posts',
            label: 'Manage Blog Posts',
            keywords: ['content', 'articles', 'blogs'],
            icon: <FileText className="h-4 w-4" />,
            category: 'navigation',
            href: '/vendor/posts'
        },
        {
            id: 'settings',
            label: 'Settings',
            keywords: ['preferences', 'config'],
            icon: <Settings className="h-4 w-4" />,
            category: 'navigation',
            href: '/vendor/settings'
        }
    ];

    const allActions = actions.length > 0 ? actions : defaultActions;

    // Filter actions based on search
    const filteredActions = search.trim() === ''
        ? allActions
        : allActions.filter(action => {
            const searchLower = search.toLowerCase();
            const labelMatch = action.label.toLowerCase().includes(searchLower);
            const keywordMatch = action.keywords?.some(kw =>
                kw.toLowerCase().includes(searchLower)
            );
            return labelMatch || keywordMatch;
        });

    // Keyboard shortcut to open/close (Cmd+K or Ctrl+K)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsOpen(prev => !prev);
            }

            if (e.key === 'Escape' && isOpen) {
                setIsOpen(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen]);

    // Focus input when opened
    useEffect(() => {
        if (isOpen) {
            inputRef.current?.focus();
            setSearch('');
            setSelectedIndex(0);
        }
    }, [isOpen]);

    // Handle arrow key navigation
    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev =>
                prev < filteredActions.length - 1 ? prev + 1 : prev
            );
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => prev > 0 ? prev - 1 : 0);
        } else if (e.key === 'Enter' && filteredActions[selectedIndex]) {
            e.preventDefault();
            executeAction(filteredActions[selectedIndex]);
        } else if (e.key === 'Escape') {
            setIsOpen(false);
        }
    }, [filteredActions, selectedIndex]);

    const executeAction = (action: CommandAction) => {
        if (action.onExecute) {
            action.onExecute();
        } else if (action.href) {
            router.push(action.href);
        }
        setIsOpen(false);
        onClose?.();
    };

    const getCategoryIcon = (category?: string) => {
        switch (category) {
            case 'navigation':
                return <ArrowRight className="h-3 w-3" />;
            case 'action':
                return <CommandIcon className="h-3 w-3" />;
            case 'search':
                return <Search className="h-3 w-3" />;
            default:
                return null;
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-8">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={() => setIsOpen(false)}
            />

            {/* Command Palette */}
            <div className="relative w-full max-w-2xl mt-[10vh] bg-white rounded-lg shadow-2xl overflow-hidden border border-gray-200">
                {/* Search Input */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200">
                    <Search className="h-5 w-5 text-gray-400" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setSelectedIndex(0);
                        }}
                        onKeyDown={handleKeyDown}
                        placeholder={placeholder}
                        className="flex-1 outline-none text-sm"
                    />
                    <kbd className="hidden sm:flex items-center gap-1 px-2 py-1 text-xs font-mono bg-gray-100 text-gray-600 rounded border border-gray-300">
                        <CommandIcon className="h-3 w-3" />K
                    </kbd>
                </div>

                {/* Results */}
                <div className="max-h-96 overflow-y-auto">
                    {filteredActions.length === 0 ? (
                        <div className="px-4 py-8 text-center text-sm text-gray-500">
                            No results found for "{search}"
                        </div>
                    ) : (
                        <div className="py-2">
                            {filteredActions.map((action, index) => (
                                <button
                                    key={action.id}
                                    onClick={() => executeAction(action)}
                                    onMouseEnter={() => setSelectedIndex(index)}
                                    className={`
                                        w-full flex items-center gap-3 px-4 py-3 text-left
                                        transition-colors
                                        ${index === selectedIndex
                                            ? 'bg-blue-50 text-blue-700'
                                            : 'text-gray-700 hover:bg-gray-50'
                                        }
                                    `}
                                >
                                    {action.icon && (
                                        <span className={index === selectedIndex ? 'text-blue-600' : 'text-gray-400'}>
                                            {action.icon}
                                        </span>
                                    )}
                                    <span className="flex-1 text-sm font-medium">
                                        {action.label}
                                    </span>
                                    {action.category && (
                                        <span className={`text-xs ${index === selectedIndex ? 'text-blue-500' : 'text-gray-400'}`}>
                                            {getCategoryIcon(action.category)}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer hint */}
                <div className="hidden sm:flex items-center gap-4 px-4 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                        <kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded">↑↓</kbd>
                        to navigate
                    </span>
                    <span className="flex items-center gap-1">
                        <kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded">↵</kbd>
                        to select
                    </span>
                    <span className="flex items-center gap-1">
                        <kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded">esc</kbd>
                        to close
                    </span>
                </div>
            </div>
        </div>
    );
}

export default CommandPalette;
