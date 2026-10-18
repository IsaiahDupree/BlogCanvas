/**
 * Test Helpers
 * Shared utilities for tests
 */

import { ensureServerRunning, checkServerHealth } from './server-manager';

/**
 * Setup hook for test files that need server
 * Call this in beforeAll() of test suites
 */
export async function setupServerForTests(timeout: number = 70000): Promise<boolean> {
    console.log('🔍 Checking server health before tests...');
    
    const isHealthy = await checkServerHealth();
    if (isHealthy) {
        console.log('✅ Server is healthy');
        return true;
    }
    
    console.log('⚠️ Server not healthy, attempting to start...');
    const started = await ensureServerRunning();
    
    if (started) {
        console.log('✅ Server started successfully');
    } else {
        console.error('❌ Failed to start server');
    }
    
    return started;
}

