import pg from 'pg';
import { readFileSync } from 'fs';
import { join } from 'path';

const connectionString = 'postgresql://postgres.gqjgxltroyysjoxswbmn:thenewaccount123@aws-0-us-east-1.pooler.supabase.com:6543/postgres';

const migrations = [
  '20260117000001_vendor_platform_base.sql',
  '20260117000002_vendor_portal_features.sql',
  '20260117000003_vendor_analytics.sql'
];

async function runMigration(client, filename) {
  console.log(`\n📄 Processing ${filename}...`);

  const filePath = join(process.cwd(), 'supabase', 'migrations', filename);
  const sql = readFileSync(filePath, 'utf-8');

  try {
    await client.query(sql);
    console.log(`✅ ${filename} applied successfully`);
    return true;
  } catch (error) {
    console.error(`❌ ${filename} failed:`, error.message);
    return false;
  }
}

async function main() {
  const client = new pg.Client({ connectionString });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    for (const migration of migrations) {
      const success = await runMigration(client, migration);
      if (!success) {
        console.log('\n⚠️  Migration failed, stopping...');
        break;
      }
    }

    console.log('\n✅ All migrations complete!');
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

main();
