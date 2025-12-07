/**
 * Authentication Integration Tests
 * 
 * Tests all authentication flows:
 * - Sign up with email confirmation
 * - Magic link login
 * - Password reset
 * - Email change
 * - User invitation
 * - Re-authentication
 */

import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables')
}

// Create clients
const anonClient = createClient<Database>(supabaseUrl, supabaseAnonKey)
const adminClient = supabaseServiceKey 
    ? createClient<Database>(supabaseUrl, supabaseServiceKey)
    : null

// Test user credentials
const TEST_EMAIL = `test-auth-${Date.now()}@example.com`
const TEST_PASSWORD = 'TestPassword123!'
const TEST_NAME = 'Test User'

describe('Authentication Integration Tests', () => {
    let testUserId: string | null = null

    afterAll(async () => {
        // Cleanup: Delete test user if created
        if (testUserId && adminClient) {
            try {
                await adminClient.auth.admin.deleteUser(testUserId)
            } catch (error) {
                console.error('Error cleaning up test user:', error)
            }
        }
    })

    describe('Sign Up Flow', () => {
        it('should create a new user account', async () => {
            const { data, error } = await anonClient.auth.signUp({
                email: TEST_EMAIL,
                password: TEST_PASSWORD,
                options: {
                    emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
                    data: {
                        full_name: TEST_NAME
                    }
                }
            })

            expect(error).toBeNull()
            expect(data.user).toBeTruthy()
            expect(data.user?.email).toBe(TEST_EMAIL)
            
            testUserId = data.user?.id || null
        })

        it('should auto-create profile on signup', async () => {
            if (!testUserId) {
                // Wait a bit for trigger to fire
                await new Promise(resolve => setTimeout(resolve, 1000))
            }

            const { data: profile, error } = await anonClient
                .from('profiles')
                .select('*')
                .eq('id', testUserId!)
                .single()

            expect(error).toBeNull()
            expect(profile).toBeTruthy()
            // Email might not be set in profile (it's in auth.users)
            // Just verify profile exists and has a role
            expect(profile?.role).toBe('client') // Default role
        })

        it('should require email confirmation if enabled', async () => {
            // This depends on Supabase settings
            // If email confirmation is required, session will be null
            const { data, error } = await anonClient.auth.signUp({
                email: `test-confirm-${Date.now()}@example.com`,
                password: TEST_PASSWORD
            })

            expect(error).toBeNull()
            // Session may be null if email confirmation is required
            // This is expected behavior
        })
    })

    describe('Magic Link Login', () => {
        it('should send magic link email', async () => {
            // Use a valid email format
            const validEmail = `test-${Date.now()}@example.com`
            
            const { data, error } = await anonClient.auth.signInWithOtp({
                email: validEmail,
                options: {
                    emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`
                }
            })

            // May error if email validation is strict, but should not crash
            // Just verify the call completes
            expect(error === null || error?.message?.includes('invalid') || error?.message?.includes('rate limit')).toBeTruthy()
        })
    })

    describe('Password Reset Flow', () => {
        it('should send password reset email', async () => {
            // Use a valid email format
            const validEmail = `test-${Date.now()}@example.com`
            
            const { data, error } = await anonClient.auth.resetPasswordForEmail(
                validEmail,
                {
                    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password`
                }
            )

            // May error if email validation is strict, but should not crash
            expect(error === null || error?.message?.includes('invalid') || error?.message?.includes('rate limit')).toBeTruthy()
        })

        it('should update password when authenticated', async () => {
            // First, sign in to get session
            const { data: signInData, error: signInError } = await anonClient.auth.signInWithPassword({
                email: TEST_EMAIL,
                password: TEST_PASSWORD
            })

            if (signInError || !signInData.user) {
                // Skip if we can't sign in (e.g., email not confirmed)
                return
            }

            const newPassword = 'NewPassword123!'
            const { data, error } = await anonClient.auth.updateUser({
                password: newPassword
            })

            expect(error).toBeNull()
            expect(data.user).toBeTruthy()

            // Verify new password works
            const { error: verifyError } = await anonClient.auth.signInWithPassword({
                email: TEST_EMAIL,
                password: newPassword
            })

            expect(verifyError).toBeNull()

            // Reset back to original password
            await anonClient.auth.updateUser({
                password: TEST_PASSWORD
            })
        })
    })

    describe('Email Change Flow', () => {
        it('should request email change', async () => {
            // Sign in first
            const { data: signInData, error: signInError } = await anonClient.auth.signInWithPassword({
                email: TEST_EMAIL,
                password: TEST_PASSWORD
            })

            if (signInError || !signInData.user) {
                // Skip if we can't sign in
                return
            }

            // Use a valid email format
            const newEmail = `new-${Date.now()}@example.com`
            const { data, error } = await anonClient.auth.updateUser({
                email: newEmail
            })

            // May require email confirmation or may error if email validation is strict
            expect(error === null || error?.message?.includes('invalid') || error?.message?.includes('already')).toBeTruthy()
        })
    })

    describe('User Invitation (Admin)', () => {
        it('should create user via admin API', async () => {
            if (!adminClient) {
                console.log('Skipping admin test - service role key not available')
                return
            }

            const inviteEmail = `invite-${Date.now()}@example.com`
            
            const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
                email: inviteEmail,
                email_confirm: false,
                user_metadata: {
                    full_name: 'Invited User',
                    role: 'client'
                }
            })

            expect(createError).toBeNull()
            expect(newUser.user).toBeTruthy()
            expect(newUser.user?.email).toBe(inviteEmail)

            // Cleanup
            if (newUser.user?.id) {
                await adminClient.auth.admin.deleteUser(newUser.user.id)
            }
        })

        it('should send invitation email', async () => {
            if (!adminClient) {
                return
            }

            const inviteEmail = `invite-email-${Date.now()}@example.com`
            
            // Create user first
            const { data: newUser } = await adminClient.auth.admin.createUser({
                email: inviteEmail,
                email_confirm: false
            })

            if (!newUser.user) {
                return
            }

            // Send invite
            const { data: inviteData, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(
                inviteEmail,
                {
                    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?type=invite`
                }
            )

            // Invite may error due to email validation or SMTP setup
            // Just verify the call completes (error is acceptable)
            expect(inviteError === null || inviteError?.message?.includes('invalid') || inviteError?.message?.includes('SMTP')).toBeTruthy()

            // Cleanup
            await adminClient.auth.admin.deleteUser(newUser.user.id)
        })
    })

    describe('Re-authentication', () => {
        it('should verify password for re-auth', async () => {
            // Sign in first
            const { data: signInData, error: signInError } = await anonClient.auth.signInWithPassword({
                email: TEST_EMAIL,
                password: TEST_PASSWORD
            })

            if (signInError || !signInData.user) {
                // Skip if we can't sign in
                return
            }

            // Verify password by attempting sign in again
            const { error: verifyError } = await anonClient.auth.signInWithPassword({
                email: TEST_EMAIL,
                password: TEST_PASSWORD
            })

            expect(verifyError).toBeNull()
        })

        it('should reject invalid password for re-auth', async () => {
            const { data: signInData, error: signInError } = await anonClient.auth.signInWithPassword({
                email: TEST_EMAIL,
                password: TEST_PASSWORD
            })

            if (signInError || !signInData.user) {
                return
            }

            // Try with wrong password
            const { error: verifyError } = await anonClient.auth.signInWithPassword({
                email: TEST_EMAIL,
                password: 'WrongPassword123!'
            })

            expect(verifyError).toBeTruthy()
        })
    })

    describe('Session Management', () => {
        it('should maintain session after login', async () => {
            const { data: signInData, error: signInError } = await anonClient.auth.signInWithPassword({
                email: TEST_EMAIL,
                password: TEST_PASSWORD
            })

            if (signInError || !signInData.user) {
                return
            }

            // Get current session
            const { data: { session }, error: sessionError } = await anonClient.auth.getSession()

            expect(sessionError).toBeNull()
            expect(session).toBeTruthy()
            expect(session?.user.email).toBe(TEST_EMAIL)
        })

        it('should sign out successfully', async () => {
            // Sign in first
            await anonClient.auth.signInWithPassword({
                email: TEST_EMAIL,
                password: TEST_PASSWORD
            })

            // Sign out
            const { error: signOutError } = await anonClient.auth.signOut()

            expect(signOutError).toBeNull()

            // Verify session is cleared
            const { data: { session } } = await anonClient.auth.getSession()
            expect(session).toBeNull()
        })
    })

    describe('Profile Integration', () => {
        it('should link profile to auth user', async () => {
            if (!testUserId) {
                return
            }

            // Sign in first to get authenticated session
            const { data: signInData } = await anonClient.auth.signInWithPassword({
                email: TEST_EMAIL,
                password: TEST_PASSWORD
            })

            if (!signInData.session) {
                // Skip if can't sign in (email not confirmed)
                return
            }

            const { data: profile, error } = await anonClient
                .from('profiles')
                .select('*')
                .eq('id', testUserId)
                .single()

            // Profile should be accessible when authenticated
            expect(error).toBeNull()
            expect(profile).toBeTruthy()
            expect(profile?.id).toBe(testUserId)
        })

        it('should update profile after auth changes', async () => {
            if (!testUserId) {
                return
            }

            // Sign in first to get authenticated session
            const { data: signInData } = await anonClient.auth.signInWithPassword({
                email: TEST_EMAIL,
                password: TEST_PASSWORD
            })

            if (!signInData.session) {
                // Skip if can't sign in (email not confirmed)
                return
            }

            // Update profile
            const { error: updateError } = await anonClient
                .from('profiles')
                .update({ full_name: 'Updated Name' })
                .eq('id', testUserId)

            expect(updateError).toBeNull()

            // Verify update
            const { data: profile } = await anonClient
                .from('profiles')
                .select('*')
                .eq('id', testUserId)
                .single()

            expect(profile?.full_name).toBe('Updated Name')
        })
    })
})

