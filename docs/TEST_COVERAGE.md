# Test Coverage Documentation

## Overview

This document outlines the comprehensive test suite for the One-Page Workflow feature, organized by test type and coverage area.

## Test Organization

### 1. Unit Tests (`__tests__/unit/workflow/`)
- **Purpose**: Test individual functions in isolation
- **Files**:
  - `gap-analysis.test.ts` - Gap analysis function unit tests
  - `blog-generation.test.ts` - Blog generation function unit tests
- **Coverage**: Individual functions, edge cases, input validation

### 2. Component Tests (`__tests__/component/workflow/`)
- **Purpose**: Test React components in isolation
- **Files**:
  - `one-page-workflow.test.tsx` - UI component tests
- **Coverage**: Rendering, user interactions, state management

### 3. Integration Tests (`__tests__/integration/workflow/`)
- **Purpose**: Test how multiple components work together
- **Files**:
  - `api-endpoints.test.ts` - API endpoint integration tests
- **Coverage**: API interactions, data flow, component integration

### 4. End-to-End Tests (`__tests__/e2e/workflow/`)
- **Purpose**: Simulate real user flows across the full stack
- **Files**:
  - `complete-workflow.test.ts` - Full workflow E2E tests
- **Coverage**: Complete user journeys from input to export

### 5. Performance Tests (`__tests__/performance/workflow/`)
- **Purpose**: Test system behavior under load
- **Files**:
  - `load-testing.test.ts` - Load and response time tests
- **Coverage**: Concurrent requests, batch processing, response times

### 6. Security Tests (`__tests__/security/workflow/`)
- **Purpose**: Test for vulnerabilities and input validation
- **Files**:
  - `vulnerability-testing.test.ts` - Security and fuzz tests
- **Coverage**: Input validation, SQL injection, XSS, rate limiting

### 7. Accessibility Tests (`__tests__/accessibility/workflow/`)
- **Purpose**: Test for WCAG compliance and screen reader support
- **Files**:
  - `a11y-testing.test.tsx` - Accessibility tests
- **Coverage**: WCAG compliance, keyboard navigation, screen readers

### 8. Regression Tests (`__tests__/regression/workflow/`)
- **Purpose**: Ensure new changes don't break existing functionality
- **Files**:
  - `regression-suite.test.ts` - Regression tests
- **Coverage**: API contract stability, backward compatibility

### 9. Smoke Tests (`__tests__/smoke/workflow/`)
- **Purpose**: Quick "does it basically run?" checks
- **Files**:
  - `smoke-tests.test.ts` - Basic functionality checks
- **Coverage**: Health checks, endpoint availability, basic validation

## Running Tests

### Run All Tests
```bash
npm test
```

### Run Specific Test Suite
```bash
# Unit tests
npm test -- __tests__/unit/workflow

# Integration tests
npm test -- __tests__/integration/workflow

# E2E tests
npm test -- __tests__/e2e/workflow

# Performance tests
npm test -- __tests__/performance/workflow

# Security tests
npm test -- __tests__/security/workflow

# Accessibility tests
npm test -- __tests__/accessibility/workflow

# Regression tests
npm test -- __tests__/regression/workflow

# Smoke tests
npm test -- __tests__/smoke/workflow
```

### Run with Coverage
```bash
npm run test:coverage
```

## Environment Variables

### Required for Full Test Suite
- `OPENAI_API_KEY` - Required for OpenAI integration tests
- `TEST_API_URL` - API base URL (defaults to `http://localhost:3000`)

### Optional Skip Flags
- `SKIP_API_TESTS=true` - Skip API-dependent tests
- `SKIP_E2E_TESTS=true` - Skip E2E tests
- `SKIP_PERFORMANCE_TESTS=true` - Skip performance tests
- `SKIP_SECURITY_TESTS=true` - Skip security tests
- `SKIP_SMOKE_TESTS=true` - Skip smoke tests
- `SKIP_REGRESSION_TESTS=true` - Skip regression tests

## Test Coverage Goals

- **Unit Tests**: 80%+ coverage
- **Integration Tests**: All API endpoints covered
- **E2E Tests**: All major user flows covered
- **Performance Tests**: Response time benchmarks met
- **Security Tests**: All input validation covered
- **Accessibility Tests**: WCAG 2.1 AA compliance

## Continuous Integration

Tests are configured to run in CI/CD pipelines:
- On every commit (smoke tests)
- On pull requests (full suite)
- Before deployment (regression tests)

## Test Maintenance

- Update tests when API contracts change
- Add new tests for new features
- Review and update performance benchmarks quarterly
- Update security tests when new vulnerabilities are discovered

