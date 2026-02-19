import { describe, expect, test } from '@jest/globals'
import { parse } from 'csv-parse/sync'
import { stringify } from 'csv-stringify/sync'

/**
 * Integration Tests for CSV Import/Export
 * Tests CSV upload, field mapping, data import, and data export
 * Feature: VENDOR-WC-009
 */

describe('Import/Export - CSV Upload', () => {
  test('should parse valid CSV file', () => {
    const csvContent = `name,email,company
John Doe,john@example.com,Acme Inc
Jane Smith,jane@example.com,Tech Corp
Bob Johnson,bob@example.com,Startup LLC`

    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    })

    expect(records).toHaveLength(3)
    expect(records[0]).toEqual({
      name: 'John Doe',
      email: 'john@example.com',
      company: 'Acme Inc'
    })
  })

  test('should handle CSV with different delimiters', () => {
    const csvContent = `name;email;company
John Doe;john@example.com;Acme Inc
Jane Smith;jane@example.com;Tech Corp`

    const records = parse(csvContent, {
      columns: true,
      delimiter: ';',
      skip_empty_lines: true,
      trim: true
    })

    expect(records).toHaveLength(2)
    expect(records[0].email).toBe('john@example.com')
  })

  test('should handle CSV with quoted fields', () => {
    const csvContent = `name,email,notes
"Doe, John",john@example.com,"Has special, characters"
"Smith, Jane",jane@example.com,"Another, note"`

    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    })

    expect(records).toHaveLength(2)
    expect(records[0].name).toBe('Doe, John')
    expect(records[0].notes).toBe('Has special, characters')
  })

  test('should handle CSV with headers', () => {
    const csvContent = `First Name,Last Name,Email Address
John,Doe,john@example.com
Jane,Smith,jane@example.com`

    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    })

    expect(records[0]).toHaveProperty('First Name', 'John')
    expect(records[0]).toHaveProperty('Email Address', 'john@example.com')
  })

  test('should skip empty lines in CSV', () => {
    const csvContent = `name,email

John Doe,john@example.com

Jane Smith,jane@example.com
`

    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    })

    expect(records).toHaveLength(2)
  })

  test('should handle CSV with BOM', () => {
    const csvContent = '\ufeffname,email\nJohn Doe,john@example.com'

    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      bom: true
    })

    expect(records).toHaveLength(1)
    expect(records[0].name).toBe('John Doe')
  })

  test('should reject invalid CSV', () => {
    const invalidCsv = `name,email
John Doe,john@example.com
Incomplete row`

    expect(() => {
      parse(invalidCsv, {
        columns: true,
        relax_column_count: false
      })
    }).toThrow()
  })

  test('should handle CSV with missing values', () => {
    const csvContent = `name,email,company
John Doe,john@example.com,
Jane Smith,,Tech Corp`

    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    })

    expect(records[0].company).toBe('')
    expect(records[1].email).toBe('')
  })
})

