/**
 * Jest Setup File
 * Runs before all tests to ensure server is available
 */

import { ensureServerRunning, checkServerHealth, stopServer } from './server-manager';

// Global setup - runs once before all tests
export default async function globalSetup() {
    console.log('\n🔧 Jest Global Setup: Ensuring server is running...\n');
    
    const serverRunning = await ensureServerRunning();
    
    if (!serverRunning) {
        console.error('\n❌ Failed to start server. Tests may fail.\n');
        console.log('💡 Tip: Start the server manually with: npm run dev\n');
    } else {
        console.log('✅ Server is ready for tests\n');
    }
    
    return async () => {
        // Global teardown - runs after all tests
        console.log('\n🧹 Jest Global Teardown: Cleaning up...\n');
        // Don't stop server in teardown - let it run for faster subsequent test runs
        // Uncomment if you want to stop server after tests:
        // await stopServer();
    };
}

