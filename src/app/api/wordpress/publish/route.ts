import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { WordPressClient, generateSlug, prepareContentForWordPress } from '@/lib/wordpress/client';
import crypto from 'crypto';

// Simple decryption for stored passwords
function decryptPassword(encrypted: string): string {
  return Buffer.from(encrypted, 'base64').toString('utf-8');
}

// Generate content hash for change detection
function generateContentHash(content: string): string {
  return crypto.createHash('md5').update(content).digest('hex');
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      blogPostId, 
      connectionId,
      status = 'publish', // publish, draft, or future (scheduled)
      scheduledDate,
      categories = [],
      tags = []
    } = body;

    if (!blogPostId) {
      return NextResponse.json({ error: 'blogPostId is required' }, { status: 400 });
    }

    // Get the blog post
    const { data: post, error: postError } = await supabase
      .from('blog_posts')
      .select(`
        *,
        client:clients(id, name)
      `)
      .eq('id', blogPostId)
      .single();

    if (postError || !post) {
      return NextResponse.json({ error: 'Blog post not found' }, { status: 404 });
    }

    // Check if post is approved
    if (post.status !== 'approved' && post.status !== 'published') {
      return NextResponse.json({ 
        error: 'Post must be approved before publishing to WordPress' 
      }, { status: 400 });
    }

    // Get WordPress connection
    let connection;
    if (connectionId) {
      const { data } = await supabase
        .from('wordpress_connections')
        .select('*')
        .eq('id', connectionId)
        .single();
      connection = data;
    } else if (post.client_id) {
      // Try to find connection for this client
      const { data } = await supabase
        .from('wordpress_connections')
        .select('*')
        .eq('client_id', post.client_id)
        .eq('is_active', true)
        .single();
      connection = data;
    }

    if (!connection) {
      return NextResponse.json({ 
        error: 'No WordPress connection found. Please configure WordPress integration first.' 
      }, { status: 400 });
    }

    // Initialize WordPress client
    const wpClient = new WordPressClient({
      siteUrl: connection.site_url,
      username: connection.username,
      applicationPassword: decryptPassword(connection.application_password_encrypted)
    });

    // Prepare the post content
    const title = post.title || post.topic;
    const content = prepareContentForWordPress(post.content || '');
    const slug = generateSlug(title);
    const contentHash = generateContentHash(content);

    // Check if already published (update instead)
    const { data: existingPublish } = await supabase
      .from('wordpress_publish_log')
      .select('*')
      .eq('blog_post_id', blogPostId)
      .eq('wordpress_connection_id', connection.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    let result;
    let isUpdate = false;

    if (existingPublish?.wp_post_id && existingPublish.status === 'published') {
      // Update existing post
      isUpdate = true;
      result = await wpClient.updatePost(existingPublish.wp_post_id, {
        title,
        content,
        status: status as any,
        slug,
        excerpt: post.meta_description || undefined,
        meta: post.target_keyword ? {
          _yoast_wpseo_focuskw: post.target_keyword,
          _yoast_wpseo_title: post.meta_title || title,
          _yoast_wpseo_metadesc: post.meta_description || undefined
        } : undefined,
        date: scheduledDate || undefined
      });
    } else {
      // Create new post
      result = await wpClient.createPost({
        title,
        content,
        status: status as any,
        slug,
        excerpt: post.meta_description || undefined,
        meta: post.target_keyword ? {
          _yoast_wpseo_focuskw: post.target_keyword,
          _yoast_wpseo_title: post.meta_title || title,
          _yoast_wpseo_metadesc: post.meta_description || undefined
        } : undefined,
        date: scheduledDate || undefined
      });
    }

    if (!result.success) {
      // Log the failure
      await supabase.from('wordpress_publish_log').insert({
        blog_post_id: blogPostId,
        wordpress_connection_id: connection.id,
        status: 'failed',
        error_message: result.error,
        content_hash: contentHash
      });

      return NextResponse.json({ 
        success: false, 
        error: result.error 
      }, { status: 500 });
    }

    // Log successful publish
    await supabase.from('wordpress_publish_log').insert({
      blog_post_id: blogPostId,
      wordpress_connection_id: connection.id,
      wp_post_id: result.postId,
      wp_post_url: result.postUrl,
      wp_post_status: status,
      published_at: status === 'publish' ? new Date().toISOString() : null,
      scheduled_for: status === 'future' ? scheduledDate : null,
      status: 'published',
      content_hash: contentHash
    });

    // Update the blog post with CMS info
    await supabase
      .from('blog_posts')
      .update({
        cms_post_id: result.postId,
        cms_url: result.postUrl,
        cms_published_at: status === 'publish' ? new Date().toISOString() : null,
        cms_status: status,
        status: status === 'publish' ? 'published' : post.status
      })
      .eq('id', blogPostId);

    return NextResponse.json({
      success: true,
      isUpdate,
      postId: result.postId,
      postUrl: result.postUrl,
      status
    });

  } catch (error: any) {
    console.error('WordPress publish error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}

// GET - Check publish status for a post
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const blogPostId = searchParams.get('blogPostId');

    if (!blogPostId) {
      return NextResponse.json({ error: 'blogPostId is required' }, { status: 400 });
    }

    const { data: logs, error } = await supabase
      .from('wordpress_publish_log')
      .select(`
        *,
        wordpress_connection:wordpress_connections(site_url, site_name)
      `)
      .eq('blog_post_id', blogPostId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      logs: logs || []
    });

  } catch (error: any) {
    console.error('Get publish status error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
