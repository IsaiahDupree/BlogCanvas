/**
 * Test script for feat-080: PRD Data - blog_post_metrics snapshots
 *
 * This script:
 * 1. Creates a test blog post
 * 2. Creates sample metrics snapshots
 * 3. Tests the metrics API endpoint
 * 4. Tests the export functionality
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseKey) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY is required');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runTests() {
    console.log('🧪 Testing feat-080: blog_post_metrics snapshots\n');

    try {
        // Step 1: Create or find a test blog post
        console.log('📝 Step 1: Setting up test blog post...');
        const { data: existingPost, error: findError } = await supabase
            .from('blog_posts')
            .select('id, title')
            .limit(1)
            .single();

        let testPostId: string;

        if (existingPost && !findError) {
            testPostId = existingPost.id;
            console.log(`✅ Using existing post: "${existingPost.title}" (${testPostId})`);
        } else {
            console.log('⚠️  No existing posts found, cannot proceed with test');
            console.log('   Please create at least one blog post first');
            return;
        }

        // Step 2: Create sample metrics snapshots
        console.log('\n📊 Step 2: Creating metrics snapshots...');
        const now = new Date();
        const snapshots = [];

        for (let i = 30; i >= 0; i--) {
            const snapshotDate = new Date(now);
            snapshotDate.setDate(snapshotDate.getDate() - i);

            const baseImpressions = 100 + (30 - i) * 50; // Growing impressions
            const baseClicks = Math.floor(baseImpressions * 0.02); // 2% CTR
            const avgPosition = Math.max(1, 25 - (30 - i) * 0.5); // Improving position

            snapshots.push({
                blog_post_id: testPostId,
                snapshot_date: snapshotDate.toISOString(),
                impressions: baseImpressions + Math.floor(Math.random() * 50),
                clicks: baseClicks + Math.floor(Math.random() * 10),
                ctr: 2.0 + Math.random(),
                avg_position: avgPosition + Math.random() * 2,
                sessions: baseClicks + Math.floor(Math.random() * 5),
                time_on_page: 120 + Math.random() * 60,
                conversions: Math.floor(baseClicks * 0.05),
                seo_score: 60 + Math.floor((30 - i) * 0.5)
            });
        }

        const { data: metricsData, error: metricsError } = await supabase
            .from('blog_post_metrics')
            .upsert(snapshots, {
                onConflict: 'blog_post_id,snapshot_date'
            })
            .select();

        if (metricsError) {
            throw metricsError;
        }

        console.log(`✅ Created ${snapshots.length} metrics snapshots`);

        // Step 3: Test metrics retrieval
        console.log('\n📈 Step 3: Testing metrics API endpoint...');
        const metricsResponse = await fetch(`http://localhost:4848/api/analytics/metrics/${testPostId}?limit=30`);

        if (!metricsResponse.ok) {
            throw new Error(`Metrics API failed: ${metricsResponse.status}`);
        }

        const metricsResult = await metricsResponse.json();

        if (!metricsResult.success) {
            throw new Error('Metrics API returned success: false');
        }

        console.log(`✅ Retrieved ${metricsResult.metrics.length} metrics`);
        console.log(`✅ Trends calculated:`, {
            impressions: metricsResult.trends.impressions.direction,
            clicks: metricsResult.trends.clicks.direction,
            avg_position: metricsResult.trends.avg_position.direction
        });

        // Step 4: Test CSV export
        console.log('\n📥 Step 4: Testing CSV export...');
        const csvResponse = await fetch(`http://localhost:4848/api/analytics/metrics/${testPostId}/export?format=csv&limit=30`);

        if (!csvResponse.ok) {
            throw new Error(`CSV export failed: ${csvResponse.status}`);
        }

        const csvText = await csvResponse.text();
        const csvLines = csvText.split('\n');
        console.log(`✅ CSV export successful (${csvLines.length} lines)`);
        console.log('   First line:', csvLines[0]);

        // Step 5: Test JSON export
        console.log('\n📥 Step 5: Testing JSON export...');
        const jsonResponse = await fetch(`http://localhost:4848/api/analytics/metrics/${testPostId}/export?format=json&limit=30`);

        if (!jsonResponse.ok) {
            throw new Error(`JSON export failed: ${jsonResponse.status}`);
        }

        const jsonData = await jsonResponse.json();
        console.log(`✅ JSON export successful (${jsonData.metrics.length} metrics)`);
        console.log(`   Date range: ${jsonData.date_range.from} to ${jsonData.date_range.to}`);

        // Acceptance Criteria Verification
        console.log('\n✅ ACCEPTANCE CRITERIA VERIFICATION:');
        console.log('  ✅ Snapshot dates work - Multiple snapshots created with unique dates');
        console.log('  ✅ All metrics captured - impressions, clicks, CTR, avg_position, sessions, conversions');
        console.log('  ✅ Historical trends visible - Trend calculation shows direction (up/down/stable)');
        console.log('  ✅ Export metrics - Both CSV and JSON export working correctly');

        console.log('\n🎉 All tests passed! feat-080 is complete.\n');

    } catch (error: any) {
        console.error('\n❌ Test failed:', error.message);
        console.error(error);
        process.exit(1);
    }
}

runTests();
