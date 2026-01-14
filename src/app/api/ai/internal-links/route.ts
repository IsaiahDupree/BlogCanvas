import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { runInternalLinkingAgent, applyInternalLinks } from '@/lib/agents/internal-linking';

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      content,
      blogPostId,
      currentUrl,
      websiteId,
      maxLinks = 5,
      autoApply = false
    } = body;

    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    // Get existing posts for linking suggestions
    let existingPosts: any[] = [];
    
    if (websiteId) {
      const { data: posts } = await supabase
        .from('blog_posts')
        .select('id, title, slug, target_keyword, meta_description, cms_url')
        .eq('website_id', websiteId)
        .eq('status', 'published')
        .neq('id', blogPostId || '')
        .limit(50);
      
      if (posts) {
        existingPosts = posts.map(p => ({
          url: p.cms_url || `/blog/${p.slug}`,
          title: p.title,
          targetKeyword: p.target_keyword || '',
          excerpt: p.meta_description
        }));
      }
    }

    if (existingPosts.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No existing posts available for internal linking',
        suggestedLinks: [],
        linkingOpportunities: 0
      });
    }

    const result = await runInternalLinkingAgent({
      content,
      currentUrl: currentUrl || '/current-post',
      existingPosts,
      maxLinks
    });

    if (!result.success) {
      return NextResponse.json({ 
        success: false, 
        error: result.error 
      }, { status: 500 });
    }

    let modifiedContent = content;
    
    // Auto-apply links if requested
    if (autoApply && result.data?.suggestedLinks) {
      modifiedContent = applyInternalLinks(content, result.data.suggestedLinks);
      
      // Update blog post if ID provided
      if (blogPostId) {
        await supabase
          .from('blog_posts')
          .update({ 
            content: modifiedContent,
            updated_at: new Date().toISOString()
          })
          .eq('id', blogPostId);
      }
    }

    return NextResponse.json({
      success: true,
      suggestedLinks: result.data?.suggestedLinks,
      orphanedPages: result.data?.orphanedPages,
      linkingOpportunities: result.data?.linkingOpportunities,
      recommendedLinkCount: result.data?.recommendedLinkCount,
      seoImpactScore: result.data?.seoImpactScore,
      linkingStrategy: result.data?.linkingStrategy,
      modifiedContent: autoApply ? modifiedContent : undefined
    });

  } catch (error: any) {
    console.error('Internal linking error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
