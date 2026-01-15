import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { CacheInvalidation } from '@/lib/cache';

interface TopicCluster {
  id: string;
  name: string;
  primary_keyword: string;
  difficulty: number;
  estimated_traffic: number;
  priority: 'high' | 'medium' | 'low';
}

// POST /api/pipeline-jobs/create-batch - Create content batch from pipeline topics
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pipelineJobId, batchName, topics } = body;

    if (!pipelineJobId || !batchName || !topics || !Array.isArray(topics)) {
      return NextResponse.json(
        { success: false, error: 'Pipeline job ID, batch name, and topics array are required' },
        { status: 400 }
      );
    }

    if (topics.length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one topic must be provided' },
        { status: 400 }
      );
    }

    // Get the pipeline job to extract metadata
    const { data: job, error: jobError } = await supabaseAdmin
      .from('pipeline_jobs')
      .select('website_url, client_id, clients(id, name)')
      .eq('id', pipelineJobId)
      .single();

    if (jobError || !job) {
      return NextResponse.json(
        { success: false, error: 'Pipeline job not found' },
        { status: 404 }
      );
    }

    // Find or create a website record for this URL
    let websiteId = null;
    const { data: existingWebsite } = await supabaseAdmin
      .from('websites')
      .select('id')
      .eq('url', job.website_url)
      .single();

    if (existingWebsite) {
      websiteId = existingWebsite.id;
    } else {
      // Create a new website record
      const { data: newWebsite, error: websiteError } = await supabaseAdmin
        .from('websites')
        .insert({
          client_id: job.client_id || null,
          url: job.website_url,
          domain: new URL(job.website_url).hostname,
          status: 'active'
        })
        .select('id')
        .single();

      if (websiteError || !newWebsite) {
        console.error('Error creating website:', websiteError);
        return NextResponse.json(
          { success: false, error: 'Failed to create website record' },
          { status: 500 }
        );
      }

      websiteId = newWebsite.id;
    }

    // Create the content batch
    const { data: batch, error: batchError } = await supabaseAdmin
      .from('content_batches')
      .insert({
        website_id: websiteId,
        client_id: job.client_id || null,
        name: batchName.trim(),
        status: 'planned',
        total_posts: topics.length,
        posts_approved: 0,
        posts_completed: 0,
        posts_published: 0
      })
      .select('id')
      .single();

    if (batchError || !batch) {
      console.error('Error creating batch:', batchError);
      return NextResponse.json(
        { success: false, error: 'Failed to create content batch' },
        { status: 500 }
      );
    }

    // Create blog posts for each topic
    const blogPosts = topics.map((topic: TopicCluster) => ({
      content_batch_id: batch.id,
      client_id: job.client_id || null,
      topic: topic.name,
      target_keyword: topic.primary_keyword,
      status: 'idea',
      seo_quality_score: null,
      // Store topic metadata in research_context for future reference
      research_context: {
        pipeline_job_id: pipelineJobId,
        topic_cluster_id: topic.id,
        difficulty: topic.difficulty,
        estimated_traffic: topic.estimated_traffic,
        priority: topic.priority
      }
    }));

    const { data: createdPosts, error: postsError } = await supabaseAdmin
      .from('blog_posts')
      .insert(blogPosts)
      .select('id');

    if (postsError) {
      console.error('Error creating blog posts:', postsError);
      // Rollback: delete the batch
      await supabaseAdmin
        .from('content_batches')
        .delete()
        .eq('id', batch.id);

      return NextResponse.json(
        { success: false, error: 'Failed to create blog posts' },
        { status: 500 }
      );
    }

    // Update the batch status to in_progress since it has posts
    await supabaseAdmin
      .from('content_batches')
      .update({ status: 'in_progress' })
      .eq('id', batch.id);

    // Invalidate relevant caches
    CacheInvalidation.contentBatch();

    return NextResponse.json({
      success: true,
      batchId: batch.id,
      postsCreated: createdPosts?.length || 0,
      message: `Successfully created batch "${batchName}" with ${createdPosts?.length} posts`
    });

  } catch (error) {
    console.error('Error in create-batch endpoint:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
