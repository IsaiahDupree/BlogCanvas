/**
 * Blog Pipeline & Status Flow Integration Tests
 * Tests full blog creation pipeline and status display consistency
 * Based on BLOG_PIPELINE_STATUS_FLOW.md
 */

import { supabaseAdmin } from '@/lib/supabase';

const TEST_OWNER_ID = '00000000-0000-0000-0000-000000000001';

describe('Blog Pipeline: URL → Topics → Blog Creation', () => {
    let clientId: string;
    let pipelineJobId: string;
    let blogPostId: string;

    afterAll(async () => {
        if (blogPostId) await supabaseAdmin.from('blog_posts').delete().eq('id', blogPostId);
        if (pipelineJobId) await supabaseAdmin.from('pipeline_jobs').delete().eq('id', pipelineJobId);
        if (clientId) await supabaseAdmin.from('clients').delete().eq('id', clientId);
    });

    it('should create pipeline job from URL input', async () => {
        // Setup client
        const { data: client } = await supabaseAdmin
            .from('clients')
            .insert({
                name: 'Pipeline Test Client',
                owner_id: TEST_OWNER_ID,
                website_url: 'https://pipeline-test.com'
            })
            .select()
            .single();
        clientId = client.id;

        // Get vendor for job
        const { data: vendors } = await supabaseAdmin.from('vendors').select('id').limit(1);
        
        if (vendors && vendors.length > 0) {
            // Create pipeline job
            const { data: job, error: jobError } = await supabaseAdmin
                .from('pipeline_jobs')
                .insert({
                    vendor_id: vendors[0].id,
                    client_id: clientId,
                    website_url: 'https://pipeline-test.com',
                    target_market: 'B2B SaaS',
                    client_goals: 'Increase organic traffic',
                    ideal_customer_profile: 'Marketing managers',
                    status: 'pending',
                    progress: 0
                })
                .select()
                .single();

            expect(jobError).toBeNull();
            pipelineJobId = job.id;
            expect(job.status).toBe('pending');
            expect(job.website_url).toBe('https://pipeline-test.com');

            console.log('✅ Pipeline job created from URL');
        } else {
            console.log('⚠️ Skipped - no vendors available');
        }
    });

    it('should track pipeline job progress through stages', async () => {
        if (!pipelineJobId) {
            console.log('⚠️ Skipped - no pipeline job');
            return;
        }

        // Stage 1: Running - Crawl
        await supabaseAdmin
            .from('pipeline_jobs')
            .update({
                status: 'running',
                current_step: 'crawl',
                progress: 10,
                started_at: new Date().toISOString()
            })
            .eq('id', pipelineJobId);

        let { data: job } = await supabaseAdmin
            .from('pipeline_jobs')
            .select('*')
            .eq('id', pipelineJobId)
            .single();

        expect(job?.status).toBe('running');
        expect(job?.current_step).toBe('crawl');
        expect(job?.progress).toBe(10);

        // Stage 2: Analyze
        await supabaseAdmin
            .from('pipeline_jobs')
            .update({
                current_step: 'analyze',
                progress: 35,
                crawl_result: { pages: 25, success: true }
            })
            .eq('id', pipelineJobId);

        // Stage 3: Gaps
        await supabaseAdmin
            .from('pipeline_jobs')
            .update({
                current_step: 'gaps',
                progress: 60,
                seo_score: 62,
                pages_indexed: 25
            })
            .eq('id', pipelineJobId);

        // Stage 4: Topics
        await supabaseAdmin
            .from('pipeline_jobs')
            .update({
                current_step: 'topics',
                progress: 85
            })
            .eq('id', pipelineJobId);

        // Complete
        await supabaseAdmin
            .from('pipeline_jobs')
            .update({
                status: 'completed',
                progress: 100,
                topics_generated: 5,
                content_gaps: 3,
                completed_at: new Date().toISOString()
            })
            .eq('id', pipelineJobId);

        const { data: finalJob } = await supabaseAdmin
            .from('pipeline_jobs')
            .select('*')
            .eq('id', pipelineJobId)
            .single();

        expect(finalJob?.status).toBe('completed');
        expect(finalJob?.progress).toBe(100);
        expect(finalJob?.topics_generated).toBe(5);

        console.log('✅ Pipeline job progress tracked through all stages');
    });

    it('should create blog post from pipeline topic', async () => {
        if (!clientId) {
            console.log('⚠️ Skipped - no client');
            return;
        }

        // Create blog post from "generated" topic
        const { data: post, error: postError } = await supabaseAdmin
            .from('blog_posts')
            .insert({
                client_id: clientId,
                topic: 'How B2B SaaS Companies Increase Organic Traffic',
                target_keyword: 'B2B SaaS organic traffic',
                word_count_goal: 1500,
                status: 'draft', // AI generation complete
                seo_quality_score: 78
            })
            .select()
            .single();

        expect(postError).toBeNull();
        blogPostId = post.id;
        expect(post.status).toBe('draft');

        // Update pipeline job with blog created
        if (pipelineJobId) {
            await supabaseAdmin
                .from('pipeline_jobs')
                .update({ blogs_created: 1 })
                .eq('id', pipelineJobId);
        }

        console.log('✅ Blog post created from pipeline topic');
    });
});

