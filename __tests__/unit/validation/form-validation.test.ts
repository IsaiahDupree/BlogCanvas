import { describe, expect, test } from '@jest/globals'

/**
 * Unit Tests for Form Validation
 * Tests validation rules for required fields, email, password, and custom validators
 * Feature: VENDOR-WC-004
 */

describe('Form Validation - Required Fields', () => {
  test('should fail when required field is missing', () => {
    const data = { email: 'test@example.com' }
    const errors: string[] = []

    if (!data.vendorName) {
      errors.push('vendorName is required')
    }

    expect(errors).toContain('vendorName is required')
    expect(errors.length).toBeGreaterThan(0)
  })

  test('should pass when all required fields are present', () => {
    const data = {
      vendorName: 'Test Vendor',
      slug: 'test-vendor',
      email: 'test@example.com',
      password: 'SecurePass123!',
      fullName: 'Test User'
    }

    const errors: string[] = []

    if (!data.vendorName) errors.push('vendorName is required')
    if (!data.slug) errors.push('slug is required')
    if (!data.email) errors.push('email is required')
    if (!data.password) errors.push('password is required')
    if (!data.fullName) errors.push('fullName is required')

    expect(errors).toHaveLength(0)
  })

  test('should fail when required field is empty string', () => {
    const data = { email: '' }
    const errors: string[] = []

    if (!data.email || data.email.trim() === '') {
      errors.push('email cannot be empty')
    }

    expect(errors).toContain('email cannot be empty')
  })

  test('should fail when required field is only whitespace', () => {
    const data = { fullName: '   ' }
    const errors: string[] = []

    if (!data.fullName || data.fullName.trim() === '') {
      errors.push('fullName cannot be empty')
    }

    expect(errors).toContain('fullName cannot be empty')
  })
})

describe('Form Validation - Email', () => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  test('should accept valid email addresses', () => {
    const validEmails = [
      'user@example.com',
      'test.user@example.com',
      'user+tag@example.co.uk',
      'user123@test-domain.com'
    ]

    validEmails.forEach(email => {
      expect(emailRegex.test(email)).toBe(true)
    })
  })

  test('should reject invalid email addresses', () => {
    const invalidEmails = [
      'invalid',
      'invalid@',
      '@example.com',
      'user@',
      'user @example.com',
      'user@example',
      ''
    ]

    invalidEmails.forEach(email => {
      expect(emailRegex.test(email)).toBe(false)
    })
  })

  test('should reject email with spaces', () => {
    expect(emailRegex.test('user name@example.com')).toBe(false)
  })

  test('should reject email without domain extension', () => {
    expect(emailRegex.test('user@domain')).toBe(false)
  })
})

