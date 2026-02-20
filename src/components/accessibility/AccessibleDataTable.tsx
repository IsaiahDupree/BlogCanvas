'use client';

import { ReactNode } from 'react';

export interface AccessibleTableColumn<T> {
    key: string;
    header: string;
    render?: (value: any, row: T) => ReactNode;
    sortable?: boolean;
}

export interface AccessibleDataTableProps<T> {
    caption: string;
    columns: AccessibleTableColumn<T>[];
    data: T[];
    keyField: keyof T;
    onSort?: (key: string) => void;
    sortKey?: string;
    sortDirection?: 'asc' | 'desc';
    className?: string;
}

export function AccessibleDataTable<T extends Record<string, any>>({
    caption,
    columns,
    data,
    keyField,
    onSort,
    sortKey,
    sortDirection,
    className = ''
}: AccessibleDataTableProps<T>) {
    const handleSort = (columnKey: string) => {
        if (onSort) {
            onSort(columnKey);
        }
    };

    const getCellValue = (row: T, column: AccessibleTableColumn<T>) => {
        const value = row[column.key];
        return column.render ? column.render(value, row) : value;
    };

    return (
        <div className={`overflow-x-auto ${className}`} role="region" aria-label={caption} tabIndex={0}>
            <table className="min-w-full divide-y divide-gray-200" role="table">
                <caption className="sr-only">{caption}</caption>

                <thead className="bg-gray-50">
                    <tr role="row">
                        {columns.map((column) => (
                            <th
                                key={column.key}
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                role="columnheader"
                                aria-sort={
                                    sortKey === column.key
                                        ? sortDirection === 'asc'
                                            ? 'ascending'
                                            : 'descending'
                                        : column.sortable
                                            ? 'none'
                                            : undefined
                                }
                            >
                                {column.sortable ? (
                                    <button
                                        onClick={() => handleSort(column.key)}
                                        className="group inline-flex items-center gap-1 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded px-1"
                                        aria-label={`Sort by ${column.header}`}
                                    >
                                        <span>{column.header}</span>
                                        <span aria-hidden="true" className="text-gray-400 group-hover:text-gray-600">
                                            {sortKey === column.key ? (
                                                sortDirection === 'asc' ? '↑' : '↓'
                                            ) : (
                                                '↕'
                                            )}
                                        </span>
                                    </button>
                                ) : (
                                    column.header
                                )}
                            </th>
                        ))}
                    </tr>
                </thead>

                <tbody className="bg-white divide-y divide-gray-200">
                    {data.length === 0 ? (
                        <tr role="row">
                            <td
                                colSpan={columns.length}
                                className="px-6 py-8 text-center text-sm text-gray-500"
                                role="cell"
                            >
                                No data available
                            </td>
                        </tr>
                    ) : (
                        data.map((row, rowIndex) => (
                            <tr
                                key={String(row[keyField])}
                                role="row"
                                className="hover:bg-gray-50 focus-within:bg-gray-50"
                            >
                                {columns.map((column, colIndex) => {
                                    const isFirstColumn = colIndex === 0;
                                    return (
                                        <td
                                            key={column.key}
                                            className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                                            role={isFirstColumn ? 'rowheader' : 'cell'}
                                            {...(isFirstColumn ? { scope: 'row' } : {})}
                                        >
                                            {getCellValue(row, column)}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}

export default AccessibleDataTable;
