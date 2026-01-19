# PRD: Comprehensive Testing Strategy

**Version:** 1.0  
**Created:** January 19, 2026  
**Status:** Draft  
**Priority:** High  
**Estimated Effort:** 40-60 hours

---

## 1. Executive Summary

Establish a comprehensive testing strategy covering unit tests, integration tests, end-to-end tests, and performance tests. This ensures code quality, prevents regressions, and enables confident deployments.

---

## 2. Current State Assessment

### Existing Testing
| Area | Current Coverage | Target |
|------|------------------|--------|
| Unit Tests (lib/) | ~15% | 80% |
| API Integration Tests | ~5% | 70% |
| E2E Tests | 0% | Critical paths |
| Performance Tests | 0% | Key endpoints |
| Visual Regression | 0% | Core components |

### Identified Gaps
- No E2E test suite
- Limited unit test coverage for utilities
- No API contract testing
- No load/performance testing
- No visual regression tests
- Inconsistent test patterns

---

## 3. Testing Pyramid Strategy

```
                    /\
                   /  \
                  / E2E \        <- 10% (Critical flows)
                 /------\
                /        \
               /Integration\     <- 30% (API, DB)
              /------------\
             /              \
            /   Unit Tests   \   <- 60% (Functions, Utils)
           /------------------\
```

---

## 4. Unit Testing Strategy

### 4.1 Coverage Targets

| Directory | Current | Target | Priority |
|-----------|---------|--------|----------|
| `lib/agents/` | 20% | 85% | High |
| `lib/stripe/` | 10% | 90% | Critical |
| `lib/supabase/` | 5% | 80% | High |
| `lib/scheduling/` | 0% | 85% | High |
| `lib/email/` | 15% | 80% | Medium |
| `lib/reports/` | 10% | 75% | Medium |
| `lib/analytics/` | 5% | 80% | Medium |
| `components/` | 5% | 60% | Medium |

### 4.2 Test Structure

```
__tests__/
├── unit/
│   ├── lib/
│   │   ├── agents/
│   │   │   ├── research-agent.test.ts
│   │   │   ├── draft-agent.test.ts
│   │   │   └── seo-agent.test.ts
│   │   ├── stripe/
│   │   │   ├── checkout.test.ts
│   │   │   └── webhooks.test.ts
│   │   ├── scheduling/
│   │   │   ├── availability.test.ts
│   │   │   └── booking.test.ts
│   │   └── email/
│   │       └── templates.test.ts
│   └── components/
│       ├── editor/
│       └── ui/
├── integration/
│   ├── api/
│   └── db/
└── e2e/
    ├── flows/
    └── pages/
```

### 4.3 Unit Test Examples

```typescript
// __tests__/unit/lib/scheduling/availability.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  getAvailableSlots, 
  isSlotAvailable, 
  calculateEndTime 
} from '@/lib/scheduling/availability';

describe('Scheduling Availability', () => {
  describe('getAvailableSlots', () => {
    it('should return empty array when no availability configured', async () => {
      const slots = await getAvailableSlots({
        vendorId: 'vendor-123',
        date: new Date('2026-01-20'),
        duration: 30
      });
      expect(slots).toEqual([]);
    });

    it('should exclude already booked slots', async () => {
      // Setup mock data
      vi.mock('@/lib/supabase/server', () => ({
        createClient: vi.fn().mockResolvedValue({
          from: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          gte: vi.fn().mockReturnThis(),
          lte: vi.fn().mockResolvedValue({
            data: [
              { start_time: '09:00', end_time: '09:30' } // Booked slot
            ]
          })
        })
      }));

      const slots = await getAvailableSlots({
        vendorId: 'vendor-123',
        date: new Date('2026-01-20'),
        duration: 30
      });

      expect(slots).not.toContainEqual(
        expect.objectContaining({ time: '09:00' })
      );
    });

    it('should respect timezone differences', async () => {
      const slots = await getAvailableSlots({
        vendorId: 'vendor-123',
        date: new Date('2026-01-20'),
        duration: 30,
        timezone: 'America/New_York'
      });

      // Verify times are in correct timezone
      slots.forEach(slot => {
        expect(slot.timezone).toBe('America/New_York');
      });
    });
  });

  describe('isSlotAvailable', () => {
    it('should return true for available slot', () => {
      const result = isSlotAvailable({
        requestedTime: '10:00',
        bookedSlots: [
          { start: '09:00', end: '09:30' },
          { start: '11:00', end: '11:30' }
        ],
        duration: 30
      });
      expect(result).toBe(true);
    });

    it('should return false for overlapping slot', () => {
      const result = isSlotAvailable({
        requestedTime: '09:15',
        bookedSlots: [
          { start: '09:00', end: '09:30' }
        ],
        duration: 30
      });
      expect(result).toBe(false);
    });
  });

  describe('calculateEndTime', () => {
    it('should add duration correctly', () => {
      expect(calculateEndTime('09:00', 30)).toBe('09:30');
      expect(calculateEndTime('09:00', 60)).toBe('10:00');
      expect(calculateEndTime('23:30', 60)).toBe('00:30');
    });
  });
});
```

