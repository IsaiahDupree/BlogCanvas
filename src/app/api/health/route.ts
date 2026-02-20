/**
 * Health Check Endpoint
 * VENDOR-WC-114: Uptime monitoring with external checks
 *
 * Returns system health status for uptime monitoring services
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

interface HealthCheck {
    status: 'healthy' | 'degraded' | 'unhealthy';
    timestamp: string;
    uptime: number;
    checks: {
        database: CheckResult;
        storage: CheckResult;
        config: CheckResult;
    };
}

interface CheckResult {
    status: 'pass' | 'warn' | 'fail';
    responseTime?: number;
    message?: string;
}

const startTime = Date.now();

async function checkDatabase(): Promise<CheckResult> {
    const start = Date.now();
    try {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const { error } = await supabase
            .from('vendors')
            .select('count')
            .limit(1);

        const responseTime = Date.now() - start;

        if (error) {
            return { status: 'fail', responseTime, message: 'Database query failed' };
        }

        return responseTime > 1000
            ? { status: 'warn', responseTime, message: 'Database response slow' }
            : { status: 'pass', responseTime };
    } catch (error) {
        return { status: 'fail', responseTime: Date.now() - start, message: 'Database connection failed' };
    }
}

async function checkStorage(): Promise<CheckResult> {
    const start = Date.now();
    try {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const { error } = await supabase.storage.listBuckets();
        const responseTime = Date.now() - start;

        return error
            ? { status: 'fail', responseTime, message: 'Storage access failed' }
            : { status: 'pass', responseTime };
    } catch (error) {
        return { status: 'fail', responseTime: Date.now() - start, message: 'Storage check failed' };
    }
}

function checkConfig(): CheckResult {
    const required = ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'STRIPE_SECRET_KEY', 'OPENAI_API_KEY'];
    const missing = required.filter(key => !process.env[key]);

    return missing.length > 0
        ? { status: 'fail', message: `Missing: ${missing.join(', ')}` }
        : { status: 'pass' };
}

export async function GET() {
    const [database, storage] = await Promise.all([checkDatabase(), checkStorage()]);
    const config = checkConfig();

    const checks = [database, storage, config];
    const hasFailure = checks.some(c => c.status === 'fail');
    const hasWarning = checks.some(c => c.status === 'warn');

    const status = hasFailure ? 'unhealthy' : hasWarning ? 'degraded' : 'healthy';

    const health: HealthCheck = {
        status,
        timestamp: new Date().toISOString(),
        uptime: Math.floor((Date.now() - startTime) / 1000),
        checks: { database, storage, config },
    };

    return NextResponse.json(health, {
        status: status === 'healthy' ? 200 : 503,
        headers: { 'Cache-Control': 'no-store, max-age=0' },
    });
}
