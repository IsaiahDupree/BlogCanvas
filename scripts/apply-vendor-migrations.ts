/**
 * Apply Vendor Platform Migrations
 * Run with: node --import tsx scripts/apply-vendor-migrations.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅' : '❌');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
});

const vendorMigrations = [
  '20260117000001_vendor_platform_base.sql',
  '20260117000002_vendor_portal_features.sql',
  '20260117000003_vendor_analytics.sql'
];

async function executeSqlFile(filePath: string): Promise<boolean> {
  try {
    const sql = fs.readFileSync(filePath, 'utf-8');

    // Execute using rpc to run raw SQL
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql }).catch(async () => {
      // If exec_sql doesn't exist, try direct query
      const { error } = await supabase.from('_migrations').insert({
        name: path.basename(filePath),
        executed_at: new Date().toISOString()
      });

      // For now, we'll need to apply these manually via Supabase dashboard
      return { error: new Error('Cannot execute SQL directly - please apply via Supabase dashboard') };
    });

    if (error) {
      console.error(`❌ Error executing ${path.basename(filePath)}:`, error.message);
      return false;
    }

    console.log(`✅ Applied ${path.basename(filePath)}`);
    return true;
  } catch (err: any) {
    console.error(`❌ Failed to read ${path.basename(filePath)}:`, err.message);
    return false;
  }
}

async function checkTableExists(tableName: string): Promise<boolean> {
  const { error } = await supabase
    .from(tableName)
    .select('*')
    .limit(1);

  return !error;
}

async function main() {
  console.log('🚀 Vendor Platform Migration Tool\n');

  // Check current state
  console.log('📋 Checking current database state...\n');

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
    'vendor_availability'
  ];

  const tableStatus: Record<string, boolean> = {};
  for (const table of tables) {
    const exists = await checkTableExists(table);
    tableStatus[table] = exists;
    console.log(`  ${exists ? '✅' : '❌'} ${table}`);
  }

  const missingTables = tables.filter(t => !tableStatus[t]);

  console.log('\n📊 Summary:');
  console.log(`  ✅ ${tables.length - missingTables.length} tables exist`);
  console.log(`  ❌ ${missingTables.length} tables missing\n`);

  if (missingTables.length === 0) {
    console.log('✅ All vendor platform tables exist!\n');
    return;
  }

  console.log('⚠️  Missing tables detected. Migrations need to be applied.\n');
  console.log('📝 Instructions to apply migrations:\n');
  console.log('1. Open Supabase SQL Editor:');
  console.log(`   ${supabaseUrl.replace('.supabase.co', '')}.supabase.co/project/${supabaseUrl.split('.')[0].replace('https://', '')}/sql/new\n`);
  console.log('2. Copy and paste each migration file in order:\n');

  const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations');

  for (const migration of vendorMigrations) {
    const filePath = path.join(migrationsDir, migration);
    if (fs.existsSync(filePath)) {
      console.log(`   ✓ ${migration}`);
      console.log(`     Path: ${filePath}\n`);
    } else {
      console.log(`   ✗ ${migration} (FILE NOT FOUND)`);
    }
  }

  console.log('3. Click "Run" to execute each migration\n');
  console.log('4. Re-run this script to verify: node --import tsx scripts/apply-vendor-migrations.ts\n');
}

main().catch(console.error);
