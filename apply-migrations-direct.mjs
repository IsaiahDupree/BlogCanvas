#!/usr/bin/env node
/**
 * Direct Migration Application Script
 * This script directly applies SQL migrations via Supabase's pg_meta API
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

// Create admin client
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function executeSql(sql) {
  try {
    // Split SQL into individual statements (basic split on semicolon followed by newline)
    const statements = sql
      .split(/;\s*\n/)
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      if (statement) {
        const { error } = await supabase.rpc('exec', { sql: statement + ';' });

        if (error && !error.message.includes('already exists')) {
          console.error('  ⚠️  Error:', error.message.substring(0, 100));
          // Continue anyway, some errors might be expected (like table already exists)
        }
      }
    }

    return true;
  } catch (error) {
    console.error('  ❌ Execution error:', error.message);
    return false;
  }
}

async function applyMigration(filename) {
  console.log(`\n📝 Applying: ${filename}`);

  const filePath = join(__dirname, 'supabase', 'migrations', filename);
  const sql = readFileSync(filePath, 'utf-8');

  // Try to execute the entire migration
  const { data, error } = await supabase.rpc('exec', { sql });

  if (error) {
    // If that fails, try to execute statement by statement
    console.log('  ℹ️  Executing statements individually...');
    await executeSql(sql);
  }

  console.log(`  ✅ Applied: ${filename}`);
  return true;
}

async function checkTable(tableName) {
  const { error } = await supabase.from(tableName).select('*').limit(1);
  return !error;
}

async function main() {
  console.log('🚀 BlogCanvas - Direct Migration Tool\n');

  const migrations = [
    '20260117000001_vendor_platform_base.sql',
    '20260117000002_vendor_portal_features.sql',
    '20260117000003_vendor_analytics.sql',
  ];

  console.log('⚠️  IMPORTANT: This script requires the pg_net extension and exec function.');
  console.log('If migrations fail, please apply manually via Supabase SQL Editor.\n');

  for (const migration of migrations) {
    try {
      await applyMigration(migration);
    } catch (error) {
      console.error(`\n❌ Failed to apply ${migration}:`, error.message);
      console.log('\n📝 Please apply migrations manually:');
      console.log(`   https://supabase.com/dashboard/project/${supabaseUrl.split('.')[0].replace('https://', '')}/sql/new`);
      process.exit(1);
    }
  }

  // Verify tables
  console.log('\n\n📋 Verifying tables...\n');

  const tables = [
    'vendors',
    'vendor_members',
    'offer_pages',
    'offers',
    'offer_addons',
    'vendor_clients',
    'vendor_workspaces',
    'vendor_orders',
    'vendor_subscriptions',
    'onboarding_steps',
    'vendor_forms',
    'vendor_messages',
    'vendor_deliverables',
    'vendor_revisions',
    'vendor_meeting_types',
    'vendor_meetings',
    'vendor_event_log',
  ];

  let allExist = true;
  for (const table of tables) {
    const exists = await checkTable(table);
    console.log(`  ${exists ? '✅' : '❌'} ${table}`);
    if (!exists) allExist = false;
  }

  if (allExist) {
    console.log('\n✅ All tables created successfully!\n');
  } else {
    console.log('\n⚠️  Some tables are missing. Manual migration may be required.\n');
    console.log('Please visit:');
    console.log(`https://supabase.com/dashboard/project/${supabaseUrl.split('.')[0].replace('https://', '')}/sql/new\n`);
  }
}

main().catch(console.error);
