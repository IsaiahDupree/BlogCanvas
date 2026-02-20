'use client';

import { useState } from 'react';
import { Check, X, Trash2, Archive, Download, MoreHorizontal } from 'lucide-react';
import { Button } from './button';

export interface BulkAction {
    id: string;
    label: string;
    icon?: React.ReactNode;
    variant?: 'default' | 'destructive' | 'outline';
    onExecute: (selectedIds: string[]) => void | Promise<void>;
    confirm?: {
        title: string;
        message: string;
    };
}

interface BulkActionToolbarProps {
    selectedCount: number;
    totalCount: number;
    selectedIds: string[];
    onClearSelection: () => void;
    onSelectAll?: () => void;
    actions?: BulkAction[];
    className?: string;
}

export function BulkActionToolbar({
    selectedCount,
    totalCount,
    selectedIds,
    onClearSelection,
    onSelectAll,
    actions = [],
    className = ''
}: BulkActionToolbarProps) {
    const [isExecuting, setIsExecuting] = useState(false);
    const [showConfirm, setShowConfirm] = useState<BulkAction | null>(null);
    const [showMoreActions, setShowMoreActions] = useState(false);

    // Default actions if none provided
    const defaultActions: BulkAction[] = [
        {
            id: 'delete',
            label: 'Delete',
            icon: <Trash2 className="h-4 w-4" />,
            variant: 'destructive',
            onExecute: async (ids) => {
                console.log('Delete:', ids);
            },
            confirm: {
                title: 'Delete Items',
                message: `Are you sure you want to delete ${selectedCount} item(s)? This action cannot be undone.`
            }
        },
        {
            id: 'archive',
            label: 'Archive',
            icon: <Archive className="h-4 w-4" />,
            onExecute: async (ids) => {
                console.log('Archive:', ids);
            }
        },
        {
            id: 'export',
            label: 'Export',
            icon: <Download className="h-4 w-4" />,
            onExecute: async (ids) => {
                console.log('Export:', ids);
            }
        }
    ];

    const allActions = actions.length > 0 ? actions : defaultActions;
    const visibleActions = allActions.slice(0, 2);
    const moreActions = allActions.slice(2);

    const handleActionClick = (action: BulkAction) => {
        if (action.confirm) {
            setShowConfirm(action);
        } else {
            executeAction(action);
        }
    };

    const executeAction = async (action: BulkAction) => {
        setIsExecuting(true);
        setShowConfirm(null);
        setShowMoreActions(false);

        try {
            await action.onExecute(selectedIds);
        } catch (error) {
            console.error('Bulk action error:', error);
        } finally {
            setIsExecuting(false);
        }
    };

    if (selectedCount === 0) {
        return null;
    }

    return (
        <>
            <div
                className={`
                    fixed bottom-6 left-1/2 -translate-x-1/2 z-40
                    bg-white border border-gray-200 rounded-lg shadow-lg
                    flex items-center gap-4 px-4 py-3
                    ${className}
                `}
            >
                {/* Selection info */}
                <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center h-8 w-8 bg-blue-100 rounded-full">
                        <Check className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-900">
                            {selectedCount} {selectedCount === 1 ? 'item' : 'items'} selected
                        </p>
                        {onSelectAll && selectedCount < totalCount && (
                            <button
                                onClick={onSelectAll}
                                className="text-xs text-blue-600 hover:text-blue-700 underline"
                            >
                                Select all {totalCount}
                            </button>
                        )}
                    </div>
                </div>

                {/* Divider */}
                <div className="h-8 w-px bg-gray-200" />

                {/* Actions */}
                <div className="flex items-center gap-2">
                    {visibleActions.map((action) => (
                        <Button
                            key={action.id}
                            size="sm"
                            variant={action.variant || 'outline'}
                            onClick={() => handleActionClick(action)}
                            disabled={isExecuting}
                        >
                            {action.icon}
                            <span className="ml-2 hidden sm:inline">{action.label}</span>
                        </Button>
                    ))}

                    {moreActions.length > 0 && (
                        <div className="relative">
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setShowMoreActions(!showMoreActions)}
                                disabled={isExecuting}
                            >
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>

                            {showMoreActions && (
                                <div className="absolute bottom-full mb-2 right-0 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[160px]">
                                    {moreActions.map((action) => (
                                        <button
                                            key={action.id}
                                            onClick={() => handleActionClick(action)}
                                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-left hover:bg-gray-50 transition-colors"
                                        >
                                            {action.icon}
                                            {action.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Clear selection */}
                <button
                    onClick={onClearSelection}
                    className="ml-2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label="Clear selection"
                >
                    <X className="h-5 w-5" />
                </button>
            </div>

            {/* Confirmation dialog */}
            {showConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            {showConfirm.confirm?.title}
                        </h3>
                        <p className="text-sm text-gray-600 mb-6">
                            {showConfirm.confirm?.message}
                        </p>
                        <div className="flex justify-end gap-3">
                            <Button
                                variant="outline"
                                onClick={() => setShowConfirm(null)}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant={showConfirm.variant === 'destructive' ? 'destructive' : 'default'}
                                onClick={() => executeAction(showConfirm)}
                                disabled={isExecuting}
                            >
                                {isExecuting ? 'Processing...' : 'Confirm'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default BulkActionToolbar;
