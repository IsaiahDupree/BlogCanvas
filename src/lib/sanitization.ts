/**
 * Input Sanitization Utilities
 *
 * Provides utilities to sanitize and validate user inputs to prevent
 * XSS, SQL injection, and other injection attacks.
 */

/**
 * Sanitize HTML string by escaping special characters
 * This prevents XSS attacks when rendering user input
 */
export function sanitizeHtml(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }

  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Validate and sanitize email address
 */
export function sanitizeEmail(email: string): string | null {
  if (typeof email !== 'string') {
    return null;
  }

  // Trim whitespace
  const trimmed = email.trim().toLowerCase();

  // Basic email regex validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(trimmed)) {
    return null;
  }

  // Additional validation: check length
  if (trimmed.length > 320) { // Max email length per RFC 5321
    return null;
  }

  return trimmed;
}

/**
 * Validate and sanitize URL
 * Only allows http:// and https:// protocols
 */
export function sanitizeUrl(url: string): string | null {
  if (typeof url !== 'string') {
    return null;
  }

  const trimmed = url.trim();

  // Only allow http and https protocols
  const urlRegex = /^https?:\/\/[^\s$.?#].[^\s]*$/i;

  if (!urlRegex.test(trimmed)) {
    return null;
  }

  // Block javascript: and data: URLs
  if (trimmed.toLowerCase().startsWith('javascript:') ||
      trimmed.toLowerCase().startsWith('data:')) {
    return null;
  }

  // Validate URL structure
  try {
    const urlObj = new URL(trimmed);
    return urlObj.href;
  } catch {
    return null;
  }
}

/**
 * Sanitize plain text input
 * Removes control characters and limits length
 */
export function sanitizeText(
  input: string,
  maxLength: number = 10000
): string {
  if (typeof input !== 'string') {
    return '';
  }

  // Remove control characters (except newlines and tabs)
  let sanitized = input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  // Trim to max length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.slice(0, maxLength);
  }

  return sanitized;
}

/**
 * Validate filename for file uploads
 * Prevents directory traversal and malicious filenames
 */
export function sanitizeFilename(filename: string): string | null {
  if (typeof filename !== 'string') {
    return null;
  }

  // Remove path separators to prevent directory traversal
  let sanitized = filename.replace(/[\/\\]/g, '');

  // Remove leading dots to prevent hidden files
  sanitized = sanitized.replace(/^\.+/, '');

  // Only allow alphanumeric, dash, underscore, dot
  sanitized = sanitized.replace(/[^a-zA-Z0-9._-]/g, '_');

  // Limit length
  if (sanitized.length > 255) {
    sanitized = sanitized.slice(0, 255);
  }

  // Must have at least one character before extension
  if (sanitized.length === 0 || sanitized.startsWith('.')) {
    return null;
  }

  return sanitized;
}

/**
 * Validate file type by MIME type
 */
export function isValidFileType(
  mimeType: string,
  allowedTypes: string[]
): boolean {
  if (typeof mimeType !== 'string') {
    return false;
  }

  const normalized = mimeType.toLowerCase().trim();
  return allowedTypes.some(type => normalized === type.toLowerCase());
}

/**
 * Validate file size
 */
export function isValidFileSize(
  size: number,
  maxSizeBytes: number
): boolean {
  return typeof size === 'number' && size > 0 && size <= maxSizeBytes;
}

/**
 * Allowed MIME types for common file uploads
 */
export const AllowedMimeTypes = {
  IMAGES: [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml'
  ],
  DOCUMENTS: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv'
  ],
  VIDEOS: [
    'video/mp4',
    'video/mpeg',
    'video/quicktime',
    'video/webm'
  ]
};

/**
 * Max file sizes for different types (in bytes)
 */
export const MaxFileSizes = {
  IMAGE: 10 * 1024 * 1024,      // 10 MB
  DOCUMENT: 20 * 1024 * 1024,   // 20 MB
  VIDEO: 100 * 1024 * 1024,     // 100 MB
  DEFAULT: 5 * 1024 * 1024      // 5 MB
};

/**
 * Validate integer input
 */
export function sanitizeInteger(
  input: any,
  min?: number,
  max?: number
): number | null {
  const num = parseInt(input, 10);

  if (isNaN(num)) {
    return null;
  }

  if (min !== undefined && num < min) {
    return null;
  }

  if (max !== undefined && num > max) {
    return null;
  }

  return num;
}

/**
 * Validate float input
 */
export function sanitizeFloat(
  input: any,
  min?: number,
  max?: number
): number | null {
  const num = parseFloat(input);

  if (isNaN(num)) {
    return null;
  }

  if (min !== undefined && num < min) {
    return null;
  }

  if (max !== undefined && num > max) {
    return null;
  }

  return num;
}

/**
 * Validate UUID format
 */
export function isValidUuid(uuid: string): boolean {
  if (typeof uuid !== 'string') {
    return false;
  }

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Sanitize and validate slug (URL-friendly string)
 */
export function sanitizeSlug(input: string, maxLength: number = 100): string | null {
  if (typeof input !== 'string') {
    return null;
  }

  let slug = input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, '-')  // Replace non-alphanumeric with dash
    .replace(/-+/g, '-')           // Replace multiple dashes with single
    .replace(/^-|-$/g, '');        // Remove leading/trailing dashes

  if (slug.length === 0 || slug.length > maxLength) {
    return null;
  }

  return slug;
}