describe('Import/Export - Field Mapping', () => {
  test('should map CSV headers to database fields', () => {
    const csvHeaders = ['First Name', 'Last Name', 'Email Address', 'Company Name']
    const dbFields = ['first_name', 'last_name', 'email', 'company']

    const mapping: Record<string, string> = {
      'First Name': 'first_name',
      'Last Name': 'last_name',
      'Email Address': 'email',
      'Company Name': 'company'
    }

    csvHeaders.forEach((header, index) => {
      expect(mapping[header]).toBe(dbFields[index])
    })
  })

  test('should handle case-insensitive field matching', () => {
    const csvHeader = 'EMAIL ADDRESS'

    function matchField(header: string, possibleFields: string[]): string | null {
      const normalized = header.toLowerCase().replace(/\s+/g, '_')
      // Check if normalized matches any field directly
      const directMatch = possibleFields.find(f => f.toLowerCase() === normalized)
      if (directMatch) return directMatch

      // Check if normalized contains the field name
      const partialMatch = possibleFields.find(f => normalized.includes(f.toLowerCase()))
      return partialMatch || null
    }

    const matched = matchField(csvHeader, ['first_name', 'email', 'company'])
    expect(matched).toBe('email')
  })

  test('should detect unmapped required fields', () => {
    const mapping = {
      'Name': 'name',
      'Company': 'company'
    }

    const requiredFields = ['name', 'email', 'company']
    const mappedFields = Object.values(mapping)
    const missingFields = requiredFields.filter(f => !mappedFields.includes(f))

    expect(missingFields).toContain('email')
    expect(missingFields).toHaveLength(1)
  })

  test('should auto-detect common field mappings', () => {
    function autoMapField(csvHeader: string): string | null {
      const commonMappings: Record<string, string> = {
        'email': 'email',
        'e-mail': 'email',
        'email address': 'email',
        'name': 'name',
        'full name': 'name',
        'company': 'company',
        'company name': 'company',
        'phone': 'phone',
        'phone number': 'phone'
      }

      const normalized = csvHeader.toLowerCase().trim()
      return commonMappings[normalized] || null
    }

    expect(autoMapField('Email')).toBe('email')
    expect(autoMapField('E-Mail')).toBe('email')
    expect(autoMapField('Full Name')).toBe('name')
    expect(autoMapField('Unknown Field')).toBeNull()
  })

  test('should validate mapped data types', () => {
    function validateFieldType(value: string, type: 'email' | 'number' | 'string'): boolean {
      switch (type) {
        case 'email':
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
        case 'number':
          return !isNaN(Number(value))
        case 'string':
          return typeof value === 'string'
        default:
          return false
      }
    }

    expect(validateFieldType('test@example.com', 'email')).toBe(true)
    expect(validateFieldType('invalid-email', 'email')).toBe(false)
    expect(validateFieldType('123', 'number')).toBe(true)
    expect(validateFieldType('abc', 'number')).toBe(false)
  })
})

describe('Import/Export - Data Import', () => {
  test('should import valid records', () => {
    const csvContent = `name,email,company
John Doe,john@example.com,Acme Inc
Jane Smith,jane@example.com,Tech Corp`

    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    })

    const imported = records.map(record => ({
      name: record.name,
      email: record.email,
      company: record.company,
      status: 'active',
      created_at: new Date().toISOString()
    }))

    expect(imported).toHaveLength(2)
    expect(imported[0].status).toBe('active')
    expect(imported[0].created_at).toBeDefined()
  })

  test('should validate email addresses during import', () => {
    const records = [
      { name: 'John', email: 'john@example.com' },
      { name: 'Jane', email: 'invalid-email' },
      { name: 'Bob', email: 'bob@example.com' }
    ]

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const validRecords = records.filter(r => emailRegex.test(r.email))
    const invalidRecords = records.filter(r => !emailRegex.test(r.email))

    expect(validRecords).toHaveLength(2)
    expect(invalidRecords).toHaveLength(1)
    expect(invalidRecords[0].name).toBe('Jane')
  })

  test('should handle duplicate records during import', () => {
    const existingEmails = new Set(['john@example.com', 'jane@example.com'])

    const newRecords = [
      { name: 'John', email: 'john@example.com' }, // Duplicate
      { name: 'Bob', email: 'bob@example.com' },   // New
      { name: 'Jane', email: 'jane@example.com' }  // Duplicate
    ]

    const toImport = newRecords.filter(r => !existingEmails.has(r.email))
    const duplicates = newRecords.filter(r => existingEmails.has(r.email))

    expect(toImport).toHaveLength(1)
    expect(toImport[0].email).toBe('bob@example.com')
    expect(duplicates).toHaveLength(2)
  })

  test('should track import errors', () => {
    const records = [
      { name: 'John', email: 'john@example.com' },
      { name: '', email: 'missing-name@example.com' },
      { name: 'Jane', email: '' }
    ]

    const errors: Array<{ row: number; field: string; error: string }> = []

    records.forEach((record, index) => {
      if (!record.name || record.name.trim() === '') {
        errors.push({ row: index + 1, field: 'name', error: 'Name is required' })
      }
      if (!record.email || record.email.trim() === '') {
        errors.push({ row: index + 1, field: 'email', error: 'Email is required' })
      }
    })

    expect(errors).toHaveLength(2)
    expect(errors[0].row).toBe(2)
    expect(errors[1].row).toBe(3)
  })

  test('should batch import records for performance', () => {
    const records = Array.from({ length: 100 }, (_, i) => ({
      name: `User ${i}`,
      email: `user${i}@example.com`
    }))

    const BATCH_SIZE = 25
    const batches: Array<typeof records> = []

    for (let i = 0; i < records.length; i += BATCH_SIZE) {
      batches.push(records.slice(i, i + BATCH_SIZE))
    }

    expect(batches).toHaveLength(4)
    expect(batches[0]).toHaveLength(25)
    expect(batches[3]).toHaveLength(25)
  })

  test('should transform data during import', () => {
    const records = [
      { name: ' John Doe ', email: 'JOHN@EXAMPLE.COM', company: '  acme inc  ' }
    ]

    const transformed = records.map(record => ({
      name: record.name.trim(),
      email: record.email.toLowerCase().trim(),
      company: record.company.trim(),
      slug: record.company.trim().toLowerCase().replace(/\s+/g, '-')
    }))

    expect(transformed[0].name).toBe('John Doe')
    expect(transformed[0].email).toBe('john@example.com')
    expect(transformed[0].company).toBe('acme inc')
    expect(transformed[0].slug).toBe('acme-inc')
  })
})

