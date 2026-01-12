// Jest setup file
require('dotenv').config({ path: '.env.local' });
require('@testing-library/jest-dom');

// Set test environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'test-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'test-service-key';
process.env.NEXT_PUBLIC_APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
process.env.RESEND_API_KEY = process.env.RESEND_API_KEY || 're_test_key_for_testing';
process.env.CRON_SECRET = process.env.CRON_SECRET || 'test-cron-secret';
