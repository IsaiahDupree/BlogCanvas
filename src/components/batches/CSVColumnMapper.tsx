'use client'

import { useState, useEffect } from 'react'
import { Settings, Save, X, Plus, Trash2, Star, Check } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface ColumnMapping {
  internalField: string
  csvColumn: string
  label: string
  required: boolean
  description?: string
}

interface CustomField {
  name: string
  csvColumn: string
  type: 'text' | 'number' | 'date' | 'boolean'
}

interface SavedMapping {
  id: string
  mapping_name: string
  column_mapping: Record<string, string>
  custom_fields: CustomField[]
  is_default: boolean
}

interface CSVColumnMapperProps {
  csvHeaders: string[]
  onMappingChange: (mapping: Record<string, string>, customFields: CustomField[]) => void
  clientId: string
  initialMapping?: Record<string, string>
  initialCustomFields?: CustomField[]
}

// Standard internal fields for blog posts
const STANDARD_FIELDS: ColumnMapping[] = [
  {
    internalField: 'topic',
    csvColumn: '',
    label: 'Topic/Title',
    required: true,
    description: 'The blog post topic or title'
  },
  {
    internalField: 'target_keyword',
    csvColumn: '',
    label: 'Target Keyword',
    required: false,
    description: 'Primary SEO keyword to target'
  },
  {
    internalField: 'target_wordcount',
    csvColumn: '',
    label: 'Target Word Count',
    required: false,
    description: 'Desired length of the post'
  },
  {
    internalField: 'topic_cluster',
    csvColumn: '',
    label: 'Topic Cluster',
    required: false,
    description: 'Content cluster or category'
  },
  {
    internalField: 'search_intent',
    csvColumn: '',
    label: 'Search Intent',
    required: false,
    description: 'informational, commercial, transactional, or navigational'
  },
  {
    internalField: 'tone_voice',
    csvColumn: '',
    label: 'Tone of Voice',
    required: false,
    description: 'professional, casual, friendly, authoritative, etc.'
  },
  {
    internalField: 'priority',
    csvColumn: '',
    label: 'Priority',
    required: false,
    description: 'Numeric priority (0-10)'
  },
  {
    internalField: 'notes',
    csvColumn: '',
    label: 'Notes/Description',
    required: false,
    description: 'Additional notes or instructions'
  },
  {
    internalField: 'due_date',
    csvColumn: '',
    label: 'Due Date',
    required: false,
    description: 'Deadline for this post'
  },
  {
    internalField: 'publish_window_start',
    csvColumn: '',
    label: 'Publish Window Start',
    required: false,
    description: 'Earliest publish date'
  },
  {
    internalField: 'publish_window_end',
    csvColumn: '',
    label: 'Publish Window End',
    required: false,
    description: 'Latest publish date'
  }
]