describe('Blog Status: Display Consistency Across Pages', () => {
    let clientId: string;
    let batchId: string;
    let postId: string;

    afterAll(async () => {
        if (postId) await supabaseAdmin.from('blog_posts').delete().eq('id', postId);
        if (batchId) await supabaseAdmin.from('content_batches').delete().eq('id', batchId);
        if (clientId) await supabaseAdmin.from('clients').delete().eq('id', clientId);
    });

    it('should show consistent status across vendor and client pages', async () => {
        // Setup
        const { data: client } = await supabaseAdmin
            .from('clients')
            .insert({ name: 'Status Consistency Test', owner_id: TEST_OWNER_ID })
            .select()
            .single();
        clientId = client.id;

        const { data: batch } = await supabaseAdmin
            .from('content_batches')
            .insert({ name: 'Status Test Batch', client_id: clientId, status: 'in_progress' })
            .select()
            .single();
        batchId = batch.id;

        // Create post with initial draft status
        const { data: post } = await supabaseAdmin
            .from('blog_posts')
            .insert({
                client_id: clientId,
                content_batch_id: batchId,
                topic: 'Status Consistency Test Post',
                status: 'draft',
                approval_status: 'draft'
            })
            .select()
            .single();
        postId = post.id;

        // Query as review board would (all posts)
        const { data: reviewBoardPosts } = await supabaseAdmin
            .from('blog_posts')
            .select('id, status')
            .eq('id', postId);

        expect(reviewBoardPosts?.[0]?.status).toBe('draft');

        // Query as batch page would (by batch)
        const { data: batchPosts } = await supabaseAdmin
            .from('blog_posts')
            .select('id, status')
            .eq('content_batch_id', batchId);

        expect(batchPosts?.[0]?.status).toBe('draft');

        // Query as client page would (by client)
        const { data: clientPosts } = await supabaseAdmin
            .from('blog_posts')
            .select('id, status')
            .eq('client_id', clientId);

        expect(clientPosts?.[0]?.status).toBe('draft');

        // All three queries return same status
        expect(reviewBoardPosts?.[0]?.status).toBe(batchPosts?.[0]?.status);
        expect(batchPosts?.[0]?.status).toBe(clientPosts?.[0]?.status);

        console.log('✅ Status consistent across all query patterns');
    });

    it('should update status consistently when changed', async () => {
        if (!postId) {
            console.log('⚠️ Skipped - no post');
            return;
        }

        // Update status to ready_for_review
        await supabaseAdmin
            .from('blog_posts')
            .update({ status: 'ready_for_review' })
            .eq('id', postId);

        // Verify all query patterns see the update
        const { data: reviewBoardPosts } = await supabaseAdmin
            .from('blog_posts')
            .select('id, status')
            .eq('id', postId);

        const { data: batchPosts } = await supabaseAdmin
            .from('blog_posts')
            .select('id, status')
            .eq('content_batch_id', batchId);

        const { data: clientPosts } = await supabaseAdmin
            .from('blog_posts')
            .select('id, status')
            .eq('client_id', clientId);

        expect(reviewBoardPosts?.[0]?.status).toBe('ready_for_review');
        expect(batchPosts?.[0]?.status).toBe('ready_for_review');
        expect(clientPosts?.[0]?.status).toBe('ready_for_review');

        console.log('✅ Status update propagates to all views');
    });
});

