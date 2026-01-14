#!/usr/bin/env npx tsx
/**
 * Gmail Integration Test Suite
 * Run with: npx tsx scripts/test-gmail-integration.ts
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
}

const results: TestResult[] = [];

function test(name: string, condition: boolean, message: string) {
  results.push({ name, passed: condition, message });
  console.log(condition ? `  ✅ ${name}` : `  ❌ ${name}: ${message}`);
}

async function main() {
  console.log('\n🧪 Gmail Integration Test Suite\n');

  // Test 1: Environment variables
  console.log('📋 Testing Environment Variables...');
  
  const googleClientId = process.env.GOOGLE_CLIENT_ID;
  const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const googleRedirectUri = process.env.GOOGLE_REDIRECT_URI;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  test(
    'GOOGLE_CLIENT_ID is set',
    !!googleClientId,
    'Missing GOOGLE_CLIENT_ID in .env.local'
  );

  test(
    'GOOGLE_CLIENT_SECRET is set',
    !!googleClientSecret,
    'Missing GOOGLE_CLIENT_SECRET in .env.local'
  );

  test(
    'GOOGLE_REDIRECT_URI is set',
    !!googleRedirectUri,
    'Missing GOOGLE_REDIRECT_URI in .env.local'
  );

  test(
    'GOOGLE_CLIENT_ID format is valid',
    googleClientId?.includes('.apps.googleusercontent.com') || false,
    'Client ID should end with .apps.googleusercontent.com'
  );

  test(
    'GOOGLE_CLIENT_SECRET format is valid',
    googleClientSecret?.startsWith('GOCSPX-') || false,
    'Client secret should start with GOCSPX-'
  );

  // Test 2: Gmail Service
  console.log('\n📧 Testing Gmail Service...');
  
  try {
    const { GmailService } = await import('../src/lib/gmail-service');
    const gmailService = new GmailService();
    
    test('GmailService instantiates', true, '');

    // Test OAuth URL generation
    const testUserId = 'test-user-123';
    const authUrl = gmailService.getAuthUrl(testUserId);
    
    test(
      'OAuth URL is generated',
      authUrl.includes('accounts.google.com'),
      'Auth URL should point to Google accounts'
    );

    test(
      'OAuth URL contains client_id',
      authUrl.includes(googleClientId || ''),
      'Auth URL should contain client ID'
    );

    test(
      'OAuth URL contains redirect_uri',
      authUrl.includes('redirect_uri'),
      'Auth URL should contain redirect URI'
    );

    test(
      'OAuth URL contains state (user ID)',
      authUrl.includes(`state=${testUserId}`),
      'Auth URL should contain user ID in state'
    );

    console.log('\n📍 Generated OAuth URL:');
    console.log(`   ${authUrl.substring(0, 100)}...`);

  } catch (error: any) {
    test('GmailService instantiates', false, error.message);
  }

  // Test 3: Database tables
  console.log('\n🗄️  Testing Gmail Database Tables...');
  
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      supabaseUrl!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const tables = ['gmail_connections', 'email_threads', 'email_messages'];
    
    for (const table of tables) {
      const { error } = await supabase.from(table).select('*').limit(1);
      test(
        `Table "${table}" exists`,
        !error || !error.message.includes('does not exist'),
        error?.message || ''
      );
    }

  } catch (error: any) {
    test('Database connection', false, error.message);
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  console.log(`\n📊 Results: ${passed} passed, ${failed} failed\n`);

  if (failed > 0) {
    console.log('❌ Failed tests:');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`   - ${r.name}: ${r.message}`);
    });
    process.exit(1);
  } else {
    console.log('✅ All Gmail integration tests passed!\n');
    console.log('📝 Next steps:');
    console.log('   1. Add http://localhost:4848 to Google OAuth redirect URIs');
    console.log('   2. Go to http://localhost:4848/app/settings/gmail');
    console.log('   3. Click "Connect Gmail" to test the full OAuth flow\n');
    process.exit(0);
  }
}

main().catch(console.error);
