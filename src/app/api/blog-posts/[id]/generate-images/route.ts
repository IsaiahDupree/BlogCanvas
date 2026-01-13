import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  generateImageVariations,
  createImagePromptFromPost,
  downloadImage,
} from '@/lib/ai/image-generator';

// POST /api/blog-posts/[id]/generate-images - Generate images for a blog post
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: postId } = await params;
    const body = await request.json();
    const { count = 3, customPrompt } = body;

    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get blog post details
    const { data: post, error: postError } = await supabase
      .from('blog_posts')
      .select('id, topic, draft, outline, target_keyword, client_id')
      .eq('id', postId)
      .single();

    if (postError || !post) {
      return NextResponse.json(
        { error: 'Blog post not found' },
        { status: 404 }
      );
    }

    // Verify access (vendor must have access to this client's posts)
    const { data: vendorClient } = await supabase
      .from('vendor_clients')
      .select('id')
      .eq('vendor_id', user.id)
      .eq('client_id', post.client_id)
      .single();

    if (!vendorClient) {
      return NextResponse.json(
        { error: 'Access denied to this post' },
        { status: 403 }
      );
    }

    // Generate prompt from post content
    let prompt: string;
    if (customPrompt) {
      prompt = customPrompt;
    } else {
      // Extract content from draft or outline
      const content = extractContentPreview(post);
      const keywords = post.target_keyword ? [post.target_keyword] : [];
      prompt = createImagePromptFromPost(post.topic, content, keywords);
    }

    // Generate images
    console.log(`Generating ${count} images for post ${postId}...`);
    const generatedImages = await generateImageVariations(prompt, count);

    if (generatedImages.length === 0) {
      return NextResponse.json(
        { error: 'Failed to generate any images' },
        { status: 500 }
      );
    }

    // Store generated images in database
    const imageRecords = generatedImages.map((img, index) => ({
      blog_post_id: postId,
      prompt,
      revised_prompt: img.revised_prompt,
      image_url: img.url,
      is_selected: index === 0, // Auto-select first image
      is_featured: index === 0,
      generation_status: 'generated',
    }));

    const { data: savedImages, error: saveError } = await supabase
      .from('blog_post_generated_images')
      .insert(imageRecords)
      .select();

    if (saveError) {
      console.error('Error saving images:', saveError);
      return NextResponse.json(
        { error: 'Failed to save generated images' },
        { status: 500 }
      );
    }

    // Update post's featured_image_id to first image
    if (savedImages && savedImages.length > 0) {
      await supabase
        .from('blog_posts')
        .update({ featured_image_id: savedImages[0].id })
        .eq('id', postId);
    }

    return NextResponse.json({
      success: true,
      images: savedImages,
      prompt,
      message: `Generated ${generatedImages.length} images successfully`,
    });
  } catch (error: any) {
    console.error('Error generating images:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate images' },
      { status: 500 }
    );
  }
}

// GET /api/blog-posts/[id]/generate-images - Get all generated images for a post
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: postId } = await params;
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all generated images for this post
    const { data: images, error } = await supabase
      .from('blog_post_generated_images')
      .select('*')
      .eq('blog_post_id', postId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching images:', error);
      return NextResponse.json(
        { error: 'Failed to fetch images' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      images: images || [],
    });
  } catch (error: any) {
    console.error('Error fetching images:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch images' },
      { status: 500 }
    );
  }
}

/**
 * Extract content preview from post draft or outline
 */
function extractContentPreview(post: any): string {
  let content = '';

  // Try to extract from draft
  if (post.draft) {
    if (typeof post.draft === 'string') {
      content = post.draft;
    } else if (post.draft.sections) {
      content = post.draft.sections
        .map((s: any) => s.content || '')
        .join(' ');
    } else if (post.draft.content) {
      content = post.draft.content;
    }
  }

  // Fallback to outline
  if (!content && post.outline) {
    if (typeof post.outline === 'string') {
      content = post.outline;
    } else if (post.outline.sections) {
      content = post.outline.sections
        .map((s: any) => s.title || s.heading || '')
        .join(' ');
    }
  }

  return content || post.topic;
}
