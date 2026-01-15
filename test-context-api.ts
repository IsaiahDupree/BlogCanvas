/**
 * Test script for /api/clients/[clientId]/context endpoint
 * Usage: npx tsx test-context-api.ts <clientId>
 */

import { config } from 'dotenv';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// Load environment variables
config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createSupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testContextAPI(clientId?: string) {
  try {
    // Get first client if no ID provided
    if (!clientId) {
      console.log('No clientId provided, fetching first client from database...\n');
      const { data: clients, error } = await supabase
        .from('clients')
        .select('id, name, slug')
        .limit(1);

      if (error || !clients || clients.length === 0) {
        console.error('No clients found in database');
        process.exit(1);
      }

      clientId = clients[0].id;
      console.log(`Using client: ${clients[0].name} (${clientId})\n`);
    }

    // Test the API endpoint
    console.log('Testing API endpoint...');
    console.log(`GET http://localhost:4848/api/clients/${clientId}/context\n`);

    // Note: This test doesn't include authentication
    // In a real scenario, you'd need to include a valid session token
    const response = await fetch(`http://localhost:4848/api/clients/${clientId}/context`);

    console.log(`Status: ${response.status} ${response.statusText}`);

    const data = await response.json();

    if (data.success) {
      console.log('\n✅ API endpoint returned successfully!\n');
      console.log(`Cached: ${data.cached}\n`);
      console.log('Context summary:');
      console.log(`- Client ID: ${data.context.clientId}`);
      console.log(`- Client Name: ${data.context.clientName}`);
      console.log(`- Brand Name: ${data.context.brandGuide.brandName}`);
      console.log(`- Voice Traits: ${data.context.voiceAndTone.voiceTraits.length} traits`);
      console.log(`- Styles to Avoid: ${data.context.stylesToAvoid.wordPatterns.length} patterns`);
      console.log(`- Styles to Keep: ${data.context.stylesToKeep.preferredPatterns.length} patterns`);
      console.log(`- Title Formats: ${data.context.titleGuidelines.preferredFormats.length} formats`);
      console.log(`- Power Words: ${data.context.titleGuidelines.powerWords.length} words`);

      // Test cache by making a second request
      console.log('\n\nTesting cache...');
      const response2 = await fetch(`http://localhost:4848/api/clients/${clientId}/context`);
      const data2 = await response2.json();

      if (data2.cached) {
        console.log('✅ Cache is working! Second request returned cached data.\n');
      } else {
        console.log('⚠️ Cache might not be working as expected.\n');
      }

    } else {
      console.error('\n❌ API endpoint returned an error:');
      console.error(data.error);

      if (response.status === 401) {
        console.log('\nNote: 401 Unauthorized is expected without authentication.');
        console.log('The endpoint is working correctly - it requires authentication.');
      }
    }

    console.log('\n\nFull response:');
    console.log(JSON.stringify(data, null, 2));

  } catch (error) {
    console.error('Error testing API:', error);
    process.exit(1);
  }
}

const clientId = process.argv[2];
testContextAPI(clientId);
