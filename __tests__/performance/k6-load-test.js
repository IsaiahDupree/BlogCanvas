/**
 * BlogCanvas Load Testing with k6
 *
 * Tests 50+ concurrent users across critical paths
 *
 * Usage:
 *   k6 run __tests__/performance/k6-load-test.js
 *   k6 run --vus 100 --duration 5m __tests__/performance/k6-load-test.js
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const responseTimeTrend = new Trend('response_time');
const requestCounter = new Counter('requests');

// Test configuration
export const options = {
    stages: [
        { duration: '30s', target: 10 },  // Ramp up to 10 users
        { duration: '1m', target: 50 },   // Ramp up to 50 users
        { duration: '2m', target: 50 },   // Stay at 50 users
        { duration: '1m', target: 100 },  // Spike to 100 users
        { duration: '30s', target: 0 },   // Ramp down
    ],
    thresholds: {
        http_req_duration: ['p(95)<2000'], // 95% of requests < 2s (2x normal)
        http_req_failed: ['rate<0.01'],     // < 1% errors
        errors: ['rate<0.01'],
    },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:4848';

// Test data
const testVendor = {
    email: `test-vendor-${Date.now()}@example.com`,
    password: 'TestPassword123!',
};

const testClient = {
    email: `test-client-${Date.now()}@example.com`,
    name: 'Test Client',
};

/**
 * Setup function - runs once before tests
 */
export function setup() {
    console.log('Starting load test setup...');

    // Create a test vendor account
    const signupRes = http.post(`${BASE_URL}/api/auth/signup`, JSON.stringify({
        email: testVendor.email,
        password: testVendor.password,
        role: 'vendor',
    }), {
        headers: { 'Content-Type': 'application/json' },
    });

    if (signupRes.status !== 200 && signupRes.status !== 201) {
        console.log('Using existing test account...');
    }

    return {
        vendorEmail: testVendor.email,
        vendorPassword: testVendor.password,
    };
}

/**
 * Main test scenario
 */
export default function(data) {
    let authToken = null;

    // Group 1: Authentication
    group('Authentication Flow', () => {
        const loginRes = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify({
            email: data.vendorEmail,
            password: data.vendorPassword,
        }), {
            headers: { 'Content-Type': 'application/json' },
        });

        const loginSuccess = check(loginRes, {
            'login status is 200': (r) => r.status === 200,
            'login response time < 500ms': (r) => r.timings.duration < 500,
        });

        errorRate.add(!loginSuccess);
        responseTimeTrend.add(loginRes.timings.duration);
        requestCounter.add(1);

        if (loginSuccess && loginRes.json('token')) {
            authToken = loginRes.json('token');
        }

        sleep(1);
    });

    if (!authToken) {
        console.log('Login failed, skipping authenticated tests');
        return;
    }

    const headers = {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
    };

    // Group 2: Dashboard
    group('Dashboard Load', () => {
        const dashboardRes = http.get(`${BASE_URL}/api/dashboard`, {
            headers,
        });

        const dashboardSuccess = check(dashboardRes, {
            'dashboard status is 200': (r) => r.status === 200,
            'dashboard response time < 1000ms': (r) => r.timings.duration < 1000,
            'dashboard has data': (r) => r.body.length > 0,
        });

        errorRate.add(!dashboardSuccess);
        responseTimeTrend.add(dashboardRes.timings.duration);
        requestCounter.add(1);

        sleep(2);
    });

    // Group 3: Clients List
    group('Clients List', () => {
        const clientsRes = http.get(`${BASE_URL}/api/clients`, {
            headers,
        });

        const clientsSuccess = check(clientsRes, {
            'clients status is 200': (r) => r.status === 200,
            'clients response time < 800ms': (r) => r.timings.duration < 800,
        });

        errorRate.add(!clientsSuccess);
        responseTimeTrend.add(clientsRes.timings.duration);
        requestCounter.add(1);

        sleep(1);
    });

    // Group 4: Blog Posts
    group('Blog Posts', () => {
        const postsRes = http.get(`${BASE_URL}/api/blog-posts`, {
            headers,
        });

        const postsSuccess = check(postsRes, {
            'posts status is 200': (r) => r.status === 200,
            'posts response time < 1000ms': (r) => r.timings.duration < 1000,
        });

        errorRate.add(!postsSuccess);
        responseTimeTrend.add(postsRes.timings.duration);
        requestCounter.add(1);

        sleep(2);
    });

    // Group 5: Websites
    group('Websites', () => {
        const websitesRes = http.get(`${BASE_URL}/api/websites`, {
            headers,
        });

        const websitesSuccess = check(websitesRes, {
            'websites status is 200': (r) => r.status === 200,
            'websites response time < 800ms': (r) => r.timings.duration < 800,
        });

        errorRate.add(!websitesSuccess);
        responseTimeTrend.add(websitesRes.timings.duration);
        requestCounter.add(1);

        sleep(1);
    });

    // Group 6: Analytics
    group('Analytics', () => {
        const analyticsRes = http.get(`${BASE_URL}/api/analytics/overview`, {
            headers,
        });

        const analyticsSuccess = check(analyticsRes, {
            'analytics status is 200': (r) => r.status === 200,
            'analytics response time < 1500ms': (r) => r.timings.duration < 1500,
        });

        errorRate.add(!analyticsSuccess);
        responseTimeTrend.add(analyticsRes.timings.duration);
        requestCounter.add(1);

        sleep(2);
    });

    // Group 7: AI Pipeline Status
    group('AI Pipeline', () => {
        const pipelineRes = http.get(`${BASE_URL}/api/pipeline/status`, {
            headers,
        });

        const pipelineSuccess = check(pipelineRes, {
            'pipeline status is 200': (r) => r.status === 200,
            'pipeline response time < 500ms': (r) => r.timings.duration < 500,
        });

        errorRate.add(!pipelineSuccess);
        responseTimeTrend.add(pipelineRes.timings.duration);
        requestCounter.add(1);

        sleep(1);
    });

    // Random think time
    sleep(Math.random() * 3);
}

