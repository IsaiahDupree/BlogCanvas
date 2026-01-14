
import { NextRequest } from 'next/server';

// Mock Supabase client
const mockSignInWithPassword = jest.fn();
const mockSignOut = jest.fn();
const mockFrom = jest.fn();

jest.mock('@/lib/supabase/server', () => ({
    createClient: jest.fn(() => ({
        auth: {
            signInWithPassword: mockSignInWithPassword,
            signOut: mockSignOut,
            getUser: jest.fn(() => Promise.resolve({ data: { user: { id: 'test-user' } }, error: null }))
        },
        from: mockFrom
    }))
}));

describe('Auth API Routes', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /api/auth/login', () => {
        it('should login successfully and return redirect URL for admin', async () => {
            const { POST } = await import('@/app/api/auth/login/route');

            // Mock successful login
            mockSignInWithPassword.mockResolvedValue({
                data: { user: { id: 'admin-user' } },
                error: null
            });

            // Mock profile lookup
            mockFrom.mockReturnValue({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({
                            data: { role: 'admin' }
                        })
                    })
                })
            });

            const request = new NextRequest('http://localhost/api/auth/login', {
                method: 'POST',
                body: JSON.stringify({
                    email: 'admin@example.com',
                    password: 'password123',
                    userType: 'vendor'
                })
            });

            const response = await POST(request);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.success).toBe(true);
            expect(data.redirectUrl).toBe('/app');
            expect(mockSignInWithPassword).toHaveBeenCalledWith({
                email: 'admin@example.com',
                password: 'password123'
            });
        });

        it('should redirect to /app when vendor userType is selected', async () => {
            const { POST } = await import('@/app/api/auth/login/route');

            mockSignInWithPassword.mockResolvedValue({
                data: { user: { id: 'vendor-user' } },
                error: null
            });

            mockFrom.mockReturnValue({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({
                            data: { role: 'owner' }
                        })
                    })
                })
            });

            const request = new NextRequest('http://localhost/api/auth/login', {
                method: 'POST',
                body: JSON.stringify({
                    email: 'vendor@example.com',
                    password: 'password123',
                    userType: 'vendor'
                })
            });

            const response = await POST(request);
            const data = await response.json();

            expect(data.success).toBe(true);
            expect(data.redirectUrl).toBe('/app');
            expect(data.userRole).toBe('owner');
            console.log('[Test] Vendor selection redirects to /app:', data.redirectUrl);
        });

        it('should redirect to /portal/dashboard when client userType is selected', async () => {
            const { POST } = await import('@/app/api/auth/login/route');

            mockSignInWithPassword.mockResolvedValue({
                data: { user: { id: 'client-user' } },
                error: null
            });

            mockFrom.mockReturnValue({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({
                            data: { role: 'client' }
                        })
                    })
                })
            });

            const request = new NextRequest('http://localhost/api/auth/login', {
                method: 'POST',
                body: JSON.stringify({
                    email: 'client@example.com',
                    password: 'password123',
                    userType: 'client'
                })
            });

            const response = await POST(request);
            const data = await response.json();

            expect(data.success).toBe(true);
            expect(data.redirectUrl).toBe('/portal/dashboard');
            expect(data.userRole).toBe('client');
            console.log('[Test] Client selection redirects to /portal/dashboard:', data.redirectUrl);
        });

        it('should use userType selection for redirect even when role differs (vendor selects client)', async () => {
            const { POST } = await import('@/app/api/auth/login/route');

            mockSignInWithPassword.mockResolvedValue({
                data: { user: { id: 'vendor-user' } },
                error: null
            });

            // User has vendor role but selected client
            mockFrom.mockReturnValue({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({
                            data: { role: 'owner' }
                        })
                    })
                })
            });

            const request = new NextRequest('http://localhost/api/auth/login', {
                method: 'POST',
                body: JSON.stringify({
                    email: 'vendor@example.com',
                    password: 'password123',
                    userType: 'client' // Vendor selects client portal
                })
            });

            const response = await POST(request);
            const data = await response.json();

            // Should redirect to client portal based on selection
            expect(data.redirectUrl).toBe('/portal/dashboard');
            console.log('[Test] Vendor role with client selection redirects to portal:', data.redirectUrl);
        });

        it('should use userType selection for redirect even when role differs (client selects vendor)', async () => {
            const { POST } = await import('@/app/api/auth/login/route');

            mockSignInWithPassword.mockResolvedValue({
                data: { user: { id: 'client-user' } },
                error: null
            });

            // User has client role but selected vendor
            mockFrom.mockReturnValue({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({
                            data: { role: 'client' }
                        })
                    })
                })
            });

            const request = new NextRequest('http://localhost/api/auth/login', {
                method: 'POST',
                body: JSON.stringify({
                    email: 'client@example.com',
                    password: 'password123',
                    userType: 'vendor' // Client selects vendor app
                })
            });

            const response = await POST(request);
            const data = await response.json();

            // Should redirect to vendor app based on selection
            expect(data.redirectUrl).toBe('/app');
            console.log('[Test] Client role with vendor selection redirects to app:', data.redirectUrl);
        });

        it('should redirect client users to portal when client userType selected', async () => {
            const { POST } = await import('@/app/api/auth/login/route');

            mockSignInWithPassword.mockResolvedValue({
                data: { user: { id: 'client-user' } },
                error: null
            });

            mockFrom.mockReturnValue({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({
                            data: { role: 'client' }
                        })
                    })
                })
            });

            const request = new NextRequest('http://localhost/api/auth/login', {
                method: 'POST',
                body: JSON.stringify({
                    email: 'client@example.com',
                    password: 'password123',
                    userType: 'client'
                })
            });

            const response = await POST(request);
            const data = await response.json();

            expect(data.redirectUrl).toBe('/portal/dashboard');
        });

        it('should handle invalid credentials', async () => {
            const { POST } = await import('@/app/api/auth/login/route');

            mockSignInWithPassword.mockResolvedValue({
                data: { user: null },
                error: { message: 'Invalid login credentials' }
            });

            const request = new NextRequest('http://localhost/api/auth/login', {
                method: 'POST',
                body: JSON.stringify({
                    email: 'test@example.com',
                    password: 'wrongpassword'
                })
            });

            const response = await POST(request);
            const data = await response.json();

            expect(response.status).toBe(401);
            expect(data.success).toBe(false);
            expect(data.error).toBe('Invalid login credentials');
        });

        it('should require email and password', async () => {
            const { POST } = await import('@/app/api/auth/login/route');

            const request = new NextRequest('http://localhost/api/auth/login', {
                method: 'POST',
                body: JSON.stringify({})
            });

            const response = await POST(request);
            expect(response.status).toBe(400);
        });
    });

    describe('POST /api/auth/logout', () => {
        it('should sign out successfully', async () => {
            const { POST } = await import('@/app/api/auth/logout/route');

            mockSignOut.mockResolvedValue({ error: null });

            const request = new NextRequest('http://localhost/api/auth/logout', {
                method: 'POST'
            });

            const response = await POST(request);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.success).toBe(true);
            expect(mockSignOut).toHaveBeenCalled();
        });
    });
});