```typescript
// __tests__/unit/lib/stripe/checkout.test.ts
import { describe, it, expect, vi } from 'vitest';
import { createCheckoutSession, calculateOrderTotal } from '@/lib/stripe/checkout';

describe('Stripe Checkout', () => {
  describe('calculateOrderTotal', () => {
    it('should calculate base offer price', () => {
      const total = calculateOrderTotal({
        offer: { price: 99.00 },
        addons: []
      });
      expect(total).toBe(9900); // Cents
    });

    it('should add addon prices', () => {
      const total = calculateOrderTotal({
        offer: { price: 99.00 },
        addons: [
          { price: 25.00 },
          { price: 50.00 }
        ]
      });
      expect(total).toBe(17400); // 99 + 25 + 50 = 174
    });

    it('should apply percentage discounts', () => {
      const total = calculateOrderTotal({
        offer: { price: 100.00 },
        addons: [],
        discount: { type: 'percentage', value: 20 }
      });
      expect(total).toBe(8000); // 100 - 20% = 80
    });

    it('should apply fixed discounts', () => {
      const total = calculateOrderTotal({
        offer: { price: 100.00 },
        addons: [],
        discount: { type: 'fixed', value: 15 }
      });
      expect(total).toBe(8500); // 100 - 15 = 85
    });

    it('should not go below zero', () => {
      const total = calculateOrderTotal({
        offer: { price: 10.00 },
        addons: [],
        discount: { type: 'fixed', value: 50 }
      });
      expect(total).toBe(0);
    });
  });

  describe('createCheckoutSession', () => {
    it('should create session with correct line items', async () => {
      const mockStripe = {
        checkout: {
          sessions: {
            create: vi.fn().mockResolvedValue({ id: 'cs_123', url: 'https://...' })
          }
        }
      };

      const session = await createCheckoutSession({
        stripe: mockStripe,
        offer: { id: 'offer-1', name: 'Pro Package', price: 99 },
        customer: { email: 'test@example.com' },
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel'
      });

      expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          line_items: expect.arrayContaining([
            expect.objectContaining({
              price_data: expect.objectContaining({
                unit_amount: 9900
              })
            })
          ])
        })
      );
    });
  });
});
```

---

## 5. Integration Testing Strategy

### 5.1 API Route Tests

