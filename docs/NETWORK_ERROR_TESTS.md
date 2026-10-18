# Network Error Tests Documentation

## Overview

Comprehensive test suite for handling network errors, RSC payload issues, and WebSocket connection problems in the one-page workflow.

## Test Files Created

### 1. Component Tests (`__tests__/component/workflow/one-page-workflow-network.test.tsx`)
Tests for React component-level network error handling:
- RSC payload fetch failures
- Network error handling
- WebSocket HMR connection interruptions
- SSE connection failures and reconnection
- Client component validation
- Hydration mismatch detection

**Note**: These tests require `jsdom` test environment. Update `jest.config.mjs` to use `testEnvironment: 'jsdom'` for component tests, or run with:
```bash
npm test -- __tests__/component/workflow/one-page-workflow-network.test.tsx --testEnvironment=jsdom
```

### 2. Integration Tests (`__tests__/integration/workflow/network-errors.test.ts`)
Tests for API-level network error handling:
- RSC payload errors
- WebSocket HMR connection handling
- API endpoint resilience
- SSE log streaming errors
- Server health checks
- Concurrent request handling

## Common Network Errors Addressed

### 1. RSC Payload Errors
**Error**: `Failed to fetch RSC payload for http://localhost:6789/one-page-workflow`

**Causes**:
- Server not fully started
- Network connectivity issues
- CORS problems
- Server-side rendering errors

**Tests Cover**:
- RSC payload fetch failures
- Proper header handling
- Graceful degradation

### 2. WebSocket HMR Connection
**Error**: `The connection to ws://localhost:6789/_next/webpack-hmr was interrupted`

**Causes**:
- Hot Module Replacement (HMR) connection issues
- Server restart during development
- Network interruptions

**Tests Cover**:
- WebSocket connection interruptions
- HMR reconnection handling
- Graceful fallback

### 3. Network Errors
**Error**: `NetworkError when attempting to fetch resource`

**Causes**:
- API endpoint failures
- Timeout scenarios
- CORS issues
- Server unavailability

**Tests Cover**:
- API error handling
- Timeout scenarios
- CORS error handling
- Network failure recovery

## Running the Tests

### Component Tests (requires jsdom)
```bash
# Option 1: Set environment in command
npm test -- __tests__/component/workflow/one-page-workflow-network.test.tsx --testEnvironment=jsdom

# Option 2: Update jest.config.mjs to use jsdom for .tsx files
```

### Integration Tests
```bash
npm test -- __tests__/integration/workflow/network-errors.test.ts
```

### All Network Tests
```bash
npm test -- __tests__/component/workflow/one-page-workflow-network.test.tsx __tests__/integration/workflow/network-errors.test.ts
```

## Fixes Applied

1. **Less Aggressive Coverage Detection**: Updated `checkCoverage` to require 80% match and at least 2 pages
2. **Blog Suggestions from Gaps**: Generate blog titles directly from topic gaps
3. **Terminal Viewer**: Added SSE connection error handling
4. **Error Boundaries**: Graceful error handling throughout the workflow

## Next Steps

1. Update `jest.config.mjs` to use `jsdom` for component tests:
```javascript
{
  testEnvironment: 'jsdom',
  // or use per-file overrides
}
```

2. Install `@testing-library/user-event` if needed:
```bash
npm install --save-dev @testing-library/user-event
```

3. Run tests and verify all network error scenarios are covered

## Troubleshooting

### Tests failing with "document is not defined"
- Ensure `testEnvironment: 'jsdom'` is set for component tests
- Or use `@jest-environment jsdom` comment at top of test file

### SSE tests timing out
- Increase timeout in test configuration
- Ensure server is running on correct port (6789)

### WebSocket tests failing
- Mock WebSocket properly in test setup
- Ensure HMR is not interfering with tests

