import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  autoAssignCategoriesAndTags,
  manuallyAssignCategoriesAndTags,
  getCategoryTagAssignments
} from '@/lib/wordpress/category-tag-mapper';

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

/**
 * GET /api/blog-posts/[id]/categories-tags
 * Get current category and tag assignments for a blog post
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const supabase = await createClient();
    const { id: postId } = await context.params;

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const assignments = await getCategoryTagAssignments(postId);

    if (!assignments) {
      return NextResponse.json({
        error: 'Blog post not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      postId,
      ...assignments
    });

  } catch (error: any) {
    console.error('Get categories/tags error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to get category/tag assignments'
    }, { status: 500 });
  }
}

/**
 * POST /api/blog-posts/[id]/categories-tags
 * Assign categories and tags (auto or manual)
 *
 * Body:
 * - mode: 'auto' | 'manual'
 * - connectionId: string (required for auto mode)
 * - categories: array (required for manual mode)
 * - tags: array (required for manual mode)
 */
export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const supabase = await createClient();
    const { id: postId } = await context.params;

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { mode, connectionId, categories, tags } = body;

    if (!mode || !['auto', 'manual'].includes(mode)) {
      return NextResponse.json({
        error: 'Invalid mode. Must be "auto" or "manual"'
      }, { status: 400 });
    }

    if (mode === 'auto') {
      if (!connectionId) {
        return NextResponse.json({
          error: 'connectionId required for auto mode'
        }, { status: 400 });
      }

      const result = await autoAssignCategoriesAndTags(postId, connectionId);

      return NextResponse.json({
        success: true,
        postId,
        mode: 'auto',
        ...result
      });

    } else {
      // Manual mode
      if (!Array.isArray(categories) || !Array.isArray(tags)) {
        return NextResponse.json({
          error: 'categories and tags must be arrays'
        }, { status: 400 });
      }

      await manuallyAssignCategoriesAndTags(postId, categories, tags);

      return NextResponse.json({
        success: true,
        postId,
        mode: 'manual',
        categories,
        tags,
        categoriesAutoAssigned: false,
        tagsAutoAssigned: false
      });
    }

  } catch (error: any) {
    console.error('Assign categories/tags error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to assign categories/tags'
    }, { status: 500 });
  }
}