```typescript
// __tests__/integration/api/vendor/meeting-types.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestClient, createTestVendor, cleanup } from '../helpers';

describe('API: /api/vendor/meeting-types', () => {
  let testVendor: any;
  let authToken: string;

  beforeAll(async () => {
    const { vendor, token } = await createTestVendor();
    testVendor = vendor;
    authToken = token;
  });

  afterAll(async () => {
    await cleanup(testVendor.id);
  });

  describe('GET /api/vendor/meeting-types', () => {
    it('should return 401 without auth', async () => {
      const res = await fetch('/api/vendor/meeting-types');
      expect(res.status).toBe(401);
    });

    it('should return empty array for new vendor', async () => {
      const res = await fetch('/api/vendor/meeting-types', {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      const data = await res.json();
      
      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.meetingTypes).toEqual([]);
    });
  });

  describe('POST /api/vendor/meeting-types', () => {
    it('should create meeting type', async () => {
      const res = await fetch('/api/vendor/meeting-types', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: 'Discovery Call',
          duration: 30,
          location_type: 'video'
        })
      });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.meetingType).toMatchObject({
        name: 'Discovery Call',
        duration: 30,
        location_type: 'video'
      });
    });

    it('should validate required fields', async () => {
      const res = await fetch('/api/vendor/meeting-types', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          duration: 30 // Missing name
        })
      });
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain('name');
    });
  });
});
```

### 5.2 Database Tests

```typescript
// __tests__/integration/db/vendor-operations.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createTestSupabase, resetDatabase } from '../helpers';

describe('Database: Vendor Operations', () => {
  let supabase: any;

  beforeEach(async () => {
    supabase = await createTestSupabase();
  });

  afterEach(async () => {
    await resetDatabase();
  });

  describe('RLS Policies', () => {
    it('should only return vendors own data', async () => {
      // Create two vendors
      const vendor1 = await createVendor(supabase, { handle: 'vendor1' });
      const vendor2 = await createVendor(supabase, { handle: 'vendor2' });

      // Auth as vendor1
      await supabase.auth.signInWithPassword({
        email: 'vendor1@test.com',
        password: 'test123'
      });

      // Query vendors - should only see own record
      const { data } = await supabase.from('vendors').select('*');
      
      expect(data.length).toBe(1);
      expect(data[0].handle).toBe('vendor1');
    });

    it('should prevent cross-vendor data access', async () => {
      const vendor1 = await createVendor(supabase, { handle: 'vendor1' });
      const vendor2 = await createVendor(supabase, { handle: 'vendor2' });

      // Create client for vendor2
      const client = await createClient(supabase, { vendor_id: vendor2.id });

      // Auth as vendor1
      await supabase.auth.signInWithPassword({
        email: 'vendor1@test.com',
        password: 'test123'
      });

      // Try to access vendor2's client
      const { data, error } = await supabase
        .from('vendor_clients')
        .select('*')
        .eq('id', client.id);

      expect(data).toEqual([]);
    });
  });
});
```

---

## 6. End-to-End Testing Strategy

### 6.1 Critical User Flows

| Flow | Priority | Test Scenarios |
|------|----------|----------------|
| Vendor Registration | Critical | Happy path, validation errors, duplicate handle |
| Offer Page Creation | Critical | Create, edit, preview, publish |
| Checkout Flow | Critical | One-time, subscription, with addons |
| Client Portal Access | High | Login, view deliverables, approve |
| Meeting Booking | High | Select slot, book, confirm |
| Messaging | Medium | Send, receive, attachments |

### 6.2 Playwright Test Setup

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  
  use: {
    baseURL: 'http://localhost:4848',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'mobile-chrome', use: { ...devices['Pixel 5'] } },
    { name: 'mobile-safari', use: { ...devices['iPhone 12'] } }
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:4848',
    reuseExistingServer: !process.env.CI
  }
});
```

### 6.3 E2E Test Examples

```typescript
// e2e/flows/checkout.spec.ts
import { test, expect } from '@playwright/test';
import { createTestVendor, createTestOfferPage } from './helpers';

