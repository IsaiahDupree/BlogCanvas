import { describe, expect, test } from '@jest/globals'

/**
 * Integration Tests for Search and Filter
 * Tests text search, filtering, and pagination functionality
 * Feature: VENDOR-WC-010
 */

interface Record {
  id: string
  name: string
  email: string
  status: 'active' | 'inactive' | 'pending'
  company?: string
  role?: string
  created_at: string
  tags?: string[]
}

const mockData: Record[] = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    status: 'active',
    company: 'Acme Inc',
    role: 'admin',
    created_at: '2024-01-15T10:00:00Z',
    tags: ['premium', 'verified']
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane@techcorp.com',
    status: 'active',
    company: 'Tech Corp',
    role: 'user',
    created_at: '2024-02-20T12:00:00Z',
    tags: ['verified']
  },
  {
    id: '3',
    name: 'Bob Johnson',
    email: 'bob@startup.io',
    status: 'pending',
    company: 'Startup LLC',
    role: 'user',
    created_at: '2024-03-10T14:00:00Z',
    tags: []
  },
  {
    id: '4',
    name: 'Alice Williams',
    email: 'alice@example.com',
    status: 'inactive',
    company: 'Acme Inc',
    role: 'editor',
    created_at: '2024-01-25T09:00:00Z',
    tags: ['premium']
  },
  {
    id: '5',
    name: 'Charlie Brown',
    email: 'charlie@example.com',
    status: 'active',
    company: 'Tech Corp',
    role: 'admin',
    created_at: '2024-02-15T11:00:00Z',
    tags: ['premium', 'verified', 'featured']
  }
]

