/**
 * Apply Vendor Platform Migrations
 * Simple script using createClient
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';
import dotenv from 'dotenv';

// Load .env.local
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const migrations = [
  '20260117000001_vendor_platform_base.sql',
  '20260117000002_vendor_portal_features.sql',
  '20260117000003_vendor_analytics.sql'
];

async function runMigration(filename) {
  console.log(`\n📄 Processing ${filename}...`);

  const filePath = join(process.cwd(), 'supabase', 'migrations', filename);
  const sql = readFileSync(filePath, 'utf-8');

  // Split into statements and execute one by one
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 10 && !s.startsWith('--'));

  console.log(`   Found ${statements.length} SQL statements`);

  let success = 0;
  let errors = 0;

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];

    try {
      // Try to execute using rpc
      const { data, error } = await supabase.rpc('exec_sql', { sql: stmt + ';' });

      if (error) {
        // Expected - this RPC might not exist
        // Fall back to outputting the SQL
        if (i === 0) {
          console.log('   ⚠️  Direct SQL execution not available');
          console.log('   📋 Please run this migration in Supabase dashboard:');
          console.log(`   https://supabase.com/dashboard/project/${supabaseUrl.split('.')[0].replace('https://', '')}/sql/new\n`);
          return false;
        }
      } else {
        success++;
      }
    } catch (err) {
      console.log(`   ❌ Statement ${i + 1} failed:`, err.message.substring(0, 100));
      errors++;
    }
  }

  if (success > 0) {
    console.log(`   ✅ ${success} statements executed successfully`);
  }

  if (errors > 0) {
    console.log(`   ❌ ${errors} statements failed`);
    return false;
  }

  return success > 0;
}

async function main() {
  console.log('🚀 Vendor Platform Migration Tool\n');

  // Check current state first
  console.log('📋 Checking vendor tables...');

  const { error: vendorError } = await supabase.from('vendors').select('id').limit(1);
  const { error: memberError } = await supabase.from('vendor_members').select('id').limit(1);

  console.log('  vendors:', vendorError ? '❌' : '✅');
  console.log('  vendor_members:', memberError ? '❌' : '✅');

  if (!memberError) {
    console.log('\n✅ Vendor platform tables already exist!\n');
    return;
  }

  console.log('\n⚠️  Vendor platform tables need to be created\n');
  console.log('📝 Manual Migration Steps:\n');
  console.log('1. Open Supabase SQL Editor:');
  console.log(`   https://supabase.com/dashboard/project/${supabaseUrl.split('.')[0].replace('https://', '')}/sql/new\n`);
  console.log('2. Run each migration file in order:\n');

  for (const migration of migrations) {
    const filePath = join(process.cwd(), 'supabase', 'migrations', migration);
    console.log(`   ✓ ${migration}`);
    console.log(`     File: ${filePath}\n`);
  }

  console.log('3. Copy the file content and paste into SQL Editor');
  console.log('4. Click "Run" to execute\n');
  console.log('5. Verify with: node run-vendor-migrations.mjs\n');
}

main().catch(console.error);
