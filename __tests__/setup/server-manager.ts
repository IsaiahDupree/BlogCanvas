/**
 * Server Manager
 * Manages Next.js dev server lifecycle for tests
 */

import { spawn, ChildProcess, exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const execAsync = promisify(exec);

// Configurable port and URL via environment variables
const TEST_PORT = process.env.TEST_PORT || '6789';
const BASE_URL = process.env.TEST_API_URL || `http://localhost:${TEST_PORT}`;
const SERVER_START_TIMEOUT = 60000; // 60 seconds
const HEALTH_CHECK_INTERVAL = 2000; // 2 seconds
const MAX_HEALTH_CHECK_ATTEMPTS = 30; // 30 attempts = 60 seconds

let serverProcess: ChildProcess | null = null;
let serverReady = false;

/**
 * Check if server is healthy
 */
export async function checkServerHealth(): Promise<boolean> {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        
        const response = await fetch(`${BASE_URL}/api/health`, {
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
            const data = await response.json().catch(() => ({}));
            console.log(`   ✅ Health check passed! Status: ${response.status}`);
            return true;
        } else if (response.status === 404) {
            console.log(`   ⚠️ Health endpoint not found (404) - server may still be starting`);
            return false;
        } else {
            console.log(`   ⚠️ Health check returned status ${response.status}`);
            return false;
        }
    } catch (error: any) {
        if (error.name === 'AbortError') {
            // Timeout - server not responding
            return false;
        } else if (error.message?.includes('ECONNREFUSED')) {
            // Connection refused - server not running
            return false;
        } else {
            // Other network error
            return false;
        }
    }
}

/**
 * Wait for server to be ready
 */
export async function waitForServer(maxAttempts: number = MAX_HEALTH_CHECK_ATTEMPTS): Promise<boolean> {
    console.log(`   Starting health checks (${maxAttempts} attempts, ${HEALTH_CHECK_INTERVAL}ms interval)...`);
    
    for (let i = 0; i < maxAttempts; i++) {
        const attempt = i + 1;
        if (attempt % 5 === 0 || attempt <= 3) {
            console.log(`   Attempt ${attempt}/${maxAttempts}: Checking ${BASE_URL}/api/health...`);
        }
        
        const isHealthy = await checkServerHealth();
        if (isHealthy) {
            console.log(`   ✅ Health check passed on attempt ${attempt}`);
            return true;
        }
        
        if (attempt < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, HEALTH_CHECK_INTERVAL));
        }
    }
    
    console.log(`   ❌ Health check failed after ${maxAttempts} attempts`);
    return false;
}

/**
 * Kill process running on a specific port
 */
