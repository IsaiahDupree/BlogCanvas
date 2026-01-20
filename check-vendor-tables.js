import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkVendorTables() {
  console.log('Checking vendor platform tables...\n');

  const tables = [
    'vendors',
    'vendor_members',
    'offer_pages',
    'offers',
    'offer_addons',
    'vendor_clients',
    'vendor_workspaces',
    'vendor_orders',
    'vendor_order_items',
    'vendor_subscriptions'
  ];

  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);

      if (error) {
        console.log(`❌ ${table}: ${error.message}`);
      } else {
        console.log(`✅ ${table}: Exists (${data.length} row${data.length === 1 ? '' : 's'} returned)`);
      }
    } catch (err) {
      console.log(`❌ ${table}: ${err.message}`);
    }
  }

  console.log('\nChecking vendor count...');
  const { count, error } = await supabase
    .from('vendors')
    .select('*', { count: 'exact', head: true });

  if (!error) {
    console.log(`Total vendors: ${count}`);
  }
}

checkVendorTables().catch(console.error);