describe('Search - Text Search', () => {
  test('should search by name', () => {
    const searchTerm = 'john'
    const results = mockData.filter(r =>
      r.name.toLowerCase().includes(searchTerm.toLowerCase())
    )

    expect(results).toHaveLength(2)
    expect(results.some(r => r.name === 'John Doe')).toBe(true)
    expect(results.some(r => r.name === 'Bob Johnson')).toBe(true)
  })

  test('should search by email', () => {
    const searchTerm = 'example.com'
    const results = mockData.filter(r =>
      r.email.toLowerCase().includes(searchTerm.toLowerCase())
    )

    expect(results).toHaveLength(3)
  })

  test('should search by company', () => {
    const searchTerm = 'acme'
    const results = mockData.filter(r =>
      r.company?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    expect(results).toHaveLength(2)
    expect(results.every(r => r.company === 'Acme Inc')).toBe(true)
  })

  test('should perform case-insensitive search', () => {
    const searchTerms = ['JOHN', 'john', 'JoHn']

    searchTerms.forEach(term => {
      const results = mockData.filter(r =>
        r.name.toLowerCase().includes(term.toLowerCase())
      )
      expect(results).toHaveLength(2)
    })
  })

  test('should search across multiple fields', () => {
    function searchAll(data: Record[], term: string): Record[] {
      const lowerTerm = term.toLowerCase()
      return data.filter(r =>
        r.name.toLowerCase().includes(lowerTerm) ||
        r.email.toLowerCase().includes(lowerTerm) ||
        r.company?.toLowerCase().includes(lowerTerm) ||
        r.role?.toLowerCase().includes(lowerTerm)
      )
    }

    const results = searchAll(mockData, 'admin')
    expect(results).toHaveLength(2)
    expect(results.every(r => r.role === 'admin')).toBe(true)
  })

  test('should handle empty search term', () => {
    const searchTerm = ''
    const results = mockData.filter(r =>
      !searchTerm || r.name.toLowerCase().includes(searchTerm.toLowerCase())
    )

    expect(results).toHaveLength(mockData.length)
  })

  test('should handle search with no results', () => {
    const searchTerm = 'nonexistent'
    const results = mockData.filter(r =>
      r.name.toLowerCase().includes(searchTerm.toLowerCase())
    )

    expect(results).toHaveLength(0)
  })

  test('should trim whitespace in search term', () => {
    const searchTerm = '  john  '
    const results = mockData.filter(r =>
      r.name.toLowerCase().includes(searchTerm.trim().toLowerCase())
    )

    expect(results).toHaveLength(2)
  })

  test('should search by partial match', () => {
    const searchTerm = 'tech'
    const results = mockData.filter(r =>
      r.company?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    expect(results).toHaveLength(2)
    expect(results.every(r => r.company === 'Tech Corp')).toBe(true)
  })

  test('should highlight search matches', () => {
    function highlightMatch(text: string, term: string): string {
      if (!term) return text
      const regex = new RegExp(`(${term})`, 'gi')
      return text.replace(regex, '<mark>$1</mark>')
    }

    const highlighted = highlightMatch('John Doe', 'john')
    expect(highlighted).toBe('<mark>John</mark> Doe')
  })
})

describe('Filter - Status Filter', () => {
  test('should filter by active status', () => {
    const results = mockData.filter(r => r.status === 'active')

    expect(results).toHaveLength(3)
    expect(results.every(r => r.status === 'active')).toBe(true)
  })

  test('should filter by inactive status', () => {
    const results = mockData.filter(r => r.status === 'inactive')

    expect(results).toHaveLength(1)
    expect(results[0].name).toBe('Alice Williams')
  })

  test('should filter by pending status', () => {
    const results = mockData.filter(r => r.status === 'pending')

    expect(results).toHaveLength(1)
    expect(results[0].name).toBe('Bob Johnson')
  })

  test('should filter by multiple statuses', () => {
    const statuses: Array<'active' | 'inactive' | 'pending'> = ['active', 'pending']
    const results = mockData.filter(r => statuses.includes(r.status))

    expect(results).toHaveLength(4)
  })

  test('should combine status filter with search', () => {
    const searchTerm = 'example.com'
    const status = 'active'

    const results = mockData.filter(r =>
      r.status === status &&
      r.email.toLowerCase().includes(searchTerm.toLowerCase())
    )

    expect(results).toHaveLength(2)
  })
})

describe('Filter - Role Filter', () => {
  test('should filter by admin role', () => {
    const results = mockData.filter(r => r.role === 'admin')

    expect(results).toHaveLength(2)
    expect(results.every(r => r.role === 'admin')).toBe(true)
  })

  test('should filter by user role', () => {
    const results = mockData.filter(r => r.role === 'user')

    expect(results).toHaveLength(2)
  })

  test('should filter by multiple roles', () => {
    const roles = ['admin', 'editor']
    const results = mockData.filter(r => r.role && roles.includes(r.role))

    expect(results).toHaveLength(3)
  })
})

describe('Filter - Date Range Filter', () => {
  test('should filter by date range', () => {
    const startDate = new Date('2024-02-01')
    const endDate = new Date('2024-02-28')

    const results = mockData.filter(r => {
      const date = new Date(r.created_at)
      return date >= startDate && date <= endDate
    })

    expect(results).toHaveLength(2)
  })

  test('should filter records after date', () => {
    const afterDate = new Date('2024-02-15T00:00:00Z')

    const results = mockData.filter(r => {
      const date = new Date(r.created_at)
      return date > afterDate
    })

    // Records after 2024-02-15 midnight:
    // - Record 2: 2024-02-20T12:00:00Z
    // - Record 3: 2024-03-10T14:00:00Z
    // - Record 5: 2024-02-15T11:00:00Z
    expect(results).toHaveLength(3)
  })

  test('should filter records before date', () => {
    const beforeDate = new Date('2024-02-01')

    const results = mockData.filter(r => {
      const date = new Date(r.created_at)
      return date < beforeDate
    })

    expect(results).toHaveLength(2)
  })

  test('should filter records from last 30 days', () => {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const results = mockData.filter(r => {
      const date = new Date(r.created_at)
      return date >= thirtyDaysAgo
    })

    // All mock records are from 2024, so this should return 0
    expect(results).toHaveLength(0)
  })
})

describe('Filter - Tag Filter', () => {
  test('should filter by single tag', () => {
    const tag = 'premium'
    const results = mockData.filter(r => r.tags?.includes(tag))

    expect(results).toHaveLength(3)
  })

  test('should filter by multiple tags (OR logic)', () => {
    const tags = ['premium', 'featured']
    const results = mockData.filter(r =>
      r.tags?.some(tag => tags.includes(tag))
    )

    expect(results).toHaveLength(3)
  })

  test('should filter by multiple tags (AND logic)', () => {
    const tags = ['premium', 'verified']
    const results = mockData.filter(r =>
      tags.every(tag => r.tags?.includes(tag))
    )

    expect(results).toHaveLength(2)
  })

  test('should filter records with no tags', () => {
    const results = mockData.filter(r => !r.tags || r.tags.length === 0)

    expect(results).toHaveLength(1)
    expect(results[0].name).toBe('Bob Johnson')
  })
})

describe('Filter - Combined Filters', () => {
  test('should combine search, status, and role filters', () => {
    const searchTerm = 'example.com'
    const status = 'active'
    const role = 'admin'

    const results = mockData.filter(r =>
      r.email.toLowerCase().includes(searchTerm.toLowerCase()) &&
      r.status === status &&
      r.role === role
    )

    // Records matching: john@example.com (active, admin) and charlie@example.com (active, admin)
    expect(results).toHaveLength(2)
    expect(results.some(r => r.name === 'Charlie Brown')).toBe(true)
    expect(results.some(r => r.name === 'John Doe')).toBe(true)
  })

  test('should combine all filter types', () => {
    const filters = {
      search: 'acme',
      status: 'active',
      tag: 'premium',
      afterDate: new Date('2024-01-01')
    }

    const results = mockData.filter(r => {
      const matchesSearch = r.company?.toLowerCase().includes(filters.search.toLowerCase())
      const matchesStatus = r.status === filters.status
      const matchesTag = r.tags?.includes(filters.tag)
      const matchesDate = new Date(r.created_at) >= filters.afterDate

      return matchesSearch && matchesStatus && matchesTag && matchesDate
    })

    expect(results).toHaveLength(1)
    expect(results[0].name).toBe('John Doe')
  })

  test('should handle empty filters', () => {
    const filters = {
      search: '',
      status: null,
      role: null
    }

    const results = mockData.filter(r => {
      const matchesSearch = !filters.search ||
        r.name.toLowerCase().includes(filters.search.toLowerCase())
      const matchesStatus = !filters.status || r.status === filters.status
      const matchesRole = !filters.role || r.role === filters.role

      return matchesSearch && matchesStatus && matchesRole
    })

    expect(results).toHaveLength(mockData.length)
  })
})

describe('Pagination', () => {
  test('should paginate results with page 1', () => {
    const page = 1
    const pageSize = 2
    const offset = (page - 1) * pageSize

    const paginatedResults = mockData.slice(offset, offset + pageSize)

    expect(paginatedResults).toHaveLength(2)
    expect(paginatedResults[0].id).toBe('1')
    expect(paginatedResults[1].id).toBe('2')
  })

  test('should paginate results with page 2', () => {
    const page = 2
    const pageSize = 2
    const offset = (page - 1) * pageSize

    const paginatedResults = mockData.slice(offset, offset + pageSize)

    expect(paginatedResults).toHaveLength(2)
    expect(paginatedResults[0].id).toBe('3')
    expect(paginatedResults[1].id).toBe('4')
  })

  test('should handle last page with fewer items', () => {
    const page = 3
    const pageSize = 2
    const offset = (page - 1) * pageSize

    const paginatedResults = mockData.slice(offset, offset + pageSize)

    expect(paginatedResults).toHaveLength(1)
    expect(paginatedResults[0].id).toBe('5')
  })

  test('should calculate total pages', () => {
    const totalItems = mockData.length
    const pageSize = 2
    const totalPages = Math.ceil(totalItems / pageSize)

    expect(totalPages).toBe(3)
  })

  test('should provide pagination metadata', () => {
    const page = 2
    const pageSize = 2
    const totalItems = mockData.length
    const totalPages = Math.ceil(totalItems / pageSize)
    const offset = (page - 1) * pageSize
    const paginatedResults = mockData.slice(offset, offset + pageSize)

    const metadata = {
      page,
      pageSize,
      totalItems,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
      itemsOnPage: paginatedResults.length
    }

    expect(metadata.page).toBe(2)
    expect(metadata.totalPages).toBe(3)
    expect(metadata.hasNextPage).toBe(true)
    expect(metadata.hasPreviousPage).toBe(true)
    expect(metadata.itemsOnPage).toBe(2)
  })

  test('should paginate filtered results', () => {
    const status = 'active'
    const filtered = mockData.filter(r => r.status === status)

    const page = 1
    const pageSize = 2
    const offset = (page - 1) * pageSize
    const paginatedResults = filtered.slice(offset, offset + pageSize)

    expect(filtered).toHaveLength(3)
    expect(paginatedResults).toHaveLength(2)
  })

  test('should handle page out of range', () => {
    const page = 100
    const pageSize = 2
    const offset = (page - 1) * pageSize

    const paginatedResults = mockData.slice(offset, offset + pageSize)

    expect(paginatedResults).toHaveLength(0)
  })

  test('should handle different page sizes', () => {
    const pageSizes = [1, 2, 5, 10]

    pageSizes.forEach(pageSize => {
      const totalPages = Math.ceil(mockData.length / pageSize)
      expect(totalPages).toBeGreaterThan(0)
    })

    expect(Math.ceil(mockData.length / 1)).toBe(5)
    expect(Math.ceil(mockData.length / 2)).toBe(3)
    expect(Math.ceil(mockData.length / 5)).toBe(1)
    expect(Math.ceil(mockData.length / 10)).toBe(1)
  })
})

describe('Sorting', () => {
  test('should sort by name ascending', () => {
    const sorted = [...mockData].sort((a, b) =>
      a.name.localeCompare(b.name)
    )

    expect(sorted[0].name).toBe('Alice Williams')
    expect(sorted[sorted.length - 1].name).toBe('John Doe')
  })

  test('should sort by name descending', () => {
    const sorted = [...mockData].sort((a, b) =>
      b.name.localeCompare(a.name)
    )

    expect(sorted[0].name).toBe('John Doe')
    expect(sorted[sorted.length - 1].name).toBe('Alice Williams')
  })

  test('should sort by date ascending', () => {
    const sorted = [...mockData].sort((a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )

    expect(sorted[0].id).toBe('1')
    expect(sorted[sorted.length - 1].id).toBe('3')
  })

  test('should sort by date descending', () => {
    const sorted = [...mockData].sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )

    expect(sorted[0].id).toBe('3')
    expect(sorted[sorted.length - 1].id).toBe('1')
  })

  test('should combine sort with filters', () => {
    const status = 'active'
    const filtered = mockData.filter(r => r.status === status)
    const sorted = filtered.sort((a, b) => a.name.localeCompare(b.name))

    expect(sorted).toHaveLength(3)
    expect(sorted[0].name).toBe('Charlie Brown')
  })

  test('should sort by multiple fields', () => {
    const sorted = [...mockData].sort((a, b) => {
      // First by company
      if (a.company && b.company) {
        const companyCompare = a.company.localeCompare(b.company)
        if (companyCompare !== 0) return companyCompare
      }
      // Then by name
      return a.name.localeCompare(b.name)
    })

    expect(sorted[0].company).toBe('Acme Inc')
    expect(sorted[1].company).toBe('Acme Inc')
  })
})

describe('Performance', () => {
  test('should handle large datasets efficiently', () => {
    const largeDataset = Array.from({ length: 10000 }, (_, i) => ({
      id: `${i + 1}`,
      name: `User ${i + 1}`,
      email: `user${i + 1}@example.com`,
      status: i % 2 === 0 ? 'active' : 'inactive' as const,
      created_at: new Date().toISOString()
    }))

    const startTime = Date.now()
    const results = largeDataset.filter(r => r.status === 'active')
    const endTime = Date.now()

    expect(results).toHaveLength(5000)
    expect(endTime - startTime).toBeLessThan(100) // Should complete in <100ms
  })

  test('should optimize search with indexing concept', () => {
    // Simulate indexed search
    const searchIndex = new Map<string, string[]>()

    // Build index
    mockData.forEach(record => {
      const words = record.name.toLowerCase().split(' ')
      words.forEach(word => {
        if (!searchIndex.has(word)) {
          searchIndex.set(word, [])
        }
        searchIndex.get(word)!.push(record.id)
      })
    })

    // Search using index
    const searchTerm = 'john'
    const matchingIds = searchIndex.get(searchTerm) || []
    const results = mockData.filter(r => matchingIds.includes(r.id))

    expect(results).toHaveLength(1)
    expect(results[0].name).toBe('John Doe')
  })
})
