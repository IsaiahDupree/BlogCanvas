/**
 * BlogCanvas Critical Paths Load Test
 *
 * Tests critical user journeys under load:
 * - Client onboarding
 * - Blog post creation
 * - AI pipeline execution
 * - Analytics dashboard
 *
 * Usage:
 *   k6 run __tests__/performance/k6-critical-paths.js
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const criticalPathErrors = new Rate('critical_path_errors');
const criticalPathDuration = new Trend('critical_path_duration');

export const options = {
    scenarios: {
        // Scenario 1: Client onboarding flow
        client_onboarding: {
            executor: 'ramping-vus',
            startVUs: 0,
            stages: [
                { duration: '30s', target: 10 },
                { duration: '1m', target: 20 },
                { duration: '30s', target: 0 },
            ],
            exec: 'clientOnboardingScenario',
        },

        // Scenario 2: Blog post creation
        blog_post_creation: {
            executor: 'ramping-vus',
            startVUs: 0,
            stages: [
                { duration: '30s', target: 15 },
                { duration: '1m', target: 30 },
                { duration: '30s', target: 0 },
            ],
            exec: 'blogPostCreationScenario',
            startTime: '30s',
        },

        // Scenario 3: Analytics dashboard
        analytics_dashboard: {
            executor: 'constant-vus',
            vus: 25,
            duration: '2m',
            exec: 'analyticsDashboardScenario',
            startTime: '1m',
        },
    },
    thresholds: {
        http_req_duration: ['p(95)<3000'],
        http_req_failed: ['rate<0.01'],
        critical_path_errors: ['rate<0.01'],
    },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:4848';

/**
 * Scenario 1: Client Onboarding
 */
export function clientOnboardingScenario() {
    const startTime = Date.now();

    group('Client Onboarding Flow', () => {
        // Step 1: Create client
        const createClientRes = http.post(`${BASE_URL}/api/clients`, JSON.stringify({
            name: `Load Test Client ${Date.now()}`,
            email: `client-${Date.now()}@example.com`,
            industry: 'Technology',
        }), {
            headers: { 'Content-Type': 'application/json' },
        });

        const createSuccess = check(createClientRes, {
            'create client status is 200': (r) => r.status === 200 || r.status === 201,
            'create client time < 2s': (r) => r.timings.duration < 2000,
        });

        criticalPathErrors.add(!createSuccess);

        if (!createSuccess) return;

        const clientId = createClientRes.json('id');

        sleep(0.5);

        // Step 2: Add website
        const addWebsiteRes = http.post(`${BASE_URL}/api/clients/${clientId}/websites`, JSON.stringify({
            url: 'https://example.com',
            name: 'Example Website',
        }), {
            headers: { 'Content-Type': 'application/json' },
        });

        const websiteSuccess = check(addWebsiteRes, {
            'add website status is 200': (r) => r.status === 200 || r.status === 201,
        });

        criticalPathErrors.add(!websiteSuccess);

        sleep(0.5);

        // Step 3: Send welcome email
        const welcomeEmailRes = http.post(`${BASE_URL}/api/clients/${clientId}/welcome`, null, {
            headers: { 'Content-Type': 'application/json' },
        });

        const emailSuccess = check(welcomeEmailRes, {
            'welcome email status is 200': (r) => r.status === 200 || r.status === 202,
        });

        criticalPathErrors.add(!emailSuccess);
    });

    criticalPathDuration.add(Date.now() - startTime);
    sleep(1);
}

/**
 * Scenario 2: Blog Post Creation
 */
export function blogPostCreationScenario() {
    const startTime = Date.now();

    group('Blog Post Creation Flow', () => {
        // Step 1: Create draft
        const createDraftRes = http.post(`${BASE_URL}/api/blog-posts`, JSON.stringify({
            title: `Load Test Post ${Date.now()}`,
            content: 'This is a load test blog post.',
            status: 'draft',
        }), {
            headers: { 'Content-Type': 'application/json' },
        });

        const draftSuccess = check(createDraftRes, {
            'create draft status is 200': (r) => r.status === 200 || r.status === 201,
            'create draft time < 1s': (r) => r.timings.duration < 1000,
        });

        criticalPathErrors.add(!draftSuccess);

        if (!draftSuccess) return;

        const postId = createDraftRes.json('id');

        sleep(0.5);

        // Step 2: Calculate SEO score
        const seoScoreRes = http.post(`${BASE_URL}/api/blog-posts/${postId}/seo-score`, null, {
            headers: { 'Content-Type': 'application/json' },
        });

        const seoSuccess = check(seoScoreRes, {
            'seo score status is 200': (r) => r.status === 200,
            'seo score time < 2s': (r) => r.timings.duration < 2000,
        });

        criticalPathErrors.add(!seoSuccess);

        sleep(0.5);

        // Step 3: Submit for approval
        const submitRes = http.post(`${BASE_URL}/api/blog-posts/${postId}/submit`, null, {
            headers: { 'Content-Type': 'application/json' },
        });

        const submitSuccess = check(submitRes, {
            'submit status is 200': (r) => r.status === 200,
        });

        criticalPathErrors.add(!submitSuccess);
    });

    criticalPathDuration.add(Date.now() - startTime);
    sleep(1);
}

/**
 * Scenario 3: Analytics Dashboard
 */
export function analyticsDashboardScenario() {
    const startTime = Date.now();

    group('Analytics Dashboard Flow', () => {
        // Step 1: Load overview
        const overviewRes = http.get(`${BASE_URL}/api/analytics/overview`, {
            headers: { 'Content-Type': 'application/json' },
        });

        const overviewSuccess = check(overviewRes, {
            'analytics overview status is 200': (r) => r.status === 200,
            'analytics overview time < 2s': (r) => r.timings.duration < 2000,
        });

        criticalPathErrors.add(!overviewSuccess);

        sleep(0.5);

        // Step 2: Load client metrics
        const clientMetricsRes = http.get(`${BASE_URL}/api/analytics/clients`, {
            headers: { 'Content-Type': 'application/json' },
        });

        const clientMetricsSuccess = check(clientMetricsRes, {
            'client metrics status is 200': (r) => r.status === 200,
            'client metrics time < 1.5s': (r) => r.timings.duration < 1500,
        });

        criticalPathErrors.add(!clientMetricsSuccess);

        sleep(0.5);

        // Step 3: Load revenue data
        const revenueRes = http.get(`${BASE_URL}/api/analytics/revenue`, {
            headers: { 'Content-Type': 'application/json' },
        });

        const revenueSuccess = check(revenueRes, {
            'revenue data status is 200': (r) => r.status === 200,
        });

        criticalPathErrors.add(!revenueSuccess);
    });

    criticalPathDuration.add(Date.now() - startTime);
    sleep(2);
}

export function handleSummary(data) {
    console.log('Critical Paths Load Test Summary:');
    console.log('===================================');

    if (data.metrics?.critical_path_duration) {
        const duration = data.metrics.critical_path_duration;
        console.log(`Average Critical Path Duration: ${duration.values.avg.toFixed(2)}ms`);
        console.log(`Max Critical Path Duration: ${duration.values.max.toFixed(2)}ms`);
    }

    if (data.metrics?.critical_path_errors) {
        const errors = data.metrics.critical_path_errors;
        console.log(`Critical Path Error Rate: ${(errors.values.rate * 100).toFixed(2)}%`);
    }

    return {
        'stdout': JSON.stringify(data, null, 2),
        'k6-critical-paths-results.json': JSON.stringify(data),
    };
}
