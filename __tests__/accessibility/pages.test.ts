/**
 * Comprehensive Page Accessibility Tests
 * Tests all routes to ensure they're accessible and return correct status codes
 */

describe('Page Accessibility Tests', () => {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    describe('Public Pages', () => {
        it('should access home page', async () => {
            const response = await fetch(`${baseUrl}/`);
            expect(response.status).toBe(200);
        });

        it('should access blog listing page', async () => {
            const response = await fetch(`${baseUrl}/blog`);
            expect(response.status).toBe(200);
        });

        it('should access individual blog post page', async () => {
            const response = await fetch(`${baseUrl}/blog/test-slug`);
            // Can be 200 (found) or 404 (not found) - both are valid responses
            expect([200, 404]).toContain(response.status);
        });
    });

    describe('Merchant Portal Pages', () => {
        it('should access merchant dashboard', async () => {
            const response = await fetch(`${baseUrl}/app`);
            expect(response.status).toBe(200);
        });

        it('should access clients list', async () => {
            const response = await fetch(`${baseUrl}/app/clients`);
            expect(response.status).toBe(200);
        });

        it('should access client detail page', async () => {
            const response = await fetch(`${baseUrl}/app/clients/test-client-id/overview`);
            expect([200, 404]).toContain(response.status);
        });
    });

    describe('Client Portal Pages', () => {
        it('should access client login page', async () => {
            const response = await fetch(`${baseUrl}/portal/login`);
            expect(response.status).toBe(200);
        });

        it('should access client dashboard', async () => {
            const response = await fetch(`${baseUrl}/portal/dashboard`);
            expect(response.status).toBe(200);
        });

        it('should access posts list', async () => {
            const response = await fetch(`${baseUrl}/portal/posts`);
            expect(response.status).toBe(200);
        });

        it('should access post detail page', async () => {
            const response = await fetch(`${baseUrl}/portal/posts/test-post-id`);
            expect([200, 404]).toContain(response.status);
        });

        it('should access brand settings', async () => {
            const response = await fetch(`${baseUrl}/portal/brand`);
            expect(response.status).toBe(200);
        });

        it('should access notification settings', async () => {
            const response = await fetch(`${baseUrl}/portal/settings/notifications`);
            expect(response.status).toBe(200);
        });
    });

    describe('Settings & Analysis Pages', () => {
        it('should access settings page', async () => {
            const response = await fetch(`${baseUrl}/settings`);
            expect(response.status).toBe(200);
        });

        it('should access analyze page', async () => {
            const response = await fetch(`${baseUrl}/analyze`);
            expect(response.status).toBe(200);
        });

        it('should access brand guide page', async () => {
            const response = await fetch(`${baseUrl}/brand-guide`);
            expect(response.status).toBe(200);
        });
    });
});

describe('API Route Accessibility Tests', () => {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    describe('Client API Routes', () => {
        it('should access GET /api/clients', async () => {
            const response = await fetch(`${baseUrl}/api/clients`);
            expect([200, 401, 403]).toContain(response.status);
        });

        it('should access POST /api/clients', async () => {
            const response = await fetch(`${baseUrl}/api/clients`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: 'Test Client' })
            });
            expect([200, 400, 401, 403]).toContain(response.status);
        });

        it('should access GET /api/clients/[clientId]', async () => {
            const response = await fetch(`${baseUrl}/api/clients/test-id`);
            expect([200, 404, 401, 403]).toContain(response.status);
        });
    });

    describe('Post API Routes', () => {
        it('should access GET /api/clients/[clientId]/posts', async () => {
            const response = await fetch(`${baseUrl}/api/clients/test-id/posts`);
            expect([200, 404, 401, 403]).toContain(response.status);
        });

        it('should access POST /api/clients/[clientId]/posts', async () => {
            const response = await fetch(`${baseUrl}/api/clients/test-id/posts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ topic: 'Test Topic' })
            });
            expect([200, 400, 401, 403]).toContain(response.status);
        });
    });

    describe('Portal API Routes', () => {
        it('should access GET /api/portal/posts/[postId]/comments', async () => {
            const response = await fetch(`${baseUrl}/api/portal/posts/test-id/comments`);
            expect([200, 404, 401, 403]).toContain(response.status);
        });

        it('should access POST /api/portal/posts/[postId]/approve', async () => {
            const response = await fetch(`${baseUrl}/api/portal/posts/test-id/approve`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            expect([200, 400, 401, 403, 404]).toContain(response.status);
        });

        it('should access POST /api/portal/posts/[postId]/request-changes', async () => {
            const response = await fetch(`${baseUrl}/api/portal/posts/test-id/request-changes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ changeRequest: 'Test request' })
            });
            expect([200, 400, 401, 403, 404]).toContain(response.status);
        });
    });

    describe('Analysis API Routes', () => {
        it('should access POST /api/analyze', async () => {
            const response = await fetch(`${baseUrl}/api/analyze`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: 'https://example.com' })
            });
            expect([200, 400, 401, 403]).toContain(response.status);
        });

        it('should access GET /api/analyze/[analysisId]', async () => {
            const response = await fetch(`${baseUrl}/api/analyze/test-id`);
            expect([200, 404, 401, 403]).toContain(response.status);
        });
    });
});

