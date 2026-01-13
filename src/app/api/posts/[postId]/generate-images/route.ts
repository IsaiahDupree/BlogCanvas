/**
 * API Route: Generate AI Images for Blog Post
 * POST: Generate multiple image options using DALL-E
 * feat-039: AI image generation for posts
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  generateImageVariations,
  createImagePromptFromPost,
} from '@/lib/ai/image-generator';
import {
  uploadImageToStorage,
  getImagePublicUrl,
} from '@/lib/storage/image-storage';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const supabase = await createClient();
    const { postId } = await params;

    // Parse request body
    const body = await request.json();
    const {
      prompt: customPrompt,
      count = 3,
      position = 'header',
    } = body;

    // Fetch blog post details
    const { data: post, error: postError } = await supabase
      .from('blog_posts')
      .select('id, topic, target_keyword, draft, final_html')
      .eq('id', postId)
      .single();

    if (postError || !post) {
      return NextResponse.json(
        { error: 'Blog post not found' },
        { status: 404 }
      );
    }

    // Generate prompt if not provided
    let imagePrompt = customPrompt;
    if (!imagePrompt) {
      // Extract content from draft or final_html
      const content = post.final_html ||
        (post.draft && typeof post.draft === 'object' ?
          JSON.stringify(post.draft) : '');

      const keywords = post.target_keyword ? [post.target_keyword] : [];
      imagePrompt = createImagePromptFromPost(post.topic, content, keywords);
    }

    console.log('Generating images with prompt:', imagePrompt);

    // Generate multiple image variations
    const generatedImages = await generateImageVariations(imagePrompt, count);

    if (generatedImages.length === 0) {
      return NextResponse.json(
        { error: 'Failed to generate any images' },
        { status: 500 }
      );
    }

    // Upload images to Supabase Storage and save to database
    const savedImages = [];

    for (let i = 0; i < generatedImages.length; i++) {
      const image = generatedImages[i];

      try {
        // Upload to storage
        const storagePath = await uploadImageToStorage(
          image.url,
          postId,
          `generated-${position}-${i + 1}.png`
        );

        // Get public URL
        const publicUrl = await getImagePublicUrl(storagePath);

        // Save to database
        const { data: savedImage, error: saveError } = await supabase
          .from('generated_images')
          .insert({
            blog_post_id: postId,
            prompt: imagePrompt,
            revised_prompt: image.revised_prompt,
            model: 'dall-e-3',
            size: '1024x1024',
            quality: i === 1 ? 'hd' : 'standard', // Second image is HD
            style: i % 2 === 0 ? 'vivid' : 'natural',
            storage_path: storagePath,
            storage_bucket: 'blog-post-images',
            url: publicUrl,
            position,
            is_selected: i === 0, // Auto-select the first image
            is_featured: i === 0 && position === 'header',
          })
          .select()
          .single();

        if (saveError) {
          console.error('Failed to save image to database:', saveError);
        } else {
          savedImages.push(savedImage);
        }
      } catch (uploadError) {
        console.error(`Failed to upload image ${i + 1}:`, uploadError);
      }
    }

    return NextResponse.json({
      success: true,
      images: savedImages,
      count: savedImages.length,
      prompt: imagePrompt,
    });
  } catch (error: any) {
    console.error('Error generating images:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to generate images',
        details: error.stack
      },
      { status: 500 }
    );
  }
}

/**
 * GET: Fetch all generated images for a blog post
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const supabase = await createClient();
    const { postId } = await params;

    // Fetch all generated images for this post (not soft-deleted)
    const { data: images, error } = await supabase
      .from('generated_images')
      .select('*')
      .eq('blog_post_id', postId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      images: images || [],
    });
  } catch (error: any) {
    console.error('Error fetching generated images:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch images' },
      { status: 500 }
    );
  }
}