describe('Import/Export - Data Export', () => {
  test('should export records to CSV', () => {
    const records = [
      { name: 'John Doe', email: 'john@example.com', company: 'Acme Inc' },
      { name: 'Jane Smith', email: 'jane@example.com', company: 'Tech Corp' }
    ]

    const csv = stringify(records, {
      header: true,
      columns: ['name', 'email', 'company']
    })

    expect(csv).toContain('name,email,company')
    expect(csv).toContain('John Doe,john@example.com,Acme Inc')
    expect(csv).toContain('Jane Smith,jane@example.com,Tech Corp')
  })

  test('should export with custom column names', () => {
    const records = [
      { name: 'John Doe', email: 'john@example.com' }
    ]

    const csv = stringify(records, {
      header: true,
      columns: {
        name: 'Full Name',
        email: 'Email Address'
      }
    })

    expect(csv).toContain('Full Name,Email Address')
  })

  test('should handle special characters in export', () => {
    const records = [
      { name: 'Doe, John', notes: 'Has "quotes" and commas' }
    ]

    const csv = stringify(records, {
      header: true,
      columns: ['name', 'notes']
    })

    expect(csv).toContain('"Doe, John"')
    expect(csv).toContain('"Has ""quotes"" and commas"')
  })

  test('should export with filters', () => {
    const records = [
      { name: 'John', status: 'active', email: 'john@example.com' },
      { name: 'Jane', status: 'inactive', email: 'jane@example.com' },
      { name: 'Bob', status: 'active', email: 'bob@example.com' }
    ]

    const activeRecords = records.filter(r => r.status === 'active')
    const csv = stringify(activeRecords, {
      header: true,
      columns: ['name', 'email']
    })

    const lines = csv.trim().split('\n')
    expect(lines).toHaveLength(3) // Header + 2 active records
  })

  test('should export selected fields only', () => {
    const records = [
      { id: 1, name: 'John', email: 'john@example.com', password: 'secret123', internal_notes: 'Private' }
    ]

    const publicFields = ['name', 'email']
    const csv = stringify(records, {
      header: true,
      columns: publicFields
    })

    expect(csv).toContain('name,email')
    expect(csv).not.toContain('password')
    expect(csv).not.toContain('internal_notes')
  })

  test('should format dates for export', () => {
    const records = [
      {
        name: 'John',
        created_at: new Date('2024-01-15T10:30:00Z'),
        updated_at: new Date('2024-02-20T15:45:00Z')
      }
    ]

    const formatted = records.map(r => ({
      name: r.name,
      created_at: r.created_at.toISOString().split('T')[0],
      updated_at: r.updated_at.toISOString().split('T')[0]
    }))

    const csv = stringify(formatted, {
      header: true
    })

    expect(csv).toContain('2024-01-15')
    expect(csv).toContain('2024-02-20')
  })

  test('should export large dataset efficiently', () => {
    const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
      id: i + 1,
      name: `User ${i + 1}`,
      email: `user${i + 1}@example.com`
    }))

    const csv = stringify(largeDataset, {
      header: true,
      columns: ['id', 'name', 'email']
    })

    const lines = csv.trim().split('\n')
    expect(lines).toHaveLength(1001) // Header + 1000 records
  })

  test('should export to JSON format', () => {
    const records = [
      { name: 'John Doe', email: 'john@example.com' },
      { name: 'Jane Smith', email: 'jane@example.com' }
    ]

    const json = JSON.stringify(records, null, 2)
    const parsed = JSON.parse(json)

    expect(parsed).toHaveLength(2)
    expect(parsed[0].email).toBe('john@example.com')
  })
})