describe('Blog Status: Kanban Column Mapping', () => {
    let clientId: string;
    let postIds: string[] = [];

    // Kanban column definitions from review board
    const KANBAN_COLUMNS = [
        { id: 'draft', statuses: ['draft', 'generating', 'idea', 'researching', 'outlining', 'drafting'] },
        { id: 'editing', statuses: ['editing', 'needs_human_input'] },
        { id: 'review', statuses: ['ready_for_review', 'in_review'] },
        { id: 'client', statuses: ['client_review', 'pending_review'] },
        { id: 'approved', statuses: ['approved'] },
        { id: 'published', statuses: ['published', 'scheduled'] }
    ];

    afterAll(async () => {
        for (const id of postIds) {
            await supabaseAdmin.from('blog_posts').delete().eq('id', id);
        }
        if (clientId) await supabaseAdmin.from('clients').delete().eq('id', clientId);
    });

    it('should correctly map posts to kanban columns', async () => {
        // Setup
        const { data: client } = await supabaseAdmin
            .from('clients')
            .insert({ name: 'Kanban Test Client', owner_id: TEST_OWNER_ID })
            .select()
            .single();
        clientId = client.id;

        // Create posts in different statuses
        const testStatuses = ['draft', 'editing', 'ready_for_review', 'approved', 'published'];
        
        for (const status of testStatuses) {
            const { data: post } = await supabaseAdmin
                .from('blog_posts')
                .insert({
                    client_id: clientId,
                    topic: `Kanban Test - ${status}`,
                    status
                })
                .select()
                .single();
            postIds.push(post.id);
        }

        // Fetch all posts
        const { data: posts } = await supabaseAdmin
            .from('blog_posts')
            .select('id, status')
            .eq('client_id', clientId);

        // Map to columns (as review board does)
        const columnCounts: Record<string, number> = {};
        
        for (const post of posts || []) {
            for (const column of KANBAN_COLUMNS) {
                if (column.statuses.includes(post.status)) {
                    columnCounts[column.id] = (columnCounts[column.id] || 0) + 1;
                    break;
                }
            }
        }

        // Verify mapping
        expect(columnCounts['draft']).toBe(1);      // 'draft' status
        expect(columnCounts['editing']).toBe(1);    // 'editing' status
        expect(columnCounts['review']).toBe(1);     // 'ready_for_review' status
        expect(columnCounts['approved']).toBe(1);   // 'approved' status
        expect(columnCounts['published']).toBe(1);  // 'published' status

        console.log('✅ Posts correctly mapped to kanban columns');
    });
});

describe('Blog Status: Approval Status Sync', () => {
    let clientId: string;
    let postId: string;
    let profileId: string;

    beforeAll(async () => {
        const { data: profiles } = await supabaseAdmin.from('profiles').select('id').limit(1);
        if (profiles && profiles.length > 0) profileId = profiles[0].id;
    });

    afterAll(async () => {
        if (postId) await supabaseAdmin.from('blog_posts').delete().eq('id', postId);
        if (clientId) await supabaseAdmin.from('clients').delete().eq('id', clientId);
    });

    it('should sync status and approval_status fields', async () => {
        // Setup
        const { data: client } = await supabaseAdmin
            .from('clients')
            .insert({ name: 'Approval Sync Test', owner_id: TEST_OWNER_ID })
            .select()
            .single();
        clientId = client.id;

        const { data: post } = await supabaseAdmin
            .from('blog_posts')
            .insert({
                client_id: clientId,
                topic: 'Approval Sync Test Post',
                status: 'draft',
                approval_status: 'draft'
            })
            .select()
            .single();
        postId = post.id;

        // Showcase for client (vendor action)
        await supabaseAdmin
            .from('blog_posts')
            .update({
                status: 'ready_for_review',
                approval_status: 'pending_review',
                showcased_at: new Date().toISOString(),
                showcased_by: profileId
            })
            .eq('id', postId);

        // Verify both fields updated
        const { data: showcasedPost } = await supabaseAdmin
            .from('blog_posts')
            .select('status, approval_status')
            .eq('id', postId)
            .single();

        expect(showcasedPost?.status).toBe('ready_for_review');
        expect(showcasedPost?.approval_status).toBe('pending_review');

        // Client approves
        await supabaseAdmin
            .from('blog_posts')
            .update({
                status: 'approved',
                approval_status: 'approved',
                approved_at: new Date().toISOString(),
                approved_by: profileId
            })
            .eq('id', postId);

        const { data: approvedPost } = await supabaseAdmin
            .from('blog_posts')
            .select('status, approval_status')
            .eq('id', postId)
            .single();

        expect(approvedPost?.status).toBe('approved');
        expect(approvedPost?.approval_status).toBe('approved');

        console.log('✅ status and approval_status fields stay in sync');
    });
});

