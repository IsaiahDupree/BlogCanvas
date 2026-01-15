#!/usr/bin/env node

/**
 * Scheduled Harness Runner
 * ========================
 * 
 * Runs the harness continuously until all features are complete,
 * with built-in rate limit protection and scheduled pacing.
 */

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');

const CONFIG = {
  featureList: path.join(PROJECT_ROOT, 'feature_list.json'),
  statusFile: path.join(PROJECT_ROOT, 'harness-status.json'),
  metricsFile: path.join(PROJECT_ROOT, 'harness-metrics.json'),
  logFile: path.join(PROJECT_ROOT, 'harness-scheduled.log'),
  
  // Pacing settings to avoid rate limits
  sessionsPerBatch: 10,           // Run 10 sessions at a time
  delayBetweenBatchesMs: 300000,  // 5 minutes between batches
  delayAfterRateLimitMs: 900000,  // 15 minutes after rate limit
  maxDailyTokens: 50000000,       // 50M token daily limit estimate
  
  // Safety
  maxTotalSessions: 500,          // Absolute maximum
  checkIntervalMs: 30000,         // Check status every 30 seconds
};

function log(message) {
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] ${message}`;
  console.log(line);
  fs.appendFileSync(CONFIG.logFile, line + '\n');
}

function getPendingCount() {
  try {
    const data = JSON.parse(fs.readFileSync(CONFIG.featureList, 'utf-8'));
    return data.features.filter(f => !f.passes).length;
  } catch {
    return -1;
  }
}

function getMetrics() {
  try {
    return JSON.parse(fs.readFileSync(CONFIG.metricsFile, 'utf-8'));
  } catch {
    return { totalTokens: 0, rateLimitHits: 0 };
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runBatch() {
  return new Promise((resolve) => {
    log(`Starting batch of ${CONFIG.sessionsPerBatch} sessions...`);
    
    const harness = spawn('node', [
      path.join(__dirname, 'run-harness-v2.js'),
      '--continuous',
      `--max=${CONFIG.sessionsPerBatch}`
    ], {
      cwd: PROJECT_ROOT,
      stdio: ['ignore', 'pipe', 'pipe']
    });

    let output = '';
    
    harness.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    harness.stderr.on('data', (data) => {
      output += data.toString();
    });

    harness.on('close', (code) => {
      const hitRateLimit = output.toLowerCase().includes('rate limit') || 
                          output.toLowerCase().includes('429');
      resolve({ code, hitRateLimit, output });
    });
  });
}

async function main() {
  log('='.repeat(50));
  log('SCHEDULED HARNESS RUNNER STARTED');
  log('='.repeat(50));
  
  let totalSessionsRun = 0;
  let batchCount = 0;
  
  while (true) {
    const pending = getPendingCount();
    const metrics = getMetrics();
    
    log(`Status: ${173 - pending}/173 complete (${pending} pending)`);
    log(`Tokens used: ${(metrics.totalTokens / 1000000).toFixed(1)}M`);
    
    // Check if complete
    if (pending <= 0) {
      log('🎉 ALL FEATURES COMPLETE!');
      break;
    }
    
    // Check safety limits
    if (totalSessionsRun >= CONFIG.maxTotalSessions) {
      log(`⚠️ Reached max sessions (${CONFIG.maxTotalSessions}). Stopping.`);
      break;
    }
    
    // Run a batch
    batchCount++;
    log(`\n--- BATCH ${batchCount} ---`);
    
    const result = await runBatch();
    totalSessionsRun += CONFIG.sessionsPerBatch;
    
    if (result.hitRateLimit) {
      log(`⚠️ Rate limit hit. Waiting ${CONFIG.delayAfterRateLimitMs / 60000} minutes...`);
      await sleep(CONFIG.delayAfterRateLimitMs);
    } else {
      log(`✓ Batch complete. Waiting ${CONFIG.delayBetweenBatchesMs / 60000} minutes before next batch...`);
      await sleep(CONFIG.delayBetweenBatchesMs);
    }
  }
  
  log('='.repeat(50));
  log('SCHEDULED HARNESS RUNNER FINISHED');
  log(`Total batches: ${batchCount}`);
  log(`Total sessions: ${totalSessionsRun}`);
  log('='.repeat(50));
}

main().catch(err => {
  log(`FATAL ERROR: ${err.message}`);
  process.exit(1);
});
