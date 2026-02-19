#!/usr/bin/env node

/**
 * Check Client Bundle for Secrets
 *
 * Scans the Next.js build output to ensure no secrets or sensitive
 * environment variables are exposed in client-side JavaScript bundles.
 */

const fs = require('fs');
const path = require('path');

// Patterns that should NEVER appear in client bundles
const FORBIDDEN_PATTERNS = [
  // Environment variable patterns
  /SUPABASE_SERVICE_ROLE_KEY/gi,
  /SUPABASE_SERVICE_KEY/gi,
  /STRIPE_SECRET_KEY/gi,
  /STRIPE_WEBHOOK_SECRET/gi,
  /RESEND_API_KEY/gi,
  /RESEND_WEBHOOK_SECRET/gi,
  /OPENAI_API_KEY/gi,
  /DATABASE_URL/gi,
  /GOOGLE_ANALYTICS_PRIVATE_KEY/gi,
  /GOOGLE_SERVICE_ACCOUNT_KEY/gi,
  /JWT_SECRET/gi,
  /SESSION_SECRET/gi,

  // Common secret patterns
  /sk_live_[a-zA-Z0-9]+/g,      // Stripe live secret key
  /sk_test_[a-zA-Z0-9]+/g,      // Stripe test secret key
  /re_[a-zA-Z0-9]+/g,            // Resend API key (but could be false positive)
  /-----BEGIN PRIVATE KEY-----/g, // Private keys
  /-----BEGIN RSA PRIVATE KEY-----/g,

  // Service role patterns (should only be server-side)
  /eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g  // JWT pattern
];

// Allowed public environment variable prefixes
const ALLOWED_PUBLIC_PREFIXES = [
  'NEXT_PUBLIC_',
];

function isPublicVariable(varName) {
  return ALLOWED_PUBLIC_PREFIXES.some(prefix => varName.startsWith(prefix));
}

function scanDirectory(dir, results = []) {
  if (!fs.existsSync(dir)) {
    return results;
  }

  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      scanDirectory(filePath, results);
    } else if (file.endsWith('.js') || file.endsWith('.json')) {
      const content = fs.readFileSync(filePath, 'utf8');

      for (const pattern of FORBIDDEN_PATTERNS) {
        const matches = content.match(pattern);
        if (matches) {
          results.push({
            file: filePath,
            pattern: pattern.toString(),
            matches: matches
          });
        }
      }
    }
  }

  return results;
}

function main() {
  console.log('🔍 Checking client bundles for exposed secrets...\n');

  const buildDir = path.join(process.cwd(), '.next');

  if (!fs.existsSync(buildDir)) {
    console.log('⚠️  No .next directory found. Run "npm run build" first.');
    process.exit(0);
  }

  // Scan client-side JavaScript
  const staticDir = path.join(buildDir, 'static');
  const results = scanDirectory(staticDir);

  if (results.length === 0) {
    console.log('✅ No secrets found in client bundles!');
    console.log('   All environment variables are properly secured.\n');
    process.exit(0);
  } else {
    console.log('❌ SECURITY WARNING: Secrets found in client bundles!\n');

    for (const result of results) {
      console.log(`File: ${result.file}`);
      console.log(`Pattern: ${result.pattern}`);
      console.log(`Matches: ${result.matches.join(', ')}`);
      console.log('');
    }

    console.log('⚠️  ACTION REQUIRED:');
    console.log('   - Move server-side secrets to API routes');
    console.log('   - Use NEXT_PUBLIC_ prefix only for truly public values');
    console.log('   - Never expose service role keys, webhook secrets, or API keys');
    console.log('');

    process.exit(1);
  }
}

main();
