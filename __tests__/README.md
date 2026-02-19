# BlogCanvas Test Suite

## Overview

This directory contains the comprehensive test suite for BlogCanvas, covering unit tests, integration tests, E2E tests, and security tests.

## Test Structure

```
__tests__/
├── mocks/                  # Mock services and test helpers
│   ├── supabase-auth.mock.ts    # Supabase Auth mocks
│   ├── supabase-db.mock.ts      # Supabase DB query mocks
│   ├── stripe.mock.ts           # Stripe payment mocks
│   ├── email.mock.ts            # Email service mocks
│   └── test-helpers.ts          # Common test utilities
├── unit/                   # Unit tests for individual functions
├── integration/            # Integration tests for API routes
├── e2e/                    # End-to-end tests with Playwright
├── security/               # Security and penetration tests
├── accessibility/          # Accessibility (a11y) tests
└── performance/            # Performance and load tests
```

## Running Tests

### All Tests
```bash
npm test
```

### Unit Tests Only
```bash
npm test -- --testPathPattern=unit
```

### Integration Tests Only
```bash
npm test -- --testPathPattern=integration
```

### E2E Tests
```bash
npm run test:e2e
```

### With Coverage
```bash
npm run test:coverage
```

### Watch Mode (for development)
```bash
npm run test:watch
```

## Test Data Seeding

To seed test data for development and testing:

```bash
npm run test:seed
```

This creates idempotent test data including:
- Test users (owner, staff, client roles)
- Test clients with profiles
- Sample blog posts in various states
- Agent run logs

### Test Credentials
After seeding, you can log in with:

- **Owner**: `owner@test.com` / `TestPassword123!`
- **Staff**: `staff@test.com` / `TestPassword123!`
- **Client (Acme)**: `acme-user@test.com` / `TestPassword123!`
- **Client (Tech)**: `tech-user@test.com` / `TestPassword123!`

## Mock Services

The test suite includes comprehensive mocks for external services:

### Supabase Auth
```typescript
import { createMockSupabaseAuth, mockUser } from '@/__tests__/mocks';

const mockAuth = createMockSupabaseAuth();
// Use in tests
```

### Supabase Database
```typescript
import { createMockSupabaseClient, mockBlogPost } from '@/__tests__/mocks';

const mockDb = createMockSupabaseClient({
  blog_posts: [mockBlogPost],
  clients: [mockClient]
});
```

### Stripe
```typescript
import { createMockStripe, mockStripeCustomer } from '@/__tests__/mocks';

const mockStripe = createMockStripe();
```

### Email (Resend)
```typescript
import { createMockResend, MockEmailTracker } from '@/__tests__/mocks';

const mockEmail = createMockResend();
const tracker = new MockEmailTracker();
```

## Test Helpers

### Creating Mock Requests
```typescript
import { createMockAuthRequest, createMockNextRequest } from '@/__tests__/mocks';

const request = createMockAuthRequest('POST', { data: 'test' });
```

### Test Data Factories
```typescript
import { createTestData } from '@/__tests__/mocks';

const { user, client, blogPost } = createTestData();
```

## Security Tests

Security tests ensure:

1. **Authentication**: Unauthenticated requests return 401
2. **Authorization**: Users cannot access other users' data
3. **Data Leaks**: No sensitive info in error messages
4. **Session Security**: Tokens expire and invalidate properly
5. **CSRF Protection**: Cross-origin requests are blocked
6. **Rate Limiting**: Login attempts are rate-limited

Run security tests:
```bash
npm test -- security/
```

## CI/CD Integration

Tests run automatically in GitHub Actions on:
- Push to `master`, `main`, or `develop` branches
- Pull requests to these branches

The CI pipeline includes:
1. **Lint**: ESLint checks
2. **Unit Tests**: With coverage reporting
3. **E2E Tests**: Parallel execution with sharding
4. **Build**: Ensure the app builds successfully

### Coverage Requirements

- Global: 60%
- Auth module: 75%
- Stripe module: 80%

## Writing Tests

### Unit Test Example
```typescript
import { describe, it, expect } from '@jest/globals';

describe('MyFunction', () => {
  it('should return correct value', () => {
    expect(myFunction(input)).toBe(expected);
  });
});
```

### Integration Test Example
```typescript
import { createMockSupabaseClient } from '@/__tests__/mocks';

describe('API Route: /api/blog-posts', () => {
  it('should create a blog post', async () => {
    const mockDb = createMockSupabaseClient();
    // Test API route with mock DB
  });
});
```

### E2E Test Example
```typescript
import { test, expect } from '@playwright/test';

test('user can create a blog post', async ({ page }) => {
  await page.goto('/dashboard');
  await page.click('text=New Post');
  // ... test flow
});
```

## Best Practices

1. **Isolation**: Each test should be independent
2. **Clarity**: Test names should clearly describe what they test
3. **Coverage**: Aim for high coverage, especially on critical paths
4. **Speed**: Unit tests should be fast; use mocks generously
5. **Determinism**: Tests should not be flaky
6. **Cleanup**: Clean up test data after each test

## Troubleshooting

### Tests failing with DB connection errors
Ensure your `.env.test.local` has valid Supabase credentials:
```
NEXT_PUBLIC_SUPABASE_URL=your-url
SUPABASE_SERVICE_ROLE_KEY=your-key
```

### E2E tests timing out
Increase timeout in `playwright.config.ts`:
```typescript
use: {
  timeout: 30000
}
```

### Mock not working
Ensure mocks are imported before the code under test:
```typescript
import { createMockSupabaseClient } from '@/__tests__/mocks';
jest.mock('@/lib/supabase', () => ({
  supabase: createMockSupabaseClient()
}));
```

## Resources

- [Jest Documentation](https://jestjs.io/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Library](https://testing-library.com/)
- [Supabase Testing Guide](https://supabase.com/docs/guides/getting-started/testing)

## Contributing

When adding new features:

1. Write tests first (TDD)
2. Ensure all tests pass
3. Update `feature_list.json` with `passes: true`
4. Run coverage to ensure you meet thresholds
5. Commit tests with the feature code

---

**Last Updated**: February 19, 2026
**Test Coverage**: 58.7% (176/300 features passing)