export default function CSVColumnMapper({
  csvHeaders,
  onMappingChange,
  clientId,
  initialMapping,
  initialCustomFields
}: CSVColumnMapperProps) {
  const [mappings, setMappings] = useState<ColumnMapping[]>(STANDARD_FIELDS)
  const [customFields, setCustomFields] = useState<CustomField[]>(initialCustomFields || [])
  const [savedMappings, setSavedMappings] = useState<SavedMapping[]>([])
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [newMappingName, setNewMappingName] = useState('')
  const [setAsDefault, setSetAsDefault] = useState(false)
  const [loading, setLoading] = useState(false)

  // Auto-detect column mapping on mount
  useEffect(() => {
    if (initialMapping && Object.keys(initialMapping).length > 0) {
      // Use provided initial mapping
      applyMapping(initialMapping, initialCustomFields || [])
    } else {
      // Auto-detect mapping
      autoDetectMapping()
    }
    loadSavedMappings()
  }, [csvHeaders])

  const autoDetectMapping = () => {
    const newMappings = [...STANDARD_FIELDS]

    for (let i = 0; i < newMappings.length; i++) {
      const field = newMappings[i]
      const csvHeader = findBestMatch(field.internalField, csvHeaders)
      if (csvHeader) {
        newMappings[i] = { ...field, csvColumn: csvHeader }
      }
    }

    setMappings(newMappings)
    notifyMappingChange(newMappings, customFields)
  }

  const findBestMatch = (internalField: string, headers: string[]): string | null => {
    const synonyms: Record<string, string[]> = {
      'topic': ['topic', 'title', 'post_title', 'post title', 'name', 'subject'],
      'target_keyword': ['target_keyword', 'keyword', 'keywords', 'target keywords', 'seo keyword'],
      'target_wordcount': ['target_wordcount', 'wordcount', 'word count', 'length', 'target length'],
      'topic_cluster': ['topic_cluster', 'cluster', 'category', 'topic category', 'content cluster'],
      'search_intent': ['search_intent', 'intent', 'search type', 'query intent'],
      'tone_voice': ['tone_voice', 'tone', 'voice', 'tone of voice', 'writing style'],
      'priority': ['priority', 'importance', 'rank'],
      'notes': ['notes', 'description', 'comments', 'instructions', 'additional notes'],
      'due_date': ['due_date', 'due date', 'deadline', 'target date'],
      'publish_window_start': ['publish_window_start', 'publish window start', 'earliest publish', 'start date'],
      'publish_window_end': ['publish_window_end', 'publish window end', 'latest publish', 'end date']
    }

    const possibleMatches = synonyms[internalField] || [internalField]

    for (const header of headers) {
      const normalizedHeader = header.toLowerCase().trim()
      if (possibleMatches.some(match => normalizedHeader === match.toLowerCase())) {
        return header
      }
    }

    // Partial match
    for (const header of headers) {
      const normalizedHeader = header.toLowerCase().trim()
      if (possibleMatches.some(match => normalizedHeader.includes(match.toLowerCase()))) {
        return header
      }
    }

    return null
  }

  const handleMappingChange = (internalField: string, csvColumn: string) => {
    const newMappings = mappings.map(m =>
      m.internalField === internalField ? { ...m, csvColumn } : m
    )
    setMappings(newMappings)
    notifyMappingChange(newMappings, customFields)
  }

  const addCustomField = () => {
    const newField: CustomField = {
      name: `custom_field_${customFields.length + 1}`,
      csvColumn: '',
      type: 'text'
    }
    const newCustomFields = [...customFields, newField]
    setCustomFields(newCustomFields)
    notifyMappingChange(mappings, newCustomFields)
  }

  const updateCustomField = (index: number, updates: Partial<CustomField>) => {
    const newCustomFields = customFields.map((field, i) =>
      i === index ? { ...field, ...updates } : field
    )
    setCustomFields(newCustomFields)
    notifyMappingChange(mappings, newCustomFields)
  }

  const removeCustomField = (index: number) => {
    const newCustomFields = customFields.filter((_, i) => i !== index)
    setCustomFields(newCustomFields)
    notifyMappingChange(mappings, newCustomFields)
  }

  const notifyMappingChange = (currentMappings: ColumnMapping[], currentCustomFields: CustomField[]) => {
    const mappingObject: Record<string, string> = {}
    currentMappings.forEach(m => {
      if (m.csvColumn) {
        mappingObject[m.internalField] = m.csvColumn
      }
    })
    onMappingChange(mappingObject, currentCustomFields)
  }

  const loadSavedMappings = async () => {
    try {
      const response = await fetch(`/api/csv-mappings?client_id=${clientId}`)
      if (response.ok) {
        const data = await response.json()
        setSavedMappings(data.mappings || [])
      }
    } catch (error) {
      console.error('Failed to load saved mappings:', error)
    }
  }

  const applySavedMapping = (savedMapping: SavedMapping) => {
    applyMapping(savedMapping.column_mapping, savedMapping.custom_fields)

    // Update last_used_at
    fetch(`/api/csv-mappings/${savedMapping.id}/use`, { method: 'POST' })
  }

  const applyMapping = (columnMapping: Record<string, string>, customFieldsDef: CustomField[]) => {
    const newMappings = STANDARD_FIELDS.map(field => ({
      ...field,
      csvColumn: columnMapping[field.internalField] || ''
    }))
    setMappings(newMappings)
    setCustomFields(customFieldsDef)
    notifyMappingChange(newMappings, customFieldsDef)
  }

  const saveMapping = async () => {
    if (!newMappingName.trim()) {
      alert('Please enter a name for this mapping')
      return
    }

    setLoading(true)
    try {
      const mappingObject: Record<string, string> = {}
      mappings.forEach(m => {
        if (m.csvColumn) {
          mappingObject[m.internalField] = m.csvColumn
        }
      })

      const response = await fetch('/api/csv-mappings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: clientId,
          mapping_name: newMappingName,
          column_mapping: mappingObject,
          custom_fields: customFields,
          is_default: setAsDefault
        })
      })

      if (response.ok) {
        alert('Mapping saved successfully')
        setShowSaveDialog(false)
        setNewMappingName('')
        setSetAsDefault(false)
        loadSavedMappings()
      } else {
        const data = await response.json()
        alert(`Failed to save mapping: ${data.error}`)
      }
    } catch (error) {
      console.error('Save error:', error)
      alert('Failed to save mapping')
    } finally {
      setLoading(false)
    }
  }

  const deleteMapping = async (id: string) => {
    if (!confirm('Delete this mapping preset?')) return

    try {
      const response = await fetch(`/api/csv-mappings/${id}`, { method: 'DELETE' })
      if (response.ok) {
        loadSavedMappings()
      }
    } catch (error) {
      console.error('Delete error:', error)
    }
  }

  const requiredFieldsMapped = mappings
    .filter(m => m.required)
    .every(m => m.csvColumn)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Settings className="w-5 h-5 text-indigo-600" />
            Column Mapping
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Map CSV columns to blog post fields
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowSaveDialog(true)}
          disabled={!requiredFieldsMapped}
        >
          <Save className="w-4 h-4 mr-2" />
          Save Mapping
        </Button>
      </div>

      {/* Saved Mappings */}
      {savedMappings.length > 0 && (
        <Card className="p-4 bg-gray-50">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Saved Mapping Presets</h4>
          <div className="flex flex-wrap gap-2">
            {savedMappings.map(mapping => (
              <div
                key={mapping.id}
                className="flex items-center gap-2 bg-white border rounded-lg px-3 py-2 hover:border-indigo-500 transition-colors"
              >
                <button
                  onClick={() => applySavedMapping(mapping)}
                  className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-indigo-600"
                >
                  {mapping.is_default && <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />}
                  {mapping.mapping_name}
                </button>
                <button
                  onClick={() => deleteMapping(mapping.id)}
                  className="text-gray-400 hover:text-red-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Standard Fields Mapping */}
      <Card className="p-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Standard Fields</h4>
        <div className="space-y-3">
          {mappings.map(field => (
            <div key={field.internalField} className="grid grid-cols-3 gap-4 items-center">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900">{field.label}</span>
                  {field.required && <Badge variant="destructive" className="text-xs">Required</Badge>}
                </div>
                {field.description && (
                  <p className="text-xs text-gray-500 mt-1">{field.description}</p>
                )}
              </div>
              <div className="text-sm text-gray-600 text-center">→</div>
              <select
                value={field.csvColumn}
                onChange={(e) => handleMappingChange(field.internalField, e.target.value)}
                className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">-- Not Mapped --</option>
                {csvHeaders.map(header => (
                  <option key={header} value={header}>{header}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </Card>

      {/* Custom Fields */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-gray-700">Custom Fields</h4>
          <Button
            variant="outline"
            size="sm"
            onClick={addCustomField}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Custom Field
          </Button>
        </div>

        {customFields.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">
            No custom fields defined. Click "Add Custom Field" to create one.
          </p>
        ) : (
          <div className="space-y-3">
            {customFields.map((field, index) => (
              <div key={index} className="grid grid-cols-4 gap-3 items-center p-3 bg-gray-50 rounded-lg">
                <input
                  type="text"
                  value={field.name}
                  onChange={(e) => updateCustomField(index, { name: e.target.value })}
                  placeholder="Field name"
                  className="px-3 py-2 border rounded-lg text-sm"
                />
                <select
                  value={field.csvColumn}
                  onChange={(e) => updateCustomField(index, { csvColumn: e.target.value })}
                  className="px-3 py-2 border rounded-lg text-sm"
                >
                  <option value="">-- Select CSV Column --</option>
                  {csvHeaders.map(header => (
                    <option key={header} value={header}>{header}</option>
                  ))}
                </select>
                <select
                  value={field.type}
                  onChange={(e) => updateCustomField(index, { type: e.target.value as any })}
                  className="px-3 py-2 border rounded-lg text-sm"
                >
                  <option value="text">Text</option>
                  <option value="number">Number</option>
                  <option value="date">Date</option>
                  <option value="boolean">Boolean</option>
                </select>
                <button
                  onClick={() => removeCustomField(index)}
                  className="text-red-600 hover:text-red-700 justify-self-end"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Validation Warning */}
      {!requiredFieldsMapped && (
        <Card className="p-4 border-yellow-200 bg-yellow-50">
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-yellow-500 text-white flex items-center justify-center flex-shrink-0 mt-0.5">
              !
            </div>
            <div>
              <h4 className="font-semibold text-yellow-900 mb-1">Required Fields Missing</h4>
              <p className="text-sm text-yellow-800">
                Please map all required fields before proceeding with the import.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Save Mapping Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Save Mapping Preset</h3>
              <button
                onClick={() => setShowSaveDialog(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mapping Name
                </label>
                <input
                  type="text"
                  value={newMappingName}
                  onChange={(e) => setNewMappingName(e.target.value)}
                  placeholder="e.g., Standard Format, Agency Template"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={setAsDefault}
                  onChange={(e) => setSetAsDefault(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-700">Set as default mapping for this client</span>
              </label>

              <div className="flex items-center gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowSaveDialog(false)}
                  disabled={loading}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={saveMapping}
                  disabled={loading || !newMappingName.trim()}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Save Mapping
                    </>
                  )}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
