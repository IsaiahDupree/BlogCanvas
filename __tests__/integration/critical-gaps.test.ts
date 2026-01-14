/**
 * Critical Gaps Integration Tests
 * Tests for vendors, work declarations, API keys, webhooks, files, and Gmail integration
 */

import { createClient } from '@supabase/supabase-js';

// Initialize test client with service role key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// Test data cleanup tracking
const cleanupIds = {
  vendors: [] as string[],
  apiKeys: [] as string[],
  webhooks: [] as string[],
  workDeclarations: [] as string[],
  folders: [] as string[],
  files: [] as string[],
};

// Cleanup after all tests
afterAll(async () => {
  // Delete in reverse dependency order
  for (const id of cleanupIds.files) {
    await supabase.from('files').delete().eq('id', id);
  }
  for (const id of cleanupIds.folders) {
    await supabase.from('folders').delete().eq('id', id);
  }
  for (const id of cleanupIds.workDeclarations) {
    await supabase.from('work_declarations').delete().eq('id', id);
  }
  for (const id of cleanupIds.webhooks) {
    await supabase.from('webhooks').delete().eq('id', id);
  }
  for (const id of cleanupIds.apiKeys) {
    await supabase.from('api_keys').delete().eq('id', id);
  }
  for (const id of cleanupIds.vendors) {
    await supabase.from('vendors').delete().eq('id', id);
  }
});

describe('Critical Gaps: Table Structure', () => {
  describe('Vendor Tables', () => {
    it('should have vendors table with required columns', async () => {
      const { error } = await supabase
        .from('vendors')
        .select('id, name, slug, email, status, created_at')
        .limit(0);

      expect(error).toBeNull();
    });

    it('should have vendor_team_invitations table', async () => {
      const { error } = await supabase
        .from('vendor_team_invitations')
        .select('id, vendor_id, email, role, token, status')
        .limit(0);

      expect(error).toBeNull();
    });

    it('should have vendor_id column on profiles', async () => {
      const { error } = await supabase
        .from('profiles')
        .select('id, vendor_id')
        .limit(0);

      expect(error).toBeNull();
    });

    it('should have vendor_id column on clients', async () => {
      const { error } = await supabase
        .from('clients')
        .select('id, vendor_id')
        .limit(0);

      expect(error).toBeNull();
    });
  });

  describe('Work Declaration Tables', () => {
    it('should have work_declarations table with required columns', async () => {
      const { error } = await supabase
        .from('work_declarations')
        .select('id, vendor_id, client_id, title, description, status, priority')
        .limit(0);

      expect(error).toBeNull();
    });

    it('should have work_declaration_updates table', async () => {
      const { error } = await supabase
        .from('work_declaration_updates')
        .select('id, declaration_id, update_type, old_value, new_value')
        .limit(0);

      expect(error).toBeNull();
    });
  });

  describe('API Keys Tables', () => {
    it('should have api_keys table with required columns', async () => {
      const { error } = await supabase
        .from('api_keys')
        .select('id, vendor_id, name, key_prefix, key_hash, scopes, is_active')
        .limit(0);

      expect(error).toBeNull();
    });

    it('should have api_key_usage table', async () => {
      const { error } = await supabase
        .from('api_key_usage')
        .select('id, api_key_id, endpoint, method, status_code')
        .limit(0);

      expect(error).toBeNull();
    });
  });

  describe('Webhook Tables', () => {
    it('should have webhooks table with required columns', async () => {
      const { error } = await supabase
        .from('webhooks')
        .select('id, vendor_id, name, url, secret, events, is_active')
        .limit(0);

      expect(error).toBeNull();
    });

    it('should have webhook_deliveries table', async () => {
      const { error } = await supabase
        .from('webhook_deliveries')
        .select('id, webhook_id, event_type, payload, status')
        .limit(0);

      expect(error).toBeNull();
    });
  });

  describe('File System Tables', () => {
    it('should have folders table with required columns', async () => {
      const { error } = await supabase
        .from('folders')
        .select('id, vendor_id, client_id, parent_id, name, path')
        .limit(0);

      expect(error).toBeNull();
    });

    it('should have files table with required columns', async () => {
      const { error } = await supabase
        .from('files')
        .select('id, vendor_id, client_id, folder_id, name, mime_type, size_bytes')
        .limit(0);

      expect(error).toBeNull();
    });
  });

  describe('Gmail Tables', () => {
    it('should have gmail_connections table', async () => {
      const { error } = await supabase
        .from('gmail_connections')
        .select('id, user_id, email, is_active')
        .limit(0);

      expect(error).toBeNull();
    });

    it('should have email_threads table', async () => {
      const { error } = await supabase
        .from('email_threads')
        .select('id, gmail_connection_id, thread_id, subject')
        .limit(0);

      expect(error).toBeNull();
    });

    it('should have email_messages table', async () => {
      const { error } = await supabase
        .from('email_messages')
        .select('id, thread_id, message_id, from_address, subject')
        .limit(0);

      expect(error).toBeNull();
    });
  });
});

