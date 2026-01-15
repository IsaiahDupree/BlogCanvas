'use client'

import { useState } from 'react'
import { X, Upload, AlertCircle, CheckCircle2, FileText } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface CSVRow {
  rowNumber: number
  topic: string
  keywords?: string
  target_audience?: string
  template?: string
  errors: string[]
  warnings: string[]
}

interface CSVImportModalProps {
  isOpen: boolean
  onClose: () => void
  batchId: string
  onImportComplete: () => void
}

export default function CSVImportModal({ isOpen, onClose, batchId, onImportComplete }: CSVImportModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [parsedData, setParsedData] = useState<CSVRow[]>([])
  const [loading, setLoading] = useState(false)
  const [importing, setImporting] = useState(false)
  const [parseError, setParseError] = useState<string | null>(null)

  if (!isOpen) return null

  const parseCSV = (text: string): CSVRow[] => {
    const lines = text.split('\n').filter(line => line.trim())
    if (lines.length === 0) {
      throw new Error('CSV file is empty')
    }

    // Parse header
    const header = lines[0].split(',').map(h => h.trim().toLowerCase())
    const topicIndex = header.findIndex(h => h === 'topic' || h === 'title' || h === 'post_title')

    if (topicIndex === -1) {
      throw new Error('CSV must have a "topic", "title", or "post_title" column')
    }

    const keywordsIndex = header.findIndex(h => h === 'keywords' || h === 'target_keywords')
    const audienceIndex = header.findIndex(h => h === 'target_audience' || h === 'audience')
    const templateIndex = header.findIndex(h => h === 'template' || h === 'content_template')

    // Parse rows
    const rows: CSVRow[] = []
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i]
      if (!line.trim()) continue

      const values = line.split(',').map(v => v.trim())
      const topic = values[topicIndex] || ''
      const keywords = keywordsIndex >= 0 ? values[keywordsIndex] : ''
      const target_audience = audienceIndex >= 0 ? values[audienceIndex] : ''
      const template = templateIndex >= 0 ? values[templateIndex] : ''

      const errors: string[] = []
      const warnings: string[] = []

      // Validation
      if (!topic) {
        errors.push('Topic is required')
      } else if (topic.length < 10) {
        warnings.push('Topic is very short (< 10 characters)')
      } else if (topic.length > 200) {
        errors.push('Topic is too long (> 200 characters)')
      }

      if (keywords && keywords.split(';').length > 10) {
        warnings.push('More than 10 keywords specified')
      }

      if (target_audience && target_audience.length > 500) {
        warnings.push('Target audience description is very long')
      }

      rows.push({
        rowNumber: i + 1,
        topic,
        keywords,
        target_audience,
        template,
        errors,
        warnings,
      })
    }

    return rows
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    if (!selectedFile.name.endsWith('.csv')) {
      setParseError('Please select a CSV file')
      return
    }

    setFile(selectedFile)
    setLoading(true)
    setParseError(null)
    setParsedData([])

    try {
      const text = await selectedFile.text()
      const parsed = parseCSV(text)
      setParsedData(parsed)
    } catch (error: any) {
      console.error('Parse error:', error)
      setParseError(error.message || 'Failed to parse CSV file')
    } finally {
      setLoading(false)
    }
  }

  const handleImport = async () => {
    if (!file) return

    // Check if there are any rows with errors
    const rowsWithErrors = parsedData.filter(row => row.errors.length > 0)
    if (rowsWithErrors.length > 0) {
      if (!confirm(`${rowsWithErrors.length} rows have errors and will be skipped. Continue with import?`)) {
        return
      }
    }

    setImporting(true)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch(`/api/content-batches/${batchId}/import-csv`, {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()
      if (data.success) {
        alert(`Successfully imported ${data.imported} posts${data.errors ? ` (${data.errors.length} skipped due to errors)` : ''}`)
        onImportComplete()
        handleClose()
      } else {
        alert(`Import failed: ${data.error}`)
      }
    } catch (error) {
      console.error('Import error:', error)
      alert('Failed to import CSV file')
    } finally {
      setImporting(false)
    }
  }

  const handleClose = () => {
    setFile(null)
    setParsedData([])
    setParseError(null)
    onClose()
  }

  const validRows = parsedData.filter(row => row.errors.length === 0)
  const rowsWithErrors = parsedData.filter(row => row.errors.length > 0)
  const rowsWithWarnings = parsedData.filter(row => row.warnings.length > 0 && row.errors.length === 0)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <Upload className="w-6 h-6 text-indigo-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Import Topics from CSV</h2>
              <p className="text-sm text-gray-600 mt-1">
                Preview and validate your CSV data before importing
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {!file && (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">Select a CSV file to preview</p>
              <p className="text-sm text-gray-500 mb-6">
                Required columns: topic (or title/post_title)<br />
                Optional columns: keywords, target_audience, template
              </p>
              <label className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors cursor-pointer">
                <Upload className="w-5 h-5" />
                Choose CSV File
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
            </div>
          )}

          {loading && (
            <div className="text-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-gray-600">Parsing CSV file...</p>
            </div>
          )}

          {parseError && (
            <Card className="p-6 border-red-200 bg-red-50">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-red-600 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-red-900 mb-2">Parse Error</h3>
                  <p className="text-red-700">{parseError}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={() => {
                      setFile(null)
                      setParseError(null)
                    }}
                  >
                    Try Again
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {file && !loading && !parseError && parsedData.length > 0 && (
            <div className="space-y-6">
              {/* Summary */}
              <Card className="p-4 bg-gray-50">
                <div className="grid grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-gray-900">{parsedData.length}</div>
                    <div className="text-sm text-gray-600">Total Rows</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">{validRows.length}</div>
                    <div className="text-sm text-gray-600">Valid</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-yellow-600">{rowsWithWarnings.length}</div>
                    <div className="text-sm text-gray-600">Warnings</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-red-600">{rowsWithErrors.length}</div>
                    <div className="text-sm text-gray-600">Errors</div>
                  </div>
                </div>
              </Card>

              {/* Data Preview */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Data Preview</h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {parsedData.map((row) => (
                    <Card
                      key={row.rowNumber}
                      className={`p-4 ${
                        row.errors.length > 0
                          ? 'border-red-200 bg-red-50'
                          : row.warnings.length > 0
                          ? 'border-yellow-200 bg-yellow-50'
                          : 'border-green-200 bg-green-50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="text-xs">
                              Row {row.rowNumber}
                            </Badge>
                            {row.errors.length === 0 && row.warnings.length === 0 && (
                              <CheckCircle2 className="w-4 h-4 text-green-600" />
                            )}
                            {row.errors.length > 0 && (
                              <AlertCircle className="w-4 h-4 text-red-600" />
                            )}
                            {row.warnings.length > 0 && row.errors.length === 0 && (
                              <AlertCircle className="w-4 h-4 text-yellow-600" />
                            )}
                          </div>

                          <div className="space-y-1 text-sm">
                            <div>
                              <span className="font-medium text-gray-700">Topic:</span>{' '}
                              <span className="text-gray-900">{row.topic || '(empty)'}</span>
                            </div>
                            {row.keywords && (
                              <div>
                                <span className="font-medium text-gray-700">Keywords:</span>{' '}
                                <span className="text-gray-900">{row.keywords}</span>
                              </div>
                            )}
                            {row.target_audience && (
                              <div>
                                <span className="font-medium text-gray-700">Audience:</span>{' '}
                                <span className="text-gray-900">{row.target_audience}</span>
                              </div>
                            )}
                          </div>

                          {/* Errors */}
                          {row.errors.length > 0 && (
                            <div className="mt-3 space-y-1">
                              {row.errors.map((error, idx) => (
                                <div key={idx} className="flex items-center gap-2 text-sm text-red-700">
                                  <AlertCircle className="w-4 h-4" />
                                  {error}
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Warnings */}
                          {row.warnings.length > 0 && (
                            <div className="mt-3 space-y-1">
                              {row.warnings.map((warning, idx) => (
                                <div key={idx} className="flex items-center gap-2 text-sm text-yellow-700">
                                  <AlertCircle className="w-4 h-4" />
                                  {warning}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {file && !loading && !parseError && parsedData.length > 0 && (
          <div className="border-t p-6 flex items-center justify-between bg-gray-50">
            <div className="text-sm text-gray-600">
              {rowsWithErrors.length > 0 && (
                <span className="text-red-600 font-medium">
                  {rowsWithErrors.length} rows will be skipped due to errors
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={importing}
              >
                Cancel
              </Button>
              <Button
                onClick={handleImport}
                disabled={importing || validRows.length === 0}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {importing ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                    Importing...
                  </>
                ) : (
                  `Import ${validRows.length} ${validRows.length === 1 ? 'Post' : 'Posts'}`
                )}
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