test.describe('Checkout Flow', () => {
  let vendorHandle: string;
  let pageSlug: string;

  test.beforeAll(async () => {
    const { handle, page } = await createTestOfferPage();
    vendorHandle = handle;
    pageSlug = page.slug;
  });

  test('should complete one-time purchase', async ({ page }) => {
    // Visit offer page
    await page.goto(`/@${vendorHandle}/${pageSlug}`);
    
    // Click checkout button
    await page.click('[data-testid="checkout-button"]');
    
    // Fill Stripe checkout (test mode)
    await page.fill('[data-testid="email"]', 'test@example.com');
    await page.fill('[data-testid="cardNumber"]', '4242424242424242');
    await page.fill('[data-testid="cardExpiry"]', '12/30');
    await page.fill('[data-testid="cardCvc"]', '123');
    await page.fill('[data-testid="billingName"]', 'Test User');
    
    // Submit payment
    await page.click('[data-testid="submit-button"]');
    
    // Verify redirect to success page
    await expect(page).toHaveURL(/\/checkout\/success/);
    await expect(page.locator('h1')).toContainText('Thank You');
    
    // Verify order confirmation email sent
    // (Check test email service or database)
  });

  test('should handle payment failure gracefully', async ({ page }) => {
    await page.goto(`/@${vendorHandle}/${pageSlug}`);
    await page.click('[data-testid="checkout-button"]');
    
    // Use decline card
    await page.fill('[data-testid="cardNumber"]', '4000000000000002');
    await page.fill('[data-testid="cardExpiry"]', '12/30');
    await page.fill('[data-testid="cardCvc"]', '123');
    
    await page.click('[data-testid="submit-button"]');
    
    // Verify error message
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-message"]')).toContainText('declined');
  });

  test('should apply coupon code', async ({ page }) => {
    await page.goto(`/@${vendorHandle}/${pageSlug}`);
    
    // Apply coupon
    await page.click('[data-testid="have-coupon"]');
    await page.fill('[data-testid="coupon-input"]', 'SAVE20');
    await page.click('[data-testid="apply-coupon"]');
    
    // Verify discount applied
    await expect(page.locator('[data-testid="discount-amount"]')).toBeVisible();
    await expect(page.locator('[data-testid="total-amount"]')).not.toEqual(
      page.locator('[data-testid="subtotal-amount"]')
    );
  });
});
```

```typescript
// e2e/flows/vendor-registration.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Vendor Registration', () => {
  test('should register new vendor', async ({ page }) => {
    await page.goto('/vendor/register');
    
    // Fill registration form
    await page.fill('[name="email"]', `test-${Date.now()}@example.com`);
    await page.fill('[name="password"]', 'SecurePass123!');
    await page.fill('[name="business_name"]', 'Test Agency');
    await page.fill('[name="handle"]', `test-agency-${Date.now()}`);
    
    // Submit
    await page.click('[type="submit"]');
    
    // Verify redirect to dashboard
    await expect(page).toHaveURL('/vendor/dashboard');
    await expect(page.locator('h1')).toContainText('Dashboard');
  });

  test('should show error for duplicate handle', async ({ page }) => {
    // First registration
    const handle = `duplicate-${Date.now()}`;
    await page.goto('/vendor/register');
    await page.fill('[name="email"]', `first@example.com`);
    await page.fill('[name="password"]', 'SecurePass123!');
    await page.fill('[name="business_name"]', 'First Agency');
    await page.fill('[name="handle"]', handle);
    await page.click('[type="submit"]');
    await expect(page).toHaveURL('/vendor/dashboard');
    
    // Logout
    await page.click('[data-testid="user-menu"]');
    await page.click('[data-testid="logout"]');
    
    // Second registration with same handle
    await page.goto('/vendor/register');
    await page.fill('[name="email"]', `second@example.com`);
    await page.fill('[name="password"]', 'SecurePass123!');
    await page.fill('[name="business_name"]', 'Second Agency');
    await page.fill('[name="handle"]', handle);
    await page.click('[type="submit"]');
    
    // Verify error
    await expect(page.locator('[data-testid="error"]')).toContainText('handle');
  });
});
```

---

## 7. Performance Testing Strategy

### 7.1 Key Metrics

| Metric | Target | Tool |
|--------|--------|------|
| API Response Time (p95) | < 200ms | k6 |
| Page Load (LCP) | < 2.5s | Lighthouse |
| Time to Interactive | < 3.5s | Lighthouse |
| Database Query Time | < 50ms | pg_stat_statements |

### 7.2 Load Testing Script

```javascript
// k6/load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '1m', target: 50 },   // Ramp up
    { duration: '3m', target: 50 },   // Sustain
    { duration: '1m', target: 100 },  // Peak
    { duration: '1m', target: 0 }     // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<200'], // 95% under 200ms
    http_req_failed: ['rate<0.01']    // <1% errors
  }
};

