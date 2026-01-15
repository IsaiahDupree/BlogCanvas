import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

/**
 * Middleware to handle:
 * 1. Request correlation ID generation
 * 2. Supabase auth session refresh
 * 3. CORS headers
 * 4. Security headers
 * 5. Route protection
 * 6. Request logging
 */
export async function middleware(request: NextRequest) {
    const startTime = Date.now();

    // Generate or extract correlation ID for request tracing
    const correlationId = request.headers.get('x-request-id') ||
                         request.headers.get('x-correlation-id') ||
                         crypto.randomUUID();

    // Clone headers and add correlation ID
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-request-id', correlationId);
    requestHeaders.set('x-correlation-id', correlationId);

    let response = NextResponse.next({
        request: {
            headers: requestHeaders,
        },
    });

    // Create Supabase client for middleware
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return request.cookies.get(name)?.value;
                },
                set(name: string, value: string, options: CookieOptions) {
                    request.cookies.set({
                        name,
                        value,
                        ...options,
                    });
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    });
                    response.cookies.set({
                        name,
                        value,
                        ...options,
                    });
                },
                remove(name: string, options: CookieOptions) {
                    request.cookies.set({
                        name,
                        value: '',
                        ...options,
                    });
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    });
                    response.cookies.set({
                        name,
                        value: '',
                        ...options,
                    });
                },
            },
        }
    );

    // Refresh auth session
    await supabase.auth.getUser();

    // Allow auth callback route
    if (request.nextUrl.pathname.startsWith('/auth/callback')) {
        return response;
    }

    // Redirect /portal/login to unified /login page
    if (request.nextUrl.pathname === '/portal/login') {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    // Protect portal routes - require authentication
    if (request.nextUrl.pathname.startsWith('/portal')) {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.redirect(new URL('/login', request.url));
        }

        // Check if user is a client (includes client_admin and client_reviewer)
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        const isClientRole = profile?.role === 'client' ||
                            profile?.role === 'client_admin' ||
                            profile?.role === 'client_reviewer';

        if (!isClientRole) {
            // Redirect staff/owners to app dashboard
            return NextResponse.redirect(new URL('/app', request.url));
        }
    }

    // Protect app routes - require staff/owner role
    if (request.nextUrl.pathname.startsWith('/app')) {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            console.log('[Middleware] No user found, redirecting to login');
            return NextResponse.redirect(new URL('/login', request.url));
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        console.log('[Middleware] /app route access attempt');
        console.log('[Middleware] User:', user.email);
        console.log('[Middleware] User role from database:', profile?.role);
        console.log('[Middleware] Path:', request.nextUrl.pathname);

        const isClientRole = profile?.role === 'client' ||
                            profile?.role === 'client_admin' ||
                            profile?.role === 'client_reviewer';

        if (isClientRole) {
            // Redirect clients to portal
            console.log('[Middleware] WARNING: User has CLIENT role but tried to access VENDOR app');
            console.log('[Middleware] Redirecting to /portal/dashboard');
            console.log('[Middleware] To fix: Update user role in profiles table to owner/admin/staff');
            return NextResponse.redirect(new URL('/portal/dashboard', request.url));
        }
        
        console.log('[Middleware] User has vendor role, allowing access to /app');
    }

    // Handle CORS for API routes
    const origin = request.headers.get('origin') || '';
    const allowedOrigins = [
        'http://localhost:3000',
        'http://localhost:3002',
        'http://localhost:3005',
        process.env.NEXT_PUBLIC_APP_URL || '',
    ].filter(Boolean);

    if (request.nextUrl.pathname.startsWith('/api')) {
        // Handle preflight requests
        if (request.method === 'OPTIONS') {
            const preflightResponse = new NextResponse(null, { status: 204 });
            if (allowedOrigins.includes(origin)) {
                preflightResponse.headers.set('Access-Control-Allow-Origin', origin);
            }
            preflightResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
            preflightResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
            preflightResponse.headers.set('Access-Control-Allow-Credentials', 'true');
            return preflightResponse;
        }

        // Add CORS headers to API responses
        if (allowedOrigins.includes(origin)) {
            response.headers.set('Access-Control-Allow-Origin', origin);
        }
        response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
        response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
        response.headers.set('Access-Control-Allow-Credentials', 'true');
    }

    // Add security headers
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('X-XSS-Protection', '1; mode=block');

    // Add correlation ID to response headers for client-side tracking
    response.headers.set('X-Request-ID', correlationId);
    response.headers.set('X-Correlation-ID', correlationId);

    // Log request completion (API routes only)
    if (request.nextUrl.pathname.startsWith('/api')) {
        const duration = Date.now() - startTime;
        const logEntry = {
            requestId: correlationId,
            method: request.method,
            path: request.nextUrl.pathname,
            duration: `${duration}ms`,
            status: response.status,
            timestamp: new Date().toISOString(),
        };

        // Structured logging for production monitoring
        if (process.env.NODE_ENV === 'production') {
            console.log('[REQUEST]', JSON.stringify(logEntry));
        } else {
            console.log('[REQUEST]', logEntry);
        }

        // Warn on slow requests (>2s)
        if (duration > 2000) {
            console.warn('[SLOW REQUEST]', {
                ...logEntry,
                warning: 'Request took longer than 2 seconds'
            });
        }
    }

    return response;
}

/**
 * Configure which routes this middleware should run on
 * API routes need CORS, pages don't necessarily need it
 */
export const config = {
    matcher: [
        '/api/:path*',
        '/portal/:path*',
        '/app/:path*',
        '/auth/callback',
        '/auth/client',
    ],
};