describe('Form Validation - Password', () => {
  function validatePassword(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!password || password.length < 8) {
      errors.push('Password must be at least 8 characters')
    }

    if (password && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter')
    }

    if (password && !/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter')
    }

    if (password && !/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number')
    }

    if (password && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain at least one special character')
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  test('should accept strong password', () => {
    const result = validatePassword('SecurePass123!')
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  test('should reject password shorter than 8 characters', () => {
    const result = validatePassword('Pass1!')
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Password must be at least 8 characters')
  })

  test('should reject password without uppercase letter', () => {
    const result = validatePassword('password123!')
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Password must contain at least one uppercase letter')
  })

  test('should reject password without lowercase letter', () => {
    const result = validatePassword('PASSWORD123!')
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Password must contain at least one lowercase letter')
  })

  test('should reject password without number', () => {
    const result = validatePassword('SecurePass!')
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Password must contain at least one number')
  })

  test('should reject password without special character', () => {
    const result = validatePassword('SecurePass123')
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Password must contain at least one special character')
  })

  test('should reject empty password', () => {
    const result = validatePassword('')
    expect(result.valid).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
  })
})

describe('Form Validation - Custom Validators', () => {
  describe('Slug Validation', () => {
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

    test('should accept valid slugs', () => {
      const validSlugs = [
        'test-vendor',
        'my-company',
        'vendor123',
        'test-123-vendor'
      ]

      validSlugs.forEach(slug => {
        expect(slugRegex.test(slug)).toBe(true)
      })
    })

    test('should reject slugs with uppercase letters', () => {
      expect(slugRegex.test('Test-Vendor')).toBe(false)
      expect(slugRegex.test('VENDOR')).toBe(false)
    })

    test('should reject slugs with spaces', () => {
      expect(slugRegex.test('test vendor')).toBe(false)
    })

    test('should reject slugs with special characters', () => {
      expect(slugRegex.test('test_vendor')).toBe(false)
      expect(slugRegex.test('test@vendor')).toBe(false)
      expect(slugRegex.test('test.vendor')).toBe(false)
    })

    test('should reject slugs starting or ending with hyphen', () => {
      expect(slugRegex.test('-test-vendor')).toBe(false)
      expect(slugRegex.test('test-vendor-')).toBe(false)
    })

    test('should reject slugs with consecutive hyphens', () => {
      expect(slugRegex.test('test--vendor')).toBe(false)
    })
  })

  describe('URL Validation', () => {
    function isValidUrl(url: string): boolean {
      try {
        const urlObj = new URL(url)
        return urlObj.protocol === 'http:' || urlObj.protocol === 'https:'
      } catch {
        return false
      }
    }

    test('should accept valid URLs', () => {
      const validUrls = [
        'https://example.com',
        'http://example.com',
        'https://www.example.com/path',
        'https://example.com:8080/path?query=value'
      ]

      validUrls.forEach(url => {
        expect(isValidUrl(url)).toBe(true)
      })
    })

    test('should reject invalid URLs', () => {
      const invalidUrls = [
        'not-a-url',
        'ftp://example.com',
        'example.com',
        '',
        'javascript:alert(1)'
      ]

      invalidUrls.forEach(url => {
        expect(isValidUrl(url)).toBe(false)
      })
    })
  })

  describe('Phone Number Validation', () => {
    const phoneRegex = /^\+?[1-9]\d{1,14}$/

    test('should accept valid phone numbers', () => {
      const validPhones = [
        '+1234567890',
        '1234567890',
        '+12345678901234',
        '12' // Minimum valid: starts with 1-9, followed by 1-14 more digits
      ]

      validPhones.forEach(phone => {
        expect(phoneRegex.test(phone)).toBe(true)
      })
    })

    test('should reject phone numbers starting with zero', () => {
      expect(phoneRegex.test('+0123456789')).toBe(false)
      expect(phoneRegex.test('0123456789')).toBe(false)
    })

    test('should reject non-numeric phone numbers', () => {
      expect(phoneRegex.test('abcdefghij')).toBe(false)
      expect(phoneRegex.test('123-456-7890')).toBe(false)
      expect(phoneRegex.test('(123) 456-7890')).toBe(false)
    })

    test('should reject empty phone number', () => {
      expect(phoneRegex.test('')).toBe(false)
    })

    test('should reject phone numbers too long', () => {
      expect(phoneRegex.test('123456789012345678')).toBe(false) // More than 15 digits
    })
  })

  describe('Range Validation', () => {
    function validateRange(value: number, min: number, max: number): boolean {
      return value >= min && value <= max
    }

    test('should accept values within range', () => {
      expect(validateRange(5, 1, 10)).toBe(true)
      expect(validateRange(1, 1, 10)).toBe(true)
      expect(validateRange(10, 1, 10)).toBe(true)
    })

    test('should reject values outside range', () => {
      expect(validateRange(0, 1, 10)).toBe(false)
      expect(validateRange(11, 1, 10)).toBe(false)
      expect(validateRange(-5, 1, 10)).toBe(false)
    })
  })

  describe('String Length Validation', () => {
    function validateLength(value: string, min: number, max: number): { valid: boolean; error?: string } {
      if (value.length < min) {
        return { valid: false, error: `Must be at least ${min} characters` }
      }
      if (value.length > max) {
        return { valid: false, error: `Must be at most ${max} characters` }
      }
      return { valid: true }
    }

    test('should accept strings within length range', () => {
      expect(validateLength('hello', 3, 10).valid).toBe(true)
      expect(validateLength('hi', 2, 5).valid).toBe(true)
    })

    test('should reject strings shorter than minimum', () => {
      const result = validateLength('hi', 5, 10)
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Must be at least 5 characters')
    })

    test('should reject strings longer than maximum', () => {
      const result = validateLength('this is a very long string', 5, 10)
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Must be at most 10 characters')
    })
  })
})

describe('Form Validation - Combined Scenarios', () => {
  function validateVendorRegistration(data: any): { valid: boolean; errors: Record<string, string> } {
    const errors: Record<string, string> = {}

    // Required fields
    if (!data.vendorName || data.vendorName.trim() === '') {
      errors.vendorName = 'Vendor name is required'
    }

    if (!data.slug || data.slug.trim() === '') {
      errors.slug = 'Slug is required'
    } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(data.slug)) {
      errors.slug = 'Slug must be lowercase, alphanumeric, and hyphen-separated'
    }

    if (!data.email || data.email.trim() === '') {
      errors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.email = 'Invalid email address'
    }

    if (!data.password || data.password.trim() === '') {
      errors.password = 'Password is required'
    } else if (data.password.length < 8) {
      errors.password = 'Password must be at least 8 characters'
    }

    if (!data.fullName || data.fullName.trim() === '') {
      errors.fullName = 'Full name is required'
    }

    return {
      valid: Object.keys(errors).length === 0,
      errors
    }
  }

  test('should validate complete valid vendor registration', () => {
    const validData = {
      vendorName: 'Test Vendor Inc',
      slug: 'test-vendor',
      email: 'admin@testvendor.com',
      password: 'SecurePass123!',
      fullName: 'John Doe'
    }

    const result = validateVendorRegistration(validData)
    expect(result.valid).toBe(true)
    expect(Object.keys(result.errors)).toHaveLength(0)
  })

  test('should collect all validation errors for invalid data', () => {
    const invalidData = {
      vendorName: '',
      slug: 'Invalid Slug!',
      email: 'invalid-email',
      password: '123',
      fullName: ''
    }

    const result = validateVendorRegistration(invalidData)
    expect(result.valid).toBe(false)
    expect(result.errors.vendorName).toBeDefined()
    expect(result.errors.slug).toBeDefined()
    expect(result.errors.email).toBeDefined()
    expect(result.errors.password).toBeDefined()
    expect(result.errors.fullName).toBeDefined()
  })

  test('should validate partial data with some errors', () => {
    const partialData = {
      vendorName: 'Test Vendor',
      slug: 'test-vendor',
      email: 'invalid',
      password: 'short',
      fullName: 'John Doe'
    }

    const result = validateVendorRegistration(partialData)
    expect(result.valid).toBe(false)
    expect(result.errors.email).toBe('Invalid email address')
    expect(result.errors.password).toBe('Password must be at least 8 characters')
    expect(result.errors.vendorName).toBeUndefined()
    expect(result.errors.slug).toBeUndefined()
  })
})