export default function () {
  // Test vendor dashboard API
  const dashboardRes = http.get('http://localhost:4848/api/vendor/dashboard/stats', {
    headers: { Authorization: `Bearer ${__ENV.AUTH_TOKEN}` }
  });
  
  check(dashboardRes, {
    'dashboard status 200': (r) => r.status === 200,
    'dashboard response time OK': (r) => r.timings.duration < 200
  });

  // Test public offer page
  const pageRes = http.get('http://localhost:4848/@test-vendor/test-page');
  
  check(pageRes, {
    'page status 200': (r) => r.status === 200,
    'page has content': (r) => r.body.includes('test-page')
  });

  sleep(1);
}
```

---

## 8. CI/CD Integration

### 8.1 GitHub Actions Workflow

```yaml
# .github/workflows/test.yml
name: Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - run: npm ci
      - run: npm run test:unit
      
      - uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
          fail_ci_if_error: true

  integration-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: supabase/postgres:15.1.0.117
        env:
          POSTGRES_PASSWORD: postgres
        ports:
          - 5432:5432
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run test:integration
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
      
      - uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/

  performance-tests:
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - uses: grafana/k6-action@v0.3.1
        with:
          filename: k6/load-test.js
```

### 8.2 Package.json Scripts

```json
{
  "scripts": {
    "test": "vitest",
    "test:unit": "vitest run --coverage",
    "test:integration": "vitest run --config vitest.integration.config.ts",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:debug": "playwright test --debug",
    "test:perf": "k6 run k6/load-test.js",
    "test:all": "npm run test:unit && npm run test:integration && npm run test:e2e"
  }
}
```

---

## 9. Implementation Plan

### Phase 1: Foundation (8 hours)
- [ ] Set up Vitest with coverage
- [ ] Configure Playwright
- [ ] Create test helpers and fixtures
- [ ] Set up CI workflow

### Phase 2: Unit Tests (16 hours)
- [ ] `lib/stripe/` - 8 hours
- [ ] `lib/scheduling/` - 4 hours
- [ ] `lib/agents/` - 4 hours

### Phase 3: Integration Tests (12 hours)
- [ ] API route tests - 8 hours
- [ ] Database operation tests - 4 hours

### Phase 4: E2E Tests (12 hours)
- [ ] Checkout flow - 4 hours
- [ ] Vendor registration - 2 hours
- [ ] Client portal - 4 hours
- [ ] Meeting booking - 2 hours

### Phase 5: Performance (8 hours)
- [ ] Set up k6
- [ ] Write load tests
- [ ] Set up monitoring
- [ ] Baseline benchmarks

---

## 10. Test Data Management

### Fixtures

```typescript
// __tests__/fixtures/vendors.ts
export const testVendors = {
  basicVendor: {
    email: 'vendor@test.com',
    handle: 'test-vendor',
    business_name: 'Test Agency'
  },
  premiumVendor: {
    email: 'premium@test.com',
    handle: 'premium-vendor',
    business_name: 'Premium Agency',
    subscription_tier: 'business'
  }
};

// __tests__/fixtures/offers.ts
export const testOffers = {
  oneTimeOffer: {
    name: 'Basic Package',
    price: 99.00,
    offer_type: 'one_time'
  },
  subscriptionOffer: {
    name: 'Monthly Retainer',
    price: 499.00,
    offer_type: 'subscription',
    billing_period: 'monthly'
  }
};
```

---

## 11. Success Criteria

| Metric | Target |
|--------|--------|
| Unit Test Coverage | 80% |
| Integration Test Coverage | 70% |
| E2E Test Pass Rate | 100% |
| CI Pipeline Time | < 10 min |
| Zero Critical Bugs in Prod | Maintained |

---

*Document Owner: Engineering*  
*Last Updated: January 19, 2026*