async function killProcessOnPort(port: string): Promise<void> {
    const isWindows = process.platform === 'win32';
    
    console.log(`\n🔍 Checking for processes on port ${port}...`);
    
    try {
        if (isWindows) {
            // Windows: Find process using port and kill it
            console.log(`   Running: netstat -ano | findstr :${port}`);
            const { stdout } = await execAsync(`netstat -ano | findstr :${port}`);
            const lines = stdout.trim().split('\n').filter(Boolean);
            
            console.log(`   Found ${lines.length} connection(s) on port ${port}`);
            
            if (lines.length === 0) {
                console.log(`   ✅ Port ${port} is free`);
                return;
            }
            
            // Find LISTENING processes (actual server processes)
            const listeningPids = new Set<string>();
            
            for (const line of lines) {
                const trimmed = line.trim();
                // Only process LISTENING connections (actual servers)
                if (trimmed.includes('LISTENING')) {
                    const parts = trimmed.split(/\s+/);
                    const pid = parts[parts.length - 1];
                    
                    // Skip PID 0 (system process) and invalid PIDs
                    if (pid && pid !== '0' && !isNaN(parseInt(pid))) {
                        listeningPids.add(pid);
                    }
                }
            }
            
            if (listeningPids.size === 0) {
                console.log(`   ℹ️ No LISTENING processes found (only TIME_WAIT/CLOSE_WAIT connections)`);
                console.log(`   ✅ Port ${port} should be free`);
                return;
            }
            
            console.log(`   Found ${listeningPids.size} LISTENING process(es) to kill`);
            
            for (const pid of listeningPids) {
                console.log(`   🔪 Killing process ${pid} on port ${port}...`);
                try {
                    await execAsync(`taskkill /F /PID ${pid}`);
                    console.log(`   ✅ Successfully killed process ${pid}`);
                } catch (error: any) {
                    if (error.message.includes('not found')) {
                        console.log(`   ℹ️ Process ${pid} already terminated`);
                    } else {
                        console.log(`   ⚠️ Could not kill process ${pid}: ${error.message}`);
                    }
                }
            }
        } else {
            // Unix/Linux/Mac: Find and kill process
            console.log(`   Running: lsof -ti:${port}`);
            const { stdout } = await execAsync(`lsof -ti:${port}`);
            const pids = stdout.trim().split('\n').filter(Boolean);
            
            console.log(`   Found ${pids.length} process(es) using port ${port}`);
            
            if (pids.length === 0) {
                console.log(`   ✅ Port ${port} is free`);
                return;
            }
            
            for (const pid of pids) {
                console.log(`   🔪 Killing process ${pid} on port ${port}...`);
                try {
                    await execAsync(`kill -9 ${pid}`);
                    console.log(`   ✅ Successfully killed process ${pid}`);
                } catch (error: any) {
                    console.log(`   ⚠️ Could not kill process ${pid}: ${error.message}`);
                    // Process might already be dead, ignore
                }
            }
        }
        
        // Wait a moment for port to be released
        console.log(`   ⏳ Waiting 2 seconds for port ${port} to be released...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        console.log(`   ✅ Port cleanup complete\n`);
    } catch (error: any) {
        // No process found on port - that's fine
        if (error.message.includes('findstr') || error.message.includes('lsof')) {
            console.log(`   ✅ No process found on port ${port} (port is free)\n`);
        } else {
            console.log(`   ⚠️ Error checking port ${port}: ${error.message}\n`);
        }
    }
}

/**
 * Clean up Next.js lock files
 */
async function cleanupNextLockFiles(): Promise<void> {
    const projectRoot = process.cwd();
    const lockPath = path.join(projectRoot, '.next', 'dev', 'lock');
    
    console.log(`\n🧹 Cleaning up Next.js lock files...`);
    console.log(`   Lock file path: ${lockPath}`);
    
    try {
        if (fs.existsSync(lockPath)) {
            console.log(`   ⚠️ Found lock file, removing...`);
            fs.unlinkSync(lockPath);
            console.log(`   ✅ Lock file removed`);
        } else {
            console.log(`   ✅ No lock file found`);
        }
        
        // Also check for .next/dev directory and clean if needed
        const devDir = path.join(projectRoot, '.next', 'dev');
        if (fs.existsSync(devDir)) {
            console.log(`   ℹ️ .next/dev directory exists (this is normal)`);
        }
    } catch (error: any) {
        console.log(`   ⚠️ Could not clean lock file: ${error.message}`);
        console.log(`   ℹ️ This is usually fine if the file doesn't exist`);
    }
    
    // Wait a moment for file system to sync
    await new Promise(resolve => setTimeout(resolve, 500));
    console.log(`   ✅ Cleanup complete\n`);
}

/**
 * Start the Next.js dev server
 */
export async function startServer(): Promise<boolean> {
    // First, kill any process on the test port
    console.log(`🔍 Checking port ${TEST_PORT} for existing processes...`);
    await killProcessOnPort(TEST_PORT);
    
    // Clean up Next.js lock files
    await cleanupNextLockFiles();
    
    if (serverProcess && !serverProcess.killed) {
        console.log('📦 Server process already exists, checking health...');
        if (await checkServerHealth()) {
            serverReady = true;
            return true;
        }
        // Process exists but server isn't healthy, kill it
        console.log('⚠️ Server process exists but not healthy, restarting...');
        await stopServer();
    }

    console.log(`🚀 Starting Next.js dev server on port ${TEST_PORT}...`);
    console.log(`   Command: npm run dev -- -p ${TEST_PORT}`);
    console.log(`   Working directory: ${process.cwd()}`);
    
    const projectRoot = process.cwd();
    const isWindows = process.platform === 'win32';
    
    // On Windows, use shell: true with 'npm' command
    // On Unix, use 'npm' directly
    // Load environment variables from .env files
    const envVars = { ...process.env };
    
    // Try to load .env.local if it exists
    try {
        const dotenv = require('dotenv');
        const envLocal = dotenv.config({ path: path.join(projectRoot, '.env.local') });
        if (envLocal.parsed) {
            Object.assign(envVars, envLocal.parsed);
            console.log(`   ✅ Loaded .env.local (${Object.keys(envLocal.parsed).length} vars)`);
        }
    } catch (error) {
        console.log(`   ℹ️ Could not load .env.local (this is okay)`);
    }
    
    // Try to load .env if it exists
    try {
        const dotenv = require('dotenv');
        const env = dotenv.config({ path: path.join(projectRoot, '.env') });
        if (env.parsed) {
            Object.assign(envVars, env.parsed);
            console.log(`   ✅ Loaded .env (${Object.keys(env.parsed).length} vars)`);
        }
    } catch (error) {
        console.log(`   ℹ️ Could not load .env (this is okay)`);
    }
    
    const spawnOptions: any = {
        cwd: projectRoot,
        stdio: ['ignore', 'pipe', 'pipe'],
        env: {
            ...envVars,
            PORT: TEST_PORT,
            NODE_ENV: 'test'
        }
    };
    
    console.log(`   Environment variables:`);
    console.log(`     PORT: ${TEST_PORT}`);
    console.log(`     NODE_ENV: test`);
    console.log(`     NEXT_PUBLIC_SUPABASE_URL: ${envVars.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing'}`);
    console.log(`     NEXT_PUBLIC_SUPABASE_ANON_KEY: ${envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'}`);
    console.log(`     SUPABASE_SERVICE_ROLE_KEY: ${envVars.SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '❌ Missing'}`);
    
    if (isWindows) {
        // Windows requires shell: true for npm commands
        spawnOptions.shell = true;
        serverProcess = spawn(`npm run dev -- -p ${TEST_PORT}`, [], spawnOptions);
    } else {
        serverProcess = spawn('npm', ['run', 'dev', '--', '-p', TEST_PORT], spawnOptions);
    }

    // Log server output for debugging
    let serverOutput = '';
    let serverErrors = '';

    serverProcess.stdout?.on('data', (data) => {
        const output = data.toString();
        serverOutput += output;
        console.log(`[SERVER STDOUT] ${output.trim()}`);
        
        if (output.includes('Ready') || output.includes('started server') || output.includes('Local:')) {
            console.log('✅ Server startup detected in output');
        }
    });

    serverProcess.stderr?.on('data', (data) => {
        const error = data.toString();
        serverErrors += error;
        console.error(`[SERVER STDERR] ${error.trim()}`);
        
        if (error.includes('EADDRINUSE')) {
            console.error(`⚠️ Port ${TEST_PORT} already in use, server may already be running`);
        }
        if (error.includes('Error')) {
            console.error(`❌ Server error detected: ${error.trim()}`);
        }
    });

    serverProcess.on('error', (error) => {
        console.error('❌ Failed to spawn server process:', error.message);
        console.error('Error details:', error);
        console.error('Command attempted:', isWindows ? `npm run dev -- -p ${TEST_PORT}` : `npm run dev -- -p ${TEST_PORT}`);
        console.error('Working directory:', projectRoot);
        console.error('Platform:', process.platform);
    });

    serverProcess.on('exit', (code, signal) => {
        console.log(`\n📊 Server Process Exit Details:`);
        console.log(`   Exit Code: ${code}`);
        console.log(`   Signal: ${signal || 'none'}`);
        console.log(`   Output length: ${serverOutput.length} chars`);
        console.log(`   Error length: ${serverErrors.length} chars`);
        
        if (code !== null && code !== 0) {
            console.error(`\n❌ Server process exited with code ${code}`);
            if (serverErrors) {
                console.error(`\n📋 Server Error Output:\n${serverErrors}`);
            }
            if (serverOutput) {
                console.log(`\n📋 Server Output (last 500 chars):\n${serverOutput.slice(-500)}`);
            }
        } else {
            console.log('✅ Server process exited normally');
        }
        
        serverProcess = null;
        serverReady = false;
    });

    // Wait for server to be ready
    console.log(`\n⏳ Waiting for server to be ready on ${BASE_URL}...`);
    console.log(`   Health check endpoint: ${BASE_URL}/api/health`);
    console.log(`   Max wait time: ${MAX_HEALTH_CHECK_ATTEMPTS * HEALTH_CHECK_INTERVAL / 1000} seconds`);
    
    const startTime = Date.now();
    const ready = await waitForServer();
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    
    if (ready) {
        serverReady = true;
        console.log(`\n✅ Server is ready! (took ${elapsed}s)`);
        console.log(`   Server URL: ${BASE_URL}`);
        console.log(`   Health check: ${BASE_URL}/api/health\n`);
        return true;
    } else {
        console.error(`\n❌ Server failed to start within timeout (waited ${elapsed}s)`);
        console.error(`   Attempted URL: ${BASE_URL}`);
        console.error(`   Port: ${TEST_PORT}`);
        console.error(`   Check if port ${TEST_PORT} is available`);
        console.error(`   Check server logs above for errors\n`);
        await stopServer();
        return false;
    }
}

/**
 * Stop the server
 */
export async function stopServer(): Promise<void> {
    if (serverProcess && !serverProcess.killed) {
        console.log('🛑 Stopping server...');
        serverProcess.kill('SIGTERM');
        
        // Wait for process to exit
        await new Promise<void>((resolve) => {
            if (serverProcess) {
                serverProcess.on('exit', () => resolve());
                // Force kill after 5 seconds
                setTimeout(() => {
                    if (serverProcess && !serverProcess.killed) {
                        serverProcess.kill('SIGKILL');
                        resolve();
                    }
                }, 5000);
            } else {
                resolve();
            }
        });
        
        serverProcess = null;
        serverReady = false;
        console.log('✅ Server stopped');
    }
}

/**
 * Ensure server is running (check and start if needed)
 */
export async function ensureServerRunning(): Promise<boolean> {
    console.log(`\n🔍 Ensuring server is running...`);
    console.log(`   Target URL: ${BASE_URL}`);
    console.log(`   Target Port: ${TEST_PORT}`);
    
    // First check if server is already healthy
    console.log(`   Checking if server is already healthy...`);
    const isHealthy = await checkServerHealth();
    
    if (isHealthy) {
        console.log(`   ✅ Server is already healthy and running`);
        serverReady = true;
        return true;
    }

    console.log(`   ⚠️ Server is not healthy, attempting to start...`);
    // Server not healthy, try to start it
    return await startServer();
}

/**
 * Get server status
 */
export function getServerStatus(): { running: boolean; process: ChildProcess | null; port: string; url: string } {
    return {
        running: serverReady && serverProcess !== null && !serverProcess.killed,
        process: serverProcess,
        port: TEST_PORT,
        url: BASE_URL
    };
}

/**
 * Get configured test URL
 */
export function getTestUrl(): string {
    return BASE_URL;
}

/**
 * Get configured test port
 */
export function getTestPort(): string {
    return TEST_PORT;
}

// Cleanup on process exit
process.on('exit', async () => {
    await stopServer();
});

process.on('SIGINT', async () => {
    await stopServer();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    await stopServer();
    process.exit(0);
});

