'use client'

import { useState, useEffect } from 'react'
import { X, Upload, AlertCircle, CheckCircle2, FileText, ArrowRight } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import CSVColumnMapper from './CSVColumnMapper'

interface CSVRow {
  rowNumber: number
  data: Record<string, any>
  errors: string[]
  warnings: string[]
}

interface CSVImportModalProps {
  isOpen: boolean
  onClose: () => void
  batchId: string
  clientId: string
  onImportComplete: () => void
}

interface CustomField {
  name: string
  csvColumn: string
  type: 'text' | 'number' | 'date' | 'boolean'
}

export default function CSVImportModalV2({ isOpen, onClose, batchId, clientId, onImportComplete }: CSVImportModalProps) {
  const [step, setStep] = useState<'upload' | 'mapping' | 'preview'>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [csvHeaders, setCsvHeaders] = useState<string[]>([])
  const [csvData, setCsvData] = useState<string[][]>([])
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({})
  const [customFields, setCustomFields] = useState<CustomField[]>([])
  const [parsedData, setParsedData] = useState<CSVRow[]>([])
  const [loading, setLoading] = useState(false)
  const [importing, setImporting] = useState(false)
  const [parseError, setParseError] = useState<string | null>(null)

  if (!isOpen) return null

  const parseCSVFile = (text: string): { headers: string[], data: string[][] } => {
    const lines = text.split('\n').filter(line => line.trim())
    if (lines.length === 0) {
      throw new Error('CSV file is empty')
    }

    // Simple CSV parser (handles basic cases)
    const parseCSVLine = (line: string): string[] => {
      const result: string[] = []
      let current = ''
      let inQuotes = false

      for (let i = 0; i < line.length; i++) {
        const char = line[i]

        if (char === '"') {
          inQuotes = !inQuotes
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim())
          current = ''
        } else {
          current += char
        }
      }
      result.push(current.trim())
      return result
    }

    const headers = parseCSVLine(lines[0])
    const data = lines.slice(1).map(line => parseCSVLine(line))

    return { headers, data }
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

    try {
      const text = await selectedFile.text()
      const { headers, data } = parseCSVFile(text)
      setCsvHeaders(headers)
      setCsvData(data)
      setStep('mapping')
    } catch (error: any) {
      console.error('Parse error:', error)
      setParseError(error.message || 'Failed to parse CSV file')
    } finally {
      setLoading(false)
    }
  }

  const handleMappingComplete = (mapping: Record<string, string>, customFieldsDef: CustomField[]) => {
    setColumnMapping(mapping)
    setCustomFields(customFieldsDef)
  }

  const handleProceedToPreview = () => {
    // Validate and transform data based on mapping
    const transformed = validateAndTransformData()
    setParsedData(transformed)
    setStep('preview')
  }

  const validateAndTransformData = (): CSVRow[] => {
    const rows: CSVRow[] = []

    for (let i = 0; i < csvData.length; i++) {
      const rowData = csvData[i]
      const transformedData: Record<string, any> = {}
      const errors: string[] = []
      const warnings: string[] = []

      // Map standard fields
      for (const [internalField, csvColumn] of Object.entries(columnMapping)) {
        const headerIndex = csvHeaders.indexOf(csvColumn)
        if (headerIndex >= 0 && rowData[headerIndex]) {
          transformedData[internalField] = rowData[headerIndex]
        }
      }

      // Map custom fields
      for (const customField of customFields) {
        if (customField.csvColumn) {
          const headerIndex = csvHeaders.indexOf(customField.csvColumn)
          if (headerIndex >= 0 && rowData[headerIndex]) {
            let value = rowData[headerIndex]

            // Type conversion
            if (customField.type === 'number') {
              value = parseFloat(value) || 0
            } else if (customField.type === 'boolean') {
              value = value.toLowerCase() === 'true' || value === '1'
            }

            transformedData[customField.name] = value
          }
        }
      }

      // Validation
      const topic = transformedData.topic || ''
      if (!topic) {
        errors.push('Topic is required')
      } else if (topic.length < 10) {
        warnings.push('Topic is very short (< 10 characters)')
      } else if (topic.length > 200) {
        errors.push('Topic is too long (> 200 characters)')
      }

      const targetWordcount = transformedData.target_wordcount
      if (targetWordcount && (isNaN(targetWordcount) || targetWordcount < 0)) {
        warnings.push('Invalid word count')
      }

      rows.push({
        rowNumber: i + 2, // +2 because header is row 1, and array is 0-indexed
        data: transformedData,
        errors,
        warnings
      })
    }

    return rows
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
      formData.append('column_mapping', JSON.stringify(columnMapping))
      formData.append('custom_fields', JSON.stringify(customFields))

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
    setStep('upload')
    setFile(null)
    setCsvHeaders([])
    setCsvData([])
    setColumnMapping({})
    setCustomFields([])
    setParsedData([])
    setParseError(null)
    onClose()
  }

  const validRows = parsedData.filter(row => row.errors.length === 0)
  const rowsWithErrors = parsedData.filter(row => row.errors.length > 0)
  const rowsWithWarnings = parsedData.filter(row => row.warnings.length > 0 && row.errors.length === 0)

  const canProceedToPreview = Object.keys(columnMapping).length > 0 && columnMapping.topic

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <Upload className="w-6 h-6 text-indigo-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Import Topics from CSV</h2>
              <p className="text-sm text-gray-600 mt-1">
                {step === 'upload' && 'Select a CSV file to get started'}
                {step === 'mapping' && 'Map CSV columns to blog post fields'}
                {step === 'preview' && 'Preview and validate your data before importing'}
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

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-4 p-4 bg-gray-50 border-b">
          <div className={`flex items-center gap-2 ${step === 'upload' ? 'text-indigo-600 font-semibold' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'upload' ? 'bg-indigo-600 text-white' : 'bg-gray-300 text-gray-600'}`}>
              1
            </div>
            <span className="text-sm">Upload CSV</span>
          </div>
          <ArrowRight className="w-5 h-5 text-gray-400" />
          <div className={`flex items-center gap-2 ${step === 'mapping' ? 'text-indigo-600 font-semibold' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'mapping' ? 'bg-indigo-600 text-white' : 'bg-gray-300 text-gray-600'}`}>
              2
            </div>
            <span className="text-sm">Map Columns</span>
          </div>
          <ArrowRight className="w-5 h-5 text-gray-400" />
          <div className={`flex items-center gap-2 ${step === 'preview' ? 'text-indigo-600 font-semibold' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'preview' ? 'bg-indigo-600 text-white' : 'bg-gray-300 text-gray-600'}`}>
              3
            </div>
            <span className="text-sm">Preview & Import</span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Step 1: Upload */}
          {step === 'upload' && (
            <>
              {!file && !loading && (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">Select a CSV file to preview</p>
                  <p className="text-sm text-gray-500 mb-6">
                    Your CSV file should have a header row with column names.<br />
                    You'll be able to map columns in the next step.
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
            </>
          )}

          {/* Step 2: Column Mapping */}
          {step === 'mapping' && (
            <CSVColumnMapper
              csvHeaders={csvHeaders}
              onMappingChange={handleMappingComplete}
              clientId={clientId}
            />
          )}

          {/* Step 3: Preview */}
          {step === 'preview' && parsedData.length > 0 && (
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
                  {parsedData.slice(0, 20).map((row) => (
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
                            {Object.entries(row.data).map(([key, value]) => (
                              <div key={key}>
                                <span className="font-medium text-gray-700 capitalize">{key.replace(/_/g, ' ')}:</span>{' '}
                                <span className="text-gray-900">{value?.toString() || '(empty)'}</span>
                              </div>
                            ))}
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
                  {parsedData.length > 20 && (
                    <p className="text-sm text-gray-500 text-center py-2">
                      ...and {parsedData.length - 20} more rows
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-6 flex items-center justify-between bg-gray-50">
          <div className="text-sm text-gray-600">
            {step === 'preview' && rowsWithErrors.length > 0 && (
              <span className="text-red-600 font-medium">
                {rowsWithErrors.length} rows will be skipped due to errors
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {step === 'mapping' && (
              <Button
                variant="outline"
                onClick={() => setStep('upload')}
              >
                Back
              </Button>
            )}
            {step === 'preview' && (
              <Button
                variant="outline"
                onClick={() => setStep('mapping')}
                disabled={importing}
              >
                Back to Mapping
              </Button>
            )}
            {step === 'upload' && file && !loading && (
              <Button
                onClick={handleClose}
              >
                Cancel
              </Button>
            )}
            {step === 'mapping' && (
              <Button
                onClick={handleProceedToPreview}
                disabled={!canProceedToPreview}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                Continue to Preview
              </Button>
            )}
            {step === 'preview' && (
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
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}
