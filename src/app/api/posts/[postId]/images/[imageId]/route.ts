/**
 * API Route: Manage Individual Generated Image
 * PATCH: Update image selection, featured status, alt text, etc.
 * DELETE: Soft delete an image
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string; imageId: string }> }
) {
  try {
    const supabase = await createClient();
    const { postId, imageId } = await params;

    // Parse request body
    const body = await request.json();
    const {
      is_selected,
      is_featured,
      alt_text,
      caption,
      position,
    } = body;

    // Build update object
    const updates: any = {};
    if (typeof is_selected === 'boolean') updates.is_selected = is_selected;
    if (typeof is_featured === 'boolean') updates.is_featured = is_featured;
    if (alt_text !== undefined) updates.alt_text = alt_text;
    if (caption !== undefined) updates.caption = caption;
    if (position !== undefined) updates.position = position;

    // Update the image
    const { data: updatedImage, error } = await supabase
      .from('generated_images')
      .update(updates)
      .eq('id', imageId)
      .eq('blog_post_id', postId)
      .is('deleted_at', null)
      .select()
      .single();

    if (error) {
      throw error;
    }

    if (!updatedImage) {
      return NextResponse.json(
        { error: 'Image not found' },
        { status: 404 }
      );
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string; imageId: string }> }
) {
  try {
    const supabase = await createClient();
    const { postId, imageId } = await params;

    // Soft delete the image
    const { data: deletedImage, error } = await supabase
      .from('generated_images')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', imageId)
      .eq('blog_post_id', postId)
      .is('deleted_at', null)
      .select()
      .single();

    if (error) {
      throw error;
    }

    if (!deletedImage) {
      return NextResponse.json(
        { error: 'Image not found or already deleted' },
        { status: 404 }
      );
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
