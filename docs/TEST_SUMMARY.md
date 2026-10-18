# Test Suite Summary

## Test Organization

### ✅ Unit Tests (Fast - < 1 second)
**Location**: `__tests__/unit/workflow/`

- `gap-analyzer.test.ts` - 3 tests
- `openai-provider.test.ts` - 2 tests  
- `blog-suggestions.test.ts` - 2 tests

**Total**: 7 tests, all passing ✅

**Run**: `npm test -- __tests__/unit/workflow`

### ⚠️ Integration Tests (Medium - 30-120 seconds)
**Location**: `__tests__/integration/workflow/`

- `gap-analysis-api.test.ts` - 2 tests (requires server)
- `blog-generation-api.test.ts` - 2 tests (requires server + OpenAI)

**Run**: `npm test -- __tests__/integration/workflow`

### ⚠️ E2E Tests (Slow - 2-5 minutes)
**Location**: `__tests__/e2e/workflow/`

- `complete-flow.test.ts` - 1 test (full workflow)

**Run**: `npm test -- __tests__/e2e/workflow`

## Server Management

✅ **Automatic server management**:
- Checks health before tests
- Starts server on port 6789 if needed
- Kills existing processes on port 6789
- Cleans up Next.js lock files
- Loads environment variables

✅ **Configurable via environment**:
- `TEST_PORT=6789` (default)
- `TEST_API_URL=http://localhost:6789` (default)
- `SKIP_API_TESTS=true` to skip API tests
- `SKIP_E2E_TESTS=true` to skip E2E tests

## Test Results

### Unit Tests: ✅ 7/7 passing
- Fast execution (< 1 second)
- No dependencies
- All passing

### Integration Tests: ⚠️ Requires server
- Server auto-starts
- Tests API endpoints
- May timeout on slow operations

### E2E Tests: ⚠️ Requires server + OpenAI
- Full workflow testing
- Slow but comprehensive
- Requires OpenAI API key

## Quick Start

```bash
# Run all unit tests (fast)
npm test -- __tests__/unit/workflow

# Run integration tests (requires server)
npm test -- __tests__/integration/workflow

# Run E2E tests (requires server + OpenAI)
npm test -- __tests__/e2e/workflow

# Run all tests
npm test
```