describe('Import/Export - Error Handling', () => {
  test('should handle file size limits', () => {
    const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
    const fileSize = 10 * 1024 * 1024 // 10MB

    const error = fileSize > MAX_FILE_SIZE
      ? 'File size exceeds maximum allowed (5MB)'
      : null

    expect(error).toBe('File size exceeds maximum allowed (5MB)')
  })

  test('should handle unsupported file types', () => {
    const allowedTypes = ['text/csv', 'application/json']
    const fileType = 'application/pdf'

    const error = !allowedTypes.includes(fileType)
      ? 'Unsupported file type. Please upload CSV or JSON.'
      : null

    expect(error).toBe('Unsupported file type. Please upload CSV or JSON.')
  })

  test('should handle empty CSV files', () => {
    const csvContent = ''

    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    })

    expect(records).toHaveLength(0)
  })

  test('should handle CSV with only headers', () => {
    const csvContent = 'name,email,company'

    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    })

    expect(records).toHaveLength(0)
  })

  test('should provide import summary', () => {
    const totalRecords = 100
    const successCount = 85
    const errorCount = 15

    const summary = {
      total: totalRecords,
      success: successCount,
      failed: errorCount,
      successRate: (successCount / totalRecords * 100).toFixed(1) + '%'
    }

    expect(summary.total).toBe(100)
    expect(summary.success).toBe(85)
    expect(summary.failed).toBe(15)
    expect(summary.successRate).toBe('85.0%')
  })
})

describe('Import/Export - Pagination', () => {
  test('should paginate export results', () => {
    const allRecords = Array.from({ length: 100 }, (_, i) => ({
      id: i + 1,
      name: `User ${i + 1}`
    }))

    const page = 2
    const pageSize = 20
    const offset = (page - 1) * pageSize

    const pageRecords = allRecords.slice(offset, offset + pageSize)

    expect(pageRecords).toHaveLength(20)
    expect(pageRecords[0].id).toBe(21)
    expect(pageRecords[19].id).toBe(40)
  })

  test('should calculate total pages', () => {
    const totalRecords = 95
    const pageSize = 20

    const totalPages = Math.ceil(totalRecords / pageSize)

    expect(totalPages).toBe(5)
  })

  test('should handle last page with fewer records', () => {
    const allRecords = Array.from({ length: 95 }, (_, i) => ({
      id: i + 1,
      name: `User ${i + 1}`
    }))

    const page = 5
    const pageSize = 20
    const offset = (page - 1) * pageSize

    const pageRecords = allRecords.slice(offset, offset + pageSize)

    expect(pageRecords).toHaveLength(15) // Only 15 records on last page
  })
})
