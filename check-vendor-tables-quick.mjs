import pg from 'pg';

const connectionString = 'postgresql://postgres.gqjgxltroyysjoxswbmn:thenewaccount123@aws-0-us-east-1.pooler.supabase.com:6543/postgres';

const client = new pg.Client({ connectionString });

try {
  await client.connect();
  
  // Check if vendor tables exist
  const result = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN ('vendors', 'offer_pages', 'offers', 'offer_addons', 'vendor_clients', 'vendor_workspaces', 'vendor_orders')
    ORDER BY table_name;
  `);
  
  console.log('Existing vendor platform tables:');
  if (result.rows.length === 0) {
    console.log('  ❌ No vendor tables found - migrations need to be applied');
  } else {
    result.rows.forEach(row => {
      console.log('  ✅', row.table_name);
    });
  }
  
} catch (error) {
  console.error('Error:', error.message);
} finally {
  await client.end();
}
