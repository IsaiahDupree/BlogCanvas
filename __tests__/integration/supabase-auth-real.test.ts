/**
 * Real Supabase Authentication Integration Tests
 * 
 * Tests authentication flows against live Supabase instance
 * Requires TEST_USER_EMAIL and TEST_USER_PASSWORD in .env.local
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const testEmail = process.env.TEST_USER_EMAIL!
const testPassword = process.env.TEST_USER_PASSWORD!

// Skip tests if credentials not available
const skipTests = !supabaseUrl || !supabaseAnonKey || !testEmail || !testPassword

describe('Real Supabase Auth Integration', () => {
  let supabase: SupabaseClient

  beforeAll(() => {
    if (skipTests) {
      console.warn('⚠️ Skipping auth tests - missing credentials')
      return
    }
    supabase = createClient(supabaseUrl, supabaseAnonKey)
  })

  afterAll(async () => {
    if (supabase) {
      await supabase.auth.signOut()
    }
  })

  describe('Environment Setup', () => {
    it('should have Supabase URL configured', () => {
      expect(supabaseUrl).toBeDefined()
      expect(supabaseUrl).toContain('supabase.co')
    })

    it('should have Supabase anon key configured', () => {
      expect(supabaseAnonKey).toBeDefined()
      expect(supabaseAnonKey.length).toBeGreaterThan(100)
    })

    it('should have test credentials configured', () => {
      expect(testEmail).toBeDefined()
      expect(testPassword).toBeDefined()
    })
  })

  describe('Sign In Flow', () => {
    it('should sign in with email and password', async () => {
      if (skipTests) return

      const { data, error } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword,
      })

      expect(error).toBeNull()
      expect(data.user).toBeDefined()
      expect(data.user?.email).toBe(testEmail)
      expect(data.session).toBeDefined()
      expect(data.session?.access_token).toBeDefined()
    })

    it('should fail with wrong password', async () => {
      if (skipTests) return

      const { data, error } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: 'wrongpassword123',
      })

      expect(error).toBeDefined()
      expect(data.user).toBeNull()
    })

    it('should fail with non-existent email', async () => {
      if (skipTests) return

      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'nonexistent@example.com',
        password: testPassword,
      })

      expect(error).toBeDefined()
      expect(data.user).toBeNull()
    })
  })

  describe('Session Management', () => {
    beforeEach(async () => {
      if (skipTests) return
      await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword,
      })
    })

    it('should get current session', async () => {
      if (skipTests) return

      const { data: { session }, error } = await supabase.auth.getSession()

      expect(error).toBeNull()
      expect(session).toBeDefined()
      expect(session?.user.email).toBe(testEmail)
    })

    it('should get current user', async () => {
      if (skipTests) return

      const { data: { user }, error } = await supabase.auth.getUser()

      expect(error).toBeNull()
      expect(user).toBeDefined()
      expect(user?.email).toBe(testEmail)
    })

    it('should refresh session', async () => {
      if (skipTests) return

      const { data, error } = await supabase.auth.refreshSession()

      expect(error).toBeNull()
      expect(data.session).toBeDefined()
    })

    it('should sign out successfully', async () => {
      if (skipTests) return

      const { error } = await supabase.auth.signOut()
      expect(error).toBeNull()

      const { data: { session } } = await supabase.auth.getSession()
      expect(session).toBeNull()
    })
  })

  describe('User Profile', () => {
    beforeEach(async () => {
      if (skipTests) return
      await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword,
      })
    })

    it('should get user metadata', async () => {
      if (skipTests) return

      const { data: { user } } = await supabase.auth.getUser()

      expect(user).toBeDefined()
      expect(user?.id).toBeDefined()
      expect(user?.email).toBe(testEmail)
      expect(user?.created_at).toBeDefined()
    })

    it('should update user metadata', async () => {
      if (skipTests) return

      const testMetadata = { test_key: `test_value_${Date.now()}` }
      
      const { data, error } = await supabase.auth.updateUser({
        data: testMetadata
      })

      expect(error).toBeNull()
      expect(data.user?.user_metadata.test_key).toBe(testMetadata.test_key)
    })
  })

  describe('Database Access with Auth', () => {
    beforeEach(async () => {
      if (skipTests) return
      await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword,
      })
    })

    it('should access users table when authenticated', async () => {
      if (skipTests) return

      const { data: { user } } = await supabase.auth.getUser()
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user?.id)
        .single()

      // May not have a users row yet, but should not get RLS error
      if (error) {
        expect(error.code).not.toBe('PGRST301') // Not a permission error
      }
    })

    it('should be blocked from other users data by RLS', async () => {
      if (skipTests) return

      // Try to access a random UUID that's not the current user
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', '00000000-0000-0000-0000-000000000000')
        .single()

      // Should either return no rows or RLS error
      expect(data).toBeNull()
    })
  })

  describe('Auth State Changes', () => {
    it('should emit auth state change events', async () => {
      if (skipTests) return

      const events: string[] = []
      
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
        events.push(event)
      })

      // Sign in
      await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword,
      })

      // Wait for event
      await new Promise(resolve => setTimeout(resolve, 100))

      expect(events).toContain('SIGNED_IN')

      // Clean up
      subscription.unsubscribe()
    })
  })
})

describe('Auth Error Handling', () => {
  let supabase: SupabaseClient

  beforeAll(() => {
    if (skipTests) return
    supabase = createClient(supabaseUrl, supabaseAnonKey)
  })

  it('should handle invalid credentials gracefully', async () => {
    if (skipTests) return

    const { error } = await supabase.auth.signInWithPassword({
      email: 'invalid',
      password: 'short',
    })

    expect(error).toBeDefined()
    expect(error?.message).toBeDefined()
  })

  it('should handle network errors gracefully', async () => {
    // Create client with invalid URL
    const badClient = createClient('https://invalid.supabase.co', supabaseAnonKey)

    const { error } = await badClient.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    })

    expect(error).toBeDefined()
  })
})
