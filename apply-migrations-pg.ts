/**
 * Apply Vendor Platform Migrations using pg client
 */

import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const projectRef = supabaseUrl.replace('https://', '').split('.')[0];

// Construct the connection string
// Format: postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
const connectionString = `postgresql://postgres.${projectRef}:${process.env.SUPABASE_DB_PASSWORD || ''}@aws-0-us-west-1.pooler.supabase.com:6543/postgres`;

const vendorMigrations = [
  '20260117000001_vendor_platform_base.sql',
  '20260117000002_vendor_portal_features.sql',
  '20260117000003_vendor_analytics.sql'
];

async function applyMigrations() {
  console.log('🚀 Applying Vendor Platform Migrations via PostgreSQL\n');

  // Try using service role key as alternative auth
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations');

    for (const migration of vendorMigrations) {
      const filePath = path.join(migrationsDir, migration);

      if (!fs.existsSync(filePath)) {
        console.log(`❌ ${migration} - FILE NOT FOUND`);
        continue;
      }

      console.log(`📄 Applying ${migration}...`);
      const sql = fs.readFileSync(filePath, 'utf-8');

      try {
        await client.query(sql);
        console.log(`✅ ${migration} applied successfully\n`);
      } catch (err: any) {
        console.error(`❌ Error applying ${migration}:`, err.message);
      }
    }

  } catch (err: any) {
    console.error('❌ Connection error:', err.message);
    console.log('\n💡 Alternative: Apply migrations via Supabase Dashboard');
    console.log(`   ${supabaseUrl}/project/${projectRef}/sql/new\n`);
  } finally {
    await client.end();
  }
}

applyMigrations().catch(console.error);
