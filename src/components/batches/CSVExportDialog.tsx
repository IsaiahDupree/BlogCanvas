'use client'

import { useState } from 'react'
import { X, Download, CheckSquare, Square } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface CSVExportDialogProps {
    open: boolean
    onClose: () => void
    batchId: string
    batchName: string
}

const AVAILABLE_COLUMNS = [
    { key: 'topic', label: 'Topic', default: true },
    { key: 'target_keyword', label: 'Target Keyword', default: true },
    { key: 'target_wordcount', label: 'Target Wordcount', default: true },
    { key: 'topic_cluster', label: 'Topic Cluster', default: true },
    { key: 'priority', label: 'Priority', default: true },
    { key: 'notes', label: 'Notes', default: true },
    { key: 'status', label: 'Status', default: true },
    { key: 'due_date', label: 'Due Date', default: true },
    { key: 'publish_window_start', label: 'Publish Window Start', default: true },
    { key: 'publish_window_end', label: 'Publish Window End', default: true },
    { key: 'seo_quality_score', label: 'SEO Quality Score', default: false },
    { key: 'created_at', label: 'Created Date', default: false },
]

const STATUS_OPTIONS = [
    { value: 'all', label: 'All Statuses' },
    { value: 'idea', label: 'Idea' },
    { value: 'ai_drafting', label: 'AI Drafting' },
    { value: 'draft', label: 'Draft' },
    { value: 'editor_review', label: 'Editor Review' },
    { value: 'client_review', label: 'Client Review' },
    { value: 'approved', label: 'Approved' },
    { value: 'published', label: 'Published' },
    { value: 'scheduled', label: 'Scheduled' },
    { value: 'failed', label: 'Failed' },
]

export default function CSVExportDialog({ open, onClose, batchId, batchName }: CSVExportDialogProps) {
    const [statusFilter, setStatusFilter] = useState('all')
    const [dateRangeStart, setDateRangeStart] = useState('')
    const [dateRangeEnd, setDateRangeEnd] = useState('')
    const [selectedColumns, setSelectedColumns] = useState<string[]>(
        AVAILABLE_COLUMNS.filter(col => col.default).map(col => col.key)
    )
    const [exporting, setExporting] = useState(false)

    const toggleColumn = (columnKey: string) => {
        if (selectedColumns.includes(columnKey)) {
            // Don't allow deselecting all columns
            if (selectedColumns.length > 1) {
                setSelectedColumns(selectedColumns.filter(k => k !== columnKey))
            }
        } else {
            setSelectedColumns([...selectedColumns, columnKey])
        }
    }

    const selectAllColumns = () => {
        setSelectedColumns(AVAILABLE_COLUMNS.map(col => col.key))
    }

    const deselectAllColumns = () => {
        // Keep at least the first column selected
        setSelectedColumns([AVAILABLE_COLUMNS[0].key])
    }

    const handleExport = async () => {
        setExporting(true)
        try {
            // Build query parameters
            const params = new URLSearchParams()

            if (statusFilter !== 'all') {
                params.append('status', statusFilter)
            }

            if (dateRangeStart) {
                params.append('dateFrom', dateRangeStart)
            }

            if (dateRangeEnd) {
                params.append('dateTo', dateRangeEnd)
            }

            if (selectedColumns.length > 0) {
                params.append('columns', selectedColumns.join(','))
            }

            const response = await fetch(`/api/content-batches/${batchId}/export-csv?${params.toString()}`)
            if (!response.ok) throw new Error('Export failed')

            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = response.headers.get('Content-Disposition')?.split('filename=')[1]?.replace(/"/g, '') ||
                        `${batchName.replace(/[^a-z0-9]/gi, '_')}_export.csv`
            document.body.appendChild(a)
            a.click()
            window.URL.revokeObjectURL(url)
            document.body.removeChild(a)

            onClose()
        } catch (error) {
            console.error('Export error:', error)
            alert('Failed to export CSV file')
        } finally {
            setExporting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center justify-between">
                        <span>Export CSV</span>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                            <X className="w-5 h-5" />
                        </button>
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Status Filter */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Filter by Status
                        </label>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            {STATUS_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Date Range Filter */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Filter by Created Date Range
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">From</label>
                                <input
                                    type="date"
                                    value={dateRangeStart}
                                    onChange={(e) => setDateRangeStart(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">To</label>
                                <input
                                    type="date"
                                    value={dateRangeEnd}
                                    onChange={(e) => setDateRangeEnd(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Column Selection */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="block text-sm font-medium text-gray-700">
                                Select Columns to Export
                            </label>
                            <div className="flex gap-2">
                                <button
                                    onClick={selectAllColumns}
                                    className="text-xs text-indigo-600 hover:text-indigo-700"
                                >
                                    Select All
                                </button>
                                <span className="text-xs text-gray-400">|</span>
                                <button
                                    onClick={deselectAllColumns}
                                    className="text-xs text-indigo-600 hover:text-indigo-700"
                                >
                                    Deselect All
                                </button>
                            </div>
                        </div>
                        <div className="border border-gray-200 rounded-md p-4 space-y-2 max-h-64 overflow-y-auto">
                            {AVAILABLE_COLUMNS.map((column) => {
                                const isSelected = selectedColumns.includes(column.key)
                                return (
                                    <button
                                        key={column.key}
                                        onClick={() => toggleColumn(column.key)}
                                        className="w-full flex items-center gap-3 p-2 rounded hover:bg-gray-50 transition-colors text-left"
                                    >
                                        {isSelected ? (
                                            <CheckSquare className="w-5 h-5 text-indigo-600 flex-shrink-0" />
                                        ) : (
                                            <Square className="w-5 h-5 text-gray-400 flex-shrink-0" />
                                        )}
                                        <span className={`text-sm ${isSelected ? 'text-gray-900 font-medium' : 'text-gray-600'}`}>
                                            {column.label}
                                        </span>
                                    </button>
                                )
                            })}
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                            {selectedColumns.length} column{selectedColumns.length !== 1 ? 's' : ''} selected
                        </p>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t">
                    <Button
                        onClick={onClose}
                        variant="outline"
                        disabled={exporting}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleExport}
                        disabled={exporting || selectedColumns.length === 0}
                        className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white"
                    >
                        {exporting ? (
                            <>
                                <Download className="w-4 h-4 mr-2 animate-pulse" />
                                Exporting...
                            </>
                        ) : (
                            <>
                                <Download className="w-4 h-4 mr-2" />
                                Export CSV
                            </>
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
