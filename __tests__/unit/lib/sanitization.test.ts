/**
 * Unit Tests: Input Sanitization
 */

import { describe, it, expect } from '@jest/globals';
import {
  sanitizeHtml,
  sanitizeEmail,
  sanitizeUrl,
  sanitizeText,
  sanitizeFilename,
  isValidFileType,
  isValidFileSize,
  sanitizeInteger,
  sanitizeFloat,
  isValidUuid,
  sanitizeSlug,
  AllowedMimeTypes,
  MaxFileSizes
} from '@/lib/sanitization';

describe('Input Sanitization', () => {
  describe('sanitizeHtml', () => {
    it('should escape HTML special characters', () => {
      expect(sanitizeHtml('<script>alert("XSS")</script>'))
        .toBe('&lt;script&gt;alert(&quot;XSS&quot;)&lt;&#x2F;script&gt;');
    });

    it('should escape ampersands', () => {
      expect(sanitizeHtml('Tom & Jerry')).toBe('Tom &amp; Jerry');
    });

    it('should escape single quotes', () => {
      expect(sanitizeHtml("It's a test")).toBe('It&#x27;s a test');
    });

    it('should handle empty string', () => {
      expect(sanitizeHtml('')).toBe('');
    });
  });

  describe('sanitizeEmail', () => {
    it('should accept valid emails', () => {
      expect(sanitizeEmail('test@example.com')).toBe('test@example.com');
      expect(sanitizeEmail('user.name+tag@example.co.uk')).toBe('user.name+tag@example.co.uk');
    });

    it('should reject invalid emails', () => {
      expect(sanitizeEmail('notanemail')).toBeNull();
      expect(sanitizeEmail('@example.com')).toBeNull();
      expect(sanitizeEmail('user@')).toBeNull();
      expect(sanitizeEmail('user domain@example.com')).toBeNull();
    });

    it('should trim and lowercase emails', () => {
      expect(sanitizeEmail('  TEST@EXAMPLE.COM  ')).toBe('test@example.com');
    });

    it('should reject emails over 320 characters', () => {
      const longEmail = 'a'.repeat(310) + '@example.com';
      expect(sanitizeEmail(longEmail)).toBeNull();
    });
  });

  describe('sanitizeUrl', () => {
    it('should accept valid HTTP URLs', () => {
      expect(sanitizeUrl('http://example.com')).toBe('http://example.com/');
      expect(sanitizeUrl('https://example.com/path?query=1')).toBeTruthy();
    });

    it('should reject javascript: URLs', () => {
      expect(sanitizeUrl('javascript:alert(1)')).toBeNull();
      expect(sanitizeUrl('JavaScript:void(0)')).toBeNull();
    });

    it('should reject data: URLs', () => {
      expect(sanitizeUrl('data:text/html,<script>alert(1)</script>')).toBeNull();
    });

    it('should reject non-HTTP protocols', () => {
      expect(sanitizeUrl('ftp://example.com')).toBeNull();
      expect(sanitizeUrl('file:///etc/passwd')).toBeNull();
    });

    it('should reject invalid URLs', () => {
      expect(sanitizeUrl('not a url')).toBeNull();
      expect(sanitizeUrl('http:/example.com')).toBeNull();
    });
  });

  describe('sanitizeText', () => {
    it('should remove control characters', () => {
      const input = 'Hello\x00\x01World';
      expect(sanitizeText(input)).toBe('HelloWorld');
    });

    it('should preserve newlines and tabs', () => {
      const input = 'Line 1\nLine 2\tTabbed';
      expect(sanitizeText(input)).toBe('Line 1\nLine 2\tTabbed');
    });

    it('should enforce max length', () => {
      const longText = 'a'.repeat(100);
      expect(sanitizeText(longText, 50).length).toBe(50);
    });

    it('should use default max length', () => {
      const longText = 'a'.repeat(20000);
      expect(sanitizeText(longText).length).toBe(10000);
    });
  });

  describe('sanitizeFilename', () => {
    it('should accept valid filenames', () => {
      expect(sanitizeFilename('document.pdf')).toBe('document.pdf');
      expect(sanitizeFilename('photo-2024-01.jpg')).toBe('photo-2024-01.jpg');
    });

    it('should prevent directory traversal', () => {
      expect(sanitizeFilename('../../../etc/passwd')).toBe('......etcpasswd');
      expect(sanitizeFilename('folder/file.txt')).toBe('folderfile.txt');
    });

    it('should remove leading dots', () => {
      expect(sanitizeFilename('...hidden.txt')).toBe('hidden.txt');
    });

    it('should replace invalid characters', () => {
      expect(sanitizeFilename('file name!@#$.txt')).toBe('file_name___$.txt');
    });

    it('should reject filenames that start with dot after sanitization', () => {
      expect(sanitizeFilename('....')).toBeNull();
      expect(sanitizeFilename('/.hidden')).toBeNull();
    });

    it('should enforce max length', () => {
      const longName = 'a'.repeat(300) + '.txt';
      const result = sanitizeFilename(longName);
      expect(result).not.toBeNull();
      expect(result!.length).toBe(255);
    });
  });

  describe('isValidFileType', () => {
    it('should accept allowed MIME types', () => {
      expect(isValidFileType('image/jpeg', AllowedMimeTypes.IMAGES)).toBe(true);
      expect(isValidFileType('application/pdf', AllowedMimeTypes.DOCUMENTS)).toBe(true);
    });

    it('should reject disallowed MIME types', () => {
      expect(isValidFileType('application/x-executable', AllowedMimeTypes.IMAGES)).toBe(false);
      expect(isValidFileType('video/mp4', AllowedMimeTypes.DOCUMENTS)).toBe(false);
    });

    it('should be case-insensitive', () => {
      expect(isValidFileType('IMAGE/JPEG', AllowedMimeTypes.IMAGES)).toBe(true);
    });
  });

  describe('isValidFileSize', () => {
    it('should accept sizes within limit', () => {
      expect(isValidFileSize(1000, MaxFileSizes.IMAGE)).toBe(true);
      expect(isValidFileSize(5 * 1024 * 1024, MaxFileSizes.IMAGE)).toBe(true);
    });

    it('should reject sizes over limit', () => {
      expect(isValidFileSize(11 * 1024 * 1024, MaxFileSizes.IMAGE)).toBe(false);
    });

    it('should reject zero and negative sizes', () => {
      expect(isValidFileSize(0, MaxFileSizes.IMAGE)).toBe(false);
      expect(isValidFileSize(-100, MaxFileSizes.IMAGE)).toBe(false);
    });
  });

  describe('sanitizeInteger', () => {
    it('should parse valid integers', () => {
      expect(sanitizeInteger('123')).toBe(123);
      expect(sanitizeInteger(456)).toBe(456);
    });

    it('should enforce min/max constraints', () => {
      expect(sanitizeInteger(5, 10, 20)).toBeNull();
      expect(sanitizeInteger(25, 10, 20)).toBeNull();
      expect(sanitizeInteger(15, 10, 20)).toBe(15);
    });

    it('should reject non-numeric input', () => {
      expect(sanitizeInteger('abc')).toBeNull();
      expect(sanitizeInteger('12.5')).toBe(12);
    });
  });

  describe('sanitizeFloat', () => {
    it('should parse valid floats', () => {
      expect(sanitizeFloat('123.45')).toBe(123.45);
      expect(sanitizeFloat(67.89)).toBe(67.89);
    });

    it('should enforce min/max constraints', () => {
      expect(sanitizeFloat(5.5, 10.0, 20.0)).toBeNull();
      expect(sanitizeFloat(25.5, 10.0, 20.0)).toBeNull();
      expect(sanitizeFloat(15.5, 10.0, 20.0)).toBe(15.5);
    });

    it('should reject non-numeric input', () => {
      expect(sanitizeFloat('abc')).toBeNull();
    });
  });

  describe('isValidUuid', () => {
    it('should accept valid UUIDs', () => {
      expect(isValidUuid('123e4567-e89b-12d3-a456-426614174000')).toBe(true);
      expect(isValidUuid('00000000-0000-0000-0000-000000000000')).toBe(true);
    });

    it('should reject invalid UUIDs', () => {
      expect(isValidUuid('not-a-uuid')).toBe(false);
      expect(isValidUuid('123e4567-e89b-12d3-a456')).toBe(false);
      expect(isValidUuid('123e4567-e89b-12d3-a456-42661417400g')).toBe(false);
    });
  });

  describe('sanitizeSlug', () => {
    it('should create valid slugs', () => {
      expect(sanitizeSlug('Hello World')).toBe('hello-world');
      expect(sanitizeSlug('Test Post 2024')).toBe('test-post-2024');
    });

    it('should handle special characters', () => {
      expect(sanitizeSlug('Hello, World!')).toBe('hello--world-');
      expect(sanitizeSlug('Test@Post#123')).toBe('test-post-123');
    });

    it('should remove leading/trailing dashes', () => {
      expect(sanitizeSlug('---hello---')).toBe('hello');
    });

    it('should collapse multiple dashes', () => {
      expect(sanitizeSlug('hello---world')).toBe('hello-world');
    });

    it('should enforce max length', () => {
      const longSlug = 'a'.repeat(150);
      expect(sanitizeSlug(longSlug, 100)).toBeNull();
    });

    it('should reject empty slugs', () => {
      expect(sanitizeSlug('!!!')).toBeNull();
      expect(sanitizeSlug('')).toBeNull();
    });
  });
});
