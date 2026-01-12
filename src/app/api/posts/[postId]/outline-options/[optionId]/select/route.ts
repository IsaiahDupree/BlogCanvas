/**
 * API Route: Select an outline option
 * POST: Mark an outline option as selected and copy to blog_posts.outline
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { postId: string; optionId: string } }
) {
  try {
    const supabase = await createClient();
    const { postId, optionId } = params;

    // Fetch the selected outline option
    const { data: option, error: optionError } = await supabase
      .from('outline_options')
      .select('*')
      .eq('id', optionId)
      .eq('blog_post_id', postId)
      .single();

    if (optionError) throw optionError;
    if (!option) {
      return NextResponse.json(
        { error: 'Outline option not found' },
        { status: 404 }
      );
    }

    // Unselect all other options for this post
    await supabase
      .from('outline_options')
      .update({ is_selected: false })
      .eq('blog_post_id', postId);

    // Mark this option as selected
    const { error: selectError } = await supabase
      .from('outline_options')
      .update({ is_selected: true })
      .eq('id', optionId);

    if (selectError) throw selectError;

    // Copy outline to blog_posts.outline
    const { error: updateError } = await supabase
      .from('blog_posts')
      .update({
        outline: option.outline_data,
        selected_outline_option_id: optionId
      })
      .eq('id', postId);

    if (updateError) throw updateError;

    return NextResponse.json({
      success: true,
      message: 'Outline option selected successfully',
      selectedOption: option
    });
  } catch (error: any) {
    console.error('Error selecting outline option:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to select outline option' },
      { status: 500 }
    );
  }
}
