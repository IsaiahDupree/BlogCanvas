# Test Server Configuration

## Overview

The test suite automatically manages a Next.js development server for running integration, E2E, and API tests. The server runs on a dedicated test port to avoid conflicts with your main development server.

## Configuration

### Environment Variables

- **`TEST_PORT`** (default: `6789`) - Port for the test server
- **`TEST_API_URL`** (default: `http://localhost:6789`) - Full URL for API calls

### Example `.env.test` or `.env.local`

```bash
# Test server configuration
TEST_PORT=6789
TEST_API_URL=http://localhost:6789

# Optional: Skip certain test types
SKIP_API_TESTS=false
SKIP_E2E_TESTS=false
SKIP_PERFORMANCE_TESTS=false
SKIP_SECURITY_TESTS=false
```

## How It Works

### Automatic Server Management

1. **Before Tests**: 
   - Checks if server is running on the test port
   - Kills any existing process on that port
   - Starts a fresh Next.js dev server on the test port
   - Waits for server to be healthy before running tests

2. **During Tests**:
   - Each test suite checks server health before running
   - If server is down, it automatically restarts

3. **After Tests**:
   - Server stays running for faster subsequent test runs
   - Can be manually stopped or will be cleaned up on process exit

### Port Management

The server manager automatically:
- Kills any process using the test port before starting
- Uses `netstat` (Windows) or `lsof` (Unix) to find processes
- Forces termination of conflicting processes
- Waits for port to be released before starting

## Usage

### Running Tests

```bash
# Run all tests (server auto-starts)
npm test

# Run specific test suite
npm test -- __tests__/smoke/workflow

# Run with custom port
TEST_PORT=9999 npm test

# Run with custom URL
TEST_API_URL=http://localhost:9999 npm test
```

### Manual Server Control

If you need to manually control the server:

```typescript
import { 
    startServer, 
    stopServer, 
    checkServerHealth,
    ensureServerRunning,
    getTestUrl,
    getTestPort
} from '__tests__/setup/server-manager';

// Start server
await startServer();

// Check if healthy
const isHealthy = await checkServerHealth();

// Ensure running (checks and starts if needed)
await ensureServerRunning();

// Get configured URL
const url = getTestUrl(); // http://localhost:6789

// Get configured port
const port = getTestPort(); // 6789

// Stop server
await stopServer();
```

## Port Conflicts

If port 6789 is already in use:

1. **Automatic**: The server manager will kill the process and start fresh
2. **Manual**: Change `TEST_PORT` environment variable
3. **Check**: Use `netstat -ano | findstr :6789` (Windows) or `lsof -i:6789` (Unix) to see what's using it

## Troubleshooting

### Server Won't Start

- Check if port is available: `netstat -ano | findstr :6789`
- Check Node.js version compatibility
- Ensure `npm run dev` works manually
- Check for firewall/antivirus blocking

### Tests Timeout

- Increase timeout in test files
- Check server logs in console
- Verify server is actually running: `curl http://localhost:6789/api/health`

### Port Already in Use

- The server manager should handle this automatically
- If not, manually kill the process or change `TEST_PORT`

## Best Practices

1. **Use Test Port**: Always use the configured test port, never hardcode `3000`
2. **Environment Variables**: Configure via `.env.test` or `.env.local`
3. **Clean State**: Server is killed and restarted before each test run
4. **Health Checks**: Tests check server health before making requests
5. **Graceful Skipping**: Tests skip gracefully if server isn't available

## Integration with CI/CD

In CI environments, you may want to:

```bash
# Start server in background
npm run dev -- -p 6789 &

# Wait for server
npx wait-on http://localhost:6789/api/health

# Run tests
npm test

# Stop server
pkill -f "next dev"
```

Or use the server manager in your CI scripts:

```typescript
import { ensureServerRunning, stopServer } from '__tests__/setup/server-manager';

await ensureServerRunning();
// Run tests
await stopServer();
```