/**
 * Teardown function - runs once after tests
 */
export function teardown(data) {
    console.log('Load test completed');
}

/**
 * Handle summary to output custom report
 */
export function handleSummary(data) {
    return {
        'stdout': textSummary(data, { indent: ' ', enableColors: true }),
        'load-test-results.json': JSON.stringify(data),
    };
}

function textSummary(data, options) {
    const indent = options?.indent || '';
    const enableColors = options?.enableColors || false;

    let summary = `\n${indent}Load Test Summary\n`;
    summary += `${indent}=================\n\n`;

    if (data.metrics) {
        summary += `${indent}HTTP Metrics:\n`;

        if (data.metrics.http_req_duration) {
            const duration = data.metrics.http_req_duration;
            summary += `${indent}  Response Time:\n`;
            summary += `${indent}    avg: ${duration.values.avg.toFixed(2)}ms\n`;
            summary += `${indent}    min: ${duration.values.min.toFixed(2)}ms\n`;
            summary += `${indent}    max: ${duration.values.max.toFixed(2)}ms\n`;
            summary += `${indent}    p(95): ${duration.values['p(95)'].toFixed(2)}ms\n`;
            summary += `${indent}    p(99): ${duration.values['p(99)'].toFixed(2)}ms\n`;
        }

        if (data.metrics.http_req_failed) {
            const failed = data.metrics.http_req_failed;
            summary += `${indent}  Error Rate: ${(failed.values.rate * 100).toFixed(2)}%\n`;
        }

        if (data.metrics.http_reqs) {
            const reqs = data.metrics.http_reqs;
            summary += `${indent}  Total Requests: ${reqs.values.count}\n`;
            summary += `${indent}  Requests/sec: ${reqs.values.rate.toFixed(2)}\n`;
        }
    }

    summary += `\n${indent}VU Metrics:\n`;
    summary += `${indent}  Max VUs: ${data.root_group?.groups ? Object.keys(data.root_group.groups).length : 'N/A'}\n`;
    summary += `${indent}  Total Iterations: ${data.metrics?.iterations?.values?.count || 'N/A'}\n`;

    return summary;
}
