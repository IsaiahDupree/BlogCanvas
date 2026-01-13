import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// PATCH /api/blog-posts/[id]/images/[imageId] - Update image (select, feature, etc.)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; imageId: string }> }
) {
  try {
    const { id: postId, imageId } = await params;
    const body = await request.json();
    const { is_selected, is_featured } = body;

    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // If setting as featured, unset any other featured images for this post
    if (is_featured === true) {
      await supabase
        .from('blog_post_generated_images')
        .update({ is_featured: false })
        .eq('blog_post_id', postId);
    }

    // If setting as selected, unset other selected images (optional - allow multiple selected)
    if (is_selected === true) {
      await supabase
        .from('blog_post_generated_images')
        .update({ is_selected: false })
        .eq('blog_post_id', postId);
    }

    // Update the image
    const { data: updatedImage, error } = await supabase
      .from('blog_post_generated_images')
      .update({
        is_selected,
        is_featured,
        generation_status: is_selected ? 'selected' : 'generated',
      })
      .eq('id', imageId)
      .eq('blog_post_id', postId)
      .select()
      .single();

    if (error) {
      console.error('Error updating image:', error);
      return NextResponse.json(
        { error: 'Failed to update image' },
        { status: 500 }
      );
    }

    // If setting as featured, update post's featured_image_id
    if (is_featured === true) {
      await supabase
        .from('blog_posts')
        .update({ featured_image_id: imageId })
        .eq('id', postId);
    }

    return NextResponse.json({
      success: true,
      image: updatedImage,
    });
  } catch (error: any) {
    console.error('Error updating image:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update image' },
      { status: 500 }
    );
  }
}

// DELETE /api/blog-posts/[id]/images/[imageId] - Delete a generated image
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; imageId: string }> }
) {
  try {
    const { id: postId, imageId } = await params;
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Delete the image
    const { error } = await supabase
      .from('blog_post_generated_images')
      .delete()
      .eq('id', imageId)
      .eq('blog_post_id', postId);

    if (error) {
      console.error('Error deleting image:', error);
      return NextResponse.json(
        { error: 'Failed to delete image' },
        { status: 500 }
      );
    }

    // If this was the featured image, clear featured_image_id
    const { data: post } = await supabase
      .from('blog_posts')
      .select('featured_image_id')
      .eq('id', postId)
      .single();

    if (post?.featured_image_id === imageId) {
      await supabase
        .from('blog_posts')
        .update({ featured_image_id: null })
        .eq('id', postId);
    }

    return NextResponse.json({
      success: true,
      message: 'Image deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting image:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete image' },
      { status: 500 }
    );
  }
}
