import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware to handle CORS and add security headers
 */
export function middleware(request: NextRequest) {
    // Get the origin from the request
    const origin = request.headers.get('origin') || '';

    // Define allowed origins (adjust for production)
    const allowedOrigins = [
        'http://localhost:3000',
        'http://localhost:3002',
        'http://localhost:3005',
        process.env.NEXT_PUBLIC_APP_URL || '',
    ].filter(Boolean);

    // Handle preflight requests
    if (request.method === 'OPTIONS') {
        const response = new NextResponse(null, { status: 204 });

        // Set CORS headers
        if (allowedOrigins.includes(origin)) {
            response.headers.set('Access-Control-Allow-Origin', origin);
        }
        response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
        response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
        response.headers.set('Access-Control-Allow-Credentials', 'true');
        response.headers.set('Access-Control-Max-Age', '86400');

        return response;
    }

    // Get the response
    const response = NextResponse.next();

    // Add CORS headers to all responses
    if (allowedOrigins.includes(origin)) {
        response.headers.set('Access-Control-Allow-Origin', origin);
    }
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    response.headers.set('Access-Control-Allow-Credentials', 'true');

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
    ],
};
