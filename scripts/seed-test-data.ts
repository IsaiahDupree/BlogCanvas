#!/usr/bin/env tsx

/**
 * Test Data Seeding Script
 *
 * Creates idempotent test data for development and testing.
 * Run with: npx tsx scripts/seed-test-data.ts
 *
 * Features:
 * - Idempotent (can run multiple times)
 * - Creates test accounts, clients, blog posts, and relations
 * - Uses deterministic IDs for consistency
 */

import { createClient } from '@supabase/supabase-js';
import * as crypto from 'crypto';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not set');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Deterministic UUID generation for idempotency
function deterministicUUID(namespace: string, name: string): string {
  const hash = crypto.createHash('sha256');
  hash.update(`${namespace}:${name}`);
  const hex = hash.digest('hex');

  // Format as UUID v4
  return [
    hex.substring(0, 8),
    hex.substring(8, 12),
    '4' + hex.substring(13, 16),
    ((parseInt(hex.substring(16, 18), 16) & 0x3f) | 0x80).toString(16) + hex.substring(18, 20),
    hex.substring(20, 32)
  ].join('-');
}

interface TestUser {
  id: string;
  email: string;
  password: string;
  full_name: string;
  role: 'owner' | 'staff' | 'client';
  client_id?: string;
}

interface TestClient {
  id: string;
  name: string;
  slug: string;
  website_url: string;
  status: string;
}

interface TestBlogPost {
  id: string;
  client_id: string;
  topic: string;
  target_keyword: string;
  status: string;
  word_count_goal: number;
}

