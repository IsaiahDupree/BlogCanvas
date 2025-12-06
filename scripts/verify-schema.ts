
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

console.log('Connecting to Supabase at:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifySchema() {
    console.log('Verifying "clients" table schema...');

    // Try to select the specific columns that are failing in tests
    const { data, error } = await supabase
        .from('clients')
        .select('id, name, slug, contact_email')
        .limit(1);

    if (error) {
        console.error('❌ Schema Verification FAILED');
        console.error('Error details:', error);
        console.log('\nThis confirms that the database schema is still missing required columns.');
        console.log('Most likely, the migration "20241204000003_multi_tenancy.sql" was not successfully applied.');
    } else {
        console.log('✅ Schema Verification PASSED');
        console.log('Successfully selected columns: id, name, slug, contact_email');
        console.log('Sample data:', data);
    }
}

verifySchema();
