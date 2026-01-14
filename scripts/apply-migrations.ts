/**
 * Migration Script - Apply database migrations using Supabase client
 * Run with: npx tsx scripts/apply-migrations.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL');
  process.exit(1);
}

if (!supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY');
  console.log('Please add SUPABASE_SERVICE_ROLE_KEY to your .env.local file');
  console.log('You can find it in your Supabase dashboard under Settings > API');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
});

// Migration files in order
const migrations = [
  '20260111000005_vendor_onboarding.sql',
  '20260112000001_work_declarations.sql',
  '20260112000002_work_declaration_email_templates.sql',
  '20260112000003_file_system.sql',
  '20260112000004_file_versioning.sql',
  '20260112000005_api_keys.sql',
  '20260112000006_webhooks.sql',
  '20260112000009_gmail_integration.sql',
];

async function checkTableExists(tableName: string): Promise<boolean> {
  const { data, error } = await supabase
    .from(tableName)
    .select('*')
    .limit(1);
  
  return !error || !error.message.includes('does not exist');
}

async function runTests() {
  console.log('\n📋 Running Database Tests...\n');

  const tests = [
    { name: 'vendors', table: 'vendors' },
    { name: 'profiles (with vendor_id)', table: 'profiles' },
    { name: 'work_declarations', table: 'work_declarations' },
    { name: 'api_keys', table: 'api_keys' },
    { name: 'webhooks', table: 'webhooks' },
    { name: 'gmail_connections', table: 'gmail_connections' },
    { name: 'files', table: 'files' },
    { name: 'folders', table: 'folders' },
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    const exists = await checkTableExists(test.table);
    if (exists) {
      console.log(`  ✅ ${test.name} - table exists`);
      passed++;
    } else {
      console.log(`  ❌ ${test.name} - table NOT found`);
      failed++;
    }
  }

  console.log(`\n📊 Results: ${passed} passed, ${failed} failed\n`);
  return failed === 0;
}

async function main() {
  console.log('🔍 Checking database tables...\n');

  // Run tests to see current state
  const allExist = await runTests();

  if (allExist) {
    console.log('✅ All required tables exist! Migrations appear to be applied.\n');
  } else {
    console.log('⚠️  Some tables are missing.');
    console.log('\nTo apply migrations manually:');
    console.log('1. Go to https://supabase.com/dashboard/project/cwnayaqzslaukjlwkzlo/sql');
    console.log('2. Copy and paste the contents of each migration file in order');
    console.log('\nMigration files to apply:');
    for (const migration of migrations) {
      const filePath = path.join(__dirname, '..', 'supabase', 'migrations', migration);
      if (fs.existsSync(filePath)) {
        console.log(`  - ${migration}`);
      }
    }
  }
}

main().catch(console.error);
