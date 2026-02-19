/**
 * Test Helper Utilities
 *
 * Common utilities for testing
 */

import { mockUser, mockStaffUser, mockClientUser } from './supabase-auth.mock';
import { mockClient, mockBlogPost, mockProfile } from './supabase-db.mock';

/**
 * Create a mock request with authentication headers
 */
export function createMockAuthRequest(
  method: string = 'GET',
  body?: any,
  userId: string = mockUser.id
): Request {
  const headers = new Headers({
    'Content-Type': 'application/json',
    'Authorization': `Bearer mock-token-${userId}`
  });

  return new Request('http://localhost:3000/api/test', {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });
}

/**
 * Create a mock NextRequest with cookies
 */
export function createMockNextRequest(
  url: string = 'http://localhost:3000',
  options: RequestInit = {}
) {
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  return new Request(url, {
    ...options,
    headers
  });
}

/**
 * Wait for a specified time (for async operations)
 */
export function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generate a deterministic UUID for testing
 */
export function testUUID(suffix: string): string {
  const base = '00000000-0000-4000-8000-000000000';
  const paddedSuffix = suffix.padStart(3, '0');
  return base + paddedSuffix;
}

/**
 * Create mock test data
 */
export const createTestData = () => ({
  user: { ...mockUser },
  staffUser: { ...mockStaffUser },
  clientUser: { ...mockClientUser },
  client: { ...mockClient },
  blogPost: { ...mockBlogPost },
  profile: { ...mockProfile }
});

/**
 * Assert that an error was thrown with a specific message
 */
export function expectError(fn: () => any, expectedMessage?: string): void {
  try {
    fn();
    throw new Error('Expected function to throw an error');
  } catch (error: any) {
    if (expectedMessage && !error.message.includes(expectedMessage)) {
      throw new Error(
        `Expected error message to include "${expectedMessage}", got "${error.message}"`
      );
    }
  }
}

/**
 * Assert that an async function throws an error
 */
export async function expectAsyncError(
  fn: () => Promise<any>,
  expectedMessage?: string
): Promise<void> {
  try {
    await fn();
    throw new Error('Expected async function to throw an error');
  } catch (error: any) {
    if (expectedMessage && !error.message.includes(expectedMessage)) {
      throw new Error(
        `Expected error message to include "${expectedMessage}", got "${error.message}"`
      );
    }
  }
}

/**
 * Mock console methods to suppress output during tests
 */
export function mockConsole() {
  const originalConsole = { ...console };

  beforeAll(() => {
    console.log = jest.fn();
    console.error = jest.fn();
    console.warn = jest.fn();
    console.info = jest.fn();
  });

  afterAll(() => {
    console.log = originalConsole.log;
    console.error = originalConsole.error;
    console.warn = originalConsole.warn;
    console.info = originalConsole.info;
  });
}

/**
 * Create a mock file for upload testing
 */
export function createMockFile(
  name: string = 'test.jpg',
  type: string = 'image/jpeg',
  size: number = 1024
): File {
  const blob = new Blob(['a'.repeat(size)], { type });
  return new File([blob], name, { type });
}

/**
 * Mock environment variables
 */
export function mockEnv(vars: Record<string, string>) {
  const originalEnv = { ...process.env };

  beforeAll(() => {
    Object.entries(vars).forEach(([key, value]) => {
      process.env[key] = value;
    });
  });

  afterAll(() => {
    process.env = originalEnv;
  });
}

/**
 * Create a mock FormData object
 */
export function createMockFormData(data: Record<string, any>): FormData {
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    if (value instanceof File) {
      formData.append(key, value);
    } else {
      formData.append(key, String(value));
    }
  });
  return formData;
}