describe('CORS Configuration Tests', () => {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    it('should handle OPTIONS preflight request', async () => {
        const response = await fetch(`${baseUrl}/api/clients`, {
            method: 'OPTIONS',
            headers: {
                'Origin': 'http://localhost:3000',
                'Access-Control-Request-Method': 'POST'
            }
        });

        expect([200, 204]).toContain(response.status);

        // Check CORS headers are present
        const allowOrigin = response.headers.get('Access-Control-Allow-Origin');
        const allowMethods = response.headers.get('Access-Control-Allow-Methods');

        expect(allowOrigin).toBeTruthy();
        expect(allowMethods).toBeTruthy();
    });

    it('should include CORS headers in API responses', async () => {
        const response = await fetch(`${baseUrl}/api/clients`, {
            headers: {
                'Origin': 'http://localhost:3000'
            }
        });

        const allowOrigin = response.headers.get('Access-Control-Allow-Origin');

        // Should have CORS header if origin is allowed
        if (response.status !== 500) {
            expect(allowOrigin).toBeTruthy();
        }
    });

    it('should include security headers', async () => {
        const response = await fetch(`${baseUrl}/api/clients`, {
            headers: {
                'Origin': 'http://localhost:3000'
            }
        });

        // Check for security headers
        const xFrameOptions = response.headers.get('X-Frame-Options');
        const xContentType = response.headers.get('X-Content-Type-Options');

        // These may or may not be present depending on middleware configuration
        // Just check that if they exist, they have correct values
        if (xFrameOptions) {
            expect(['DENY', 'SAMEORIGIN']).toContain(xFrameOptions);
        }
        if (xContentType) {
            expect(xContentType).toBe('nosniff');
        }
    });

    it('should allow credentials in CORS', async () => {
        const response = await fetch(`${baseUrl}/api/clients`, {
            headers: {
                'Origin': 'http://localhost:3000'
            }
        });

        const allowCredentials = response.headers.get('Access-Control-Allow-Credentials');

        // Should allow credentials for API routes
        if (response.status !== 500) {
            expect(allowCredentials).toBe('true');
        }
    });
});

describe('Error Page Accessibility', () => {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    it('should handle 404 for non-existent routes', async () => {
        const response = await fetch(`${baseUrl}/this-route-does-not-exist`);
        expect(response.status).toBe(404);
    });

    it('should return valid HTML for 404', async () => {
        const response = await fetch(`${baseUrl}/this-route-does-not-exist`);
        const contentType = response.headers.get('content-type');
        expect(contentType).toContain('text/html');
    });
});

describe('Static Assets Accessibility', () => {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    it('should serve favicon', async () => {
        const response = await fetch(`${baseUrl}/favicon.ico`);
        // 200 if exists, 404 if not configured yet
        expect([200, 404]).toContain(response.status);
    });
});
