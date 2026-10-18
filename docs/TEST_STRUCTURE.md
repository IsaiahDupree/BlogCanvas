# Test Structure

## Overview

Tests are organized into three main categories: **Unit**, **Integration**, and **E2E**. Each category has smaller, focused test files.

## Test Organization

### Unit Tests (`__tests__/unit/workflow/`)
**Purpose**: Test individual functions in isolation  
**Speed**: Fast (< 1 second)  
**Dependencies**: None (no server required)

- `gap-analyzer.test.ts` - Gap analysis function tests
- `openai-provider.test.ts` - OpenAI provider configuration tests
- `blog-suggestions.test.ts` - Blog title/angle generation tests

**Run**: `npm test -- __tests__/unit/workflow`

### Integration Tests (`__tests__/integration/workflow/`)
**Purpose**: Test API endpoints with real server  
**Speed**: Medium (30-120 seconds)  
**Dependencies**: Server must be running

- `gap-analysis-api.test.ts` - Gap analysis API endpoint
- `blog-generation-api.test.ts` - Blog generation API endpoint

**Run**: `npm test -- __tests__/integration/workflow`

### E2E Tests (`__tests__/e2e/workflow/`)
**Purpose**: Test complete user workflows  
**Speed**: Slow (2-5 minutes)  
**Dependencies**: Server + OpenAI API key

- `complete-flow.test.ts` - Full workflow from URL to blog generation

**Run**: `npm test -- __tests__/e2e/workflow`

## Test Execution

### Run All Tests
```bash
npm test
```

### Run by Category
```bash
# Unit tests only (fast)
npm test -- __tests__/unit/workflow

# Integration tests (requires server)
npm test -- __tests__/integration/workflow

# E2E tests (requires server + OpenAI)
npm test -- __tests__/e2e/workflow
```

### Run Specific Test File
```bash
npm test -- __tests__/unit/workflow/gap-analyzer.test.ts
```

## Server Management

The test suite automatically:
- Checks server health before tests
- Starts server on port 6789 if needed
- Kills processes on port 6789 before starting
- Cleans up Next.js lock files
- Loads environment variables from `.env.local`

### Configuration

- `TEST_PORT` (default: `6789`) - Port for test server
- `TEST_API_URL` (default: `http://localhost:6789`) - Server URL
- `SKIP_API_TESTS` - Skip API-dependent tests
- `SKIP_E2E_TESTS` - Skip E2E tests

## Test Characteristics

### Unit Tests
- ✅ Fast execution
- ✅ No external dependencies
- ✅ Isolated function testing
- ✅ Can run without server

### Integration Tests
- ⚠️ Requires server running
- ✅ Tests API contracts
- ✅ Verifies data flow
- ✅ Medium execution time

### E2E Tests
- ⚠️ Requires server + OpenAI API key
- ✅ Tests complete workflows
- ✅ Simulates real user behavior
- ⚠️ Slow execution time

## Best Practices

1. **Write unit tests first** - Fast feedback loop
2. **Add integration tests for APIs** - Verify contracts
3. **Use E2E tests sparingly** - Only for critical flows
4. **Keep tests small and focused** - One concept per test
5. **Use descriptive test names** - Clear what's being tested

