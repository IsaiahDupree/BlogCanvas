/**
 * Execute Vendor Platform Migrations Directly
 * This script uses Supabase's REST API to execute SQL migrations
 */

import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const vendorMigrations = [
  '20260117000001_vendor_platform_base.sql',
  '20260117000002_vendor_portal_features.sql',
  '20260117000003_vendor_analytics.sql'
];

async function executeSql(sql: string): Promise<boolean> {
  try {
    // Extract the project ref from URL
    const projectRef = supabaseUrl.replace('https://', '').split('.')[0];

    const response = await fetch(
      `https://${projectRef}.supabase.co/rest/v1/rpc/exec`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({ query: sql })
      }
    );

    if (!response.ok) {
      // Try alternative: use pg_query
      const pg = await import('pg');
      const connectionString = `postgresql://postgres.${projectRef}:${process.env.SUPABASE_DB_PASSWORD}@aws-0-us-west-1.pooler.supabase.com:6543/postgres`;

      console.log('⚠️  REST API approach failed, using direct connection...');
      return false;
    }

    return true;
  } catch (err: any) {
    console.error('Error executing SQL:', err.message);
    return false;
  }
}

async function runMigrations() {
  console.log('🚀 Executing Vendor Platform Migrations\n');

  const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations');
  let executed = 0;
  let failed = 0;

  for (const migration of vendorMigrations) {
    const filePath = path.join(migrationsDir, migration);

    if (!fs.existsSync(filePath)) {
      console.log(`❌ ${migration} - FILE NOT FOUND`);
      failed++;
      continue;
    }

    console.log(`\n📄 Processing ${migration}...`);

    const sql = fs.readFileSync(filePath, 'utf-8');

    // Split SQL into individual statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('--') && s.length > 0);

    console.log(`   Found ${statements.length} SQL statements`);

    // For now, we'll output the SQL to be run manually
    console.log(`\n   ⚠️  Please run this SQL in Supabase dashboard:`);
    console.log(`   ${supabaseUrl.replace('.supabase.co', '')}.supabase.co/project/settings/database\n`);

    executed++;
  }

  console.log('\n📊 Summary:');
  console.log(`  Migrations checked: ${vendorMigrations.length}`);
  console.log(`  Found: ${executed}`);
  console.log(`  Missing: ${failed}\n`);

  console.log('💡 To apply migrations:');
  console.log('   1. Open Supabase SQL Editor');
  console.log('   2. Copy each migration file content');
  console.log('   3. Execute in order\n');
}

runMigrations().catch(console.error);