async function seedTestData() {
  console.log('🌱 Starting test data seeding...\n');

  // 1. Create Test Users
  console.log('👥 Creating test users...');

  const testUsers: TestUser[] = [
    {
      id: deterministicUUID('user', 'owner@test.com'),
      email: 'owner@test.com',
      password: 'TestPassword123!',
      full_name: 'Test Owner',
      role: 'owner'
    },
    {
      id: deterministicUUID('user', 'staff@test.com'),
      email: 'staff@test.com',
      password: 'TestPassword123!',
      full_name: 'Test Staff Member',
      role: 'staff'
    }
  ];

  for (const user of testUsers) {
    // Check if user exists in auth.users
    const { data: authUser } = await supabase.auth.admin.getUserById(user.id);

    if (!authUser?.user) {
      // Create auth user
      const { data: newAuthUser, error: authError } = await supabase.auth.admin.createUser({
        id: user.id,
        email: user.email,
        password: user.password,
        email_confirm: true,
        user_metadata: {
          full_name: user.full_name,
          role: user.role
        }
      });

      if (authError) {
        console.error(`  ❌ Failed to create auth user ${user.email}:`, authError.message);
        continue;
      }
      console.log(`  ✅ Created auth user: ${user.email}`);
    } else {
      console.log(`  ⏭️  Auth user already exists: ${user.email}`);
    }

    // Create or update profile
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        client_id: user.client_id || null
      }, { onConflict: 'id' });

    if (profileError) {
      console.error(`  ❌ Failed to create profile for ${user.email}:`, profileError.message);
    } else {
      console.log(`  ✅ Created/updated profile: ${user.email}`);
    }
  }

  // 2. Create Test Clients
  console.log('\n🏢 Creating test clients...');

  const testClients: TestClient[] = [
    {
      id: deterministicUUID('client', 'acme-corp'),
      name: 'Acme Corporation',
      slug: 'acme-corp',
      website_url: 'https://acme-corp.example.com',
      status: 'active'
    },
    {
      id: deterministicUUID('client', 'tech-startup'),
      name: 'Tech Startup Inc',
      slug: 'tech-startup',
      website_url: 'https://techstartup.example.com',
      status: 'active'
    },
    {
      id: deterministicUUID('client', 'retail-brand'),
      name: 'Retail Brand Co',
      slug: 'retail-brand',
      website_url: 'https://retailbrand.example.com',
      status: 'onboarding'
    }
  ];

  const ownerUserId = deterministicUUID('user', 'owner@test.com');

  for (const client of testClients) {
    const { error } = await supabase
      .from('clients')
      .upsert({
        id: client.id,
        owner_id: ownerUserId,
        name: client.name,
        slug: client.slug,
        website_url: client.website_url,
        has_website: true,
        status: client.status,
        primary_contact_email: `contact@${client.slug}.example.com`,
        tone_of_voice: {
          style: 'professional',
          characteristics: ['authoritative', 'friendly', 'informative']
        },
        brand_profile: {
          industry: 'Technology',
          target_audience: 'Business professionals',
          unique_value_proposition: 'Innovation through technology'
        }
      }, { onConflict: 'id' });

    if (error) {
      console.error(`  ❌ Failed to create client ${client.name}:`, error.message);
    } else {
      console.log(`  ✅ Created client: ${client.name}`);
    }
  }

  // 3. Create Client Users
  console.log('\n👤 Creating client users...');

  const clientUsers: TestUser[] = [
    {
      id: deterministicUUID('user', 'acme-user@test.com'),
      email: 'acme-user@test.com',
      password: 'TestPassword123!',
      full_name: 'Acme Client User',
      role: 'client',
      client_id: deterministicUUID('client', 'acme-corp')
    },
    {
      id: deterministicUUID('user', 'tech-user@test.com'),
      email: 'tech-user@test.com',
      password: 'TestPassword123!',
      full_name: 'Tech Startup User',
      role: 'client',
      client_id: deterministicUUID('client', 'tech-startup')
    }
  ];

  for (const user of clientUsers) {
    const { data: authUser } = await supabase.auth.admin.getUserById(user.id);

    if (!authUser?.user) {
      const { error: authError } = await supabase.auth.admin.createUser({
        id: user.id,
        email: user.email,
        password: user.password,
        email_confirm: true,
        user_metadata: {
          full_name: user.full_name,
          role: user.role,
          client_id: user.client_id
        }
      });

      if (authError) {
        console.error(`  ❌ Failed to create auth user ${user.email}:`, authError.message);
        continue;
      }
      console.log(`  ✅ Created auth user: ${user.email}`);
    } else {
      console.log(`  ⏭️  Auth user already exists: ${user.email}`);
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        client_id: user.client_id
      }, { onConflict: 'id' });

    if (profileError) {
      console.error(`  ❌ Failed to create profile for ${user.email}:`, profileError.message);
    } else {
      console.log(`  ✅ Created/updated profile: ${user.email}`);
    }
  }

  // 4. Create Client Profiles
  console.log('\n📋 Creating client profiles...');

  for (const client of testClients) {
    const { error } = await supabase
      .from('client_profiles')
      .upsert({
        id: deterministicUUID('client-profile', client.slug),
        client_id: client.id,
        product_service_summary: `${client.name} provides innovative solutions for modern businesses.`,
        target_audience: 'B2B professionals and enterprise customers',
        positioning: 'Market leader in innovative technology solutions',
        tone_of_voice: 'Professional, authoritative, yet approachable',
        competitors: 'Competitor A, Competitor B, Competitor C',
        keywords: JSON.stringify(['technology', 'innovation', 'business solutions', 'enterprise']),
        locations: JSON.stringify(['United States', 'Canada', 'United Kingdom']),
        acquisition_channels: JSON.stringify(['organic search', 'social media', 'partnerships'])
      }, { onConflict: 'id' });

    if (error) {
      console.error(`  ❌ Failed to create profile for ${client.name}:`, error.message);
    } else {
      console.log(`  ✅ Created client profile: ${client.name}`);
    }
  }

  // 5. Create Test Blog Posts
  console.log('\n📝 Creating test blog posts...');

  const testPosts: TestBlogPost[] = [
    {
      id: deterministicUUID('post', 'acme-ai-guide'),
      client_id: deterministicUUID('client', 'acme-corp'),
      topic: 'The Ultimate Guide to AI in Business',
      target_keyword: 'ai in business',
      status: 'published',
      word_count_goal: 2000
    },
    {
      id: deterministicUUID('post', 'acme-automation'),
      client_id: deterministicUUID('client', 'acme-corp'),
      topic: 'How to Automate Your Workflow',
      target_keyword: 'workflow automation',
      status: 'ready_for_review',
      word_count_goal: 1500
    },
    {
      id: deterministicUUID('post', 'tech-startup-guide'),
      client_id: deterministicUUID('client', 'tech-startup'),
      topic: 'Building a Successful Tech Startup',
      target_keyword: 'tech startup guide',
      status: 'drafting',
      word_count_goal: 2500
    },
    {
      id: deterministicUUID('post', 'retail-ecommerce'),
      client_id: deterministicUUID('client', 'retail-brand'),
      topic: 'E-commerce Best Practices for 2026',
      target_keyword: 'ecommerce best practices',
      status: 'outlining',
      word_count_goal: 1800
    },
    {
      id: deterministicUUID('post', 'acme-security'),
      client_id: deterministicUUID('client', 'acme-corp'),
      topic: 'Cybersecurity Essentials for SMBs',
      target_keyword: 'cybersecurity smb',
      status: 'idea',
      word_count_goal: 1600
    }
  ];

  for (const post of testPosts) {
    const { error } = await supabase
      .from('blog_posts')
      .upsert({
        id: post.id,
        client_id: post.client_id,
        topic: post.topic,
        target_keyword: post.target_keyword,
        status: post.status,
        word_count_goal: post.word_count_goal,
        tone_of_voice: 'professional and informative',
        target_audience: 'business professionals',
        goal: 'Increase organic traffic and establish thought leadership',
        seo_metadata: {
          title: post.topic,
          meta_description: `A comprehensive guide to ${post.target_keyword}`,
          slug: post.topic.toLowerCase().replace(/\s+/g, '-')
        },
        created_by: ownerUserId
      }, { onConflict: 'id' });

    if (error) {
      console.error(`  ❌ Failed to create blog post "${post.topic}":`, error.message);
    } else {
      console.log(`  ✅ Created blog post: ${post.topic}`);
    }
  }

  // 6. Create Agent Runs
  console.log('\n🤖 Creating agent run logs...');

  const agentRuns = [
    {
      id: deterministicUUID('agent-run', 'acme-ai-research'),
      blog_post_id: deterministicUUID('post', 'acme-ai-guide'),
      agent_name: 'research',
      status: 'succeeded',
      input_summary: { topic: 'AI in Business', keyword: 'ai in business' },
      output_summary: { sources_found: 15, key_insights: 8 },
      started_at: new Date(Date.now() - 3600000).toISOString(),
      finished_at: new Date(Date.now() - 3300000).toISOString()
    },
    {
      id: deterministicUUID('agent-run', 'acme-ai-outline'),
      blog_post_id: deterministicUUID('post', 'acme-ai-guide'),
      agent_name: 'outline',
      status: 'succeeded',
      input_summary: { topic: 'AI in Business' },
      output_summary: { sections: 7, estimated_words: 2000 },
      started_at: new Date(Date.now() - 3000000).toISOString(),
      finished_at: new Date(Date.now() - 2800000).toISOString()
    }
  ];

  for (const run of agentRuns) {
    const { error } = await supabase
      .from('agent_runs')
      .upsert(run, { onConflict: 'id' });

    if (error) {
      console.error(`  ❌ Failed to create agent run:`, error.message);
    } else {
      console.log(`  ✅ Created agent run: ${run.agent_name} for post`);
    }
  }

  console.log('\n✅ Test data seeding completed!\n');
  console.log('📊 Summary:');
  console.log(`  - Users: ${testUsers.length + clientUsers.length} (${testUsers.length} staff, ${clientUsers.length} clients)`);
  console.log(`  - Clients: ${testClients.length}`);
  console.log(`  - Blog Posts: ${testPosts.length}`);
  console.log(`  - Agent Runs: ${agentRuns.length}`);
  console.log('\n🔐 Test Credentials:');
  console.log('  Owner: owner@test.com / TestPassword123!');
  console.log('  Staff: staff@test.com / TestPassword123!');
  console.log('  Client (Acme): acme-user@test.com / TestPassword123!');
  console.log('  Client (Tech): tech-user@test.com / TestPassword123!');
}

// Run the seeding
seedTestData()
  .then(() => {
    console.log('\n🎉 Seeding successful!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Seeding failed:', error);
    process.exit(1);
  });
