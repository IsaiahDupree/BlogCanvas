import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { runRepurposeAgent, generateSocialPosts, generateNewsletter, generateThread } from '@/lib/agents/repurpose';

export const maxDuration = 120;

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      content,
      blogPostId,
      targetKeyword,
      blogUrl,
      brandVoice,
      targetAudience,
      formats = ['social', 'newsletter', 'video', 'thread', 'email'],
      specificFormat
    } = body;

    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    // Get blog post details if ID provided
    let postTitle = title;
    let postUrl = blogUrl;
    
    if (blogPostId) {
      const { data: post } = await supabase
        .from('blog_posts')
        .select('title, slug, cms_url')
        .eq('id', blogPostId)
        .single();
      
      if (post) {
        postTitle = postTitle || post.title;
        postUrl = postUrl || post.cms_url;
      }
    }

    // Generate specific format only
    if (specificFormat) {
      let result;
      
      switch (specificFormat) {
        case 'social':
          result = await generateSocialPosts(postTitle || 'Blog Post', content, postUrl || '');
          return NextResponse.json({
            success: result.success,
            socialPosts: result.data,
            error: result.error
          });
          
        case 'newsletter':
          result = await generateNewsletter(postTitle || 'Blog Post', content, postUrl || '');
          return NextResponse.json({
            success: result.success,
            newsletter: result.data,
            error: result.error
          });
          
        case 'thread':
          result = await generateThread(postTitle || 'Blog Post', content, 'twitter');
          return NextResponse.json({
            success: result.success,
            thread: result.data,
            error: result.error
          });
          
        default:
          return NextResponse.json({ 
            error: 'Invalid format. Use: social, newsletter, or thread' 
          }, { status: 400 });
      }
    }

    // Generate all formats
    const result = await runRepurposeAgent({
      title: postTitle || 'Blog Post',
      content,
      targetKeyword: targetKeyword || postTitle || '',
      blogUrl: postUrl,
      brandVoice,
      targetAudience,
      formats
    });

    if (!result.success) {
      return NextResponse.json({ 
        success: false, 
        error: result.error 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      socialPosts: result.data?.socialPosts,
      newsletter: result.data?.newsletter,
      videoScript: result.data?.videoScript,
      thread: result.data?.thread,
      emailTeaser: result.data?.emailTeaser,
      metaDescription: result.data?.metaDescription,
      excerpts: result.data?.excerpts
    });

  } catch (error: any) {
    console.error('Content repurposing error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
