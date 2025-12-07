import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

/**
 * Middleware to handle:
 * 1. Supabase auth session refresh
 * 2. CORS headers
 * 3. Security headers
 * 4. Route protection
 */
export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
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

    // Protect portal routes - require authentication
    if (request.nextUrl.pathname.startsWith('/portal') && 
        !request.nextUrl.pathname.startsWith('/portal/login')) {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
            return NextResponse.redirect(new URL('/portal/login', request.url));
        }

        // Check if user is a client
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profile?.role !== 'client') {
            // Redirect staff/owners to app dashboard
            return NextResponse.redirect(new URL('/app', request.url));
        }
    }

    // Protect app routes - require staff/owner role
    if (request.nextUrl.pathname.startsWith('/app')) {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
            return NextResponse.redirect(new URL('/portal/login', request.url));
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profile?.role === 'client') {
            // Redirect clients to portal
            return NextResponse.redirect(new URL('/portal/dashboard', request.url));
        }
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
    ],
};
