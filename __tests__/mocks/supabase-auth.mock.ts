/**
 * Supabase Auth Mock
 *
 * Mocks Supabase authentication methods for testing
 */

import { User, Session } from '@supabase/supabase-js';

export const mockUser: User = {
  id: 'test-user-id-123',
  email: 'test@example.com',
  app_metadata: {},
  user_metadata: {
    full_name: 'Test User',
    role: 'owner'
  },
  aud: 'authenticated',
  created_at: new Date().toISOString(),
  role: 'authenticated',
  updated_at: new Date().toISOString()
};

export const mockSession: Session = {
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token',
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  token_type: 'bearer',
  user: mockUser
};

export const mockStaffUser: User = {
  ...mockUser,
  id: 'test-staff-id-456',
  email: 'staff@example.com',
  user_metadata: {
    full_name: 'Test Staff',
    role: 'staff'
  }
};

export const mockClientUser: User = {
  ...mockUser,
  id: 'test-client-id-789',
  email: 'client@example.com',
  user_metadata: {
    full_name: 'Test Client',
    role: 'client',
    client_id: 'test-client-uuid'
  }
};

export const createMockSupabaseAuth = () => ({
  auth: {
    getUser: jest.fn().mockResolvedValue({
      data: { user: mockUser },
      error: null
    }),
    getSession: jest.fn().mockResolvedValue({
      data: { session: mockSession },
      error: null
    }),
    signInWithPassword: jest.fn().mockResolvedValue({
      data: { user: mockUser, session: mockSession },
      error: null
    }),
    signUp: jest.fn().mockResolvedValue({
      data: { user: mockUser, session: mockSession },
      error: null
    }),
    signOut: jest.fn().mockResolvedValue({
      error: null
    }),
    resetPasswordForEmail: jest.fn().mockResolvedValue({
      data: {},
      error: null
    }),
    updateUser: jest.fn().mockResolvedValue({
      data: { user: mockUser },
      error: null
    }),
    admin: {
      createUser: jest.fn().mockResolvedValue({
        data: { user: mockUser },
        error: null
      }),
      getUserById: jest.fn().mockResolvedValue({
        data: { user: mockUser },
        error: null
      }),
      deleteUser: jest.fn().mockResolvedValue({
        data: {},
        error: null
      }),
      updateUserById: jest.fn().mockResolvedValue({
        data: { user: mockUser },
        error: null
      })
    }
  }
});

export const mockSupabaseAuthError = (message: string) => ({
  auth: {
    getUser: jest.fn().mockResolvedValue({
      data: { user: null },
      error: { message }
    }),
    getSession: jest.fn().mockResolvedValue({
      data: { session: null },
      error: { message }
    }),
    signInWithPassword: jest.fn().mockResolvedValue({
      data: { user: null, session: null },
      error: { message }
    })
  }
});
