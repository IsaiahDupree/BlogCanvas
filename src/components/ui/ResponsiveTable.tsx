'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, ArrowUpDown } from 'lucide-react';

export interface Column<T> {
    key: string;
    label: string;
    sortable?: boolean;
    render?: (value: any, row: T) => React.ReactNode;
    mobileLabel?: string; // Label to show in mobile card view
}

export interface ResponsiveTableProps<T> {
    columns: Column<T>[];
    data: T[];
    keyField: keyof T;
    onSort?: (key: string, direction: 'asc' | 'desc') => void;
    className?: string;
    emptyMessage?: string;
}

export function ResponsiveTable<T extends Record<string, any>>({
    columns,
    data,
    keyField,
    onSort,
    className = '',
    emptyMessage = 'No data available'
}: ResponsiveTableProps<T>) {
    const [sortKey, setSortKey] = useState<string | null>(null);
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

    const handleSort = (key: string) => {
        const newDirection = sortKey === key && sortDirection === 'asc' ? 'desc' : 'asc';
        setSortKey(key);
        setSortDirection(newDirection);
        onSort?.(key, newDirection);
    };

    const getSortIcon = (columnKey: string) => {
        if (sortKey !== columnKey) {
            return <ArrowUpDown className="h-4 w-4 text-gray-400" />;
        }
        return sortDirection === 'asc'
            ? <ChevronUp className="h-4 w-4 text-gray-700" />
            : <ChevronDown className="h-4 w-4 text-gray-700" />;
    };

    const getCellValue = (row: T, column: Column<T>) => {
        const value = row[column.key];
        return column.render ? column.render(value, row) : value;
    };

    if (data.length === 0) {
        return (
            <div className="text-center py-12 text-gray-500">
                {emptyMessage}
            </div>
        );
    }

    return (
        <div className={className}>
            {/* Desktop table view */}
            <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            {columns.map((column) => (
                                <th
                                    key={column.key}
                                    scope="col"
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                    {column.sortable ? (
                                        <button
                                            onClick={() => handleSort(column.key)}
                                            className="flex items-center gap-1 hover:text-gray-700 transition-colors"
                                        >
                                            {column.label}
                                            {getSortIcon(column.key)}
                                        </button>
                                    ) : (
                                        column.label
                                    )}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {data.map((row) => (
                            <tr key={String(row[keyField])} className="hover:bg-gray-50 transition-colors">
                                {columns.map((column) => (
                                    <td
                                        key={column.key}
                                        className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                                    >
                                        {getCellValue(row, column)}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile card view */}
            <div className="md:hidden space-y-4">
                {data.map((row) => (
                    <div
                        key={String(row[keyField])}
                        className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
                    >
                        {columns.map((column) => {
                            const value = getCellValue(row, column);
                            if (!value && value !== 0) return null;

                            return (
                                <div
                                    key={column.key}
                                    className="flex justify-between items-start py-2 border-b border-gray-100 last:border-0"
                                >
                                    <span className="text-sm font-medium text-gray-500">
                                        {column.mobileLabel || column.label}
                                    </span>
                                    <span className="text-sm text-gray-900 text-right ml-4">
                                        {value}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default ResponsiveTable;
