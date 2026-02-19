/**
 * Centralized Mock Service Layer
 *
 * Provides mocks for:
 * - Auth (Supabase Auth)
 * - Database (Supabase DB)
 * - Payment (Stripe)
 * - Email (Resend)
 */

export * from './supabase-auth.mock';
export * from './supabase-db.mock';
export * from './stripe.mock';
export * from './email.mock';
export * from './test-helpers';
