/**
 * API Route: Save custom merged/edited outline
 * POST: Save a custom outline created by user (merging or editing options)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const supabase = await createClient();
    const postId = params.postId;
    const body = await request.json();
    const { customOutline } = body;

    if (!customOutline) {
      return NextResponse.json(
        { error: 'customOutline is required' },
        { status: 400 }
      );
    }

    // Validate outline structure
    if (!customOutline.sections || !Array.isArray(customOutline.sections)) {
      return NextResponse.json(
        { error: 'Invalid outline structure: sections array is required' },
        { status: 400 }
      );
    }

    // Unselect all options (since user created custom)
    await supabase
      .from('outline_options')
      .update({ is_selected: false })
      .eq('blog_post_id', postId);

    // Save custom outline to blog_posts
    const { error: updateError } = await supabase
      .from('blog_posts')
      .update({
        custom_outline: customOutline,
        outline: customOutline, // Also set as main outline
        selected_outline_option_id: null // No option selected
      })
      .eq('id', postId);

    if (updateError) throw updateError;

    return NextResponse.json({
      success: true,
      message: 'Custom outline saved successfully',
      outline: customOutline
    });
  } catch (error: any) {
    console.error('Error saving custom outline:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to save custom outline' },
      { status: 500 }
    );
  }
}