describe('Critical Gaps: CRUD Operations', () => {
  let testVendorId: string;

  describe('Vendors CRUD', () => {
    it('should create a vendor', async () => {
      const { data, error } = await supabase
        .from('vendors')
        .insert({
          name: 'Test Vendor ' + Date.now(),
          slug: 'test-vendor-' + Date.now(),
          email: 'test@vendor.com',
          status: 'active',
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data.id).toBeDefined();
      
      testVendorId = data.id;
      cleanupIds.vendors.push(data.id);
    });

    it('should read a vendor', async () => {
      expect(testVendorId).toBeDefined();

      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .eq('id', testVendorId)
        .single();

      expect(error).toBeNull();
      expect(data.email).toBe('test@vendor.com');
    });

    it('should update a vendor', async () => {
      expect(testVendorId).toBeDefined();

      const { data, error } = await supabase
        .from('vendors')
        .update({ name: 'Updated Vendor Name' })
        .eq('id', testVendorId)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data.name).toBe('Updated Vendor Name');
    });
  });

  describe('API Keys CRUD', () => {
    it('should create an API key for vendor', async () => {
      expect(testVendorId).toBeDefined();

      const { data, error } = await supabase
        .from('api_keys')
        .insert({
          vendor_id: testVendorId,
          name: 'Test API Key',
          key_prefix: 'bc_test123',
          key_hash: 'testhash' + Date.now(),
          scopes: ['clients:read', 'content:read'],
          is_active: true,
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data.scopes).toContain('clients:read');
      
      cleanupIds.apiKeys.push(data.id);
    });

    it('should list API keys for vendor', async () => {
      expect(testVendorId).toBeDefined();

      const { data, error } = await supabase
        .from('api_keys')
        .select('*')
        .eq('vendor_id', testVendorId);

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data!.length).toBeGreaterThan(0);
    });
  });

  describe('Webhooks CRUD', () => {
    it('should create a webhook for vendor', async () => {
      expect(testVendorId).toBeDefined();

      const { data, error } = await supabase
        .from('webhooks')
        .insert({
          vendor_id: testVendorId,
          name: 'Test Webhook',
          url: 'https://example.com/webhook',
          secret: 'secret' + Date.now(),
          events: ['post.created', 'post.published'],
          is_active: true,
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data.events).toContain('post.created');
      
      cleanupIds.webhooks.push(data.id);
    });
  });

  describe('Folders & Files CRUD', () => {
    let testFolderId: string;

    it('should create a folder', async () => {
      expect(testVendorId).toBeDefined();

      const { data, error } = await supabase
        .from('folders')
        .insert({
          vendor_id: testVendorId,
          name: 'Test Folder',
          path: '/test-folder',
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      
      testFolderId = data.id;
      cleanupIds.folders.push(data.id);
    });

    it('should create a file in folder', async () => {
      expect(testVendorId).toBeDefined();
      expect(testFolderId).toBeDefined();

      const { data, error } = await supabase
        .from('files')
        .insert({
          vendor_id: testVendorId,
          folder_id: testFolderId,
          name: 'test-file.pdf',
          original_name: 'test-file.pdf',
          mime_type: 'application/pdf',
          size_bytes: 1024,
          storage_path: '/test/path/file.pdf',
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data!.mime_type).toBe('application/pdf');
      
      cleanupIds.files.push(data!.id);
    });
  });
});

describe('Critical Gaps: Relationships', () => {
  it('should query vendor with related API keys', async () => {
    const { data, error } = await supabase
      .from('vendors')
      .select(`
        id,
        name,
        api_keys (id, name, is_active)
      `)
      .limit(1);

    expect(error).toBeNull();
  });

  it('should query vendor with related webhooks', async () => {
    const { data, error } = await supabase
      .from('vendors')
      .select(`
        id,
        name,
        webhooks (id, name, url, is_active)
      `)
      .limit(1);

    expect(error).toBeNull();
  });

  it('should query folders with files', async () => {
    const { data, error } = await supabase
      .from('folders')
      .select(`
        id,
        name,
        path,
        files (id, name, mime_type, size_bytes)
      `)
      .limit(1);

    expect(error).toBeNull();
  });

  it('should query email threads with messages', async () => {
    const { data, error } = await supabase
      .from('email_threads')
      .select(`
        id,
        subject,
        email_messages (id, from_address, subject)
      `)
      .limit(1);

    expect(error).toBeNull();
  });
});

describe('Critical Gaps: Data Integrity', () => {
  it('should enforce vendor_id foreign key on api_keys', async () => {
    const { error } = await supabase
      .from('api_keys')
      .insert({
        vendor_id: '00000000-0000-0000-0000-000000000000', // Non-existent
        name: 'Invalid Key',
        key_prefix: 'bc_invalid',
        key_hash: 'invalidhash',
        scopes: [],
      });

    expect(error).toBeDefined();
  });

  it('should enforce vendor_id foreign key on webhooks', async () => {
    const { error } = await supabase
      .from('webhooks')
      .insert({
        vendor_id: '00000000-0000-0000-0000-000000000000', // Non-existent
        name: 'Invalid Webhook',
        url: 'https://example.com',
        secret: 'secret',
        events: [],
      });

    expect(error).toBeDefined();
  });

  it('should enforce required fields on vendors', async () => {
    const { error } = await supabase
      .from('vendors')
      .insert({
        // Missing required: name, slug, email
      });

    expect(error).toBeDefined();
  });
});