describe('Blog Status: WordPress URL Tracking', () => {
    let clientId: string;
    let postId: string;

    afterAll(async () => {
        if (postId) await supabaseAdmin.from('blog_posts').delete().eq('id', postId);
        if (clientId) await supabaseAdmin.from('clients').delete().eq('id', clientId);
    });

    it('should track WordPress URL after publishing', async () => {
        // Setup
        const { data: client } = await supabaseAdmin
            .from('clients')
            .insert({ name: 'WordPress URL Test', owner_id: TEST_OWNER_ID })
            .select()
            .single();
        clientId = client.id;

        const { data: post } = await supabaseAdmin
            .from('blog_posts')
            .insert({
                client_id: clientId,
                topic: 'WordPress URL Test Post',
                status: 'approved',
                approval_status: 'approved'
            })
            .select()
            .single();
        postId = post.id;

        // Simulate WordPress publish
        const wordpressUrl = 'https://example.com/blog/wordpress-url-test-post';
        await supabaseAdmin
            .from('blog_posts')
            .update({
                status: 'published',
                approval_status: 'published',
                wordpress_post_id: 12345,
                wordpress_url: wordpressUrl,
                published_to_wordpress_at: new Date().toISOString()
            })
            .eq('id', postId);

        // Verify URL is queryable from all contexts
        // Vendor view
        const { data: vendorView } = await supabaseAdmin
            .from('blog_posts')
            .select('status, wordpress_url')
            .eq('id', postId)
            .single();

        expect(vendorView?.status).toBe('published');
        expect(vendorView?.wordpress_url).toBe(wordpressUrl);

        // Client view (filtered by client_id)
        const { data: clientView } = await supabaseAdmin
            .from('blog_posts')
            .select('status, wordpress_url')
            .eq('id', postId)
            .eq('client_id', clientId)
            .single();

        expect(clientView?.wordpress_url).toBe(wordpressUrl);

        console.log('✅ WordPress URL tracked and accessible from all views');
    });
});

describe('Blog Status: Batch Progress Calculation', () => {
    let clientId: string;
    let batchId: string;
    let postIds: string[] = [];

    afterAll(async () => {
        for (const id of postIds) {
            await supabaseAdmin.from('blog_posts').delete().eq('id', id);
        }
        if (batchId) await supabaseAdmin.from('content_batches').delete().eq('id', batchId);
        if (clientId) await supabaseAdmin.from('clients').delete().eq('id', clientId);
    });

    it('should calculate batch progress from post statuses', async () => {
        // Setup
        const { data: client } = await supabaseAdmin
            .from('clients')
            .insert({ name: 'Batch Progress Test', owner_id: TEST_OWNER_ID })
            .select()
            .single();
        clientId = client.id;

        const { data: batch } = await supabaseAdmin
            .from('content_batches')
            .insert({ name: 'Progress Test Batch', client_id: clientId, status: 'in_progress' })
            .select()
            .single();
        batchId = batch.id;

        // Create 10 posts with varying statuses
        const statuses = [
            'draft', 'draft', 'draft',           // 3 in draft
            'ready_for_review', 'ready_for_review', // 2 in review
            'approved', 'approved',               // 2 approved
            'published', 'published', 'published' // 3 published
        ];

        for (const status of statuses) {
            const { data: post } = await supabaseAdmin
                .from('blog_posts')
                .insert({
                    client_id: clientId,
                    content_batch_id: batchId,
                    topic: `Progress Test - ${status}`,
                    status
                })
                .select()
                .single();
            postIds.push(post.id);
        }

        // Calculate progress (as batch page would)
        const { data: posts } = await supabaseAdmin
            .from('blog_posts')
            .select('status')
            .eq('content_batch_id', batchId);

        const total = posts?.length || 0;
        const completed = posts?.filter(p => 
            ['approved', 'published'].includes(p.status)
        ).length || 0;
        const progress = Math.round((completed / total) * 100);

        expect(total).toBe(10);
        expect(completed).toBe(5); // 2 approved + 3 published
        expect(progress).toBe(50);

        // Calculate status breakdown
        const statusCounts = posts?.reduce((acc, p) => {
            acc[p.status] = (acc[p.status] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        expect(statusCounts?.['draft']).toBe(3);
        expect(statusCounts?.['ready_for_review']).toBe(2);
        expect(statusCounts?.['approved']).toBe(2);
        expect(statusCounts?.['published']).toBe(3);

        console.log('✅ Batch progress calculated: 50% (5/10 complete)');
    });
});
