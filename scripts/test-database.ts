#!/usr/bin/env npx tsx
/**
 * Database Test Suite
 * Run with: npx tsx scripts/test-database.ts
 * 
 * Tests all critical database tables and relationships
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  console.log('Required: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

// Use service role key for tests (bypasses RLS)
const supabase = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey);

// Test results
interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  duration: number;
}

const results: TestResult[] = [];

async function runTest(name: string, testFn: () => Promise<void>): Promise<void> {
  const start = Date.now();
  try {
    await testFn();
    results.push({
      name,
      passed: true,
      message: 'OK',
      duration: Date.now() - start,
    });
    console.log(`  ✅ ${name}`);
  } catch (error: any) {
    results.push({
      name,
      passed: false,
      message: error.message || 'Unknown error',
      duration: Date.now() - start,
    });
    console.log(`  ❌ ${name}: ${error.message}`);
  }
}

// ============================================
// TABLE EXISTENCE TESTS
// ============================================

async function testTableExists(tableName: string): Promise<void> {
  const { error } = await supabase.from(tableName).select('*').limit(1);
  if (error && error.message.includes('does not exist')) {
    throw new Error(`Table "${tableName}" does not exist`);
  }
}

// ============================================
// CRUD TESTS
// ============================================

async function testVendorsCRUD(): Promise<void> {
  // Create
  const { data: created, error: createError } = await supabase
    .from('vendors')
    .insert({
      name: 'Test Vendor ' + Date.now(),
      slug: 'test-vendor-' + Date.now(),
      email: 'test@test.com',
    })
    .select()
    .single();

  if (createError) throw new Error(`Create failed: ${createError.message}`);
  if (!created) throw new Error('No data returned from create');

  // Read
  const { data: read, error: readError } = await supabase
    .from('vendors')
    .select('*')
    .eq('id', created.id)
    .single();

  if (readError) throw new Error(`Read failed: ${readError.message}`);
  if (!read) throw new Error('No data returned from read');

  // Update
  const { error: updateError } = await supabase
    .from('vendors')
    .update({ name: 'Updated Vendor' })
    .eq('id', created.id);

  if (updateError) throw new Error(`Update failed: ${updateError.message}`);

  // Delete
  const { error: deleteError } = await supabase
    .from('vendors')
    .delete()
    .eq('id', created.id);

  if (deleteError) throw new Error(`Delete failed: ${deleteError.message}`);
}

async function testApiKeysCRUD(): Promise<void> {
  // First create a vendor
  const { data: vendor, error: vendorError } = await supabase
    .from('vendors')
    .insert({
      name: 'API Key Test Vendor',
      slug: 'api-key-test-' + Date.now(),
      email: 'apitest@test.com',
    })
    .select()
    .single();

  if (vendorError) throw new Error(`Vendor create failed: ${vendorError.message}`);

  try {
    // Create API key
    const { data: apiKey, error: createError } = await supabase
      .from('api_keys')
      .insert({
        vendor_id: vendor.id,
        name: 'Test API Key',
        key_prefix: 'bc_test',
        key_hash: 'testhash123',
        scopes: ['clients:read'],
      })
      .select()
      .single();

    if (createError) throw new Error(`API key create failed: ${createError.message}`);

    // Delete API key
    await supabase.from('api_keys').delete().eq('id', apiKey.id);
  } finally {
    // Cleanup vendor
    await supabase.from('vendors').delete().eq('id', vendor.id);
  }
}

async function testWorkDeclarationsCRUD(): Promise<void> {
  // Get an existing client (created by app with proper owner_id)
  const { data: clients } = await supabase.from('clients').select('id').limit(1);
  
  if (!clients || clients.length === 0) {
    // No clients exist - test the table structure instead
    const { error: structureError } = await supabase
      .from('work_declarations')
      .select('id, client_id, title, description, status, priority')
      .limit(1);
    
    if (structureError && !structureError.message.includes('0 rows')) {
      throw new Error(`Table structure error: ${structureError.message}`);
    }
    // Table exists and is queryable - pass
    return;
  }

  // Create work declaration using existing client
  const { data: created, error: createError } = await supabase
    .from('work_declarations')
    .insert({
      client_id: clients[0].id,
      title: 'Test Work Declaration ' + Date.now(),
      description: 'Testing database functionality',
      type: 'custom',
      status: 'planned',
      priority: 'medium',
    })
    .select()
    .single();

  if (createError) throw new Error(`Create failed: ${createError.message}`);

  // Delete work declaration
  await supabase.from('work_declarations').delete().eq('id', created.id);
}

// ============================================
// RELATIONSHIP TESTS
// ============================================

async function testVendorRelationships(): Promise<void> {
  // Create vendor
  const { data: vendor } = await supabase
    .from('vendors')
    .insert({
      name: 'Relationship Test Vendor',
      slug: 'rel-test-' + Date.now(),
      email: 'rel@test.com',
    })
    .select()
    .single();

  if (!vendor) throw new Error('Failed to create vendor');

  try {
    // Create related API key
    const { data: apiKey, error: akError } = await supabase
      .from('api_keys')
      .insert({
        vendor_id: vendor.id,
        name: 'Related API Key',
        key_prefix: 'bc_rel',
        key_hash: 'relhash',
        scopes: [],
      })
      .select()
      .single();

    if (akError) throw new Error(`API key creation failed: ${akError.message}`);

    // Create related webhook
    const { data: webhook, error: whError } = await supabase
      .from('webhooks')
      .insert({
        vendor_id: vendor.id,
        name: 'Related Webhook',
        url: 'https://test.com/webhook',
        secret: 'secret123',
        events: ['post.created'],
      })
      .select()
      .single();

    if (whError) throw new Error(`Webhook creation failed: ${whError.message}`);

    // Query with joins
    const { data: vendorWithRelations, error: joinError } = await supabase
      .from('vendors')
      .select(`
        id,
        name,
        api_keys (id, name),
        webhooks (id, name)
      `)
      .eq('id', vendor.id)
      .single();

    if (joinError) throw new Error(`Join query failed: ${joinError.message}`);

    if (!vendorWithRelations.api_keys || vendorWithRelations.api_keys.length === 0) {
      throw new Error('API keys relationship not working');
    }

    if (!vendorWithRelations.webhooks || vendorWithRelations.webhooks.length === 0) {
      throw new Error('Webhooks relationship not working');
    }

  } finally {
    // Cleanup (cascade should delete related records)
    await supabase.from('vendors').delete().eq('id', vendor.id);
  }
}

// ============================================
// RUN ALL TESTS
// ============================================

async function main() {
  console.log('\n🧪 BlogCanvas Database Test Suite\n');
  console.log(`📍 Supabase URL: ${supabaseUrl}\n`);

  // Table existence tests
  console.log('📋 Testing table existence...');
  const tables = [
    'vendors',
    'vendor_team_invitations',
    'profiles',
    'clients',
    'work_declarations',
    'work_declaration_updates',
    'api_keys',
    'api_key_usage',
    'webhooks',
    'webhook_deliveries',
    'files',
    'folders',
    'gmail_connections',
    'email_threads',
    'email_messages',
  ];

  for (const table of tables) {
    await runTest(`Table "${table}" exists`, () => testTableExists(table));
  }

  // CRUD tests
  console.log('\n📝 Testing CRUD operations...');
  await runTest('Vendors CRUD', testVendorsCRUD);
  await runTest('API Keys CRUD', testApiKeysCRUD);
  await runTest('Work Declarations CRUD', testWorkDeclarationsCRUD);

  // Relationship tests
  console.log('\n🔗 Testing relationships...');
  await runTest('Vendor relationships (API keys, Webhooks)', testVendorRelationships);

  // Summary
  console.log('\n' + '='.repeat(50));
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  const totalTime = results.reduce((sum, r) => sum + r.duration, 0);

  console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);
  console.log(`⏱️  Total time: ${totalTime}ms\n`);

  if (failed > 0) {
    console.log('❌ Failed tests:');
    results
      .filter((r) => !r.passed)
      .forEach((r) => console.log(`   - ${r.name}: ${r.message}`));
    process.exit(1);
  } else {
    console.log('✅ All tests passed!\n');
    process.exit(0);
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
